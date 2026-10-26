import express from "express";
import crypto from "node:crypto";
import { hashPassword, verifyPassword, createSession, destroySession, setSessionCookie, clearSessionCookie, publicUser, requireModerator } from "../auth.js";
import { str, oneOf, HttpError, asyncRoute, checkPassword } from "../validate.js";
import { ROLES } from "../constants.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .'_-]*$/u;

export function authRoutes({ store, cfg, limit }) {
  const r = express.Router();
  const failures = new Map(); // email -> { count, until }

  r.post(
    "/signup",
    limit("signup", 10, 60 * 60_000),
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
      if (store.data.users.some((u) => u.email === email)) throw new HttpError(409, "An account with this email already exists. Try signing in.");

      const user = {
        id: store.id("usr"),
        name,
        email,
        passHash: await hashPassword(password),
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
    limit("login", 20, 15 * 60_000),
    asyncRoute(async (req, res) => {
      const email = str(req.body?.email, { field: "Email", max: 120, required: true }).toLowerCase();
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      const f = failures.get(email);
      if (f && f.until > Date.now()) throw new HttpError(429, "Too many failed attempts. Try again in 15 minutes.");
      const user = store.data.users.find((u) => u.email === email && !u.isSample);
      const ok = user ? await verifyPassword(password, user.passHash) : await verifyPassword(password, "scrypt$16384$8$1$AAAA$AAAA").catch(() => false);
      if (!user || !ok) {
        const next = { count: (f?.count || 0) + 1, until: 0 };
        if (next.count >= 5) next.until = Date.now() + 15 * 60_000;
        failures.set(email, next);
        throw new HttpError(401, "Invalid email or password.");
      }
      failures.delete(email);
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
      const ABC = "abcdefghjkmnpqrstuvwxyz";
      const temp = `${Array.from(crypto.randomBytes(6), (b) => ABC[b % ABC.length]).join("")}${crypto.randomInt(10, 99)}`;
      user.passHash = await hashPassword(temp);
      store.data.sessions = store.data.sessions.filter((s) => s.userId !== user.id);
      failures.delete(email);
      store.save();
      res.json({ ok: true, email, tempPassword: temp });
    }),
  );

  return r;
}
