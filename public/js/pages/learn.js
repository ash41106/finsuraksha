import { state, emit } from "../state.js";
import { api } from "../api.js";
import { t, L } from "../i18n.js";
import { html, mount, icon, $, $$, modal, el, toast } from "../ui.js";
import { MODULES, QUIZ } from "../content.js";

export async function render(root) {
  let learned = new Set();
  if (state.user) {
    try {
      learned = new Set((await api.get("/api/me")).learned || []);
    } catch {
      /* signed out elsewhere */
    }
  }
  mount(
    root,
    html`<section class="page-hero"><div class="blob b2"></div><div class="dots d1"></div>
      <div class="container" style="position:relative;z-index:1">
        <span class="crumbs">${icon("book")}<b>${t("learn.kicker")}</b></span>
        <h1 class="page-title">${t("learn.titleA")} <span class="soft">${t("learn.titleB")}</span></h1>
        <p class="lead">${t("learn.lead")}</p>
        <a class="btn btn-primary" href="#quiz" id="jump-quiz" style="margin-top:8px">${icon("target")}${t("learn.quizStart")}</a>
      </div></section>
    <section class="container">
      <div class="grid grid-4" id="mods"></div>
    </section>
    <section class="section tight" id="quiz"><div class="container"><div class="card pad-lg quiz-card" id="quiz-card"></div></div></section>`,
  );

  const mods = $("#mods", root);
  const drawMods = () =>
    mount(
      mods,
      html`${MODULES.map((m) => html`<button class="module-card" type="button" data-mod="${m.id}">
        <span class="mi">${m.icon}</span><h4>${L(m.title)}</h4><p>${L(m.blurb)}</p>
        <span class="row between" style="margin-top:auto"><span class="link-btn small">${t("learn.read")}</span>${learned.has(m.id) ? html`<span class="done">${icon("check")}${t("learn.done")}</span>` : ""}</span></button>`)}`,
    );
  drawMods();

  mods.addEventListener("click", (e) => {
    const b = e.target.closest("[data-mod]");
    if (!b) return;
    const m = MODULES.find((x) => x.id === b.dataset.mod);
    const body = el(html`<div class="stack lg prose">
      <p class="lead" style="margin:0">${L(m.blurb)}</p>
      <div><h3>${icon("refresh")} ${t("learn.how")}</h3><ol>${L(m.how).map((s) => html`<li>${s}</li>`)}</ol></div>
      <div><h3>${icon("flag")} ${t("learn.flags")}</h3><ul class="flag-list">${L(m.flags).map((s) => html`<li><span class="sev-dot sev-high"></span><span class="ft">${s}</span></li>`)}</ul></div>
      <div><h3>${icon("check")} ${t("learn.do")}</h3><ol class="actions-list">${L(m.todo).map((s) => html`<li>${s}</li>`)}</ol></div>
      <div class="notice">${icon("gavel")}<span><b>${t("learn.fact")}:</b> ${L(m.fact)}</span></div>
      <div class="row"><button class="btn btn-primary" type="button" data-done>${icon("check")}${learned.has(m.id) ? t("learn.done") : t("learn.markDone")}</button><a class="btn btn-outline" href="#/dost">${t("nav.dost")}</a></div>
    </div>`);
    const dlg = modal({ title: `${m.icon} ${L(m.title)}`, body });
    body.querySelector("[data-done]").addEventListener("click", async () => {
      learned.add(m.id);
      if (state.user) {
        try {
          const out = await api.post("/api/me/learn", { moduleId: m.id });
          state.user.points = out.points;
          emit("fs:auth");
          if (out.gained) toast(t("learn.earned", { n: out.gained }));
          if (out.badges?.length) toast(`🏅 ${out.badges.join(", ")}`);
        } catch (err) {
          toast(err.message, "err");
        }
      }
      drawMods();
      dlg.close();
    });
  });

  // ---- Quiz ----
  const card = $("#quiz-card", root);
  let order = [];
  let idx = 0;
  let score = 0;
  const intro = () =>
    mount(card, html`<div class="center"><div style="font-size:2.6rem">🕵️</div><h2 class="h-section" style="font-size:2rem;margin:8px 0">${t("learn.quizTitle")}</h2><p class="muted">${t("learn.quizText")}</p><button class="btn btn-primary btn-lg" id="q-start">${t("learn.quizStart")}</button></div>`);
  const start = () => {
    order = [...QUIZ].sort(() => Math.random() - 0.5);
    idx = 0;
    score = 0;
    ask();
  };
  const ask = () => {
    const q = order[idx];
    mount(
      card,
      html`<div class="row between"><b>${t("learn.quizTitle")}</b><span class="small muted">${idx + 1}/${order.length}</span></div>
      <div class="q-progress" style="margin:10px 0">${order.map((_, k) => html`<i class="${k < idx ? "done" : k === idx ? "cur" : ""}"></i>`)}</div>
      <div class="quiz-msg"><div class="from">${t("learn.from")}: ${L(q.from)}</div>${L(q.msg)}</div>
      <div class="quiz-opts"><button class="btn btn-outline" data-ans="scam">${t("learn.scam")}</button><button class="btn btn-outline" data-ans="safe">${t("learn.safe")}</button></div>
      <div id="q-feedback" aria-live="polite"></div>`,
    );
    $$("[data-ans]", card).forEach((b) =>
      b.addEventListener("click", () => {
        const pickedScam = b.dataset.ans === "scam";
        const right = pickedScam === q.scam;
        if (right) score += 1;
        $$("[data-ans]", card).forEach((x) => {
          x.disabled = true;
          if ((x.dataset.ans === "scam") === q.scam) x.classList.add("correct");
          else if (x === b) x.classList.add("wrong");
        });
        mount(
          $("#q-feedback", card),
          html`<div class="${right ? "form-ok" : "form-error"}" style="margin-top:14px"><b>${right ? t("learn.correct") : t("learn.wrong")}</b> ${L(q.why)}</div>
          <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn btn-primary" id="q-next">${idx + 1 < order.length ? t("learn.next") : t("learn.finish")} ${icon("arrowRight")}</button></div>`,
        );
        $("#q-next", card).addEventListener("click", () => {
          idx += 1;
          if (idx < order.length) ask();
          else finish();
        });
        $("#q-next", card).focus();
      }),
    );
  };
  const finish = async () => {
    let extra = "";
    if (state.user) {
      try {
        const out = await api.post("/api/me/quiz", { score, total: order.length });
        state.user.points = out.points;
        emit("fs:auth");
        if (out.gained) extra = t("learn.earned", { n: out.gained });
        if (out.badges?.length) toast(`🏅 ${out.badges.join(", ")}`);
      } catch {
        /* points are a bonus */
      }
    }
    mount(
      card,
      html`<div class="center"><div style="font-size:2.6rem">${score === order.length ? "🏆" : score >= order.length * 0.7 ? "🎉" : "💪"}</div>
      <h2 class="h-section" style="font-size:2rem;margin:8px 0">${t("learn.score", { s: score, t: order.length })}</h2>
      ${extra ? html`<p class="chip brand">${extra}</p>` : ""}
      ${!state.user ? html`<p class="small muted">${t("common.signinText")}</p>` : ""}
      <div class="row" style="justify-content:center"><button class="btn btn-primary" id="q-again">${t("learn.again")}</button><a class="btn btn-outline" href="#/dost">${t("nav.dost")}</a></div></div>`,
    );
    $("#q-again", card).addEventListener("click", start);
  };
  card.addEventListener("click", (e) => {
    if (e.target.closest("#q-start")) start();
  });
  intro();
  $("#jump-quiz", root).addEventListener("click", (e) => {
    e.preventDefault();
    $("#quiz", root).scrollIntoView({ behavior: "smooth" });
  });
}
