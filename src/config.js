import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Minimal .env loader (no dependency). Real environment variables win.
function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadDotEnv(path.join(ROOT, ".env"));

const env = process.env;
const bool = (v, d = false) => (v === undefined || v === "" ? d : /^(1|true|yes|on)$/i.test(v));

export function buildConfig(overrides = {}) {
  const cfg = {
    root: ROOT,
    // Unset = all interfaces, IPv4 and IPv6 (so "localhost" answers either way).
    host: env.HOST || undefined,
    port: Number(env.PORT) || 3000,
    dataDir: env.DATA_DIR ? path.resolve(env.DATA_DIR) : path.join(ROOT, "data"),
    // AI mode (Groq) is on when GROQ_API_KEY is set. App settings use an FS_
    // prefix so they never collide with other tools' variables.
    groqKey: env.GROQ_API_KEY || "",
    aiEnabled: bool(env.FS_AI_ENABLED, Boolean(env.GROQ_API_KEY)),
    aiModel: env.FS_AI_MODEL || "openai/gpt-oss-120b",
    aiEffort: ["low", "medium", "high"].includes(env.FS_AI_EFFORT) ? env.FS_AI_EFFORT : "low",
    safeBrowsingKey: env.GOOGLE_SAFE_BROWSING_API_KEY || "",
    moderatorEmails: (env.MODERATOR_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    verifyThreshold: Math.max(2, Number(env.VERIFY_THRESHOLD) || 3),
    seedDemo: bool(env.SEED_DEMO, true),
    cookieSecure: bool(env.COOKIE_SECURE, false),
    trustProxy: bool(env.TRUST_PROXY, false),
    rateLimits: true,
    quiet: false,
    ...overrides,
  };
  return cfg;
}

export const config = buildConfig();
