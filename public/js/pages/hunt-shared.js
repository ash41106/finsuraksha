import { state } from "../state.js";
import { api } from "../api.js";
import { t, L } from "../i18n.js";
import { html, icon, modal, toast, copyText, timeAgo, fmtDate, ring, $, el } from "../ui.js";
import { CATEGORY, PLATFORM } from "../content.js";

export function statusChip(r) {
  if (r.underReview) return html`<span class="chip warn">${icon("gavel")}${t("hunt.underReview")}</span>`;
  if (r.status === "verified") return html`<span class="chip bad">${icon("shieldCheck")}${t("hunt.verified")}</span>`;
  if (r.status === "rejected") return html`<span class="chip ok">${icon("check")}${t("hunt.rejected")}</span>`;
  return html`<span class="chip outline">${icon("vote")}${t("hunt.pending")}</span>`;
}

export function catChip(r) {
  const c = CATEGORY[r.category] || CATEGORY.other;
  return html`<span class="chip brand">${c.icon} ${L(c)}</span>`;
}

export function platChip(r) {
  const p = PLATFORM[r.platform] || PLATFORM.other;
  return html`<span class="chip">${p.icon} ${L(p)}</span>`;
}

export function alertCard(r, extra = "") {
  const flags = (r.analysis?.flags || []).slice(0, 3);
  return html`<article class="alert-card" data-id="${r.id}">
    <div class="row" style="gap:6px">${catChip(r)}${platChip(r)}${r.sample ? html`<span class="chip sample">${t("common.sample")}</span>` : ""}<span class="spacer"></span>${statusChip(r)}</div>
    <div class="entity">${r.entity}</div>
    <p class="desc">${r.description}</p>
    ${flags.length ? html`<div class="row" style="gap:6px">${flags.map((f) => html`<span class="chip"><span class="sev-dot sev-${f.sev}"></span>${f.title}</span>`)}</div>` : ""}
    ${extra}
    <div class="meta">
      <span>${icon("flag")}${t("hunt.reports", { n: r.reports })}</span>
      <span>${icon("vote")}${t("hunt.confirms", { n: r.votes?.confirm || 0 })}</span>
      <span>${icon("calendar")}${timeAgo(r.createdAt, state.lang)}</span>
      <span class="spacer"></span>
      <button class="link-btn small" type="button" data-open="${r.id}">${t("hunt.details")}</button>
    </div>
  </article>`;
}

export function escalationText(r) {
  const flags = (r.analysis?.flags || []).map((f) => f.title).join("; ");
  return [
    "Suspected investment scam report",
    `Entity: ${r.entity}`,
    `Type: ${CATEGORY[r.category]?.en || r.category} | Platform: ${PLATFORM[r.platform]?.en || r.platform}`,
    r.link ? `Link (defanged): ${r.link}` : "",
    `What they claim: ${r.description}`,
    flags ? `Red flags: ${flags}` : "",
    `Community status on FinSuraksha FinScam Hunter: ${r.status} (${r.votes?.confirm || 0} confirmations, ${r.reports} report(s))`,
    `Reference: ${r.id}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function openReportModal(id, { onChange } = {}) {
  let data;
  try {
    data = await api.get(`/api/hunt/reports/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err.code === "auth_required") {
      toast(t("common.signinFirst"), "info");
      location.hash = `#/login?next=${encodeURIComponent("hunt?tab=verify")}`;
      return;
    }
    toast(err.message, "err");
    return;
  }
  const r = data.report;
  const text = escalationText(r);
  const body = el(html`<div class="stack lg">
    <div class="row" style="gap:6px">${catChip(r)}${platChip(r)}${statusChip(r)}${r.sample ? html`<span class="chip sample">${t("common.sample")}</span>` : ""}</div>
    <div class="row nowrap" style="gap:16px;align-items:center">
      ${ring(r.analysis?.score || 0, r.analysis?.level)}
      <div><div class="entity" style="font-family:ui-monospace,monospace;font-weight:700;font-size:1.1rem;overflow-wrap:anywhere">${r.entity}</div>
      ${r.link ? html`<div class="small muted" style="overflow-wrap:anywhere">${r.link}</div>` : ""}
      <div class="small muted">${t("hunt.timeline", { when: fmtDate(r.createdAt, state.lang) })} · ${r.reporter}</div></div>
    </div>
    <div><div class="label">${t("hunt.claim")}</div><p style="margin:6px 0 0">${r.description}</p>
      ${r.ocrText ? html`<details class="checks" style="margin-top:8px"><summary>${t("hunt.fOcr")}</summary><div class="cbody"><pre class="draft" style="margin:0">${r.ocrText}</pre></div></details>` : ""}
      ${(r.notes || []).length ? html`<div class="small muted" style="margin-top:8px">+ ${r.notes.length} supporting report(s)</div>` : ""}</div>
    ${(r.analysis?.flags || []).length ? html`<div><div class="label">${t("hunt.autoFlags")}</div><ul class="flag-list">${r.analysis.flags.map((f) => html`<li><span class="sev-dot sev-${f.sev}"></span><span class="ft">${f.title}</span></li>`)}</ul></div>` : ""}
    <div class="tally"><span>✅ <b>${r.votes.confirm}</b> ${t("hunt.vConfirm")}</span><span>❌ <b>${r.votes.legit}</b> ${t("hunt.vLegit")}</span><span>❓ <b>${r.votes.info}</b></span></div>
    ${r.hasEvidence && state.user ? html`<button class="btn btn-soft btn-sm" type="button" data-evidence>${icon("image")}${t("hunt.viewShot")}</button><div data-evidence-slot></div>` : ""}
    <div class="card flat" style="background:var(--surface-2)">
      <h4 style="margin-bottom:6px">${t("hunt.escalate")}</h4>
      <p class="small muted" style="margin-top:0">${t("hunt.escalateText")}</p>
      <pre class="draft">${text}</pre>
      <div class="row" style="margin-top:10px">
        <button class="btn btn-primary btn-sm" type="button" data-copy>${icon("copy")}${t("common.copy")}</button>
        <a class="btn btn-outline btn-sm" href="https://sancharsaathi.gov.in/sfc/" target="_blank" rel="noopener noreferrer">Chakshu ${icon("external")}</a>
        <a class="btn btn-outline btn-sm" href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">cybercrime.gov.in ${icon("external")}</a>
        <a class="btn btn-outline btn-sm" href="https://scores.sebi.gov.in" target="_blank" rel="noopener noreferrer">SEBI SCORES ${icon("external")}</a>
      </div>
      <p class="xs muted" style="margin-bottom:0">${state.lang === "hi" ? "प्लेटफ़ॉर्म (Telegram, Instagram, YouTube…) पर उसके अपने 'Report' विकल्प से भी शिकायत करें।" : "Also use the platform's own 'Report' option (Telegram, Instagram, YouTube…)."}</p>
    </div>
    <details class="checks"><summary>${icon("gavel")}${t("hunt.appealTitle")}</summary><div class="cbody">
      <p class="small muted" style="margin:0">${t("hunt.appealText")}</p>
      <form class="stack" data-appeal>
        <div class="grid grid-2" style="gap:10px"><input class="input" name="name" required minlength="2" maxlength="60" placeholder="${t("hunt.appealName")}" />
        <input class="input" name="contact" maxlength="100" placeholder="${t("hunt.appealContact")}" /></div>
        <textarea class="textarea" name="message" required minlength="20" maxlength="1000" placeholder="${t("hunt.appealMsg")}"></textarea>
        <div><button class="btn btn-outline btn-sm" type="submit">${t("hunt.appealSend")}</button></div>
      </form></div></details>
    ${state.user?.isModerator && r.status === "pending" ? html`<div class="row"><button class="btn btn-primary btn-sm" data-mod="verify">${t("hunt.modVerify")}</button><button class="btn btn-outline btn-sm" data-mod="reject">${t("hunt.modReject")}</button></div>` : ""}
    ${state.user?.isModerator && r.underReview ? html`<div><button class="btn btn-ghost btn-sm" data-mod="clear_review">Clear 'under review'</button></div>` : ""}
  </div>`);
  const m = modal({ title: t("hunt.details"), body });

  body.querySelector("[data-copy]").addEventListener("click", async () => {
    if (await copyText(text)) toast(t("common.copied"));
  });
  body.querySelector("[data-evidence]")?.addEventListener("click", async (e) => {
    e.currentTarget.disabled = true;
    try {
      const res = await fetch(`/api/hunt/reports/${encodeURIComponent(r.id)}/evidence`, { credentials: "same-origin" });
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const img = document.createElement("img");
      img.src = url;
      img.alt = "Evidence screenshot";
      img.style.cssText = "border-radius:14px;border:1px solid var(--line);max-height:480px;margin:auto";
      body.querySelector("[data-evidence-slot]").appendChild(img);
    } catch {
      toast(t("common.error"), "err");
    }
  });
  body.querySelector("[data-appeal]").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const out = await api.post(`/api/hunt/reports/${encodeURIComponent(r.id)}/appeal`, { name: f.get("name"), contact: f.get("contact"), message: f.get("message") });
      toast(out.message);
      m.close();
      onChange?.();
    } catch (err) {
      toast(err.message, "err");
    }
  });
  body.querySelectorAll("[data-mod]").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await api.post(`/api/hunt/reports/${encodeURIComponent(r.id)}/moderate`, { action: b.dataset.mod });
        toast(state.lang === "hi" ? "अपडेट हो गया" : "Updated");
        m.close();
        onChange?.();
      } catch (err) {
        toast(err.message, "err");
      }
    }),
  );
  void $;
}

export function bindOpeners(root, opts) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-open]");
    if (b) openReportModal(b.dataset.open, opts);
  });
}
