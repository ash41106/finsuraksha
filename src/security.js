// Security middleware: headers (CSP etc.), CSRF-style origin check for the JSON
// API, and a small in-memory rate limiter.

const CSP = [
  "default-src 'self'",
  // jsDelivr hosts the OCR (tesseract.js) and QR (jsQR) libraries, loaded on demand.
  "script-src 'self' https://cdn.jsdelivr.net 'wasm-unsafe-eval'",
  "worker-src 'self' blob: https://cdn.jsdelivr.net",
  "connect-src 'self' https://cdn.jsdelivr.net https://tessdata.projectnaptha.com",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export function securityHeaders(cfg) {
  return (req, res, next) => {
    res.setHeader("Content-Security-Policy", CSP);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "microphone=(self), camera=(), geolocation=(), payment=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    if (cfg.cookieSecure) res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
    next();
  };
}

// State-changing API calls must be same-origin JSON. Cross-site forms cannot send
// application/json without a CORS preflight (which we never grant), and the
// session cookie is SameSite=Lax, so this closes the CSRF door.
export function apiGuard(cfg) {
  const extraHosts = new Set([cfg.publicUrl, ...(cfg.allowedOrigins || [])].filter(Boolean).map((o) => new URL(o).host));
  return (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    const origin = req.headers.origin;
    if (origin) {
      let host = "";
      try {
        host = new URL(origin).host;
      } catch {
        /* invalid origin, e.g. "null" */
      }
      // Behind a reverse proxy the Host header may be the internal address
      // (nginx's default), so the forwarded host also counts as "this site".
      const forwarded = cfg.trustProxy ? String(req.headers["x-forwarded-host"] || "").split(",")[0].trim() : "";
      const ok = host && (host === req.headers.host || host === forwarded || extraHosts.has(host));
      if (!ok) return res.status(403).json({ error: "Cross-origin request blocked." });
    }
    const len = Number(req.headers["content-length"] || 0);
    if (len > 0 && !req.is("application/json")) {
      return res.status(415).json({ error: "Send JSON (Content-Type: application/json)." });
    }
    next();
  };
}

// Signed-in members are limited per account, everyone else per IP address.
export const byUserOrIp = (req) => (req.user ? `u:${req.user.id}` : `ip:${req.ip}`);

// Fixed-window limiter keyed by client (IP by default) + bucket name.
// count: "all" counts every request; "failures" only responses >= 400 (so
// people behind one college or mobile-carrier IP don't block each other by
// signing in); "successes" only responses < 400 (typos don't use up the quota).
export function createRateLimiter(cfg) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  }, 60_000).unref();

  return function limit(bucket, max, windowMs, opts = {}) {
    const { key = (req) => req.ip, count = "all" } = typeof opts === "function" ? { key: opts } : opts;
    const cap = Math.max(1, Math.round(max * (cfg.rateLimitScale || 1)));
    return (req, res, next) => {
      if (!cfg.rateLimits) return next();
      const k = `${bucket}:${key(req)}`;
      const now = Date.now();
      let entry = hits.get(k);
      if (!entry || entry.reset < now) {
        entry = { count: 0, reset: now + windowMs };
        hits.set(k, entry);
      }
      if (entry.count >= cap) {
        res.setHeader("Retry-After", Math.ceil((entry.reset - now) / 1000));
        return res.status(429).json({ error: "Too many requests. Please wait a little and try again." });
      }
      if (count === "all") entry.count += 1;
      else {
        res.on("finish", () => {
          const failed = res.statusCode >= 400;
          if ((count === "failures" && failed) || (count === "successes" && !failed)) entry.count += 1;
        });
      }
      next();
    };
  };
}
