import { state, emit, go } from "../state.js";
import { api } from "../api.js";
import { t } from "../i18n.js";
import { html, mount, icon, $, toast, initials, modal, el, timeAgo, fmtNum } from "../ui.js";
import { statusChip, catChip } from "./hunt-shared.js";

export async function render(root) {
  if (!state.user) {
    go("login?next=me");
    return;
  }
  let data;
  let mine;
  try {
    [data, mine] = await Promise.all([api.get("/api/me"), api.get("/api/hunt/reports?mine=1&status=all&limit=60")]);
  } catch (err) {
    if (err.status === 401) {
      state.user = null;
      emit("fs:auth");
      go("login?next=me");
      return;
    }
    throw err;
  }
  const u = data.user;
  const s = data.stats;
  const span = u.nextLevelAt ? u.nextLevelAt - u.levelFloor : 1;
  const pct = u.nextLevelAt ? Math.min(100, Math.round(((u.points - u.levelFloor) / span) * 100)) : 100;
  const roleLabel = t(`role.${u.role}`);

  mount(
    root,
    html`<section class="page-hero"><div class="blob b2"></div>
      <div class="container" style="position:relative;z-index:1">
        <div class="card pad-lg raised">
          <div class="profile-head">
            <div class="avatar">${initials(u.name)}</div>
            <div style="flex:1;min-width:220px">
              <h1 style="margin:0;font-size:1.9rem;font-weight:500">${u.name}</h1>
              <div class="row" style="gap:6px;margin-top:6px"><span class="chip brand">${icon("trophy")}${u.level}</span><span class="chip">${roleLabel}</span>${u.college ? html`<span class="chip">${u.college}</span>` : ""}${u.isModerator ? html`<span class="chip outline">${icon("gavel")}Moderator</span>` : ""}</div>
              <div style="margin-top:14px;max-width:460px"><div class="level-track"><i style="width:${pct}%"></i></div>
              <div class="xs muted" style="margin-top:6px">${u.nextLevelAt ? t("me.toNext", { n: u.nextLevelAt - u.points, level: ["Rookie", "Spotter", "Hunter", "Guardian", "Sentinel"][u.levelIndex + 1] }) : t("me.maxLevel")}</div></div>
            </div>
            <div class="grid grid-4" style="gap:10px;min-width:min(100%,460px)">
              <div class="stat-tile"><div class="lbl">${t("me.points")}</div><div class="val">${fmtNum(u.points)}</div></div>
              <div class="stat-tile"><div class="lbl">${t("me.rank")}</div><div class="val">${s.rank ? `#${s.rank}` : "—"}</div></div>
              <div class="stat-tile"><div class="lbl">${t("me.verified")}</div><div class="val">${s.verified}</div></div>
              <div class="stat-tile"><div class="lbl">${t("me.votes")}</div><div class="val">${s.votes}</div></div>
            </div>
          </div>
        </div>
      </div></section>
    <section class="container stack lg">
      <div class="grid" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:20px;align-items:start" id="me-grid">
        <div class="stack lg">
          <div class="card pad-lg"><div class="card-title">${icon("star")} ${t("me.badges")} <span class="muted small">${data.badges.filter((b) => b.earned).length}/${data.badges.length}</span></div>
            <div class="badge-grid">${data.badges.map((b) => html`<div class="badge-tile ${b.earned ? "" : "locked"}" title="${b.desc}"><div class="bi">${b.icon}</div><div class="bn">${b.name}</div><div class="bd">${b.desc}</div></div>`)}</div></div>
          <div class="card pad-lg"><div class="card-title">${icon("flag")} ${t("me.myReports")} <a class="btn btn-soft btn-sm" href="#/hunt?tab=report">${t("me.reportNow")}</a></div>
            ${mine.reports.length
              ? html`<div class="stack">${mine.reports.map((r) => html`<div class="check-row" style="align-items:center;justify-content:space-between;gap:12px"><div style="min-width:0"><b style="overflow-wrap:anywhere">${r.entity}</b><div class="xs muted">${timeAgo(r.createdAt, state.lang)} · ${r.votes.confirm} ✅ ${r.votes.legit} ❌</div></div><div class="row" style="gap:6px">${catChip(r)}${statusChip(r)}</div></div>`)}</div>`
              : html`<div class="empty"><div class="big">🧭</div>${t("me.noReports")}</div>`}</div>
        </div>
        <div class="stack lg">
          <div class="card pad-lg ${data.certificate.eligible ? "card-brown" : ""}">
            <div class="card-title">${icon("trophy")} ${t("me.cert")}</div>
            ${data.certificate.eligible
              ? html`<p style="margin-top:0">${t("me.certReady")}</p><button class="btn btn-light" id="get-cert">${data.certificate.id ? t("me.certView") : t("me.certGet")}</button>`
              : html`<p class="small muted" style="margin-top:0">${t("me.certLocked", { p: data.certificate.rule.points, v: data.certificate.rule.verifiedReports })}</p>
                <div class="level-track"><i style="width:${Math.min(100, Math.round((u.points / data.certificate.rule.points) * 100))}%"></i></div>
                <div class="xs muted" style="margin-top:6px">${u.points}/${data.certificate.rule.points} · ${s.verified}/${data.certificate.rule.verifiedReports} ${t("me.verified").toLowerCase()}</div>`}
          </div>
          <div class="card pad-lg"><div class="card-title">${icon("chart")} ${t("me.activity")}</div>
            ${data.pointsLog.length ? html`<div class="stack">${data.pointsLog.map((p) => html`<div class="row between small"><span>${p.reason}</span><b style="color:${p.points >= 0 ? "var(--risk-low)" : "var(--risk-high)"}">${p.points >= 0 ? "+" : ""}${p.points}</b></div>`)}</div>` : html`<p class="small muted">—</p>`}</div>
          <div class="card pad-lg"><div class="card-title">${icon("lock")} ${t("me.settings")}</div>
            <form class="stack" id="prof-form">
              <div class="field"><label for="p-name">${t("auth.name")}</label><input class="input" id="p-name" value="${u.name}" maxlength="40" /></div>
              <div class="field"><label for="p-college">${t("auth.college")}</label><input class="input" id="p-college" value="${u.college}" maxlength="80" /></div>
              <div class="field"><label for="p-role">${t("auth.role")}</label><select class="select" id="p-role">${["student", "investor", "senior", "other"].map((r) => html`<option value="${r}" ${r === u.role ? "selected" : ""}>${t(`role.${r}`)}</option>`)}</select></div>
              <label class="check"><input type="checkbox" id="p-board" ${u.leaderboard ? "checked" : ""} /> <span>${t("me.showBoard")}</span></label>
              <div><button class="btn btn-primary btn-sm" type="submit">${t("common.save")}</button></div>
            </form>
            <hr class="sep" />
            <div class="row"><a class="btn btn-outline btn-sm" href="/api/me/export" download>${icon("download")}${t("me.export")}</a><button class="btn btn-ghost btn-sm" id="del" style="color:var(--risk-high)">${icon("trash")}${t("me.delete")}</button></div>
          </div>
        </div>
      </div>
    </section>`,
  );
  if (window.matchMedia("(max-width: 900px)").matches) $("#me-grid", root).style.gridTemplateColumns = "1fr";

  $("#prof-form", root).addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const out = await api.patch("/api/me", { name: $("#p-name", root).value, college: $("#p-college", root).value, role: $("#p-role", root).value, leaderboard: $("#p-board", root).checked });
      state.user = out.user;
      emit("fs:auth");
      toast(t("me.saved"));
    } catch (err) {
      toast(err.message, "err");
    }
  });

  $("#get-cert", root)?.addEventListener("click", async () => {
    try {
      const { certificate } = await api.post("/api/me/certificate");
      go(`certificate/${certificate.id}`);
    } catch (err) {
      toast(err.message, "err");
    }
  });

  $("#del", root).addEventListener("click", () => {
    const body = el(html`<form class="stack"><p style="margin-top:0">${t("me.deleteText")}</p>
      <div class="field"><label for="del-pw">${t("me.deletePw")}</label><input class="input" type="password" id="del-pw" required autocomplete="current-password" /></div>
      <div class="row"><button class="btn btn-danger" type="submit">${icon("trash")}${t("me.delete")}</button><button class="btn btn-ghost" type="button" data-close>${t("common.cancel")}</button></div></form>`);
    const m = modal({ title: t("me.delete"), body });
    body.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await api.del("/api/me", { password: body.querySelector("#del-pw").value });
        state.user = null;
        emit("fs:auth");
        m.close();
        toast(t("me.deleted"));
        go("");
      } catch (err) {
        toast(err.message, "err");
      }
    });
  });
}
