import express from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { requireAuth, publicUser, verifyPassword, clearSessionCookie } from "../auth.js";
import { BADGES, CERT_RULE, POINTS, award, grantBadges } from "../gamify.js";
import { str, oneOf, HttpError, asyncRoute } from "../validate.js";
import { ROLES, LEARN_MODULES } from "../constants.js";

const NAME_RE = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .'_-]*$/u;
const CERT_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const certId = () => `FS-${Array.from(crypto.randomBytes(10), (b) => CERT_ALPHABET[b % CERT_ALPHABET.length]).join("")}`;

export function meRoutes({ store, cfg, limit }) {
  const r = express.Router();
  r.use(requireAuth);

  function summary(u) {
    const mine = store.data.reports.filter((x) => x.reporterId === u.id);
    const verified = mine.filter((x) => x.status === "verified").length;
    const ranked = store.data.users.filter((x) => x.leaderboard !== false && (x.points || 0) > 0).sort((a, b) => b.points - a.points);
    const rank = ranked.findIndex((x) => x.id === u.id);
    const cert = store.data.certificates.find((c) => c.userId === u.id);
    return {
      user: publicUser(u),
      stats: {
        reports: mine.length,
        verified,
        pending: mine.filter((x) => x.status === "pending").length,
        rejected: mine.filter((x) => x.status === "rejected").length,
        votes: store.data.votes.filter((v) => v.userId === u.id).length,
        rank: rank >= 0 ? rank + 1 : null,
        learned: (u.learned || []).length,
        learnTotal: LEARN_MODULES.length,
        quizBest: u.quiz?.best || 0,
      },
      badges: Object.entries(BADGES).map(([id, b]) => ({ id, ...b, earned: (u.badges || []).includes(id) })),
      learned: u.learned || [],
      pointsLog: (u.pointsLog || []).slice(0, 12),
      certificate: {
        eligible: (u.points || 0) >= CERT_RULE.points && verified >= CERT_RULE.verifiedReports,
        rule: CERT_RULE,
        id: cert?.id || null,
      },
    };
  }

  r.get("/", (req, res) => res.json(summary(req.user)));

  r.patch(
    "/",
    asyncRoute(async (req, res) => {
      const b = req.body || {};
      const u = req.user;
      if (b.name !== undefined) {
        const name = str(b.name, { field: "Name", min: 2, max: 40, required: true });
        if (!NAME_RE.test(name)) throw new HttpError(400, "Name can contain letters, numbers, spaces, dots, hyphens and underscores only.");
        u.name = name;
      }
      if (b.college !== undefined) {
        u.college = str(b.college, { field: "College", max: 80 });
        u.collegeKey = u.college.toLowerCase().replace(/\s+/g, " ").trim();
      }
      if (b.role !== undefined) u.role = oneOf(b.role, ROLES, "role");
      if (b.leaderboard !== undefined) u.leaderboard = b.leaderboard === true;
      store.save();
      res.json(summary(u));
    }),
  );

  r.post("/quiz", limit("quiz", 30, 60 * 60_000), (req, res) => {
    const score = Number(req.body?.score);
    const total = Number(req.body?.total);
    if (!Number.isInteger(score) || !Number.isInteger(total) || total < 5 || total > 30 || score < 0 || score > total) {
      return res.status(400).json({ error: "Invalid quiz result." });
    }
    const u = req.user;
    const today = new Date().toISOString().slice(0, 10);
    u.quiz = u.quiz || { best: 0, lastDay: null, attempts: 0 };
    u.quiz.attempts += 1;
    u.quiz.best = Math.max(u.quiz.best || 0, score / total);
    let gained = 0;
    if (u.quiz.lastDay !== today) {
      u.quiz.lastDay = today;
      award(store, u, POINTS.quizDaily, "Daily Spot-the-Scam quiz");
      gained = POINTS.quizDaily;
    }
    const badges = grantBadges(store, u, LEARN_MODULES.length);
    store.save();
    res.json({ gained, badges, points: u.points, best: u.quiz.best });
  });

  r.post("/learn", (req, res) => {
    const id = req.body?.moduleId;
    if (!LEARN_MODULES.includes(id)) return res.status(400).json({ error: "Unknown module." });
    const u = req.user;
    u.learned = u.learned || [];
    let gained = 0;
    if (!u.learned.includes(id)) {
      u.learned.push(id);
      award(store, u, POINTS.learnModule, `Learned: ${id}`);
      gained = POINTS.learnModule;
    }
    const badges = grantBadges(store, u, LEARN_MODULES.length);
    res.json({ gained, badges, points: u.points, learned: u.learned });
  });

  r.post("/certificate", (req, res) => {
    const u = req.user;
    const s = summary(u);
    if (!s.certificate.eligible) {
      return res.status(403).json({ error: `Reach ${CERT_RULE.points} points with at least ${CERT_RULE.verifiedReports} verified report to unlock your certificate.` });
    }
    let cert = store.data.certificates.find((c) => c.userId === u.id);
    if (!cert) {
      cert = { id: certId(), userId: u.id, issuedAt: new Date().toISOString() };
      store.data.certificates.push(cert);
    }
    // Snapshot the achievements at (re)issue time.
    Object.assign(cert, { name: u.name, college: u.college || "", points: u.points, verifiedReports: s.stats.verified, badges: [...(u.badges || [])], updatedAt: new Date().toISOString() });
    store.save();
    res.json({ certificate: cert });
  });

  r.get("/export", (req, res) => {
    const u = req.user;
    const { passHash, ...profile } = u;
    const data = {
      exportedAt: new Date().toISOString(),
      profile,
      reports: store.data.reports.filter((x) => x.reporterId === u.id),
      votes: store.data.votes.filter((v) => v.userId === u.id),
      certificates: store.data.certificates.filter((c) => c.userId === u.id),
    };
    res.setHeader("Content-Disposition", 'attachment; filename="finsuraksha-my-data.json"');
    res.json(data);
  });

  r.delete(
    "/",
    asyncRoute(async (req, res) => {
      const u = req.user;
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      if (!(await verifyPassword(password, u.passHash))) throw new HttpError(401, "Password is incorrect.");
      const d = store.data;
      for (const rep of d.reports.filter((x) => x.reporterId === u.id)) {
        rep.reporterId = null;
        if (rep.evidence) {
          fs.rmSync(path.join(store.uploadsDir, path.basename(rep.evidence)), { force: true });
          rep.evidence = null;
        }
      }
      for (const rep of d.reports) rep.supporters = (rep.supporters || []).filter((id) => id !== u.id);
      for (const v of d.votes) if (v.userId === u.id) v.userId = null;
      d.certificates = d.certificates.filter((c) => c.userId !== u.id);
      d.sessions = d.sessions.filter((s) => s.userId !== u.id);
      d.users = d.users.filter((x) => x.id !== u.id);
      store.save();
      clearSessionCookie(res, cfg);
      res.json({ ok: true });
    }),
  );

  return r;
}
