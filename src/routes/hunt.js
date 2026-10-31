import express from "express";
import fs from "node:fs";
import path from "node:path";
import { requireAuth, requireModerator } from "../auth.js";
import { byUserOrIp } from "../security.js";
import { analyzeMessage, entityKeys, displayEntity } from "../analyzer.js";
import { redact } from "../redact.js";
import { POINTS, award, grantBadges, levelFor } from "../gamify.js";
import { str, oneOf, parseImage, HttpError, asyncRoute } from "../validate.js";
import { CATEGORIES, PLATFORMS, ENTITY_TYPES, LEARN_MODULES } from "../constants.js";
import { FLAG_TEXT } from "../knowledge.js";

const DAY = 864e5;

// Show links as non-clickable "defanged" text so nobody lands on a scam site by accident.
export function defang(s) {
  return String(s || "")
    .replace(/^http/i, "hxxp")
    .replace(/\.(?=[a-z0-9-]+(?:[/:?#]|$))/gi, "[.]");
}

function compactAnalysis(a) {
  return {
    score: a.score,
    level: a.level,
    flags: a.flags.slice(0, 8).map((f) => ({ id: f.id, sev: f.sev, title: f.title })),
    sebi: a.checks.sebi.map((s) => ({ number: s.normalized, valid: s.valid, found: s.found, name: s.name, type: s.type })),
    disclosedRegistration: a.checks.sebi.some((s) => s.valid),
    guaranteedReturns: a.flags.some((f) => f.id === "guaranteed" || f.id === "high_return"),
  };
}

export function huntRoutes({ store, cfg, limit }) {
  const r = express.Router();
  const users = () => store.data.users;
  const userById = (id) => users().find((u) => u.id === id);

  function publicReport(rep, viewer, detail = false) {
    const reporter = userById(rep.reporterId);
    const vote = viewer ? store.data.votes.find((v) => v.reportId === rep.id && v.userId === viewer.id) : null;
    const isUrl = ["url", "telegram", "whatsapp"].includes(rep.entityType) && /\.[a-z]{2,}/i.test(rep.entityValue);
    const out = {
      id: rep.id,
      category: rep.category,
      platform: rep.platform,
      entityType: rep.entityType,
      entity: isUrl ? defang(rep.entityValue) : displayEntity(rep.entityType, rep.entityValue),
      link: rep.link ? defang(rep.link) : "",
      description: rep.description,
      status: rep.status,
      votes: rep.votes,
      reports: 1 + (rep.supporters?.length || 0),
      analysis: rep.analysis,
      createdAt: rep.createdAt,
      resolvedAt: rep.resolvedAt,
      underReview: Boolean(rep.underReview),
      sample: Boolean(rep.sample),
      hasEvidence: Boolean(rep.evidence),
      reporter: reporter ? (reporter.leaderboard !== false ? reporter.name : "Anonymous hunter") : "Former member",
      mine: Boolean(viewer && rep.reporterId === viewer.id),
      myVote: vote?.vote || null,
    };
    if (detail) {
      out.ocrText = rep.ocrText || "";
      out.notes = (rep.notes || []).slice(-5);
      out.appeals = store.data.appeals.filter((a) => a.reportId === rep.id).length;
    }
    return out;
  }

  // ---- Auto-check before submitting --------------------------------------
  r.post(
    "/precheck",
    limit("precheck", 80, 10 * 60_000, byUserOrIp),
    asyncRoute(async (req, res) => {
      const b = req.body || {};
      const text = [str(b.entityValue, { max: 300 }), str(b.link, { max: 500 }), str(b.description, { max: 4000 }), str(b.ocrText, { max: 6000 })].filter(Boolean).join("\n");
      if (!text) throw new HttpError(400, "Add the entity, a link or a description first.");
      const a = await analyzeMessage(text, { store, cfg, lang: b.lang === "hi" ? "hi" : "en" });
      res.json({
        ...compactAnalysis(a),
        flags: a.flags.map(({ id, sev, title, why }) => ({ id, sev, title, why })),
        community: a.checks.community,
      });
    }),
  );

  // ---- Submit a report ----------------------------------------------------
  r.post(
    "/reports",
    requireAuth,
    limit("report", 15, 60 * 60_000, byUserOrIp),
    asyncRoute(async (req, res) => {
      const b = req.body || {};
      const category = oneOf(b.category, CATEGORIES, "category");
      const platform = oneOf(b.platform, PLATFORMS, "platform");
      const entityType = oneOf(b.entityType, ENTITY_TYPES, "entity type");
      const entityValue = str(b.entityValue, { field: "Name / handle / link", min: 3, max: 200, required: true });
      const link = str(b.link, { field: "Link", max: 500 });
      const description = str(b.description, { field: "Description", min: 20, max: 2000, required: true });
      const ocrText = str(b.ocrText, { field: "Screenshot text", max: 6000 });
      if (b.consent !== true) throw new HttpError(400, "Please confirm the report is genuine and free of other people's personal data.");
      const image = parseImage(b.image);

      const recent = store.data.reports.filter((x) => x.reporterId === req.user.id && Date.now() - Date.parse(x.createdAt) < DAY).length;
      if (recent >= 10) throw new HttpError(429, "You've filed 10 reports today. Please come back tomorrow.");

      const matchKeys = entityKeys(entityType, entityValue, link);
      const findExisting = () => store.data.reports.find((x) => x.status !== "rejected" && (x.matchKeys || []).some((k) => matchKeys.includes(k)));
      const merge = (existing) => {
        const supporters = (existing.supporters = existing.supporters || []);
        if (existing.reporterId === req.user.id || supporters.includes(req.user.id)) {
          return res.json({ merged: true, id: existing.id, message: "You've already reported this one. Thanks!" });
        }
        supporters.push(req.user.id);
        existing.notes = [...(existing.notes || []), { at: new Date().toISOString(), text: redact(description).text.slice(0, 400) }].slice(-20);
        store.save();
        return res.json({ merged: true, id: existing.id, message: "Someone already reported this. Your report was added as supporting evidence." });
      };
      const existing = findExisting();
      if (existing) return merge(existing);

      const cleanDesc = redact(description).text;
      const cleanOcr = redact(ocrText).text;
      const a = await analyzeMessage([entityValue, link, cleanDesc, cleanOcr].filter(Boolean).join("\n"), { store: null, cfg, lang: "en" });
      // The analysis is async: someone may have filed the same entity meanwhile.
      const raced = findExisting();
      if (raced) return merge(raced);
      const report = {
        id: store.id("rep"),
        createdAt: new Date().toISOString(),
        reporterId: req.user.id,
        category,
        platform,
        entityType,
        entityValue,
        link,
        description: cleanDesc,
        ocrText: cleanOcr,
        evidence: null,
        matchKeys,
        analysis: compactAnalysis(a),
        status: "pending",
        votes: { confirm: 0, legit: 0, info: 0 },
        supporters: [],
        notes: [],
        underReview: false,
        resolvedAt: null,
        sample: false,
      };
      if (image) {
        const file = `${report.id}.${image.ext}`;
        fs.writeFileSync(path.join(store.uploadsDir, file), image.buffer);
        report.evidence = file;
      }
      store.data.reports.push(report);
      award(store, req.user, POINTS.submit, "Report submitted");
      const badges = grantBadges(store, req.user, LEARN_MODULES.length);
      res.status(201).json({ merged: false, id: report.id, report: publicReport(report, req.user), badges, points: req.user.points });
    }),
  );

  // ---- Browse -------------------------------------------------------------
  r.get("/reports", (req, res) => {
    const status = ["verified", "pending", "rejected", "all"].includes(req.query.status) ? req.query.status : "verified";
    if (status !== "verified" && !req.user) return res.status(401).json({ error: "Sign in to see reports awaiting verification.", code: "auth_required" });
    const q = String(req.query.q || "").toLowerCase().slice(0, 100);
    const cat = CATEGORIES.includes(req.query.category) ? req.query.category : null;
    const plat = PLATFORMS.includes(req.query.platform) ? req.query.platform : null;
    let list = store.data.reports.filter((x) => (status === "all" ? x.status !== "rejected" || req.user?.isModerator : x.status === status));
    if (req.query.mine === "1" && req.user) list = store.data.reports.filter((x) => x.reporterId === req.user.id);
    if (cat) list = list.filter((x) => x.category === cat);
    if (plat) list = list.filter((x) => x.platform === plat);
    if (q) list = list.filter((x) => `${x.entityValue} ${x.description} ${x.link}`.toLowerCase().includes(q));
    list = [...list].sort((a, b) => Date.parse(b.resolvedAt || b.createdAt) - Date.parse(a.resolvedAt || a.createdAt));
    const limitN = Math.max(1, Math.min(60, parseInt(req.query.limit, 10) || 30));
    res.json({ total: list.length, reports: list.slice(0, limitN).map((x) => publicReport(x, req.user)) });
  });

  r.get("/reports/:id", (req, res) => {
    const rep = store.data.reports.find((x) => x.id === req.params.id);
    if (!rep) return res.status(404).json({ error: "Report not found." });
    if (rep.status !== "verified" && !req.user) return res.status(401).json({ error: "Sign in to view this report.", code: "auth_required" });
    res.json({ report: publicReport(rep, req.user, true) });
  });

  // Evidence screenshots can contain personal chats, so only signed-in members see them.
  r.get("/reports/:id/evidence", requireAuth, (req, res) => {
    const rep = store.data.reports.find((x) => x.id === req.params.id);
    if (!rep?.evidence) return res.status(404).json({ error: "No screenshot for this report." });
    res.setHeader("Cache-Control", "private, max-age=300");
    res.sendFile(path.join(store.uploadsDir, path.basename(rep.evidence)));
  });

  // ---- Community verification --------------------------------------------
  function resolve(rep, outcome, by) {
    rep.status = outcome;
    rep.resolvedAt = new Date().toISOString();
    rep.resolvedBy = by;
    const reporter = userById(rep.reporterId);
    if (reporter) {
      award(store, reporter, outcome === "verified" ? POINTS.verified : POINTS.rejected, outcome === "verified" ? "Report verified" : "Report rejected");
      grantBadges(store, reporter, LEARN_MODULES.length);
    }
    for (const supporterId of rep.supporters || []) {
      const s = userById(supporterId);
      if (s && outcome === "verified") award(store, s, 10, "Supporting report verified");
    }
    const aligned = outcome === "verified" ? "confirm" : "legit";
    for (const v of store.data.votes.filter((x) => x.reportId === rep.id && x.vote === aligned)) {
      const voter = userById(v.userId);
      if (voter) award(store, voter, POINTS.voteAligned, "Accurate verification vote");
    }
    store.save();
  }

  r.post(
    "/reports/:id/vote",
    requireAuth,
    limit("vote", 60, 60 * 60_000, byUserOrIp),
    asyncRoute(async (req, res) => {
      const rep = store.data.reports.find((x) => x.id === req.params.id);
      if (!rep) throw new HttpError(404, "Report not found.");
      if (rep.status !== "pending") throw new HttpError(409, "Voting is closed for this report.");
      if (rep.reporterId === req.user.id || (rep.supporters || []).includes(req.user.id)) throw new HttpError(403, "You can't vote on a report you filed or supported.");
      if (store.data.votes.some((v) => v.reportId === rep.id && v.userId === req.user.id)) throw new HttpError(409, "You've already voted on this report.");
      const vote = oneOf(req.body?.vote, ["confirm", "legit", "info"], "vote");
      const reason = redact(str(req.body?.reason, { field: "Reason", max: 300 })).text;
      store.data.votes.push({ reportId: rep.id, userId: req.user.id, vote, reason, createdAt: new Date().toISOString() });
      rep.votes[vote] += 1;

      const votesToday = store.data.votes.filter((v) => v.userId === req.user.id && Date.now() - Date.parse(v.createdAt) < DAY).length;
      if (votesToday <= 30) award(store, req.user, POINTS.vote, "Verification vote");

      const T = cfg.verifyThreshold;
      let resolved = null;
      if (rep.votes.confirm >= T && rep.votes.confirm > rep.votes.legit) resolved = "verified";
      else if (rep.votes.legit >= T && rep.votes.legit > rep.votes.confirm) resolved = "rejected";
      if (resolved) resolve(rep, resolved, "community");
      const badges = grantBadges(store, req.user, LEARN_MODULES.length);
      store.save();
      res.json({ report: publicReport(rep, req.user), resolved, badges, points: req.user.points });
    }),
  );

  r.post(
    "/reports/:id/moderate",
    requireModerator,
    asyncRoute(async (req, res) => {
      const rep = store.data.reports.find((x) => x.id === req.params.id);
      if (!rep) throw new HttpError(404, "Report not found.");
      const action = oneOf(req.body?.action, ["verify", "reject", "clear_review"], "action");
      if (action === "clear_review") rep.underReview = false;
      else {
        if (rep.status !== "pending") throw new HttpError(409, "This report is already resolved.");
        resolve(rep, action === "verify" ? "verified" : "rejected", `moderator:${req.user.id}`);
      }
      store.save();
      res.json({ report: publicReport(rep, req.user, true) });
    }),
  );

  // Right of reply: anyone (including the reported party) can ask for a review.
  r.post(
    "/reports/:id/appeal",
    limit("appeal", 5, 60 * 60_000),
    asyncRoute(async (req, res) => {
      const rep = store.data.reports.find((x) => x.id === req.params.id);
      if (!rep) throw new HttpError(404, "Report not found.");
      const name = str(req.body?.name, { field: "Name", min: 2, max: 60, required: true });
      const contact = str(req.body?.contact, { field: "Contact", max: 100 });
      const message = str(req.body?.message, { field: "Message", min: 20, max: 1000, required: true });
      store.data.appeals.push({ id: store.id("apl"), reportId: rep.id, name, contact, message, createdAt: new Date().toISOString(), status: "open" });
      rep.underReview = true;
      store.save();
      res.status(201).json({ ok: true, message: "Thanks. A moderator will review this report. It is now marked 'Under review'." });
    }),
  );

  r.get("/appeals", requireModerator, (req, res) => {
    const list = store.data.appeals
      .filter((a) => a.status === "open")
      .map((a) => ({ ...a, report: publicReport(store.data.reports.find((x) => x.id === a.reportId) || {}, req.user) }));
    res.json({ appeals: list });
  });

  r.post("/appeals/:id/close", requireModerator, (req, res) => {
    const a = store.data.appeals.find((x) => x.id === req.params.id);
    if (!a) return res.status(404).json({ error: "Appeal not found." });
    a.status = "closed";
    a.closedAt = new Date().toISOString();
    const rep = store.data.reports.find((x) => x.id === a.reportId);
    if (rep && !store.data.appeals.some((x) => x.reportId === rep.id && x.status === "open")) rep.underReview = false;
    store.save();
    res.json({ ok: true });
  });

  // ---- Leaderboard ------------------------------------------------------
  r.get("/leaderboard", (req, res) => {
    const verifiedBy = new Map();
    for (const rep of store.data.reports) if (rep.status === "verified") verifiedBy.set(rep.reporterId, (verifiedBy.get(rep.reporterId) || 0) + 1);
    const ranked = users()
      .filter((u) => u.leaderboard !== false && (u.points || 0) > 0)
      .sort((a, b) => b.points - a.points);
    const row = (u, i) => ({
      rank: i + 1,
      name: u.name,
      college: u.college || "",
      points: u.points,
      level: levelFor(u.points).name,
      badges: (u.badges || []).length,
      verified: verifiedBy.get(u.id) || 0,
      sample: Boolean(u.isSample),
      me: Boolean(req.user && u.id === req.user.id),
    });
    const colleges = new Map();
    for (const u of ranked) {
      if (!u.collegeKey) continue;
      const c = colleges.get(u.collegeKey) || { name: u.college, points: 0, members: 0, verified: 0 };
      c.points += u.points;
      c.members += 1;
      c.verified += verifiedBy.get(u.id) || 0;
      colleges.set(u.collegeKey, c);
    }
    const meIndex = req.user ? ranked.findIndex((u) => u.id === req.user.id) : -1;
    res.json({
      users: ranked.slice(0, 20).map(row),
      colleges: [...colleges.values()].sort((a, b) => b.points - a.points).slice(0, 10).map((c, i) => ({ rank: i + 1, ...c })),
      me: meIndex >= 0 ? row(ranked[meIndex], meIndex) : null,
    });
  });

  return r;
}

export function flagTitle(id) {
  return FLAG_TEXT[id]?.en[0]?.replace(/\s*\(\{x\}\)/, "") || id;
}
