// UI toolkit: auto-escaping html`` templates, icons, toasts, modals, markdown-lite.
// Every interpolated value is HTML-escaped unless explicitly wrapped in raw().

export class Safe {
  constructor(s) {
    this.s = s;
  }
  toString() {
    return this.s;
  }
}
export const raw = (s) => new Safe(String(s ?? ""));
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ESC[c]);
function toHtml(v) {
  if (v === null || v === undefined || v === false) return "";
  if (v instanceof Safe) return v.s;
  if (Array.isArray(v)) return v.map(toHtml).join("");
  return esc(v);
}
export function html(strings, ...vals) {
  let out = strings[0];
  for (let i = 0; i < vals.length; i++) out += toHtml(vals[i]) + strings[i + 1];
  return new Safe(out);
}
export function mount(target, content) {
  target.innerHTML = toHtml(content);
  return target;
}
export function el(content) {
  const t = document.createElement("template");
  t.innerHTML = toHtml(content).trim();
  return t.content.firstElementChild;
}
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---- Icons (24px stroke) -------------------------------------------------
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12Z"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z"/>',
  shieldCheck: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="m9 12 2 2 4-4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>',
  help: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="m5.6 5.6 3.9 3.9m5 5 3.9 3.9m0-12.8-3.9 3.9m-5 5-3.9 3.9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.8"/><path d="M16 14.2a5.5 5.5 0 0 1 6 5.8"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5"/><path d="M5 12h11"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
  clip: '<path d="m21 11.5-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2l-9 9a1.8 1.8 0 0 1-2.6-2.6l8.2-8.2"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  send: '<path d="M21 3 10 14"/><path d="M21 3 14.5 21l-4.5-7-7-4.5L21 3Z"/>',
  volume: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18Z"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M17 5h3v2a3 3 0 0 1-3 3"/><path d="M7 5H4v2a3 3 0 0 0 3 3"/>',
  chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M21 20H3"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  alert: '<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4.5"/><path d="M12 17.5v.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.01"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 1-1 1.7v.5"/><path d="M12 17v.01"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
  arrowUpRight: '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  access: '<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5l7 1.5 7-1.5"/><path d="M12 10v5l-3 6M12 15l3 6"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4"/>',
  phone: '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 12l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 20v-4h-4"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
  download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
  upload: '<path d="M12 20V9"/><path d="m7 14 5-5 5 5"/><path d="M5 4h14"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  rupee: '<path d="M7 5h10M7 9h10M8 5c4.5 0 6 2 6 4s-1.5 4-6 4l6 6"/>',
  app: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  vote: '<path d="M4 13h4v8H4z"/><path d="M8 13l4-9a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17.8 20H8"/>',
  gavel: '<path d="m14 4 6 6"/><path d="m11 7 6 6"/><path d="M12.5 5.5 18.5 11.5"/><path d="m4 20 7-7"/><path d="M3 21h8"/>',
};
export function icon(name, cls = "") {
  return raw(`<svg class="${cls}" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.info}</svg>`);
}

// ---- Markdown-lite (bold, code, bullets) + official links only -----------
const OFFICIAL_RE =
  /\b(?:https?:\/\/)?((?:www\.)?(?:cybercrime\.gov\.in|sancharsaathi\.gov\.in|scores\.sebi\.gov\.in|siportal\.sebi\.gov\.in|investor\.sebi\.gov\.in|sebi\.gov\.in|sachet\.rbi\.org\.in|rbi\.org\.in|smartodr\.in|nseindia\.com|bseindia\.com|cdslindia\.com)(?:\/[\w\-./]*[\w/])?)/g;
function inline(s) {
  let x = esc(s);
  x = x.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>");
  x = x.replace(OFFICIAL_RE, (_m, host) => `<a href="https://${host}" target="_blank" rel="noopener noreferrer">${host}</a>`);
  x = x.replace(/(^|[^\d])1930(?!\d)/g, '$1<a href="tel:1930">1930</a>');
  return x;
}
export function md(text) {
  const lines = String(text || "").split(/\r?\n/);
  let out = "";
  let list = false;
  for (const ln of lines) {
    const m = ln.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
    if (m) {
      if (!list) {
        out += "<ul>";
        list = true;
      }
      out += `<li>${inline(m[1])}</li>`;
    } else {
      if (list) {
        out += "</ul>";
        list = false;
      }
      if (ln.trim()) out += `<p>${inline(ln)}</p>`;
    }
  }
  if (list) out += "</ul>";
  return raw(out);
}
export const plain = (text) =>
  String(text || "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-•*]\s+/gm, "• ");

// ---- Toasts & modals ------------------------------------------------------
export function toast(message, type = "ok", ms = 3800) {
  const stack = document.getElementById("toasts");
  if (!stack) return;
  const node = el(html`<div class="toast ${type}">${icon(type === "err" ? "alert" : type === "info" ? "info" : "check")}<span>${message}</span></div>`);
  stack.appendChild(node);
  setTimeout(() => node.remove(), ms);
}

export function modal({ title, body, wide = false, onClose } = {}) {
  const prev = document.activeElement;
  const node = el(html`<div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="${title || ""}">
    <div class="modal" style="${wide ? "width:min(900px,100%)" : ""}">
      <div class="modal-head"><h3>${title || ""}</h3><button class="icon-btn" data-close aria-label="Close">${icon("x")}</button></div>
      <div class="modal-body"></div>
    </div></div>`);
  const bodyEl = node.querySelector(".modal-body");
  if (body instanceof Node) bodyEl.appendChild(body);
  else mount(bodyEl, body);
  const close = () => {
    node.remove();
    document.removeEventListener("keydown", onKey);
    onClose?.();
    prev?.focus?.();
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  node.addEventListener("click", (e) => {
    if (e.target === node || e.target.closest("[data-close]")) close();
  });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(node);
  node.querySelector("[data-close]").focus();
  return { close, body: bodyEl, node };
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

// ---- Formatting -----------------------------------------------------------
export function fmtNum(n) {
  const v = Number(n) || 0;
  if (v < 1000) return String(v);
  if (v < 1e5) return `${(v / 1000).toFixed(v < 1e4 ? 1 : 0).replace(/\.0$/, "")}K`;
  if (v < 1e7) return `${(v / 1e5).toFixed(1).replace(/\.0$/, "")}L`;
  return `${(v / 1e7).toFixed(1).replace(/\.0$/, "")}Cr`;
}
export function timeAgo(iso, lang = "en") {
  const s = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 1000));
  const units = [
    [86400 * 30, lang === "hi" ? "महीने" : "mo"],
    [86400 * 7, lang === "hi" ? "हफ़्ते" : "w"],
    [86400, lang === "hi" ? "दिन" : "d"],
    [3600, lang === "hi" ? "घंटे" : "h"],
    [60, lang === "hi" ? "मिनट" : "m"],
  ];
  for (const [sec, u] of units) if (s >= sec) return lang === "hi" ? `${Math.floor(s / sec)} ${u} पहले` : `${Math.floor(s / sec)}${u} ago`;
  return lang === "hi" ? "अभी" : "just now";
}
export function fmtDate(iso, lang = "en") {
  try {
    return new Date(iso).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}
export function initials(name) {
  return String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ---- Risk visuals ---------------------------------------------------------
export function ring(score, level) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score || 0));
  const color = { high: "var(--risk-high)", medium: "var(--risk-medium)", low: "var(--risk-low)" }[level] || "var(--risk-unknown)";
  return html`<div class="risk-ring" role="img" aria-label="Risk score ${pct} out of 100">
    <svg viewBox="0 0 74 74"><circle cx="37" cy="37" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="7"/>
    <circle cx="37" cy="37" r="${r}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${((pct / 100) * c).toFixed(1)} ${c.toFixed(1)}"/></svg>
    <div class="num"><div>${pct}<small>/100</small></div></div></div>`;
}

export function debounce(fn, ms = 250) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}
