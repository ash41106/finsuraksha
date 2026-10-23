import { state, emit } from "../state.js";
import { api } from "../api.js";
import { t, L } from "../i18n.js";
import { html, mount, icon, $, modal, el, toast } from "../ui.js";
import { MODULES } from "../content.js";
import { mountQuiz } from "../quiz-game.js";

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
    <section class="section tight" id="quiz"><div class="container"><div class="qg-card" id="quiz-card"></div></div></section>`,
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

  const openModule = (id) => {
    const m = MODULES.find((x) => x.id === id);
    if (!m) return;
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
  };
  mods.addEventListener("click", (e) => {
    const b = e.target.closest("[data-mod]");
    if (b) openModule(b.dataset.mod);
  });

  // ---- Spot the Scam game ----
  const cleanupQuiz = mountQuiz($("#quiz-card", root), { openModule });
  $("#jump-quiz", root).addEventListener("click", (e) => {
    e.preventDefault();
    $("#quiz", root).scrollIntoView({ behavior: "smooth" });
  });
  return cleanupQuiz;
}
