import crypto from "node:crypto";
import { promisify } from "node:util";
import { levelFor } from "./gamify.js";

const scrypt = promisify(crypto.scrypt);
const SCRYPT = { N: 16384, r: 8, p: 1 };
const KEYLEN = 64;
const SESSION_DAYS = 7;
export const COOKIE = "fs_sid";

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== "string" || !stored.startsWith("scrypt$")) return false;
  const [, N, r, p, saltB64, hashB64] = stored.split("$");
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, { N: +N, r: +r, p: +p });
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

export function createSession(store, userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = Date.now();
  // Only a hash of the token is stored, so a leaked db.json can't be replayed.
  store.data.sessions.push({ tokenHash: sha256(token), userId, createdAt: now, expiresAt: now + SESSION_DAYS * 864e5 });
  store.save();
  return token;
}

export function destroySession(store, token) {
  if (!token) return;
  const h = sha256(token);
  store.data.sessions = store.data.sessions.filter((s) => s.tokenHash !== h);
  store.save();
}

export function setSessionCookie(res, token, cfg) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: cfg.cookieSecure,
    maxAge: SESSION_DAYS * 864e5,
    path: "/",
  });
}

export function clearSessionCookie(res, cfg) {
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: "lax", secure: cfg.cookieSecure, path: "/" });
}

export function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function attachUser(store) {
  return (req, _res, next) => {
    req.user = null;
    const token = readCookie(req, COOKIE);
    if (token) {
      const h = sha256(token);
      const now = Date.now();
      const s = store.data.sessions.find((x) => x.tokenHash === h);
      if (s && s.expiresAt > now) {
        req.user = store.data.users.find((u) => u.id === s.userId) || null;
        req.sessionToken = token;
      }
    }
    next();
  };
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Please sign in to continue.", code: "auth_required" });
  next();
}

export function requireModerator(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Please sign in to continue.", code: "auth_required" });
  if (!req.user.isModerator) return res.status(403).json({ error: "Moderator access only." });
  next();
}

export function pruneSessions(store) {
  const now = Date.now();
  const before = store.data.sessions.length;
  store.data.sessions = store.data.sessions.filter((s) => s.expiresAt > now);
  if (store.data.sessions.length !== before) store.save();
}

// What the browser is allowed to know about the signed-in user.
export function publicUser(u) {
  if (!u) return null;
  const lvl = levelFor(u.points || 0);
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    college: u.college || "",
    leaderboard: u.leaderboard !== false,
    isModerator: Boolean(u.isModerator),
    points: u.points || 0,
    level: lvl.name,
    levelIndex: lvl.index,
    nextLevelAt: lvl.next,
    levelFloor: lvl.min,
    badges: u.badges || [],
    createdAt: u.createdAt,
  };
}
