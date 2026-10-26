import { state } from "../state.js";
import { api } from "../api.js";
import { t } from "../i18n.js";
import { html, mount, icon, $, fmtDate } from "../ui.js";

export async function render(root, { parts }) {
  const id = parts[1] || "";
  if (!id) {
    // Opened without an ID: offer a box instead of a "not found" error.
    mount(
      root,
      html`<section class="container page-hero"><form class="card pad-lg" id="cert-form" style="max-width:560px;margin:0 auto">
        <h2 style="margin-top:0">${t("cert.enterTitle")}</h2><p class="muted">${t("cert.enterText")}</p>
        <div class="row nowrap"><input class="input" id="cert-id" aria-label="${t("cert.enterTitle")}" placeholder="FS-XXXXXXXX" autocomplete="off" maxlength="40" style="flex:1" /><button class="btn btn-primary" type="submit">${t("cert.check")}</button></div>
        <p class="small" style="margin-bottom:0"><a href="#/me">${t("nav.profile")}</a> · <a href="#/hunt">${t("nav.hunt")}</a></p></form></section>`,
    );
    $("#cert-form", root).addEventListener("submit", (e) => {
      e.preventDefault();
      const v = $("#cert-id", root).value.trim();
      if (v) location.hash = `#/verify/${encodeURIComponent(v)}`;
    });
    return;
  }
  let cert = null;
  try {
    cert = (await api.get(`/api/verify/${encodeURIComponent(id)}`)).certificate;
  } catch {
    /* invalid */
  }
  if (!cert) {
    mount(root, html`<section class="container page-hero"><div class="card pad-lg center" style="max-width:560px;margin:0 auto"><div style="font-size:2.4rem">❌</div><h2>${t("cert.invalid")}</h2><p class="muted"><span class="kbd">${id}</span></p></div></section>`);
    return;
  }
  const verifyUrl = `${location.origin}/#/verify/${cert.id}`;
  if (parts[0] === "verify") {
    mount(
      root,
      html`<section class="container page-hero"><div class="card pad-lg raised" style="max-width:640px;margin:0 auto">
        <span class="level-pill level-low">${icon("check")}${t("cert.valid")}</span>
        <h2 style="margin:14px 0 4px;font-size:1.8rem">${cert.name}</h2>
        <p class="muted" style="margin:0">${t("cert.title")}${cert.college ? ` · ${cert.college}` : ""}</p>
        <div class="grid grid-3" style="margin-top:18px;gap:10px">
          <div class="stat-tile"><div class="lbl">${t("cert.points")}</div><div class="val">${cert.points}</div></div>
          <div class="stat-tile"><div class="lbl">${t("cert.verifiedReports")}</div><div class="val">${cert.verifiedReports}</div></div>
          <div class="stat-tile"><div class="lbl">${t("cert.badges")}</div><div class="val">${cert.badges.length}</div></div>
        </div>
        <p class="small muted" style="margin-bottom:0">ID <span class="kbd">${cert.id}</span> · ${t("cert.issued")} ${fmtDate(cert.issuedAt, state.lang)}</p>
        <a class="btn btn-outline btn-sm" style="margin-top:14px" href="#/certificate/${cert.id}">${t("me.certView")}</a>
      </div></section>`,
    );
    return;
  }
  mount(
    root,
    html`<section class="container" style="padding:36px 20px">
      <div class="row no-print" style="justify-content:center;margin-bottom:18px"><button class="btn btn-primary" id="print">${icon("print")}${t("cert.print")}</button><a class="btn btn-outline" href="#/verify/${cert.id}">${icon("shieldCheck")}${t("cert.valid")}?</a></div>
      <div class="cert center">
        <div class="c-kicker">${t("cert.kicker")}</div>
        <h2>${t("cert.title")}</h2>
        <div class="c-name">${cert.name}</div>
        ${cert.college ? html`<div style="color:#6b5446;margin-bottom:10px">${cert.college}</div>` : ""}
        <p class="c-body">${t("cert.body")}</p>
        <div class="c-stats">
          <div><b>${cert.points}</b>${t("cert.points")}</div>
          <div><b>${cert.verifiedReports}</b>${t("cert.verifiedReports")}</div>
          <div><b>${cert.badges.length}</b>${t("cert.badges")}</div>
        </div>
        <div class="c-foot">
          <div style="text-align:left">${t("cert.issued")}: ${fmtDate(cert.issuedAt, state.lang)}<br />ID: <b>${cert.id}</b><br />${t("cert.verifyAt")}: ${verifyUrl}</div>
          <div class="seal">FIN<br />SURAKSHA<br />✓</div>
        </div>
      </div>
    </section>`,
  );
  $("#print", root).addEventListener("click", () => window.print());
}
