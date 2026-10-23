import { createApp } from "./src/app.js";

const { app, store, cfg, ai, seeded } = await createApp();

const server = app.listen(cfg.port, cfg.host, () => {
  const url = `http://localhost:${cfg.port}`;
  console.log(`\n  FinSuraksha is running at ${url}\n`);
  console.log(`  Suraksha-Dost AI mode : ${ai.enabled ? `ON (Groq: ${ai.model})` : "OFF - rule-based engine only (set GROQ_API_KEY to enable)"}`);
  console.log(`  Safe Browsing checks  : ${cfg.safeBrowsingKey ? "ON" : "OFF (optional GOOGLE_SAFE_BROWSING_API_KEY)"}`);
  console.log(`  Data folder           : ${store.dataDir}`);
  if (seeded) {
    console.log(`\n  Sample data loaded. Moderator login (also saved in ${seeded.file}):`);
    console.log(`    ${seeded.email} / ${seeded.password}`);
  }
  console.log("");
});

function shutdown() {
  store.flush();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
