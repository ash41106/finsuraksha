import express from "express";
import path from "node:path";
import { buildConfig } from "./config.js";
import { createStore } from "./db.js";
import { securityHeaders, apiGuard, createRateLimiter } from "./security.js";
import { attachUser, pruneSessions } from "./auth.js";
import { createAi } from "./ai.js";
import { seedIfEmpty } from "./seed.js";
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
  const ai = createAi(cfg, { fetch: overrides.aiFetch });
  const limit = createRateLimiter(cfg);
  const ctx = { store, cfg, ai, limit };

  const app = express();
  app.disable("x-powered-by");
  if (cfg.trustProxy) app.set("trust proxy", 1);
  app.use(securityHeaders(cfg));
  app.use(express.json({ limit: "4mb" }));
  app.use(attachUser(store));

  app.use("/api", apiGuard);
  app.use("/api", publicRoutes(ctx));
  app.use("/api/auth", authRoutes(ctx));
  app.use("/api/dost", dostRoutes(ctx));
  app.use("/api", checkRoutes(ctx));
  app.use("/api/hunt", huntRoutes(ctx));
  app.use("/api/me", meRoutes(ctx));
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

  const pub = path.join(cfg.root, "public");
  app.use(
    express.static(pub, {
      index: "index.html",
      maxAge: "1h",
      setHeaders: (res, file) => {
        if (file.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
      },
    }),
  );
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
