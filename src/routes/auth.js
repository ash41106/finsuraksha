import express from "express";
import crypto from "node:crypto";
import { hashPassword, verifyPassword, createSession, destroySession, setSessionCookie, clearSessionCookie, publicUser, requireModerator } from "../auth.js";
import { str, oneOf, HttpError, asyncRoute, checkPassword } from "../validate.js";
import { ROLES } from "../constants.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .'_-]*$/u;

const LOCK_MS = 15 * 60_000;
const PER_CLIENT_FAILS = 5; // wrong passwords from one address before that address is locked out
const PER_ACCOUNT_FAILS = 25; // from all addresses together: slows a distributed attack

export function authRoutes({ store, cfg, limit }) {
  const r = express.Router();
  // Failed sign-ins, keyed "email|ip" and "email". Locking only the attacker's
  // address means a stranger can't lock a member out by guessing wrong.
  const failures = new Map(); // key -> { count, first, until }
  const pendingEmails = new Set(); // sign-ups in progress (password hashing is async)
  setInterval(() => {
    const now = Date.now();
    for (const [k, f] of failures) if (f.until < now && now - f.first > LOCK_MS) failures.delete(k);
  }, 10 * 60_000).unref();

  const locked = (key) => (failures.get(key)?.until || 0) > Date.now();
  function fail(key, limitN) {
    const now = Date.now();
    let f = failures.get(key);
    if (!f || now - f.first > LOCK_MS) f = { count: 0, first: now, until: 0 };
    f.count += 1;
    if (f.count >= limitN) f.until = now + LOCK_MS;
    failures.set(key, f);
  }

  r.post(
    "/signup",
    // Only accounts actually created count, so typos don't use up the quota of
    // everyone sharing a college or mobile-network address.
    limit("signup", 20, 60 * 60_000, { count: "successes" }),
    asyncRoute(async (req, res) => {
      const b = req.body || {};
      const name = str(b.name, { field: "Name", min: 2, max: 40, required: true });
      if (!NAME_RE.test(name)) throw new HttpError(400, "Name can contain letters, numbers, spaces, dots, hyphens and underscores only.");
      const email = str(b.email, { field: "Email", max: 120, required: true }).toLowerCase();
      if (!EMAIL_RE.test(email)) throw new HttpError(400, "Enter a valid email address.");
      const password = checkPassword(b.password);
      const role = oneOf(b.role, ROLES, "role");
      const college = str(b.college, { field: "College", max: 80 });
      if (b.ageOk !== true) throw new HttpError(400, "Accounts are for people aged 18 or above. Under 18? You can still use Suraksha-Dost, Quick Check and Learn without an account.");
      if (b.consent !== true) throw new HttpError(400, "Please accept the privacy notice to create an account.");
      const taken = () => pendingEmails.has(email) || store.data.users.some((u) => u.email === email);
      if (taken()) throw new HttpError(409, "An account with this email already exists. Try signing in.");
      // Reserve the address while the password is hashed, so two requests at
      // the same moment can't both create an account for it.
      pendingEmails.add(email);
      let passHash;
      try {
        passHash = await hashPassword(password);
      } finally {
        pendingEmails.delete(email);
      }
      if (store.data.users.some((u) => u.email === email)) throw new HttpError(409, "An account with this email already exists. Try signing in.");

      const user = {
        id: store.id("usr"),
        name,
        email,
        passHash,
        role,
        college,
        collegeKey: college.toLowerCase().replace(/\s+/g, " ").trim(),
        leaderboard: b.leaderboard !== false,
        isModerator: cfg.moderatorEmails.includes(email),
        points: 0,
        badges: [],
        learned: [],
        quiz: { best: 0, lastDay: null, attempts: 0 },
        consentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      store.data.users.push(user);
      store.save();
      // Sign-up only creates the account; the person then signs in with it.
      res.status(201).json({ created: true, user: publicUser(user) });
    }),
  );

  r.post(
    "/login",
    // Failed attempts only: a classroom signing in from one Wi-Fi is fine,
    // one address guessing passwords is not.
    limit("login", 30, 15 * 60_000, { count: "failures" }),
    asyncRoute(async (req, res) => {
      const email = str(req.body?.email, { field: "Email", max: 120, required: true }).toLowerCase();
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      const clientKey = `${email}|${req.ip}`;
      if (locked(clientKey) || locked(email)) throw new HttpError(429, "Too many failed attempts. Try again in 15 minutes.");
      const user = store.data.users.find((u) => u.email === email && !u.isSample);
      const ok = user ? await verifyPassword(password, user.passHash) : await verifyPassword(password, "scrypt$16384$8$1$AAAA$AAAA").catch(() => false);
      if (!user || !ok) {
        fail(clientKey, PER_CLIENT_FAILS);
        fail(email, PER_ACCOUNT_FAILS);
        throw new HttpError(401, "Invalid email or password.");
      }
      failures.delete(clientKey);
      user.lastLoginAt = new Date().toISOString();
      store.save();
      setSessionCookie(res, createSession(store, user.id), cfg);
      res.json({ user: publicUser(user) });
    }),
  );

  r.post("/logout", (req, res) => {
    destroySession(store, req.sessionToken);
    clearSessionCookie(res, cfg);
    res.json({ ok: true });
  });

  r.get("/me", (req, res) => res.json({ user: publicUser(req.user) }));

  // No email service here, so a moderator hands a member a temporary password
  // in person; the member then sets their own one in their profile.
  r.post(
    "/reset",
    requireModerator,
    limit("reset", 20, 60 * 60_000),
    asyncRoute(async (req, res) => {
      const email = str(req.body?.email, { field: "Email", max: 120, required: true }).toLowerCase();
      const user = store.data.users.find((u) => u.email === email && !u.isSample);
      if (!user) throw new HttpError(404, "No account with this email.");
      // Otherwise one moderator could take over another moderator's account.
      if (user.isModerator && user.id !== req.user.id) throw new HttpError(403, "Moderator passwords can't be reset here. Use the set-password script on the server.");
      const ABC = "abcdefghjkmnpqrstuvwxyz";
      const temp = `${Array.from(crypto.randomBytes(6), (b) => ABC[b % ABC.length]).join("")}${crypto.randomInt(10, 99)}`;
      user.passHash = await hashPassword(temp);
      store.data.sessions = store.data.sessions.filter((s) => s.userId !== user.id);
      for (const k of failures.keys()) if (k === email || k.startsWith(`${email}|`)) failures.delete(k);
      store.save();
      res.json({ ok: true, email, tempPassword: temp });
    }),
  );

  return r;
}
