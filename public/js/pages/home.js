import { state } from "../state.js";
import { api } from "../api.js";
import { t, L } from "../i18n.js";
import { html, mount, icon, $, fmtNum, timeAgo, raw } from "../ui.js";
import { lineChart, columnChart, barList, riskBar, chartCard } from "../charts.js";
import { CATEGORY, PLATFORM, SCAM_LINES, STRIP } from "../content.js";
import { alertCard, bindOpeners } from "./hunt-shared.js";

export async function render(root) {
  const [stats, wall] = await Promise.all([api.get("/api/stats").catch(() => null), api.get("/api/hunt/reports?status=verified&limit=3").catch(() => ({ reports: [] }))]);
  const s = stats || { checks: 0, verified: 0, hunters: 0, colleges: 0, weekly: [], daily: [], byCategory: {}, byPlatform: {}, verdicts: {} };
  const week = s.daily.reduce((a, d) => a + d.checks, 0);
  const flagged = s.daily.reduce((a, d) => a + d.flagged, 0);

  mount(
    root,
    html`
    <section class="hero">
      <div class="blob b1"></div><div class="blob b2"></div><div class="dots d1"></div><div class="dots d2"></div>
      <div class="container hero-inner">
        <span class="badge-pill"><span class="avatars"><span>AS</span><span>DK</span><span>KM</span></span>${raw(t("home.badge", { hunters: `<b>${fmtNum(s.hunters)}</b>`, verified: `<b>${fmtNum(s.verified)}</b>` }))}</span>
        <h1 class="display">${t("home.h1a")}<span class="soft">${t("home.h1b")}</span><br />${t("home.h1c")} <span class="inline-pill" aria-hidden="true"><span>${icon("arrowUpRight")}</span></span> <span class="soft">${t("home.h1d")}</span></h1>
        <p class="lead">${t("home.lead")}</p>
        <div class="cta-row">
          <a class="btn btn-primary btn-lg" href="#/dost">${t("home.cta1")}</a>
          <a class="btn btn-outline btn-lg" href="#/hunt">${t("home.cta2")}</a>
        </div>
        <div class="hero-visual" aria-hidden="true">
          <div class="float-chip c1"><span class="ico-circle" style="background:color-mix(in srgb,var(--risk-low) 16%,transparent);color:var(--risk-low)">${icon("check")}</span>${t("home.chipSebi")}</div>
          <div class="float-chip c2"><span class="ico-circle" style="background:color-mix(in srgb,var(--risk-high) 14%,transparent);color:var(--risk-high)">${icon("alert")}</span>${t("home.chipRisk")}</div>
          <div class="float-chip c3"><span class="ico-circle" style="background:var(--brand-soft);color:var(--brand)">${icon("rupee")}</span>${t("home.chipUpi")}</div>
          <div class="safety-card">
            <div class="sc-top"><span>${t("home.cardPass")}</span><span>${icon("shield")}</span></div>
            <div class="emblem">${icon("shieldCheck")}</div>
            <div class="sc-name">${t("home.cardName")}</div>
            <div class="sc-sub">${t("home.cardSub")}</div>
            <div class="sc-foot"><span>FINSURAKSHA</span><span>1930</span></div>
          </div>
        </div>
      </div>
      <div class="container">
        <div class="dash-row" id="dash"></div>
        ${s.includesSample ? html`<div class="sample-note">${t("common.includesSample")}</div>` : ""}
      </div>
    </section>

    <section class="strip" aria-label="${t("home.stripTitle")}">
      <div class="container"><div class="strip-grid">
        ${STRIP.map((x) => html`<div class="strip-cell"><span class="ico">${icon(x.icon)}</span>${L(CATEGORY[x.key])}</div>`)}
      </div></div>
    </section>

    <section class="quote-band" aria-roledescription="carousel" aria-label="${t("home.quoteKicker")}">
      <div class="container">
        <div class="qmark" aria-hidden="true">&ldquo;</div>
        <div class="quote-body">
          <div class="quote-kicker">${t("home.quoteKicker")}</div>
          <div class="quote-text" id="q-text" aria-live="polite"></div>
          <div class="quote-meta">
            <div class="quote-src"><span class="src-ico" id="q-ico"></span><div><b id="q-src"></b><div class="quote-flags" id="q-flags"></div></div></div>
            <div class="q-nav"><button type="button" id="q-prev" aria-label="Previous">${icon("arrowLeft")}</button><span class="q-count" id="q-count"></span><button type="button" class="next" id="q-next" aria-label="Next">${icon("arrowRight")}</button></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="blob b3"></div>
      <div class="container">
        <div class="panel-sheet">
          <div class="section-head">
            <h2 class="h-section">${t("home.secTitleA")}<br /><span class="soft">${t("home.secTitleB")}</span></h2>
            <p>${t("home.secText")}</p>
          </div>
          <div class="grid grid-4">
            <a class="feature-card" href="#/dost">
              <div class="feature-visual"><div class="mock-bubble me">Join VIP for guaranteed 30% monthly…</div><div class="mock-bubble alert"><b>${t("level.high")}</b> · 4 red flags</div></div>
              <h3>${t("home.f1t")}</h3><p>${t("home.f1d")}</p><span class="go">${t("home.open")} ${icon("arrowRight")}</span></a>
            <a class="feature-card" href="#/hunt">
              <div class="feature-visual" id="mini-weekly" style="padding:8px 6px 0"></div>
              <h3>${t("home.f2t")}</h3><p>${t("home.f2d")}</p><span class="go">${t("home.open")} ${icon("arrowRight")}</span></a>
            <a class="feature-card" href="#/check">
              <div class="feature-visual"><div class="search-pill" style="box-shadow:none;padding:4px 4px 4px 12px;font-size:.8rem"><span style="flex:1">INH000011431</span><span class="chip ok">${icon("check")} SEBI</span></div><div class="mock-bubble" style="margin-top:8px">${t("check.validHandle")}</div></div>
              <h3>${t("home.f3t")}</h3><p>${t("home.f3d")}</p><span class="go">${t("home.open")} ${icon("arrowRight")}</span></a>
            <a class="feature-card" href="#/learn">
              <div class="feature-visual" style="display:flex;align-items:center;gap:12px"><div style="font-size:2.2rem">🎯</div><div><b>10</b> <span class="muted small">guides</span><br /><b>10</b> <span class="muted small">quiz questions</span></div></div>
              <h3>${t("home.f4t")}</h3><p>${t("home.f4d")}</p><span class="go">${t("home.open")} ${icon("arrowRight")}</span></a>
          </div>
          <div class="row" style="margin-top:26px;gap:14px">
            <div class="stat-chip"><span class="num">${fmtNum(s.verified)}</span><span class="muted small">${t("home.statVerified")}</span></div>
            <div class="stat-chip"><span class="num">${fmtNum(s.colleges)}</span><span class="muted small">${t("home.statColleges")}</span></div>
            <div class="stat-chip"><span class="num">${fmtNum(s.checks)}</span><span class="muted small">${t("home.statChecks")}</span></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section tight">
      <div class="container">
        <div class="row between" style="margin-bottom:18px"><h2 class="h-section" style="font-size:clamp(1.6rem,3vw,2.2rem)">${t("home.latest")}</h2><a class="btn btn-outline btn-sm" href="#/hunt">${t("home.seeAll")} ${icon("arrowRight")}</a></div>
        <div class="alert-grid">${wall.reports.map((r) => alertCard(r))}</div>
      </div>
    </section>

    <section class="section tight">
      <div class="container">
        <h2 class="h-section" style="margin-bottom:26px">${t("home.howTitleA")} <span class="soft">${t("home.howTitleB")}</span></h2>
        <div class="grid grid-3 steps">
          <div class="step"><div class="n">1</div><h4>${t("home.s1t")}</h4><p>${t("home.s1d")}</p></div>
          <div class="step"><div class="n">2</div><h4>${t("home.s2t")}</h4><p>${t("home.s2d")}</p></div>
          <div class="step"><div class="n">3</div><h4>${t("home.s3t")}</h4><p>${t("home.s3d")}</p></div>
        </div>
      </div>
    </section>

    <section class="container">
      <div class="cta-band">
        <div><h3>${t("home.ctaTitle")}</h3><p>${t("home.ctaText")}</p></div>
        <div class="row"><a class="btn btn-light btn-lg" href="tel:1930">${icon("phone")}${t("home.ctaCall")}</a><a class="btn btn-on-brown btn-lg" href="#/help">${t("home.ctaHelp")}</a></div>
      </div>
    </section>`,
  );

  // ---- Dashboard cards ----
  const dash = $("#dash", root);
  const lang = state.lang;
  const tl = [t("common.table"), t("common.chart")];

  // 1. Checks + risk split (status colours on a light inset)
  const v = s.verdicts || {};
  const card1 = document.createElement("div");
  card1.className = "dash-card brown";
  mount(
    card1,
    html`<div class="dc-head"><span>${t("home.dc1")}</span>${icon("shieldCheck")}</div>
      <div class="row" style="align-items:baseline;gap:10px"><span class="big-num">${fmtNum(week)}</span><span class="delta muted">${week ? Math.round((flagged / week) * 100) : 0}% ${t("home.dc1flag")}</span></div>
      <div style="margin-top:auto;padding-top:16px">${riskBar([
        { label: t("level.high"), value: v.high || 0, color: "var(--risk-high)" },
        { label: t("level.medium"), value: v.medium || 0, color: "var(--risk-medium)" },
        { label: t("level.low"), value: v.low || 0, color: "var(--risk-low)" },
        { label: t("level.unknown"), value: v.unknown || 0, color: "var(--risk-unknown)" },
      ])}</div>`,
  );
  card1.querySelector(".legend").style.color = "var(--on-brown)";
  dash.appendChild(card1);

  // 2. Weekly reports (line)
  const weekly = s.weekly.map((w) => ({ label: w.week, short: new Date(w.week).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" }), value: w.reports }));
  const card2 = document.createElement("div");
  card2.className = "dash-card";
  dash.appendChild(card2);
  chartCard(card2, {
    title: t("home.dc2"),
    toggleLabel: tl,
    columns: [lang === "hi" ? "हफ़्ता" : "Week", lang === "hi" ? "रिपोर्ट" : "Reports"],
    rows: weekly.map((w) => [w.short, w.value]),
    render: (el) => lineChart(el, weekly, { valueName: lang === "hi" ? "रिपोर्ट" : "reports" }),
  });

  // 3. Categories (columns, single hue)
  const cats = Object.entries(s.byCategory)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, n]) => ({ label: L(CATEGORY[k]), short: CATEGORY[k].icon, value: n }));
  const card3 = document.createElement("div");
  card3.className = "dash-card";
  dash.appendChild(card3);
  chartCard(card3, {
    title: t("home.dc3"),
    toggleLabel: tl,
    columns: [lang === "hi" ? "प्रकार" : "Type", lang === "hi" ? "रिपोर्ट" : "Reports"],
    rows: cats.map((c) => [c.label, c.value]),
    render: (el) => columnChart(el, cats, { valueName: lang === "hi" ? "रिपोर्ट" : "reports" }),
  });

  // 4. Platforms (horizontal bars on brown)
  const plats = Object.entries(s.byPlatform)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, n]) => ({ label: L(PLATFORM[k]), value: n }));
  const card4 = document.createElement("div");
  card4.className = "dash-card brown";
  dash.appendChild(card4);
  chartCard(card4, {
    title: t("home.dc4"),
    toggleLabel: tl,
    onBrown: true,
    columns: [lang === "hi" ? "प्लेटफ़ॉर्म" : "Platform", lang === "hi" ? "रिपोर्ट" : "Reports"],
    rows: plats.map((p) => [p.label, p.value]),
    render: (el) => barList(el, plats, { onBrown: true }),
  });

  // Mini chart inside the FinScam Hunter feature card
  const mini = $("#mini-weekly", root);
  if (mini) columnChart(mini, s.weekly.slice(-6).map((w, i) => ({ label: w.week, short: `W${i + 1}`, value: w.verified })), { height: 96, valueName: lang === "hi" ? "सत्यापित" : "verified" });

  // ---- Scam-line carousel ----
  let i = 0;
  let timer = null;
  const show = (n) => {
    i = (n + SCAM_LINES.length) % SCAM_LINES.length;
    const q = SCAM_LINES[i];
    $("#q-text", root).textContent = L(q);
    $("#q-src", root).textContent = L(q.src);
    mount($("#q-ico", root), icon(q.icon));
    mount($("#q-flags", root), html`${L(q.flags).map((f) => html`<span class="chip">${icon("flag")}${f}</span>`)}`);
    mount($("#q-count", root), html`<b>${String(i + 1).padStart(2, "0")}</b>/${String(SCAM_LINES.length).padStart(2, "0")}`);
  };
  show(0);
  $("#q-prev", root).addEventListener("click", () => {
    show(i - 1);
    restart();
  });
  $("#q-next", root).addEventListener("click", () => {
    show(i + 1);
    restart();
  });
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const restart = () => {
    clearInterval(timer);
    if (!reduce) timer = setInterval(() => show(i + 1), 7000);
  };
  restart();
  const band = $(".quote-band", root);
  band.addEventListener("mouseenter", () => clearInterval(timer));
  band.addEventListener("mouseleave", restart);
  band.addEventListener("focusin", () => clearInterval(timer));

  bindOpeners(root);
  void timeAgo;
  return () => clearInterval(timer);
}
