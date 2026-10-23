// Global client state + persisted display preferences (per-device only).
export const state = {
  user: null,
  config: { aiEnabled: false, safeBrowsing: false, verifyThreshold: 3, register: {} },
  lang: "en", // UI language: en | hi
  chatLang: "en", // Suraksha-Dost reply language
  theme: "light", // light (default, matches the brand look) | dark | auto
  font: "md", // md | lg | xl
  contrast: "normal",
  autoSpeak: false,
};

const KEY = "fs_prefs";
const PERSIST = ["lang", "chatLang", "theme", "font", "contrast", "autoSpeak"];

export function loadPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    for (const k of PERSIST) if (saved[k] !== undefined) state[k] = saved[k];
  } catch {
    /* defaults */
  }
}

export function savePrefs() {
  try {
    const out = {};
    for (const k of PERSIST) out[k] = state[k];
    localStorage.setItem(KEY, JSON.stringify(out));
  } catch {
    /* storage blocked - preferences last for this visit only */
  }
}

export function applyPrefs() {
  const root = document.documentElement;
  if (state.theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", state.theme);
  if (state.font === "md") root.removeAttribute("data-font");
  else root.setAttribute("data-font", state.font);
  if (state.contrast === "high") root.setAttribute("data-contrast", "high");
  else root.removeAttribute("data-contrast");
  root.setAttribute("lang", state.lang);
}

export function emit(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

export function go(path) {
  const target = `#/${String(path).replace(/^#?\/?/, "")}`;
  if (location.hash === target) window.dispatchEvent(new HashChangeEvent("hashchange"));
  else location.hash = target;
}
