import { state, loadPrefs, savePrefs, applyPrefs, emit, go } from "./state.js";
import { api, networkMessage } from "./api.js";
import { t } from "./i18n.js";
import { html, mount, icon, $, $$, el, initials, toast } from "./ui.js";

const routes = {
  "": () => import("./pages/home.js"),
  dost: () => import("./pages/dost.js"),
  hunt: () => import("./pages/hunt.js"),
  check: () => import("./pages/check.js"),
  learn: () => import("./pages/learn.js"),
  help: () => import("./pages/help.js"),
  me: () => import("./pages/me.js"),
  login: () => import("./pages/login.js"),
  certificate: () => import("./pages/cert.js"),
  verify: () => import("./pages/cert.js"),
  privacy: () => import("./pages/privacy.js"),
};

const NAV = [
  ["", "nav.home", "home"],
  ["dost", "nav.dost", "chat"],
  ["hunt", "nav.hunt", "flag"],
  ["check", "nav.check", "search"],
  ["learn", "nav.learn", "book"],
  ["help", "nav.help", "help"],
];

export function parseHash() {
  const h = location.hash.replace(/^#\/?/, "");
  const [path, qs] = h.split("?");
  return { parts: path.split("/").filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(qs || "") };
}

function renderHeader() {
  const { parts } = parseHash();
  const cur = parts[0] || "";
  const u = state.user;
  mount(
    $("#site-header"),
    html`<div class="container header-row">
      <a class="logo" href="#/" aria-label="FinSuraksha home"><span class="mark">${icon("shieldCheck")}</span>FinSuraksha<span class="dot">.</span></a>
      <nav class="pill-nav" id="main-nav" aria-label="Main">
        ${NAV.map(([path, key, ic]) => html`<a href="#/${path}" class="${cur === path ? "active" : ""}" ${cur === path ? html`aria-current="page"` : ""}>${cur === path ? icon(ic, "ico") : ""}${t(key)}</a>`)}
      </nav>
      <div class="header-actions">
        <div class="lang-toggle" role="group" aria-label="Language">
          <button type="button" data-lang="en" aria-pressed="${state.lang === "en"}">EN</button>
          <button type="button" data-lang="hi" aria-pressed="${state.lang === "hi"}">हिं</button>
        </div>
        <div class="menu">
          <button class="icon-btn" id="a11y-btn" aria-haspopup="true" aria-expanded="false" title="${t("nav.display")}" aria-label="${t("nav.display")}">${icon("access")}</button>
          <div class="menu-panel hidden" id="a11y-panel">
            <div class="label">${t("nav.textSize")}</div>
            <div class="seg">${["md", "lg", "xl"].map((f, i) => html`<button type="button" data-font="${f}" aria-pressed="${state.font === f}">${["A", "A+", "A++"][i]}</button>`)}</div>
            <div class="label">${t("nav.theme")}</div>
            <div class="seg">${["auto", "light", "dark"].map((th) => html`<button type="button" data-theme-set="${th}" aria-pressed="${state.theme === th}">${t(`nav.${th}`)}</button>`)}</div>
            <div class="label">${t("nav.contrast")}</div>
            <div class="seg">${["normal", "high"].map((c) => html`<button type="button" data-contrast="${c}" aria-pressed="${state.contrast === c}">${t(c === "high" ? "nav.on" : "nav.off")}</button>`)}</div>
            <div class="label">Language / भाषा</div>
            <div class="seg"><button type="button" data-lang="en" aria-pressed="${state.lang === "en"}">English</button><button type="button" data-lang="hi" aria-pressed="${state.lang === "hi"}">हिन्दी</button></div>
          </div>
        </div>
        ${u
          ? html`<div class="menu">
              <button class="avatar" id="user-btn" aria-haspopup="true" aria-expanded="false" title="${u.name}">${initials(u.name)}</button>
              <div class="menu-panel hidden" id="user-panel">
                <div class="label">${u.name} · ${u.points} pts</div>
                <a href="#/me">${icon("user")}${t("nav.profile")}</a>
                <a href="#/hunt?tab=report">${icon("flag")}${t("hunt.tabReport")}</a>
                <button class="item" id="logout-btn" type="button">${icon("logout")}${t("nav.logout")}</button>
              </div></div>`
          : html`<a class="btn btn-outline btn-sm hide-sm" href="#/login">${t("nav.signin")}</a>`}
        <button class="icon-btn menu-toggle" id="nav-toggle" aria-controls="main-nav" aria-expanded="false" aria-label="${t("nav.menu")}">${icon("menu")}</button>
      </div>
    </div>`,
  );

  const toggle = (btn, panel) => {
    btn?.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = panel.classList.toggle("hidden") === false;
      btn.setAttribute("aria-expanded", String(open));
    });
  };
  toggle($("#a11y-btn"), $("#a11y-panel"));
  toggle($("#user-btn"), $("#user-panel"));
  $("#nav-toggle").addEventListener("click", () => {
    const nav = $("#main-nav");
    const open = nav.classList.toggle("open");
    $("#nav-toggle").setAttribute("aria-expanded", String(open));
  });
  $$("[data-lang]").forEach((b) =>
    b.addEventListener("click", () => {
      state.lang = b.dataset.lang;
      if (!state.chatLangChosen) state.chatLang = state.lang;
      savePrefs();
      applyPrefs();
      emit("fs:lang");
    }),
  );
  $$("[data-font]").forEach((b) => b.addEventListener("click", () => setPref("font", b.dataset.font)));
  $$("[data-theme-set]").forEach((b) => b.addEventListener("click", () => setPref("theme", b.dataset.themeSet)));
  $$("[data-contrast]").forEach((b) => b.addEventListener("click", () => setPref("contrast", b.dataset.contrast)));
  $("#logout-btn")?.addEventListener("click", async () => {
    await api.post("/api/auth/logout").catch(() => {});
    state.user = null;
    emit("fs:auth");
    toast(state.lang === "hi" ? "साइन आउट हो गया" : "Signed out");
    go("");
  });
}

function setPref(key, value) {
  state[key] = value;
  savePrefs();
  applyPrefs();
  renderHeader();
  $("#a11y-panel")?.classList.remove("hidden");
  $("#a11y-btn")?.setAttribute("aria-expanded", "true");
}

function renderFooter() {
  mount(
    $("#site-footer"),
    html`<div class="container">
      <div class="footer-grid">
        <div>
          <a class="logo" href="#/"><span class="mark">${icon("shieldCheck")}</span>FinSuraksha<span class="dot">.</span></a>
          <p class="muted small" style="max-width:360px">${t("footer.about")}</p>
          <a class="small" href="#/privacy">${t("footer.privacy")}</a>
        </div>
        <div><h5>${t("footer.product")}</h5><ul>
          <li><a href="#/dost">${t("nav.dost")}</a></li><li><a href="#/hunt">${t("nav.hunt")}</a></li>
          <li><a href="#/check">${t("nav.check")}</a></li><li><a href="#/learn">${t("nav.learn")}</a></li><li><a href="#/help">${t("nav.help")}</a></li></ul></div>
        <div><h5>${t("footer.official")}</h5><ul>
          <li><a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">cybercrime.gov.in</a></li>
          <li><a href="https://sancharsaathi.gov.in/sfc/" target="_blank" rel="noopener noreferrer">Sanchar Saathi · Chakshu</a></li>
          <li><a href="https://scores.sebi.gov.in" target="_blank" rel="noopener noreferrer">SEBI SCORES</a></li>
          <li><a href="https://siportal.sebi.gov.in/intermediary/sebi-check" target="_blank" rel="noopener noreferrer">SEBI Check</a></li>
          <li><a href="https://sachet.rbi.org.in" target="_blank" rel="noopener noreferrer">RBI Sachet</a></li></ul></div>
        <div><h5>${t("footer.emergency")}</h5><p class="small muted">${t("footer.emText")}</p>
          <a class="helpline" href="tel:1930">${icon("phone")}1930</a>
          <p class="small muted" style="margin-top:10px">SEBI: 1800 266 7575</p></div>
      </div>
      <div class="footer-note"><span>${t("footer.disclaimer")}</span><span>© ${new Date().getFullYear()} FinSuraksha</span></div>
    </div>`,
  );
}

let cleanup = null;
let navSeq = 0;
async function navigate() {
  const seq = ++navSeq;
  const { parts, query } = parseHash();
  const app = $("#app");
  if (cleanup) {
    try {
      cleanup();
    } catch {
      /* ignore */
    }
    cleanup = null;
  }
  renderHeader();
  const loader = routes[parts[0] || ""];
  if (!loader) {
    mount(app, html`<section class="container page-hero"><h1 class="page-title">${t("notfound.title")}</h1><p class="lead">${t("notfound.text")}</p><a class="btn btn-primary" href="#/">${t("nav.home")}</a></section>`);
    return;
  }
  app.setAttribute("aria-busy", "true");
  try {
    const mod = await loader();
    if (seq !== navSeq) return;
    app.innerHTML = "";
    const result = await mod.render(app, { parts, query });
    if (seq !== navSeq) {
      if (typeof result === "function") result();
      return;
    }
    cleanup = typeof result === "function" ? result : null;
  } catch (err) {
    console.error(err);
    mount(app, html`<section class="container page-hero"><h1 class="page-title">${t("common.error")}</h1><p class="lead">${err.message || ""}</p><button class="btn btn-primary" id="retry">${t("common.retry")}</button></section>`);
    $("#retry")?.addEventListener("click", navigate);
  } finally {
    app.removeAttribute("aria-busy");
  }
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  if (document.activeElement === document.body || document.activeElement?.closest?.("#site-header") === null) app.focus({ preventScroll: true });
}

// ---- Connection banner: shown when the server can't be reached, polls
// /api/health and disappears (with a toast) as soon as it answers again.
let netTimer = null;
function showNetBanner() {
  let bar = $("#net-banner");
  if (!bar) {
    bar = el(html`<div class="net-banner" id="net-banner" role="alert">
      <span class="nb-ico">${icon("alert")}</span>
      <div class="nb-text"><b>${t("net.bannerTitle")}</b><span id="net-msg"></span></div>
      <button class="btn btn-sm btn-light" type="button" id="net-retry">${icon("refresh")}${t("net.retry")}</button></div>`);
    document.body.appendChild(bar);
    bar.querySelector("#net-retry").addEventListener("click", () => checkServer(true));
  }
  $("#net-msg").textContent = networkMessage();
  if (!netTimer) netTimer = setInterval(checkServer, 4000);
}
async function checkServer(manual = false) {
  try {
    const r = await fetch("/api/health", { cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
  } catch {
    if ($("#net-banner")) $("#net-msg").textContent = networkMessage();
    if (manual) toast(t("net.stillDown"), "err");
    return;
  }
  if (!$("#net-banner")) return;
  $("#net-banner").remove();
  clearInterval(netTimer);
  netTimer = null;
  toast(t("net.back"));
  // The server may have restarted: refresh config and who is signed in.
  try {
    const [cfg, me] = await Promise.all([api.get("/api/config"), api.get("/api/auth/me")]);
    state.config = cfg;
    state.user = me.user;
    renderHeader();
  } catch {
    /* banner comes back on the next failed request */
  }
}
document.addEventListener("fs:net-down", showNetBanner);
window.addEventListener("online", () => checkServer());

document.addEventListener("click", (e) => {
  if (!e.target.closest(".menu")) {
    $$(".menu-panel").forEach((p) => p.classList.add("hidden"));
    $$("[aria-haspopup]").forEach((b) => b.setAttribute("aria-expanded", "false"));
  }
  if (e.target.closest("#main-nav a")) $("#main-nav")?.classList.remove("open");
});

async function boot() {
  loadPrefs();
  // Shareable language links, e.g. /?lang=hi#/dost for a Hindi-speaking parent.
  const urlLang = new URLSearchParams(location.search).get("lang");
  if (urlLang === "en" || urlLang === "hi") {
    state.lang = urlLang;
    state.chatLang = urlLang;
    savePrefs();
  }
  applyPrefs();
  try {
    const [cfg, me] = await Promise.all([api.get("/api/config"), api.get("/api/auth/me")]);
    state.config = cfg;
    state.user = me.user;
  } catch {
    /* offline or server down - pages show their own errors */
  }
  renderFooter();
  window.addEventListener("hashchange", navigate);
  document.addEventListener("fs:auth", renderHeader);
  document.addEventListener("fs:lang", () => {
    renderFooter();
    navigate();
  });
  await navigate();
}

boot();
