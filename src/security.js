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
export function apiGuard(req, res, next) {
  res.setHeader("Cache-Control", "no-store");
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin) {
    let host = "";
    try {
      host = new URL(origin).host;
    } catch {
      /* invalid origin */
    }
    if (host !== req.headers.host) return res.status(403).json({ error: "Cross-origin request blocked." });
  }
  const len = Number(req.headers["content-length"] || 0);
  if (len > 0 && !req.is("application/json")) {
    return res.status(415).json({ error: "Send JSON (Content-Type: application/json)." });
  }
  next();
}

// Fixed-window limiter keyed by client IP + bucket name.
export function createRateLimiter(cfg) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  }, 60_000).unref();

  return function limit(bucket, max, windowMs, keyFn) {
    return (req, res, next) => {
      if (!cfg.rateLimits) return next();
      const who = keyFn ? keyFn(req) : req.ip;
      const key = `${bucket}:${who}`;
      const now = Date.now();
      let entry = hits.get(key);
      if (!entry || entry.reset < now) {
        entry = { count: 0, reset: now + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      if (entry.count > max) {
        res.setHeader("Retry-After", Math.ceil((entry.reset - now) / 1000));
        return res.status(429).json({ error: "Too many requests. Please wait a little and try again." });
      }
      next();
    };
  };
}
