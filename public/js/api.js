import { emit } from "./state.js";
import { t } from "./i18n.js";

// Served from this computer or the local network? Then a request that can't
// connect almost always means the FinSuraksha server window was closed.
const LOCAL = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(location.hostname);
const TIMEOUT_MS = 90_000;

export function networkMessage(kind = "down") {
  if (kind === "timeout") return t("net.timeout");
  if (navigator.onLine === false) return t("net.offline");
  return t(LOCAL ? "net.serverLocal" : "net.server");
}

export class ApiError extends Error {
  constructor(status, body, kind = "down") {
    super(body?.error || (status ? t("net.failed", { s: status }) : networkMessage(kind)));
    this.status = status;
    this.code = body?.code;
    this.body = body;
  }
}

async function send(url, opts) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function request(method, url, body) {
  const opts = { method, headers: { Accept: "application/json" }, credentials: "same-origin" };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  let res;
  let failure;
  try {
    res = await send(url, opts);
  } catch (err) {
    failure = err;
  }
  // A read is safe to repeat once (for example while the server restarts).
  if (!res && method === "GET" && failure?.name !== "AbortError") {
    await new Promise((r) => setTimeout(r, 800));
    try {
      res = await send(url, opts);
    } catch (err) {
      failure = err;
    }
  }
  if (!res) {
    const kind = failure?.name === "AbortError" ? "timeout" : "down";
    if (kind === "down") emit("fs:net-down");
    throw new ApiError(0, null, kind);
  }
  const data = await res.json().catch(() => null);
  // The session expired or was signed out elsewhere: let the page update.
  if (res.status === 401 && !url.startsWith("/api/auth/")) emit("fs:unauth");
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  get: (url) => request("GET", url),
  post: (url, body = {}) => request("POST", url, body),
  patch: (url, body = {}) => request("PATCH", url, body),
  del: (url, body = {}) => request("DELETE", url, body),
};
