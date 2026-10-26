import http from "node:http";
import os from "node:os";
import { spawn } from "node:child_process";
import { buildConfig } from "./src/config.js";
import { createApp } from "./src/app.js";
import { registerInfo } from "./src/sebi.js";

// `node server.js --open` (used by run.bat) also opens the site in the browser.
const OPEN = process.argv.includes("--open");

function openBrowser(url) {
  const [cmd, args] = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true, windowsHide: true }).unref();
  } catch {
    /* no browser available - the URL is printed anyway */
  }
}

function lanUrls(port) {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((n) => n && (n.family === "IPv4" || n.family === 4) && !n.internal && !n.address.startsWith("169.254."))
    .map((n) => `http://${n.address}:${port}`)
    .slice(0, 3);
}

async function isFinSuraksha(port) {
  for (const host of ["127.0.0.1", "[::1]"]) {
    try {
      const r = await fetch(`http://${host}:${port}/api/health`, { signal: AbortSignal.timeout(2500) });
      if ((await r.json())?.app === "finsuraksha") return true;
    } catch {
      /* try the next address */
    }
  }
  return false;
}

const { port, host } = buildConfig();
const url = `http://localhost:${port}`;

// Claim the port first and only then open the data store, so a second copy
// (run.bat double-clicked twice) never touches the data folder.
let attach;
const appReady = new Promise((resolve) => (attach = resolve));
const server = http.createServer((req, res) => appReady.then((app) => app(req, res)));

server.on("error", async (err) => {
  if (err.code !== "EADDRINUSE") throw err;
  if (await isFinSuraksha(port)) {
    console.log(`\n  FinSuraksha is already running at ${url}\n`);
    if (OPEN) openBrowser(url);
    process.exit(0);
  }
  console.error(`\n  Port ${port} is already used by another program.`);
  console.error("  Close that program, or set a different port in .env (for example PORT=3001).\n");
  process.exit(1);
});

server.listen(port, host, async () => {
  const { app, store, cfg, ai, seeded } = await createApp();
  attach(app);
  console.log(`\n  FinSuraksha is running at ${url}\n`);
  if (!host || host === "0.0.0.0" || host === "::") {
    for (const u of lanUrls(port)) console.log(`  On the same Wi-Fi     : ${u}`);
  }
  console.log(`  Suraksha-Dost AI mode : ${ai.enabled ? `ON (Groq: ${ai.model})` : "OFF - rule-based engine only (set GROQ_API_KEY to enable)"}`);
  console.log(`  Safe Browsing checks  : ${cfg.safeBrowsingKey ? "ON" : "OFF (optional GOOGLE_SAFE_BROWSING_API_KEY)"}`);
  const reg = registerInfo();
  console.log(`  SEBI register         : ${reg.count} entries, as on ${reg.asOf || "unknown"} (${reg.complete ? "complete" : "partial - see PROGRESS.md to load the full list"})${cfg.sebiLookupUrl ? " + lookup service" : ""}`);
  if (reg.stale) console.log(`  !! SEBI register is ${reg.ageDays ?? "?"} days old - refresh it (npm run import-register).`);
  console.log(`  Data folder           : ${store.dataDir}`);
  if (seeded) {
    console.log(`\n  Sample data loaded. Moderator login (also saved in ${seeded.file}):`);
    console.log(`    ${seeded.email} / ${seeded.password}`);
  }
  console.log("\n  Keep this window open while you use the site - closing it stops FinSuraksha.\n");
  if (OPEN) openBrowser(url);

  const shutdown = () => {
    store.flush();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500).unref();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  // Windows sends SIGHUP when the console window is closed.
  process.on("SIGHUP", shutdown);
});

// Log stray async errors instead of letting one bad request stop the server.
process.on("unhandledRejection", (err) => console.error("[unhandled]", err));
