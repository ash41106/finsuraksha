import { state } from "../state.js";
import { api } from "../api.js";
import { t, L } from "../i18n.js";
import { html, mount, icon, $, $$, toast, ring } from "../ui.js";
import { OPPORTUNITY, SEBI_GUIDE } from "../content.js";
import { prepareImage, decodeQr, parseUpiUri } from "../media.js";

const EXAMPLES = ["INH000011431", "INA000017523", "abc.brk@validhdfc", "9876543210@ybl", "zer0dha-kyc-update.top", "@crorepati.trader.official"];

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
      <div class="card pad-lg">
        <h3 style="font-size:1.3rem;margin-bottom:12px">${icon("book")} ${t("check.guideTitle")}</h3>
        <div class="table-wrap"><table class="lb-table"><thead><tr><th>${t("check.prefix")}</th><th>${t("check.who")}</th><th>${t("check.whereVerify")}</th></tr></thead>
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
}

function upiBlock(u) {
  if (!u) return "";
  return html`<div class="notice ${u.validHandle ? "" : "danger"}">${icon(u.validHandle ? "check" : "alert")}<div>
    <b>${u.validHandle ? t("check.validHandle") : t("check.personalHandle")}</b>${u.category ? html` · ${u.category}` : ""}
    <div class="small" style="margin-top:4px">${t("check.upiAdvice")} <a href="${u.sebiCheckUrl}" target="_blank" rel="noopener noreferrer">SEBI Check ${icon("external")}</a></div></div></div>`;
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
        <span class="level-pill ${s.valid ? (s.found ? "level-low" : "level-unknown") : "level-high"}">${icon(s.valid ? (s.found ? "check" : "info") : "x")}${s.valid ? (s.found ? t("check.found") : t("check.notFound")) : t("check.badFormat")}</span>
        <span class="kbd">${s.normalized}</span>${s.type ? html`<span class="chip">${state.lang === "hi" ? s.typeHi : s.type}</span>` : ""}</div>
      ${s.found ? html`<h3 style="margin:14px 0 4px;font-size:1.4rem">${s.name}</h3><p class="small muted" style="margin:0">${state.lang === "hi" ? "देखें कि आपसे संपर्क करने वाला यही नाम है — ठग असली नंबर चुराते हैं।" : "Make sure this is the name of whoever contacted you — scammers copy real numbers."}</p>` : ""}
      ${!s.valid && s.reason ? html`<p class="small" style="color:var(--risk-high)">${s.reason}</p>` : ""}
      <p class="xs muted">${t("check.snapshotNote", { count: reg.count || 0, date: reg.asOf || "—" })}</p>
      ${s.officialUrl ? html`<a class="btn btn-outline btn-sm" href="${s.officialUrl}" target="_blank" rel="noopener noreferrer">${t("dost.verifyOn")} ${icon("external")}</a>` : ""}</div>`);
  }
  if (d.upi) parts.push(html`<div class="card pad-lg"><div class="card-title">${icon("rupee")} ${t("check.resUpi")}: <span class="kbd">${d.upi.vpa}</span></div>${upiBlock(d.upi)}</div>`);
  if (d.link) {
    const l = d.link;
    parts.push(html`<div class="card pad-lg"><div class="card-title">${icon("link")} ${t("check.resLink")}: <span class="kbd">${l.host}</span></div>
      ${l.official ? html`<div class="notice">${icon("check")}<span>${t("check.officialSite")}</span></div>` : ""}
      ${d.flags.length ? html`<ul class="flag-list">${d.flags.map((f) => html`<li><span class="sev-dot sev-${f.sev}"></span><div><div class="ft">${f.title}</div><div class="fw">${f.why}</div></div></li>`)}</ul>` : !l.official ? html`<div class="notice">${icon("info")}<span>${t("check.noLinkFlags")}</span></div>` : ""}
      <p class="xs muted">Google Safe Browsing: ${l.safeBrowsing === "not_configured" ? (state.lang === "hi" ? "चालू नहीं (वैकल्पिक API key)" : "not enabled (optional API key)") : l.safeBrowsing}</p></div>`);
  }
  if (d.matches) {
    parts.push(html`<div class="card pad-lg"><div class="card-title">${icon("search")} ${t("check.resName")}</div>
      ${d.matches.length ? html`<div class="stack">${d.matches.map((m) => html`<div class="check-row" style="align-items:center">${icon("check")}<b>${m.name}</b><span class="kbd">${m.regNo}</span><span class="chip">${m.type}</span></div>`)}</div>` : html`<p class="small muted">${state.lang === "hi" ? "हमारी अधूरी सूची में नहीं मिला। SEBI की आधिकारिक खोज पर देखें।" : "Not found in our partial snapshot. Search SEBI's official list."}</p>`}
      <p class="xs muted">${t("check.snapshotNote", { count: reg.count || 0, date: reg.asOf || "—" })}</p>
      <div class="row"><a class="btn btn-outline btn-sm" href="${d.links.ia}" target="_blank" rel="noopener noreferrer">SEBI · Investment Advisers ${icon("external")}</a><a class="btn btn-outline btn-sm" href="${d.links.ra}" target="_blank" rel="noopener noreferrer">SEBI · Research Analysts ${icon("external")}</a></div></div>`);
  }
  if (d.type === "phone" || d.type === "handle") {
    parts.push(html`<div class="card pad-lg"><div class="card-title">${icon(d.type === "phone" ? "phone" : "user")} ${d.phone || d.query}</div>
      <p class="small muted" style="margin:0">${state.lang === "hi" ? "हम निजी नंबर/हैंडल की जानकारी नहीं दिखाते — सिर्फ़ समुदाय की रिपोर्ट जाँचते हैं।" : "We don't look up people's personal details — only community reports."}</p></div>`);
  }
  const flagsOnly = !d.link && d.flags?.length;
  return html`<div class="grid grid-2 fade-in">${parts}${flagsOnly ? html`<div class="card pad-lg"><div class="card-title">${icon("alert")} ${t("dost.redFlags")}</div><div class="row nowrap" style="gap:14px">${ring(d.score, d.level)}<ul class="flag-list" style="flex:1">${d.flags.map((f) => html`<li><span class="sev-dot sev-${f.sev}"></span><div class="ft">${f.title}</div></li>`)}</ul></div></div>` : ""}<div>${communityBlock(d.community)}</div></div>`;
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
