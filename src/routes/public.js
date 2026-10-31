import express from "express";
import { registerInfo } from "../sebi.js";
import { CATEGORIES, PLATFORMS } from "../constants.js";
import { flagTitle } from "./hunt.js";

function isoWeekStart(d) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() - day + 1);
  return x;
}

export function publicRoutes({ store, cfg, ai }) {
  const r = express.Router();

  // Lightweight liveness check used by the page's reconnect banner and run.bat.
  r.get("/health", (_req, res) => res.json({ ok: true, app: "finsuraksha" }));

  r.get("/config", (_req, res) => {
    res.json({
      brand: "FinSuraksha",
      aiEnabled: Boolean(ai.enabled),
      aiVision: Boolean(ai.vision),
      safeBrowsing: Boolean(cfg.safeBrowsingKey),
      verifyThreshold: cfg.verifyThreshold,
      contactEmail: cfg.contactEmail || null,
      register: registerInfo(),
    });
  });

  r.get("/stats", (_req, res) => {
    const d = store.data;
    const reports = d.reports;
    const live = reports.filter((x) => x.status !== "rejected");
    const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, live.filter((x) => x.category === c).length]));
    const byPlatform = Object.fromEntries(PLATFORMS.map((p) => [p, live.filter((x) => x.platform === p).length]));

    const thisWeek = isoWeekStart(new Date());
    const weekly = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(thisWeek.getTime() - i * 7 * 864e5);
      const end = new Date(start.getTime() + 7 * 864e5);
      const inWeek = reports.filter((x) => {
        const t = Date.parse(x.createdAt);
        return t >= start.getTime() && t < end.getTime();
      });
      weekly.push({ week: start.toISOString().slice(0, 10), reports: inWeek.length, verified: inWeek.filter((x) => x.status === "verified").length });
    }

    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
      const c = d.counters.daily[day] || { checks: 0, flagged: 0 };
      daily.push({ day, checks: c.checks, flagged: c.flagged });
    }

    const active = new Set([...reports.map((x) => x.reporterId), ...d.votes.map((v) => v.userId)].filter(Boolean));
    const colleges = new Set(d.users.filter((u) => u.collegeKey && (u.points || 0) > 0).map((u) => u.collegeKey));
    const topFlags = Object.entries(d.counters.flags || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, count]) => ({ id, title: flagTitle(id), count }));

    res.json({
      checks: d.counters.checks || 0,
      verdicts: d.counters.verdicts || {},
      reports: reports.length,
      verified: reports.filter((x) => x.status === "verified").length,
      pending: reports.filter((x) => x.status === "pending").length,
      hunters: active.size,
      colleges: colleges.size,
      byCategory,
      byPlatform,
      weekly,
      daily,
      topFlags,
      includesSample: Boolean(d.meta.sampleData),
    });
  });

  r.get("/verify/:id", (req, res) => {
    const cert = store.data.certificates.find((c) => c.id === String(req.params.id).toUpperCase());
    if (!cert) return res.status(404).json({ valid: false, error: "No certificate with this ID." });
    res.json({
      valid: true,
      certificate: { id: cert.id, name: cert.name, college: cert.college, points: cert.points, verifiedReports: cert.verifiedReports, badges: cert.badges, issuedAt: cert.issuedAt, updatedAt: cert.updatedAt },
    });
  });

  return r;
}
