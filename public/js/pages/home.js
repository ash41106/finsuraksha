import { state } from "../state.js";
import { api } from "../api.js";
import { t, L } from "../i18n.js";
import { html, mount, icon, $, $$, fmtNum, timeAgo, raw, ring } from "../ui.js";
import { lineChart, columnChart, barList, riskBar, chartCard } from "../charts.js";
import { CATEGORY, PLATFORM, SCAM_LINES, STRIP } from "../content.js";
import { alertCard, bindOpeners } from "./hunt-shared.js";

const tx = (en, hi) => (state.lang === "hi" ? hi : en);
const DEMOS = [
  { en: "Join our VIP WhatsApp group for guaranteed 30% monthly returns. Install Zerodha Pro VIP app from bit.ly/zpro and pay ₹5,000 to 9876543210@ybl. Only 5 seats left!", label: ["VIP tips group", "VIP टिप्स ग्रुप"] },
  { en: "Your profit of ₹4,80,000 is ready. Pay 18% tax of ₹86,400 to release the withdrawal from your institutional account today.", label: ["Withdrawal 'tax'", "निकासी 'टैक्स'"] },
  { en: "My broker asked me to pay margin to abc.brk@validhdfc. Is that okay?", label: ["@valid UPI", "@valid UPI"] },
];

// Tools other scam checkers don't have.
const TOOLS = [
  { icon: "app", href: "#/check?q=Zerodha%20Pro%20VIP", en: ["Clone-app detector", "Type any trading-app name. We catch “VIP”, “Pro” and misspelt clones of real brokers, the apps behind ₹1,400+ crore of losses, and show the official app and website."], hi: ["नकली-ऐप पहचान", "कोई भी ट्रेडिंग-ऐप नाम लिखें। हम असली ब्रोकर के “VIP”, “Pro” और ग़लत-वर्तनी वाले नकली ऐप पकड़ते हैं और आधिकारिक ऐप व वेबसाइट दिखाते हैं।"], tag: ["New", "नया"] },
  { icon: "bolt", href: "#/check?tool=calc", en: ["Return reality check", "“3% a day” sounds small. It is over 4,800,000% a year. See any promise next to an FD and the long-run market average."], hi: ["रिटर्न की सच्चाई", "“रोज़ 3%” छोटा लगता है, पर यह साल में 48 लाख% से ज़्यादा है। किसी भी वादे को FD और बाज़ार के औसत से मिलाकर देखें।"], tag: ["New", "नया"] },
  { icon: "target", href: "#/dost", en: ["Scam-stage meter", "Not just “risky”: we show where you are in the scam journey (hook, trust, install, pay, trap) and the one thing to do right now."], hi: ["ठगी-चरण मीटर", "सिर्फ़ “ख़तरनाक” नहीं: हम बताते हैं कि आप ठगी के किस चरण पर हैं (जाल, भरोसा, इंस्टॉल, भुगतान, फंदा) और अभी क्या करें।"], tag: ["New", "नया"] },
  { icon: "shieldCheck", href: "#/check", en: ["Verified by FinSuraksha", "SEBI registration numbers and @valid UPI IDs are checked for you, against SEBI's register. No jumping between government websites."], hi: ["FinSuraksha द्वारा सत्यापित", "SEBI रजिस्ट्रेशन नंबर और @valid UPI ID हम आपके लिए SEBI रजिस्टर में जाँचते हैं। सरकारी वेबसाइटों पर भटकना नहीं।"] },
];

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
        <p class="sos-line"><a href="tel:1930">${icon("phone")} ${t("home.sos")}</a> · <a href="#/help">${t("home.ctaHelp")}</a></p>
        <div class="live-demo reveal" id="live-demo">
          <div class="float-chip c1" aria-hidden="true"><span class="ico-circle" style="background:color-mix(in srgb,var(--risk-low) 16%,transparent);color:var(--risk-low)">${icon("check")}</span>${t("home.chipSebi")}</div>
          <div class="float-chip c2" aria-hidden="true"><span class="ico-circle" style="background:color-mix(in srgb,var(--risk-high) 14%,transparent);color:var(--risk-high)">${icon("alert")}</span>${t("home.chipRisk")}</div>
          <div class="ld-card">
            <div class="ld-top"><span class="ld-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="ld-title">${icon("sparkle")} ${tx("Try it now — no sign-up", "अभी आज़माएँ — साइन-अप की ज़रूरत नहीं")}</span></div>
            <form id="ld-form" class="ld-body">
              <label class="sr-only" for="ld-text">${tx("Message to check", "जाँचने के लिए संदेश")}</label>
              <textarea id="ld-text" class="ld-text" rows="4" maxlength="2000" placeholder="${tx("Paste a suspicious message, link, UPI ID or app name…", "कोई संदिग्ध संदेश, लिंक, UPI ID या ऐप नाम पेस्ट करें…")}">${DEMOS[0].en}</textarea>
              <div class="ld-actions">
                <div class="row" style="gap:6px">${DEMOS.map((d, i) => html`<button class="chip" type="button" data-demo="${i}">${d.label[state.lang === "hi" ? 1 : 0]}</button>`)}</div>
                <button class="btn btn-primary" type="submit">${icon("shieldCheck")}${tx("Check", "जाँचें")}</button>
              </div>
            </form>
            <div class="ld-result" id="ld-result" aria-live="polite"></div>
          </div>
        </div>
      </div>
      <div class="container">
        <div class="dash-row" id="dash"></div>
        ${s.includesSample ? html`<div class="sample-note">${t("common.includesSample")}</div>` : ""}
      </div>
    </section>

    <section class="section tools-section">
      <div class="container">
        <div class="section-head reveal">
          <h2 class="h-section">${tx("Built for the gaps", "उन कमियों के लिए बना")}<br /><span class="soft">${tx("other scam checkers leave.", "जो दूसरे स्कैम-चेकर छोड़ देते हैं।")}</span></h2>
          <p>${tx("Most tools stop at “this looks risky”. FinSuraksha explains the math, names the clone, verifies the registration and tells you what to do at this exact moment.", "ज़्यादातर टूल “यह ख़तरनाक लगता है” पर रुक जाते हैं। FinSuraksha हिसाब समझाता है, नकली ऐप पहचानता है, रजिस्ट्रेशन जाँचता है और बताता है कि अभी क्या करें।")}</p>
        </div>
        <div class="tools-grid">${TOOLS.map((tl, i) => html`<a class="tool-card reveal" style="--d:${i * 70}ms" href="${tl.href}">
          <span class="tool-ico">${icon(tl.icon)}</span>${tl.tag ? html`<span class="tool-tag">${tl.tag[state.lang === "hi" ? 1 : 0]}</span>` : ""}
          <h3>${(state.lang === "hi" ? tl.hi : tl.en)[0]}</h3><p>${(state.lang === "hi" ? tl.hi : tl.en)[1]}</p>
          <span class="go">${t("home.open")} ${icon("arrowRight")}</span></a>`)}</div>
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

  // ---- Live demo in the hero ----
  const STAGE_NAMES = [["Hook", "जाल"], ["Trust", "भरोसा"], ["Install", "इंस्टॉल"], ["Pay", "भुगतान"], ["Trap", "फंदा"]];
  const STAGE_IDS = [
    ["celebrity", "group_invite", "link_whatsapp_group", "link_telegram_private", "unregistered_tips", "task_job"],
    ["guaranteed", "high_return", "insider", "fake_proof", "authority", "sebi_claim_no_number", "sebi_bad_format", "sebi_not_registered", "ponzi", "forex_crypto", "dabba"],
    ["link_apk", "remote_apk", "fake_app_name", "institutional", "link_lookalike", "link_shortener", "credentials"],
    ["pay_personal", "upi_personal", "urgency"],
    ["withdrawal_fee", "threat", "utility_threat"],
  ];
  const ldText = $("#ld-text", root);
  const ldOut = $("#ld-result", root);
  $$("[data-demo]", root).forEach((b) => b.addEventListener("click", () => {
    ldText.value = DEMOS[Number(b.dataset.demo)].en;
    $("#ld-form", root).requestSubmit();
  }));
  $("#ld-form", root).addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = ldText.value.trim();
    if (!msg) return ldText.focus();
    mount(ldOut, html`<div class="ld-loading"><span></span><span></span><span></span></div>`);
    try {
      const r = await api.post("/api/dost/analyze", { message: msg, lang: state.lang === "hi" ? "hi" : "en", history: [] });
      const ids = new Set((r.ruleFlags || []).map((f) => f.id));
      let at = -1;
      STAGE_IDS.forEach((list, i) => list.some((id) => ids.has(id)) && (at = i));
      const lvl = r.level === "info" ? "unknown" : r.level;
      const flags = (r.flags || []).slice(0, 3);
      const good = (r.actions || []).find((a) => /Verified by FinSuraksha|FinSuraksha द्वारा सत्यापित/.test(a));
      mount(ldOut, html`<div class="ld-res fade-in">
        <div class="row nowrap" style="gap:14px;align-items:center">${r.mode === "check" ? ring(r.score, lvl) : ""}<div style="min-width:0"><span class="level-pill level-${lvl}">${t(`level.${lvl}`)}</span>${r.headline ? html`<div class="ld-head">${r.headline}</div>` : ""}</div></div>
        ${flags.length ? html`<ul class="ld-flags">${flags.map((f) => html`<li><span class="sev-dot sev-${f.sev || "medium"}"></span>${f.title}</li>`)}</ul>` : ""}
        ${good ? html`<div class="ld-good">${icon("shieldCheck")}<span>${good.replace(/\*\*/g, "").replace(/^✓\s*/, "")}</span></div>` : ""}
        ${at >= 0 && lvl !== "low" ? html`<div class="ld-stage">${STAGE_NAMES.map((n, i) => html`<span class="${i < at ? "past" : i === at ? "now" : ""}">${n[state.lang === "hi" ? 1 : 0]}</span>`)}</div>` : ""}
        <a class="ld-more" href="#/dost?q=${encodeURIComponent(msg)}">${tx("See full explanation, next steps & audio", "पूरी जानकारी, अगले क़दम और ऑडियो देखें")} ${icon("arrowRight")}</a>
      </div>`);
    } catch (err) {
      mount(ldOut, html`<div class="form-error">${err.message}</div>`);
    }
  });

  // ---- Reveal on scroll ----
  let io = null;
  const reveals = $$(".reveal", root);
  if (!reduce && "IntersectionObserver" in window) {
    io = new IntersectionObserver((entries) => entries.forEach((en) => en.isIntersecting && (en.target.classList.add("in"), io.unobserve(en.target))), { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((n) => io.observe(n));
  } else reveals.forEach((n) => n.classList.add("in"));

  bindOpeners(root);
  void timeAgo;
  return () => {
    clearInterval(timer);
    io?.disconnect();
  };
}
