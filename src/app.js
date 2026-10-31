import express from "express";
import compression from "compression";
import path from "node:path";
import { buildConfig } from "./config.js";
import { createStore } from "./db.js";
import { securityHeaders, apiGuard, createRateLimiter } from "./security.js";
import { attachUser, pruneSessions, hashPassword } from "./auth.js";
import { checkPassword } from "./validate.js";
import { createAi } from "./ai.js";
import { seedIfEmpty } from "./seed.js";
import { setRegisterExtras } from "./sebi.js";
import { scheduleRetention } from "./retention.js";
import { authRoutes } from "./routes/auth.js";
import { dostRoutes } from "./routes/dost.js";
import { checkRoutes } from "./routes/check.js";
import { huntRoutes } from "./routes/hunt.js";
import { meRoutes } from "./routes/me.js";
import { publicRoutes } from "./routes/public.js";

export async function createApp(overrides = {}) {
  const cfg = buildConfig(overrides);
  const store = createStore(cfg.dataDir);
  const seeded = cfg.seedDemo ? await seedIfEmpty(store, cfg) : null;
  pruneSessions(store);
  setInterval(() => pruneSessions(store), 60 * 60_000).unref();
  await ensureAdmin(store, cfg);
  if (!overrides.dataDir || cfg.backups) {
    store.backup();
    setInterval(() => store.backup(), 24 * 60 * 60_000).unref();
  }
  setRegisterExtras(store.data.registerAdditions);
  scheduleRetention(store);
  const ai = createAi(cfg, { fetch: overrides.aiFetch });
  const limit = createRateLimiter(cfg);
  const ctx = { store, cfg, ai, limit };

  const app = express();
  app.disable("x-powered-by");
  if (cfg.trustProxy) app.set("trust proxy", cfg.trustProxy);
  app.use(compression());
  app.use(securityHeaders(cfg));
  // Only the two endpoints that accept a screenshot need a large body.
  const bigJson = express.json({ limit: "4mb" });
  const smallJson = express.json({ limit: "100kb" });
  const BIG = new Set(["/api/hunt/reports", "/api/dost/analyze"]);
  app.use((req, res, next) => (req.method === "POST" && BIG.has(req.path) ? bigJson : smallJson)(req, res, next));
  if (cfg.logRequests) {
    app.use((req, res, next) => {
      const t = Date.now();
      res.on("finish", () => console.log(`${req.method} ${req.originalUrl.split("?")[0]} ${res.statusCode} ${Date.now() - t}ms`));
      next();
    });
  }
  if (!cfg.trustProxy && !cfg.quiet) {
    let warned = false;
    app.use((req, _res, next) => {
      if (!warned && req.headers["x-forwarded-for"]) {
        warned = true;
        console.warn("Requests arrive through a proxy but TRUST_PROXY is not set: rate limits will treat every visitor as one. Set TRUST_PROXY=1.");
      }
      next();
    });
  }
  app.use(attachUser(store));

  app.use("/api", apiGuard(cfg));
  app.use("/api", publicRoutes(ctx));
  app.use("/api/auth", authRoutes(ctx));
  app.use("/api/dost", dostRoutes(ctx));
  app.use("/api", checkRoutes(ctx));
  app.use("/api/hunt", huntRoutes(ctx));
  app.use("/api/me", meRoutes(ctx));
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

  const pub = path.join(cfg.root, "public");
  // no-cache = the browser re-checks each file (cheap 304s), so an updated
  // page or script shows up right away instead of after an hour.
  app.use(
    express.static(pub, {
      index: "index.html",
      setHeaders: (res) => res.setHeader("Cache-Control", "no-cache"),
    }),
  );
  // A missing file (anything with an extension) is a real 404, not the page.
  app.get(/\.[a-z0-9]{1,8}$/i, (_req, res) => res.status(404).type("text").send("Not found"));
  // SPA fallback (hash routing makes this rare, but keep deep links working).
  app.get("*", (_req, res) => res.sendFile(path.join(pub, "index.html")));

  // JSON errors for the API; never leak stack traces.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON body." });
    if (err?.type === "entity.too.large") return res.status(413).json({ error: "Upload is too large." });
    const status = err?.status && err.status < 600 ? err.status : 500;
    if (status >= 500 && !cfg.quiet) console.error(err);
    res.status(status).json({ error: status >= 500 ? "Something went wrong. Please try again." : err.message, code: err.code });
  });

  return { app, store, cfg, ai, seeded };
}

// First moderator for a fresh deployment, from ADMIN_EMAIL / ADMIN_PASSWORD.
// An existing account is promoted, never has its password changed.
async function ensureAdmin(store, cfg) {
  if (!cfg.adminEmail) return;
  const existing = store.data.users.find((u) => u.email === cfg.adminEmail);
  if (existing) {
    if (!existing.isModerator) {
      existing.isModerator = true;
      store.save();
    }
    return;
  }
  if (!cfg.adminPassword) return console.warn("ADMIN_EMAIL is set but ADMIN_PASSWORD is not; no admin account created.");
  try {
    checkPassword(cfg.adminPassword);
  } catch (e) {
    return console.warn(`ADMIN_PASSWORD rejected: ${e.message}`);
  }
  const now = new Date().toISOString();
  store.data.users.push({
    id: store.id("usr"),
    name: "Admin",
    email: cfg.adminEmail,
    passHash: await hashPassword(cfg.adminPassword),
    role: "other",
    college: "",
    collegeKey: "",
    leaderboard: false,
    isModerator: true,
    points: 0,
    badges: [],
    learned: [],
    quiz: { best: 0, lastDay: null, attempts: 0 },
    consentAt: now,
    createdAt: now,
    lastLoginAt: now,
  });
  store.save();
  if (!cfg.quiet) console.log(`Admin account created for ${cfg.adminEmail}.`);
}
