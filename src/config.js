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
// Set by `node --test`: the test suite never calls outside services.
const underTest = Boolean(env.NODE_TEST_CONTEXT);
const bool = (v, d = false) => (v === undefined || v === "" ? d : /^(1|true|yes|on)$/i.test(v));
const list = (v) =>
  String(v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// TRUST_PROXY: false (default), true (= one proxy hop), a hop count, or a list
// of proxy addresses / CIDRs, exactly as Express's "trust proxy" setting.
function trustProxySetting(v) {
  if (v === undefined || v === "" || /^(0|false|no|off)$/i.test(v)) return false;
  if (/^(1|true|yes|on)$/i.test(v)) return 1;
  if (/^\d+$/.test(v)) return Number(v);
  return v;
}

// Public address of the site, e.g. https://finsuraksha.in (no trailing slash).
function publicUrl(v) {
  try {
    const u = new URL(v);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "";
  }
}

export function buildConfig(overrides = {}) {
  const cfg = {
    root: ROOT,
    // Unset = all interfaces, IPv4 and IPv6 (so "localhost" answers either way).
    host: env.HOST || undefined,
    port: Number(env.PORT) || 3000,
    dataDir: env.DATA_DIR ? path.resolve(env.DATA_DIR) : path.join(ROOT, "data"),
    // AI mode is on when GEMINI_API_KEY (preferred) or GROQ_API_KEY is set.
    // App settings use an FS_ prefix so they never collide with other tools.
    geminiKey: env.GEMINI_API_KEY || "",
    groqKey: env.GROQ_API_KEY || "",
    aiProvider: env.GEMINI_API_KEY ? "gemini" : "groq",
    aiEnabled: bool(env.FS_AI_ENABLED, Boolean(env.GEMINI_API_KEY || env.GROQ_API_KEY)),
    aiModel: env.FS_AI_MODEL || (env.GEMINI_API_KEY ? "gemini-2.5-flash" : "openai/gpt-oss-120b"),
    aiEffort: ["low", "medium", "high"].includes(env.FS_AI_EFFORT) ? env.FS_AI_EFFORT : "low",
    safeBrowsingKey: env.GOOGLE_SAFE_BROWSING_API_KEY || "",
    // Optional SEBI registration lookup service for numbers missing from the local register.
    sebiLookupUrl: env.SEBI_LOOKUP_URL || "",
    sebiLookupKey: env.SEBI_LOOKUP_KEY || "",
    // Check numbers missing from the local copy on SEBI's own website.
    sebiLive: bool(env.SEBI_LIVE_CHECK, !underTest),
    // Re-download SEBI's lists once a day into DATA_DIR/sebi_register.json.
    sebiSync: bool(env.SEBI_SYNC, !underTest),
    moderatorEmails: (env.MODERATOR_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    verifyThreshold: Math.max(2, Number(env.VERIFY_THRESHOLD) || 3),
    seedDemo: bool(env.SEED_DEMO, true),
    cookieSecure: bool(env.COOKIE_SECURE, false),
    trustProxy: trustProxySetting(env.TRUST_PROXY),
    publicUrl: publicUrl(env.PUBLIC_URL),
    // Extra origins allowed to call the API (besides the site's own host).
    allowedOrigins: list(env.ALLOWED_ORIGINS).map(publicUrl).filter(Boolean),
    // First moderator for a fresh deployment (created at start-up if missing).
    adminEmail: (env.ADMIN_EMAIL || "").trim().toLowerCase(),
    adminPassword: env.ADMIN_PASSWORD || "",
    // Grievance / contact address shown on the privacy and terms pages.
    contactEmail: (env.CONTACT_EMAIL || "").trim(),
    // Multiplies every rate limit, e.g. 3 for a campus event behind one IP.
    rateLimitScale: Math.max(0.1, Number(env.RATE_LIMIT_SCALE) || 1),
    logRequests: bool(env.LOG_REQUESTS, false),
    production: env.NODE_ENV === "production",
    rateLimits: true,
    quiet: false,
    ...overrides,
  };
  return cfg;
}

export const config = buildConfig();
