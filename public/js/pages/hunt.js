import { state, emit } from "../state.js";
import { api } from "../api.js";
import { t, L } from "../i18n.js";
import { html, mount, icon, $, $$, toast, ring, debounce, fmtNum, el } from "../ui.js";
import { lineChart, columnChart, barList, chartCard } from "../charts.js";
import { CATEGORY, PLATFORM, ENTITY } from "../content.js";
import { alertCard, bindOpeners, statusChip } from "./hunt-shared.js";
import { prepareImage, readText } from "../media.js";

const TABS = [
  ["wall", "hunt.tabWall", "shield"],
  ["report", "hunt.tabReport", "flag"],
  ["verify", "hunt.tabVerify", "vote"],
  ["board", "hunt.tabBoard", "trophy"],
  ["trends", "hunt.tabTrends", "chart"],
];

export async function render(root, { query }) {
  const tab = TABS.some(([k]) => k === query.get("tab")) ? query.get("tab") : "wall";
  mount(
    root,
    html`<section class="page-hero"><div class="blob b2"></div><div class="dots d2"></div>
      <div class="container" style="position:relative;z-index:1">
        <span class="crumbs">${icon("flag")}<b>${t("hunt.kicker")}</b></span>
        <h1 class="page-title">${t("hunt.titleA")} <span class="soft">${t("hunt.titleB")}</span></h1>
        <p class="lead">${t("hunt.lead")}</p>
        <div class="tabs" role="tablist" style="margin-top:14px">
          ${TABS.map(([k, key, ic]) => html`<a role="tab" href="#/hunt?tab=${k}" aria-selected="${k === tab}">${icon(ic)}${t(key)}</a>`)}
        </div>
      </div></section>
    <section class="container" id="tab-body"></section>`,
  );
  const body = $("#tab-body", root);
  const views = { wall, report, verify, board, trends };
  return views[tab](body);
}

function needLogin(body, next) {
  mount(
    body,
    html`<div class="card pad-lg center" style="max-width:560px;margin:0 auto">
      <div style="font-size:2.4rem">🔐</div><h3 style="margin:8px 0">${t("common.signinFirst")}</h3><p class="muted">${t("common.signinText")}</p>
      <div class="row" style="justify-content:center"><a class="btn btn-primary" href="#/login?next=${encodeURIComponent(next)}">${t("nav.signin")}</a><a class="btn btn-outline" href="#/login?mode=signup&next=${encodeURIComponent(next)}">${t("auth.tabSignup")}</a></div>
    </div>`,
  );
}

const options = (obj, selected) => Object.entries(obj).map(([k, v]) => html`<option value="${k}" ${k === selected ? "selected" : ""}>${v.icon ? `${v.icon} ` : ""}${L(v)}</option>`);

// ---------------------------------------------------------------- Alert wall
async function wall(body) {
  mount(
    body,
    html`<div class="filters">
      <label class="search-pill">${icon("search")}<input id="f-q" type="search" placeholder="${t("hunt.search")}" aria-label="${t("hunt.search")}" /></label>
      <select class="select" id="f-cat" aria-label="${t("hunt.allCat")}"><option value="">${t("hunt.allCat")}</option>${options(CATEGORY)}</select>
      <select class="select" id="f-plat" aria-label="${t("hunt.allPlat")}"><option value="">${t("hunt.allPlat")}</option>${options(PLATFORM)}</select>
    </div><div id="wall-list" class="alert-grid"></div>`,
  );
  const list = $("#wall-list", body);
  const load = async () => {
    list.style.opacity = "0.55";
    const q = new URLSearchParams({ status: "verified", limit: "60" });
    if ($("#f-q", body).value.trim()) q.set("q", $("#f-q", body).value.trim());
    if ($("#f-cat", body).value) q.set("category", $("#f-cat", body).value);
    if ($("#f-plat", body).value) q.set("platform", $("#f-plat", body).value);
    try {
      const data = await api.get(`/api/hunt/reports?${q}`);
      mount(list, data.reports.length ? html`${data.reports.map((r) => alertCard(r))}` : html`<div class="empty" style="grid-column:1/-1"><div class="big">🔍</div>${t("hunt.noAlerts")}</div>`);
    } catch (err) {
      mount(list, html`<div class="form-error">${err.message}</div>`);
    }
    list.style.opacity = "";
  };
  $("#f-q", body).addEventListener("input", debounce(load, 300));
  $("#f-cat", body).addEventListener("change", load);
  $("#f-plat", body).addEventListener("change", load);
  bindOpeners(body, { onChange: load });
  await load();
}

// ---------------------------------------------------------------- Report form
async function report(body) {
  if (!state.user) return needLogin(body, "hunt?tab=report");
  let prefill = {};
  try {
    prefill = JSON.parse(sessionStorage.getItem("fs_prefill") || "{}");
    sessionStorage.removeItem("fs_prefill");
  } catch {
    /* none */
  }
  let image = null;
  mount(
    body,
    html`<div class="grid" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:22px;align-items:start" id="rep-grid">
      <form class="card pad-lg stack lg" id="rep-form" novalidate>
        <div class="grid grid-2">
          <div class="field"><label for="r-cat">${t("hunt.fCategory")}</label><select class="select" id="r-cat" name="category">${options(CATEGORY, prefill.category || "fno_tips")}</select></div>
          <div class="field"><label for="r-plat">${t("hunt.fPlatform")}</label><select class="select" id="r-plat" name="platform">${options(PLATFORM, prefill.platform || "telegram")}</select></div>
        </div>
        <div class="grid grid-2">
          <div class="field"><label for="r-et">${t("hunt.fEntityType")}</label><select class="select" id="r-et" name="entityType">${Object.entries(ENTITY).map(([k, v]) => html`<option value="${k}" ${k === (prefill.entityType || "telegram") ? "selected" : ""}>${L(v)}</option>`)}</select></div>
          <div class="field"><label for="r-ev">${t("hunt.fEntity")}</label><input class="input" id="r-ev" name="entityValue" required minlength="3" maxlength="200" value="${prefill.entityValue || ""}" placeholder="${ENTITY[prefill.entityType || "telegram"].ph}" /></div>
        </div>
        <p class="hint xs muted" style="margin:-10px 0 0">${t("hunt.fEntityHint")}</p>
        <div class="field"><label for="r-link">${t("hunt.fLink")}</label><input class="input" id="r-link" name="link" maxlength="500" value="${prefill.link || ""}" placeholder="https://…" /></div>
        <div class="field"><label for="r-desc">${t("hunt.fDesc")}</label><textarea class="textarea" id="r-desc" name="description" required minlength="20" maxlength="2000">${prefill.description || ""}</textarea><span class="hint">${t("hunt.fDescHint")}</span></div>
        <div class="field"><label>${t("hunt.fShot")}</label>
          <div class="row"><label class="btn btn-soft btn-sm" for="r-file">${icon("upload")}${t("dost.attach")}</label><input type="file" id="r-file" accept="image/*" class="sr-only" /><span class="small muted" id="r-file-name"></span></div>
          <div class="progress hidden" id="r-prog"><i></i></div>
          <span class="hint">${t("hunt.fShotHint")}</span></div>
        <div class="field hidden" id="r-ocr-wrap"><label for="r-ocr">${t("hunt.fOcr")}</label><textarea class="textarea" id="r-ocr" name="ocrText" maxlength="6000"></textarea></div>
        <label class="check"><input type="checkbox" id="r-consent" /> <span>${t("hunt.consent")}</span></label>
        <div id="r-msg"></div>
        <div class="row"><button class="btn btn-outline" type="button" id="r-pre">${icon("sparkle")}${t("hunt.precheck")}</button><button class="btn btn-primary" type="submit" id="r-submit">${icon("send")}${t("hunt.submit")}</button></div>
      </form>
      <aside class="card raised stack" id="auto-panel">
        <h3 style="font-size:1.2rem">${icon("shieldCheck")} ${t("hunt.autoTitle")}</h3>
        <p class="small muted" style="margin:0">${t("hunt.autoIntro")}</p>
        <div id="auto-result" class="stack"><div class="empty" style="padding:20px">${icon("sparkle")}</div></div>
      </aside>
    </div>`,
  );
  if (window.matchMedia("(max-width: 900px)").matches) $("#rep-grid", body).style.gridTemplateColumns = "1fr";
  const form = $("#rep-form", body);
  $("#r-et", body).addEventListener("change", (e) => ($("#r-ev", body).placeholder = ENTITY[e.target.value].ph));

  $("#r-file", body).addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const prog = $("#r-prog", body);
    try {
      const prepared = await prepareImage(file);
      image = prepared.dataUrl;
      $("#r-file-name", body).textContent = file.name;
      prog.classList.remove("hidden");
      const text = await readText(prepared.canvas, state.lang === "hi" ? "eng+hin" : "eng", (p) => ($("i", prog).style.width = `${Math.round(p * 100)}%`)).catch(() => "");
      prog.classList.add("hidden");
      if (text) {
        $("#r-ocr-wrap", body).classList.remove("hidden");
        $("#r-ocr", body).value = text.slice(0, 6000);
        toast(t("dost.readDone"), "info");
      } else toast(t("dost.readFail"), "info");
    } catch (err) {
      prog.classList.add("hidden");
      toast(err.message, "err");
    }
  });

  const payload = () => ({
    category: $("#r-cat", body).value,
    platform: $("#r-plat", body).value,
    entityType: $("#r-et", body).value,
    entityValue: $("#r-ev", body).value.trim(),
    link: $("#r-link", body).value.trim(),
    description: $("#r-desc", body).value.trim(),
    ocrText: $("#r-ocr", body).value.trim(),
    lang: state.lang,
  });

  const showAuto = (a) => {
    mount(
      $("#auto-result", body),
      html`<div class="row nowrap" style="gap:14px">${ring(a.score, a.level)}<div><span class="level-pill level-${a.level}">${t(`level.${a.level}`)}</span></div></div>
      <div class="check-row">${icon(a.disclosedRegistration ? "check" : "x")}<span>${t("hunt.disclosed")}: <b>${t(a.disclosedRegistration ? "hunt.yes" : "hunt.no")}</b></span></div>
      <div class="check-row">${icon(a.guaranteedReturns ? "alert" : "check")}<span>${t("hunt.guarantee")}: <b>${t(a.guaranteedReturns ? "hunt.yes" : "hunt.no")}</b></span></div>
      ${a.community?.length ? html`<div class="notice danger">${icon("users")}<span>${t("hunt.alreadyReported")}: <b>${a.community.map((c) => c.display).join(", ")}</b></span></div>` : ""}
      ${a.flags.length ? html`<ul class="flag-list">${a.flags.slice(0, 6).map((f) => html`<li><span class="sev-dot sev-${f.sev}"></span><div><div class="ft">${f.title}</div><div class="fw">${f.why}</div></div></li>`)}</ul>` : ""}`,
    );
  };

  $("#r-pre", body).addEventListener("click", async () => {
    try {
      showAuto(await api.post("/api/hunt/precheck", payload()));
    } catch (err) {
      toast(err.message, "err");
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#r-msg", body);
    const p = payload();
    if (p.entityValue.length < 3 || p.description.length < 20) {
      mount(msg, html`<div class="form-error">${t("hunt.fEntity")} / ${t("hunt.fDescHint")}</div>`);
      return;
    }
    if (!$("#r-consent", body).checked) {
      mount(msg, html`<div class="form-error">${t("hunt.consent")}</div>`);
      return;
    }
    const btn = $("#r-submit", body);
    btn.disabled = true;
    try {
      const out = await api.post("/api/hunt/reports", { ...p, image, consent: true });
      if (out.merged) {
        mount(msg, html`<div class="form-ok">${out.message || t("hunt.merged")}</div>`);
      } else {
        if (state.user) state.user.points = out.points;
        emit("fs:auth");
        mount(
          body,
          html`<div class="card pad-lg center fade-in" style="max-width:600px;margin:0 auto">
            <div style="font-size:2.6rem">🎯</div><h3 style="margin:8px 0">${t("hunt.thanks")}</h3>
            <p class="muted">${t("hunt.pointsNow", { n: 2, total: out.points })}</p>
            ${out.badges?.length ? html`<p><span class="chip brand">${icon("star")} ${out.badges.join(", ")}</span></p>` : ""}
            <div class="row" style="justify-content:center"><a class="btn btn-primary" href="#/hunt?tab=verify">${t("hunt.tabVerify")}</a><a class="btn btn-outline" href="#/hunt?tab=report" id="again">${t("hunt.tabReport")}</a></div></div>`,
        );
        $("#again", body).addEventListener("click", (ev) => {
          ev.preventDefault();
          report(body);
        });
      }
    } catch (err) {
      mount(msg, html`<div class="form-error">${err.message}</div>`);
    } finally {
      btn.disabled = false;
    }
  });
}

// ---------------------------------------------------------------- Verify queue
async function verify(body) {
  if (!state.user) return needLogin(body, "hunt?tab=verify");
  const T = state.config.verifyThreshold || 3;
  const voteLabel = { confirm: t("hunt.vConfirm"), legit: t("hunt.vLegit"), info: t("hunt.vInfo") };
  mount(body, html`<div class="notice" style="margin-bottom:18px">${icon("info")}<span>${t("hunt.verifyIntro", { n: T })}</span></div><div id="mod"></div><div id="queue" class="alert-grid"></div>`);
  const queue = $("#queue", body);

  const voteRow = (r) => {
    if (r.mine) return html`<div class="chip outline">${icon("user")}${t("hunt.yours")}</div>`;
    if (r.myVote) return html`<div class="chip brand">${icon("check")}${t("hunt.youVoted", { v: voteLabel[r.myVote] })}</div>`;
    return html`<div class="vote-row">
      <button class="btn btn-primary btn-sm" data-vote="confirm" data-id="${r.id}">✅ ${t("hunt.vConfirm")}</button>
      <button class="btn btn-outline btn-sm" data-vote="legit" data-id="${r.id}">❌ ${t("hunt.vLegit")}</button>
      <button class="btn btn-ghost btn-sm" data-vote="info" data-id="${r.id}">❓ ${t("hunt.vInfo")}</button></div>`;
  };

  const load = async () => {
    try {
      const data = await api.get("/api/hunt/reports?status=pending&limit=60");
      mount(
        queue,
        data.reports.length
          ? html`${data.reports.map((r) => alertCard(r, html`<div class="row" style="gap:8px">${ring(r.analysis?.score || 0, r.analysis?.level)}<div class="small muted">${t("hunt.confirms", { n: r.votes.confirm })} · ${r.votes.legit} ❌ · ${r.votes.info} ❓<br />${r.hasEvidence ? html`📎 ${t("hunt.viewShot")}` : ""}</div></div>${voteRow(r)}`))}`
          : html`<div class="empty" style="grid-column:1/-1"><div class="big">🎉</div>${t("hunt.noPending")}</div>`,
      );
    } catch (err) {
      mount(queue, html`<div class="form-error">${err.message}</div>`);
    }
  };
  queue.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-vote]");
    if (!b) return;
    $$("[data-vote]", b.closest(".vote-row")).forEach((x) => (x.disabled = true));
    try {
      const out = await api.post(`/api/hunt/reports/${encodeURIComponent(b.dataset.id)}/vote`, { vote: b.dataset.vote });
      if (state.user) state.user.points = out.points;
      emit("fs:auth");
      if (out.resolved === "verified") toast(t("hunt.resolvedV"));
      else if (out.resolved === "rejected") toast(t("hunt.resolvedR"));
      else toast("+1");
      if (out.badges?.length) toast(`🏅 ${out.badges.join(", ")}`);
      await load();
    } catch (err) {
      toast(err.message, "err");
      await load();
    }
  });
  bindOpeners(body, { onChange: load });
  await load();

  if (state.user.isModerator) {
    try {
      const { appeals } = await api.get("/api/hunt/appeals");
      const mod = $("#mod", body);
      if (appeals.length) {
        mount(
          mod,
          html`<div class="card" style="margin-bottom:18px"><div class="card-title">${icon("gavel")} ${t("hunt.appeals")} (${appeals.length})</div>
            <div class="stack">${appeals.map((a) => html`<div class="check-row" style="justify-content:space-between;align-items:center"><div><b>${a.report.entity || a.reportId}</b> · ${a.name}${a.contact ? ` · ${a.contact}` : ""}<div class="small muted">${a.message}</div></div>
              <div class="row"><button class="btn btn-ghost btn-sm" data-open="${a.reportId}">${t("hunt.details")}</button><button class="btn btn-outline btn-sm" data-close-appeal="${a.id}">${t("hunt.closeAppeal")}</button></div></div>`)}</div></div>`,
        );
        mod.addEventListener("click", async (e) => {
          const c = e.target.closest("[data-close-appeal]");
          if (!c) return;
          await api.post(`/api/hunt/appeals/${encodeURIComponent(c.dataset.closeAppeal)}/close`).catch((err) => toast(err.message, "err"));
          c.closest(".check-row").remove();
        });
      }
    } catch {
      /* not critical */
    }
  }
}

// ---------------------------------------------------------------- Leaderboard
async function board(body) {
  const data = await api.get("/api/hunt/leaderboard");
  let mode = "people";
  const draw = () => {
    const top = data.users.slice(0, 3);
    const order = [top[1], top[0], top[2]].filter(Boolean);
    mount(
      body,
      html`<div class="row between" style="margin-bottom:18px">
        <div class="tabs" role="tablist"><button role="tab" aria-selected="${mode === "people"}" data-mode="people">${icon("users")}${t("hunt.boardPeople")}</button><button role="tab" aria-selected="${mode === "colleges"}" data-mode="colleges">${icon("book")}${t("hunt.boardColleges")}</button></div>
        ${data.me ? html`<span class="chip brand">${t("hunt.you")}: #${data.me.rank} · ${data.me.points} ${t("hunt.points")}</span>` : ""}
      </div>
      ${mode === "people"
        ? html`<div class="podium">${order.map((u) => html`<div class="pod ${u === top[0] ? "first" : ""}"><div class="medal">${["🥇", "🥈", "🥉"][u.rank - 1]}</div><div class="pname">${u.name}</div><div class="small muted">${u.college || "—"}</div><div class="ppts">${u.points}</div><div class="small muted">${u.level} · ${u.verified} ${t("hunt.verifiedCol")}</div></div>`)}</div>
          <div class="card table-wrap" tabindex="0" role="region" aria-label="${t("hunt.tabBoard") || "Leaderboard"}"><table class="lb-table"><thead><tr><th>${t("hunt.rank")}</th><th>${t("hunt.name")}</th><th>${t("hunt.college")}</th><th>${t("hunt.level")}</th><th class="num">${t("hunt.verifiedCol")}</th><th class="num">${t("hunt.points")}</th></tr></thead>
          <tbody>${data.users.map((u) => html`<tr class="${u.me ? "me" : ""}"><td>#${u.rank}</td><td><b>${u.name}</b> ${u.sample ? html`<span class="chip sample">${t("common.sample")}</span>` : ""}</td><td>${u.college || "—"}</td><td>${u.level}</td><td class="num">${u.verified}</td><td class="num"><b>${u.points}</b></td></tr>`)}</tbody></table></div>`
        : html`<div class="card table-wrap" tabindex="0" role="region" aria-label="${t("hunt.tabBoard") || "Leaderboard"}"><table class="lb-table"><thead><tr><th>${t("hunt.rank")}</th><th>${t("hunt.college")}</th><th class="num">${t("hunt.members")}</th><th class="num">${t("hunt.verifiedCol")}</th><th class="num">${t("hunt.points")}</th></tr></thead>
          <tbody>${data.colleges.map((c) => html`<tr><td>#${c.rank}</td><td><b>${c.name}</b></td><td class="num">${c.members}</td><td class="num">${c.verified}</td><td class="num"><b>${c.points}</b></td></tr>`)}</tbody></table></div>`}`,
    );
    $$("[data-mode]", body).forEach((b) =>
      b.addEventListener("click", () => {
        mode = b.dataset.mode;
        draw();
      }),
    );
  };
  draw();
}

// ---------------------------------------------------------------- Trends
async function trends(body) {
  const s = await api.get("/api/stats");
  const lang = state.lang;
  const tl = [t("common.table"), t("common.chart")];
  mount(
    body,
    html`<div class="grid grid-4" style="margin-bottom:20px">
      <div class="stat-tile"><div class="lbl">${t("hunt.tTotal")}</div><div class="val">${fmtNum(s.reports)}</div></div>
      <div class="stat-tile"><div class="lbl">${t("hunt.tVerified")}</div><div class="val">${fmtNum(s.verified)}</div></div>
      <div class="stat-tile"><div class="lbl">${t("hunt.tPending")}</div><div class="val">${fmtNum(s.pending)}</div></div>
      <div class="stat-tile"><div class="lbl">${t("hunt.tHunters")}</div><div class="val">${fmtNum(s.hunters)}</div></div>
    </div>
    <div class="grid grid-2" id="charts"></div>
    ${s.includesSample ? html`<p class="xs muted" style="text-align:right">${t("common.includesSample")}</p>` : ""}`,
  );
  const holder = $("#charts", body);
  const card = () => {
    const c = el(html`<div class="dash-card" style="min-height:260px"></div>`);
    holder.appendChild(c);
    return c;
  };
  const weekly = s.weekly.map((w) => ({ label: w.week, short: new Date(w.week).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" }), value: w.reports }));
  chartCard(card(), { title: t("hunt.tWeekly"), toggleLabel: tl, columns: ["Week", "Reports"], rows: weekly.map((w) => [w.short, w.value]), render: (e) => lineChart(e, weekly, { height: 170, valueName: "reports" }) });
  const cats = Object.entries(s.byCategory)
    .filter(([, n]) => n)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => ({ label: L(CATEGORY[k]), short: CATEGORY[k].icon, value: n }));
  chartCard(card(), { title: t("hunt.tCategories"), toggleLabel: tl, columns: ["Type", "Reports"], rows: cats.map((c) => [c.label, c.value]), render: (e) => columnChart(e, cats, { height: 170, valueName: "reports" }) });
  const plats = Object.entries(s.byPlatform)
    .filter(([, n]) => n)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => ({ label: L(PLATFORM[k]), value: n }));
  chartCard(card(), { title: t("hunt.tPlatforms"), toggleLabel: tl, columns: ["Platform", "Reports"], rows: plats.map((p) => [p.label, p.value]), render: (e) => barList(e, plats) });
  const flags = s.topFlags.map((f) => ({ label: f.title, value: f.count }));
  chartCard(card(), { title: t("hunt.tFlags"), toggleLabel: tl, columns: ["Red flag", "Checks"], rows: flags.map((f) => [f.label, f.value]), render: (e) => barList(e, flags, { wide: true }) });
  void statusChip;
}
