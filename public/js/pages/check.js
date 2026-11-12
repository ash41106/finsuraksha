import { state } from "../state.js";
import { api } from "../api.js";
import { t, L } from "../i18n.js";
import { html, mount, icon, $, $$, toast, ring } from "../ui.js";
import { OPPORTUNITY, SEBI_GUIDE } from "../content.js";
import { prepareImage, decodeQr, parseUpiUri } from "../media.js";

const EXAMPLES = ["INH000011431", "INA000017523", "abc.brk@validhdfc", "9876543210@ybl", "Zerodha Pro VIP", "zer0dha-kyc-update.top", "@crorepati.trader.official"];
const tx = (en, hi) => (state.lang === "hi" ? hi : en);

export async function render(root, { query }) {
  mount(
    root,
    html`<section class="page-hero"><div class="blob b1"></div><div class="dots d2"></div>
      <div class="container" style="position:relative;z-index:1">
        <span class="crumbs">${icon("search")}<b>${t("check.kicker")}</b></span>
        <h1 class="page-title">${t("check.titleA")} <span class="soft">${t("check.titleB")}</span></h1>
        <p class="lead">${t("check.lead")}</p>
        <form class="search-pill" id="q-form" style="max-width:760px;margin-top:18px" role="search">
          ${icon("search")}<input id="q" name="q" placeholder="${t("check.placeholder")}" aria-label="${t("check.placeholder")}" autocomplete="off" maxlength="300" />
          <button class="btn btn-primary" type="submit">${t("check.go")}</button>
        </form>
        <div class="row" style="margin-top:12px;gap:6px"><span class="small muted">${t("check.examples")}</span>${EXAMPLES.map((e) => html`<button class="chip" type="button" data-q="${e}">${e}</button>`)}</div>
      </div></section>
    <section class="container stack lg">
      <div id="results"></div>
      <div class="grid grid-2">
        <div class="card pad-lg" id="qr-card">
          <h3 style="font-size:1.3rem">${icon("qr")} ${t("check.qrTitle")}</h3>
          <p class="muted small">${t("check.qrText")}</p>
          <label class="btn btn-soft" for="qr-file">${icon("upload")}${t("check.qrPick")}</label><input type="file" id="qr-file" accept="image/*" class="sr-only" />
          <div id="qr-out" style="margin-top:14px"></div>
        </div>
        <div class="card pad-lg" id="opp-card"></div>
      </div>
      <div class="card pad-lg calc-card" id="calc-card"></div>
      <div class="card pad-lg">
        <h3 style="font-size:1.3rem;margin-bottom:12px">${icon("book")} ${t("check.guideTitle")}</h3>
        <div class="table-wrap" tabindex="0" role="region" aria-label="${t("check.prefix")}"><table class="lb-table"><thead><tr><th>${t("check.prefix")}</th><th>${t("check.who")}</th><th>${t("check.whereVerify")}</th></tr></thead>
        <tbody>${SEBI_GUIDE.map((g) => html`<tr><td><span class="kbd">${g.p}</span> + 9 digits</td><td>${L(g.who)}</td><td><a href="${g.url}" target="_blank" rel="noopener noreferrer">sebi.gov.in ${icon("external")}</a></td></tr>`)}
          <tr><td><span class="kbd">…@valid…</span></td><td>${state.lang === "hi" ? "रजिस्टर्ड संस्था की UPI ID (जैसे abc.brk@validhdfc)" : "UPI ID of a registered intermediary (e.g. abc.brk@validhdfc)"}</td><td><a href="https://siportal.sebi.gov.in/intermediary/sebi-check" target="_blank" rel="noopener noreferrer">SEBI Check ${icon("external")}</a></td></tr></tbody></table></div>
      </div>
    </section>`,
  );

  const results = $("#results", root);
  async function run(q) {
    if (!q || q.trim().length < 2) return;
    results.style.opacity = "0.55";
    try {
      const d = await api.get(`/api/check?q=${encodeURIComponent(q.trim())}&lang=${state.lang}`);
      mount(results, resultView(d));
    } catch (err) {
      mount(results, html`<div class="form-error">${err.message}</div>`);
    }
    results.style.opacity = "";
    results.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  $("#q-form", root).addEventListener("submit", (e) => {
    e.preventDefault();
    run($("#q", root).value);
  });
  $$("[data-q]", root).forEach((b) =>
    b.addEventListener("click", () => {
      $("#q", root).value = b.dataset.q;
      run(b.dataset.q);
    }),
  );
  if (query.get("q")) {
    $("#q", root).value = query.get("q");
    run(query.get("q"));
  }

  // QR scanner
  $("#qr-file", root).addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const out = $("#qr-out", root);
    mount(out, html`<div class="skeleton" style="height:60px"></div>`);
    try {
      const { canvas } = await prepareImage(file, 1400);
      const text = await decodeQr(canvas);
      const upi = parseUpiUri(text);
      if (!text) return mount(out, html`<div class="notice">${icon("info")}<span>${t("check.qrNone")}</span></div>`);
      if (!upi) return mount(out, html`<div class="notice">${icon("info")}<span>QR: <code>${text.slice(0, 200)}</code></span></div>`);
      const d = await api.get(`/api/check?q=${encodeURIComponent(upi.pa)}&lang=${state.lang}`);
      mount(
        out,
        html`<div class="stack">
          <div class="check-row">${icon("rupee")}<span>${t("check.qrPays")}: <b>${upi.pa}</b></span></div>
          ${upi.pn ? html`<div class="check-row">${icon("user")}<span>${t("check.qrName")}: <b>${upi.pn}</b></span></div>` : ""}
          ${upi.am ? html`<div class="check-row">${icon("rupee")}<span>${t("check.qrAmount")}: <b>₹${upi.am}</b></span></div>` : ""}
          ${upiBlock(d.upi)}
          ${communityBlock(d.community)}
        </div>`,
      );
    } catch (err) {
      mount(out, html`<div class="form-error">${err.message}</div>`);
    }
  });

  opportunity($("#opp-card", root));
  returnCalc($("#calc-card", root));
  if (query.get("tool") === "calc") requestAnimationFrame(() => $("#calc-card", root).scrollIntoView({ behavior: "smooth", block: "start" }));
}

function upiBlock(u) {
  if (!u) return "";
  return html`<div class="notice ${u.validHandle ? "" : "danger"}">${icon(u.validHandle ? "check" : "alert")}<div>
    <b>${u.validHandle ? t("check.validHandle") : t("check.personalHandle")}</b>${u.category ? html` · ${u.category}` : ""}${u.bank ? html` · ${u.bank}` : ""}
    ${u.verified ? html`<div class="small" style="margin-top:4px">${t("check.upiAdvice")}</div>` : ""}</div></div>`;
}

function communityBlock(list) {
  return html`<div class="card flat" style="background:var(--surface-2)"><div class="card-title">${icon("users")} ${t("check.resCommunity")}</div>
    ${list?.length ? html`<div class="stack">${list.map((c) => html`<div class="check-row" style="align-items:center"><span class="chip ${c.status === "verified" ? "bad" : "outline"}">${c.status === "verified" ? t("hunt.verified") : t("hunt.pending")}</span><b>${c.display}</b><span class="small muted">${t("hunt.reports", { n: c.reports })}</span></div>`)}</div>` : html`<p class="small muted" style="margin:0">${t("check.noCommunity")}</p>`}</div>`;
}

function resultView(d) {
  const reg = d.register || {};
  const parts = [];
  if (d.sebi) {
    const s = d.sebi;
    parts.push(html`<div class="card pad-lg"><div class="card-title">${icon("shieldCheck")} ${t("check.resSebi")}</div>
      <div class="row" style="gap:14px">
        <span class="level-pill ${!s.valid || s.notRegistered ? "level-high" : s.found ? "level-low" : "level-unknown"}">${icon(!s.valid || s.notRegistered ? "x" : s.found ? "check" : "info")}${!s.valid ? t("check.badFormat") : s.found ? t("check.found") : s.notRegistered ? t("check.notRegistered") : t("check.notFound")}</span>
        <span class="kbd">${s.normalized}</span>${s.type ? html`<span class="chip">${state.lang === "hi" ? s.typeHi : s.type}</span>` : ""}</div>
      ${s.found ? html`<h3 style="margin:14px 0 4px;font-size:1.4rem">${s.name}</h3><p class="small muted" style="margin:0">${state.lang === "hi" ? "✓ FinSuraksha ने SEBI रजिस्टर में सत्यापित किया। देखें कि आपसे संपर्क करने वाला यही नाम है — ठग असली नंबर चुराते हैं।" : "✓ Verified by FinSuraksha against SEBI's register. Make sure this is the name of whoever contacted you — scammers copy real numbers."}</p>` : ""}
      ${!s.valid && s.reason ? html`<p class="small" style="color:var(--risk-high)">${s.reason}</p>` : ""}
      ${s.valid && !s.found ? html`<p class="small" style="margin:14px 0 0">${t(s.notRegistered ? "check.notRegisteredText" : "check.notVerifiedText")}</p>` : ""}
      ${s.found && s.validity ? html`<p class="xs muted" style="margin:6px 0 0">${state.lang === "hi" ? "वैधता" : "Validity"}: ${s.validity}</p>` : ""}
      ${s.valid ? html`<p class="xs muted">${/live/.test(s.verifiedBy || "") ? t("check.liveNote") : t(reg.completeTypes?.[s.prefix] ? "check.registerNote" : "check.partialNote", { count: reg.count || 0, date: reg.asOf || "—" })}</p>` : ""}
</div>`);
  }
  if (d.upi) parts.push(html`<div class="card pad-lg"><div class="card-title">${icon("rupee")} ${t("check.resUpi")}: <span class="kbd">${d.upi.vpa}</span></div>${upiBlock(d.upi)}</div>`);
  if (d.link) {
    const l = d.link;
    parts.push(html`<div class="card pad-lg"><div class="card-title">${icon("link")} ${t("check.resLink")}: <span class="kbd">${l.host}</span></div>
      ${l.official ? html`<div class="notice">${icon("check")}<span>${t("check.officialSite")}</span></div>` : ""}
      ${d.flags.length ? html`<ul class="flag-list">${d.flags.map((f) => html`<li><span class="sev-dot sev-${f.sev}"></span><div><div class="ft">${f.title}</div><div class="fw">${f.why}</div></div></li>`)}</ul>` : !l.official ? html`<div class="notice">${icon("info")}<span>${t("check.noLinkFlags")}</span></div>` : ""}
      <p class="xs muted">Google Safe Browsing: ${l.safeBrowsing === "not_configured" ? (state.lang === "hi" ? "चालू नहीं (वैकल्पिक API key)" : "not enabled (optional API key)") : l.safeBrowsing}</p></div>`);
  }
  if (d.matches && (d.matches.length || !d.app)) {
    parts.push(html`<div class="card pad-lg"><div class="card-title">${icon("search")} ${t("check.resName")}</div>
      ${d.matches.length ? html`<div class="stack">${d.matches.map((m) => html`<div class="check-row" style="align-items:center">${icon("check")}<b>${m.name}</b><span class="kbd">${m.regNo}</span><span class="chip">${m.type}</span></div>`)}</div>` : html`<p class="small muted">${t(reg.completeTypes?.INA && reg.completeTypes?.INH ? "check.nameNotRegistered" : "check.nameNotVerified")}</p>`}
      <p class="xs muted">${t(reg.completeTypes?.INA && reg.completeTypes?.INH ? "check.registerNote" : "check.partialNote", { count: reg.count || 0, date: reg.asOf || "—" })}</p></div>`);
  }
  if (d.app) {
    const a = d.app;
    const fake = a.verdict === "impersonation";
    const why = {
      misspelt: tx(`The name is spelt like "${a.brand}" but isn't the same. Clone apps change one or two letters.`, `नाम "${a.brand}" जैसा लिखा है पर वैसा नहीं है। नकली ऐप एक-दो अक्षर बदल देते हैं।`),
      apk: tx("Real broker apps are never shared as APK files.", "असली ब्रोकर ऐप कभी APK फ़ाइल के रूप में नहीं भेजे जाते।"),
      bait: tx(`${a.brand} has no "${a.bait}" app. Scammers add words like VIP, Pro or Institutional to a real brand.`, `${a.brand} का कोई "${a.bait}" ऐप नहीं है। ठग असली ब्रांड में VIP, Pro या Institutional जैसे शब्द जोड़ते हैं।`),
    }[a.reason];
    parts.push(html`<div class="card pad-lg app-card ${fake ? "fake" : "real"}"><div class="card-title">${icon("app")} ${tx("Trading app check", "ट्रेडिंग ऐप जाँच")}</div>
      <span class="level-pill ${fake ? "level-high" : "level-low"}">${icon(fake ? "x" : "check")}${fake ? tx("Looks like a clone app", "नकली ऐप लगता है") : tx(`Genuine ${a.brand} app name`, `असली ${a.brand} ऐप का नाम`)}</span>
      ${why ? html`<p class="small" style="margin:12px 0 0">${why}</p>` : ""}
      <div class="app-official"><div class="label">${tx(`Official ${a.brand} apps`, `${a.brand} के आधिकारिक ऐप`)}</div>
        <div class="row" style="gap:6px">${a.officialApps.map((x) => html`<span class="chip ok">${icon("check")}${x}</span>`)}</div>
        <div class="label" style="margin-top:10px">${tx("Official websites", "आधिकारिक वेबसाइट")}</div>
        <div class="row" style="gap:6px">${a.officialDomains.map((x) => html`<span class="kbd">${x}</span>`)}</div></div>
      <ul class="tick-list" style="margin-top:12px">
        <li>${icon("check")}<span>${tx("Install only from Google Play or the App Store, and look for the SEBI “Verified” badge on Play.", "सिर्फ़ Google Play या App Store से इंस्टॉल करें, और Play पर SEBI “Verified” बैज देखें।")}</span></li>
        <li>${icon("check")}<span>${tx("Check that the developer name matches the broker exactly.", "देखें कि डेवलपर का नाम ब्रोकर से बिल्कुल मेल खाता है।")}</span></li>
        ${fake ? html`<li>${icon("alert")}<span>${tx("Already installed it? Uninstall it, turn on flight mode and change banking passwords from another phone.", "इंस्टॉल कर लिया है? हटाएँ, फ़्लाइट मोड चालू करें और दूसरे फ़ोन से बैंकिंग पासवर्ड बदलें।")}</span></li>` : ""}
      </ul></div>`);
  }
  if (d.type === "phone" || d.type === "handle") {
    parts.push(html`<div class="card pad-lg"><div class="card-title">${icon(d.type === "phone" ? "phone" : "user")} ${d.phone || d.query}</div>
      <p class="small muted" style="margin:0">${state.lang === "hi" ? "हम निजी नंबर/हैंडल की जानकारी नहीं दिखाते — सिर्फ़ समुदाय की रिपोर्ट जाँचते हैं।" : "We don't look up people's personal details — only community reports."}</p></div>`);
  }
  const flagsOnly = !d.link && d.flags?.length;
  // Plain-language answer first: people want "is it safe?" before the details.
  let lvl = ["high", "medium", "low"].includes(d.level) ? d.level : d.sebi?.found || d.upi?.validHandle || d.link?.official ? "low" : "unknown";
  // Keep the banner consistent with the cards below it.
  if (d.sebi && (!d.sebi.valid || d.sebi.notRegistered)) lvl = "high";
  else if (d.app?.verdict === "impersonation") lvl = "high";
  else if (d.app?.verdict === "genuine" && lvl === "unknown") lvl = "low";
  else if (lvl !== "high" && ((d.upi && !d.upi.validHandle) || (d.sebi && !d.sebi.found))) lvl = "medium";
  const vKey = { high: "check.vHigh", medium: "check.vMedium", low: "check.vLow", unknown: "check.vUnknown" }[lvl];
  const banner = html`<div class="verdict-banner level-${lvl}" role="status"><span class="level-pill level-${lvl}">${icon(lvl === "high" ? "alert" : lvl === "low" ? "check" : "info")}${t(`level.${lvl}`)}</span><p>${t(vKey)}</p></div>`;
  return html`${banner}<div class="grid grid-2 fade-in">${parts}${flagsOnly ? html`<div class="card pad-lg"><div class="card-title">${icon("alert")} ${t("dost.redFlags")}</div><div class="row nowrap" style="gap:14px">${ring(d.score, d.level)}<ul class="flag-list" style="flex:1">${d.flags.map((f) => html`<li><span class="sev-dot sev-${f.sev}"></span><div class="ft">${f.title}</div></li>`)}</ul></div></div>` : ""}<div>${communityBlock(d.community)}</div></div>`;
}

function opportunity(card) {
  let i = -1;
  const answers = [];
  const draw = () => {
    if (i < 0) {
      mount(card, html`<h3 style="font-size:1.3rem">${icon("target")} ${t("check.oppTitle")}</h3><p class="muted small">${t("check.oppText")}</p><button class="btn btn-primary" id="opp-start">${t("check.oppStart")}</button>`);
      $("#opp-start", card).addEventListener("click", () => {
        i = 0;
        answers.length = 0;
        draw();
      });
      return;
    }
    if (i >= OPPORTUNITY.length) {
      let score = 0;
      let max = 0;
      OPPORTUNITY.forEach((q, k) => {
        max += q.w;
        if (answers[k] === "yes") score += q.w;
        if (answers[k] === "unsure") score += q.w / 2;
      });
      const pct = Math.round((score / max) * 100);
      const level = pct >= 45 ? "high" : pct >= 20 ? "medium" : "low";
      const tips = OPPORTUNITY.filter((_, k) => answers[k] !== "no").map((q) => L(q.tip));
      mount(
        card,
        html`<h3 style="font-size:1.3rem">${t("check.oppResult")}</h3>
        <div class="row nowrap" style="gap:16px;margin:10px 0">${ring(pct, level)}<div><span class="level-pill level-${level}">${t(`level.${level}`)}</span>
          <p class="small" style="margin:8px 0 0">${level === "high" ? (state.lang === "hi" ? "यह ठगी जैसा लगता है। पैसे न भेजें।" : "This looks like a scam. Don't send money.") : level === "medium" ? (state.lang === "hi" ? "कई ख़तरे के संकेत हैं — पहले जाँच करें।" : "Several warning signs — verify first.") : state.lang === "hi" ? "बड़े संकेत नहीं दिखे, फिर भी रजिस्ट्रेशन जाँचें।" : "No big warning signs, but still verify registration."}</p></div></div>
        ${tips.length ? html`<ul class="tick-list">${tips.map((tp) => html`<li>${icon("info")}<span>${tp}</span></li>`)}</ul>` : ""}
        <div class="row" style="margin-top:14px"><a class="btn btn-primary btn-sm" href="#/dost">${t("nav.dost")}</a><button class="btn btn-outline btn-sm" id="opp-again">${t("check.oppAgain")}</button></div>`,
      );
      $("#opp-again", card).addEventListener("click", () => {
        i = 0;
        answers.length = 0;
        draw();
      });
      return;
    }
    const q = OPPORTUNITY[i];
    mount(
      card,
      html`<div class="row between"><h3 style="font-size:1.1rem">${t("check.oppTitle")}</h3><span class="small muted">${i + 1}/${OPPORTUNITY.length}</span></div>
      <div class="q-progress" style="margin:10px 0 16px">${OPPORTUNITY.map((_, k) => html`<i class="${k < i ? "done" : k === i ? "cur" : ""}"></i>`)}</div>
      <p style="font-size:1.08rem;font-weight:600">${L(q.q)}</p>
      <div class="grid grid-3" style="gap:8px">
        <button class="btn btn-outline" data-a="yes">${t("check.yes")}</button><button class="btn btn-outline" data-a="no">${t("check.no")}</button><button class="btn btn-ghost" data-a="unsure">${t("check.unsure")}</button></div>`,
    );
    $$("[data-a]", card).forEach((b) =>
      b.addEventListener("click", () => {
        answers[i] = b.dataset.a;
        i += 1;
        draw();
      }),
    );
    void toast;
  };
  draw();
}

// "Too good to be true?" - turns a promised return into what it would really mean.
const PERIODS = { day: 365, week: 52, month: 12, year: 1 };
const FD = 7; // typical bank FD rate, % a year
const EQUITY = 12; // rough long-run Indian equity index average, % a year - never guaranteed

function returnCalc(card) {
  let rate = 3;
  let per = "day";
  let amount = 10000;
  const money = (n) =>
    n >= 1e12 ? `₹${(n / 1e12).toLocaleString("en-IN", { maximumFractionDigits: 1 })}${tx(" lakh crore", " लाख करोड़")}`
    : n >= 1e7 ? `₹${(n / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 1 })}${tx(" crore", " करोड़")}`
    : `₹${Math.round(n).toLocaleString("en-IN")}`;
  const draw = () => {
    const n = PERIODS[per];
    const annual = (Math.pow(1 + rate / 100, n) - 1) * 100;
    const end = amount * (1 + annual / 100);
    const fd = amount * (1 + FD / 100);
    const eq = amount * (1 + EQUITY / 100);
    const doubling = Math.log(2) / Math.log(1 + rate / 100);
    const level = annual > 30 ? "high" : annual > 15 ? "medium" : "low";
    const lo = Math.log10(amount * 0.9);
    const hi = Math.log10(Math.max(end, fd, eq));
    const bar = (v) => Math.max(3, Math.min(100, ((Math.log10(v) - lo) / (hi - lo || 1)) * 100));
    const pw = { day: tx("day", "दिन"), week: tx("week", "हफ़्ते"), month: tx("month", "महीने"), year: tx("year", "साल") };
    const yearly = annual > 1e9 ? "100,00,00,000%+" : `${Math.round(annual).toLocaleString("en-IN")}%`;
    const verdict = {
      high: tx(`No legal investment can promise this. ${rate}% every ${pw[per]} means ${yearly} a year. Schemes like this pay early investors with new victims' money, then vanish.`, `कोई भी क़ानूनी निवेश ऐसा वादा नहीं कर सकता। हर ${pw[per]} ${rate}% का मतलब है साल में ${yearly}। ऐसी स्कीमें नए लोगों के पैसे से पुराने लोगों को देती हैं, फिर ग़ायब हो जाती हैं।`),
      medium: tx("Far above what markets usually give, and no one can guarantee it. Treat a promise like this as a warning sign.", "बाज़ार आम तौर पर इतना नहीं देता, और कोई इसकी गारंटी नहीं दे सकता। ऐसे वादे को ख़तरे का संकेत मानें।"),
      low: tx("A realistic range, but market returns are never guaranteed. A “fixed” or “guaranteed” promise is still a red flag.", "यह वास्तविक दायरा है, पर बाज़ार में रिटर्न की गारंटी कभी नहीं होती। “फ़िक्स्ड” या “गारंटीड” वादा फिर भी ख़तरे का संकेत है।"),
    }[level];
    const showDoubling = per !== "year" && doubling < 120;
    mount(
      card,
      html`<div class="calc-head"><span class="eyebrow">${icon("bolt")} ${tx("Return reality check", "रिटर्न की सच्चाई")}</span>
        <h3>${tx("Too good to be true? Do the math.", "बहुत अच्छा लग रहा है? हिसाब लगाइए।")}</h3>
        <p class="muted small">${tx("Enter what they promised and see what it would really mean.", "जो वादा किया गया है वह डालें और देखें इसका असली मतलब क्या है।")}</p></div>
      <div class="calc-grid">
        <div class="calc-inputs">
          <label class="field"><span class="label">${tx("Promised return (%)", "वादा किया गया रिटर्न (%)")}</span><input class="input" id="c-rate" type="number" min="0.1" max="100" step="0.1" value="${rate}" inputmode="decimal" /></label>
          <div class="field"><span class="label">${tx("Every", "हर")}</span><div class="seg wide">${Object.keys(PERIODS).map((p) => html`<button type="button" data-per="${p}" aria-pressed="${p === per}">${pw[p]}</button>`)}</div></div>
          <label class="field"><span class="label">${tx("If I invest (₹)", "अगर मैं लगाऊँ (₹)")}</span><input class="input" id="c-amt" type="number" min="100" max="100000000" step="100" value="${amount}" inputmode="numeric" /></label>
          <div class="row" style="gap:6px"><span class="xs muted">${tx("Common scam pitches:", "आम ठगी के वादे:")}</span>${[["3", "day"], ["10", "week"], ["20", "month"]].map(([rr, p]) => html`<button class="chip" type="button" data-preset="${rr}|${p}">${rr}% / ${pw[p]}</button>`)}</div>
        </div>
        <div class="calc-out level-${level}" aria-live="polite">
          <div class="calc-big"><span class="muted small">${tx("That is", "इसका मतलब")}</span><b>${yearly}</b><span class="muted small">${tx("a year", "सालाना")}</span></div>
          <div class="calc-bars">
            <div class="cb"><span>${tx("Their promise", "उनका वादा")}</span><div class="track"><i class="promise" style="width:${bar(end)}%"></i></div><b>${money(end)}</b></div>
            <div class="cb"><span>${tx("Equity index*", "शेयर सूचकांक*")}</span><div class="track"><i style="width:${bar(eq)}%"></i></div><b>${money(eq)}</b></div>
            <div class="cb"><span>${tx("Bank FD", "बैंक FD")}</span><div class="track"><i style="width:${bar(fd)}%"></i></div><b>${money(fd)}</b></div>
          </div>
          ${showDoubling ? html`<p class="small" style="margin:0"><b>${tx(`Your money would double every ${Math.max(1, Math.round(doubling))} ${pw[per]}${Math.round(doubling) > 1 ? "s" : ""}.`, `आपका पैसा हर ${Math.max(1, Math.round(doubling))} ${pw[per]} में दोगुना हो जाता।`)}</b></p>` : ""}
          <p class="small calc-verdict" style="margin:0">${verdict}</p>
          <p class="xs muted" style="margin:0">${tx(`*Value after 1 year. FD ≈ ${FD}%, equity ≈ ${EQUITY}% a year (rough long-run average, never guaranteed). Bars use a log scale. Education only, not investment advice.`, `*1 साल बाद की रक़म। FD ≈ ${FD}%, शेयर ≈ ${EQUITY}% सालाना (लंबी अवधि का अनुमानित औसत, गारंटी नहीं)। बार लॉग स्केल पर हैं। सिर्फ़ जानकारी के लिए, निवेश सलाह नहीं।`)}</p>
        </div>
      </div>`,
    );
    const num = (id, min, max, set) =>
      card.querySelector(id).addEventListener("change", (e) => {
        const v = Number(e.target.value);
        if (Number.isFinite(v) && v >= min && v <= max) set(v);
        draw();
      });
    num("#c-rate", 0.1, 100, (v) => (rate = v));
    num("#c-amt", 100, 1e8, (v) => (amount = v));
    $$("[data-per]", card).forEach((b) => b.addEventListener("click", () => ((per = b.dataset.per), draw())));
    $$("[data-preset]", card).forEach((b) =>
      b.addEventListener("click", () => {
        const [rr, p] = b.dataset.preset.split("|");
        rate = Number(rr);
        per = p;
        draw();
      }),
    );
  };
  draw();
}
