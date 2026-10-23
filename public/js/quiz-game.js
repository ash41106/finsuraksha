// Spot the Scam: a phone simulator game. Each message arrives on a realistic
// app screen; the player swipes (or taps / uses arrow keys) Scam or Safe, then
// hunts the red flags hidden in the message for bonus points.
import { state, emit } from "./state.js";
import { api } from "./api.js";
import { t, L } from "./i18n.js";
import { html, mount, raw, icon, $, $$, el, toast, copyText, initials } from "./ui.js";
import { drawRound } from "./quiz-data.js";

const TIME_LIMIT = 25; // seconds per message in Challenge mode
const LIVES = 3;
const PTS = { right: 10, combo: 5, flag: 3, eagle: 5, speedMax: 5 };
const RANK_EMOJI = ["🌱", "🔍", "🦅", "🛡️"];

const APPS = {
  whatsapp: { icon: "💬", en: "WhatsApp", hi: "WhatsApp" },
  telegram: { icon: "✈️", en: "Telegram", hi: "Telegram" },
  sms: { icon: "✉️", en: "SMS", hi: "SMS" },
  instagram: { icon: "📸", en: "Instagram DM", hi: "Instagram DM" },
  email: { icon: "📧", en: "Email", hi: "ईमेल" },
  upi: { icon: "💳", en: "UPI payment", hi: "UPI भुगतान" },
  call: { icon: "📞", en: "Phone call", hi: "फ़ोन कॉल" },
  app: { icon: "📲", en: "App message", hi: "ऐप संदेश" },
  web: { icon: "🌐", en: "Website", hi: "वेबसाइट" },
  ad: { icon: "📣", en: "Social media ad", hi: "सोशल मीडिया विज्ञापन" },
};

const LOBBY_NOTIFS = [
  { icon: "💬", from: "IPO Club", text: { en: "Guaranteed allotment! Download our app…", hi: "पक्का अलॉटमेंट! हमारा ऐप डाउनलोड करें…" } },
  { icon: "✉️", from: "VM-DEMATX", text: { en: "Your demat a/c will be BLOCKED today…", hi: "आपका डीमैट खाता आज ब्लॉक होगा…" } },
  { icon: "🏦", from: "JD-MYBANK", text: { en: "OTP for your login. Do not share it…", hi: "लॉगिन का OTP। किसी से साझा न करें…" }, ok: true },
  { icon: "📞", from: "'CBI Officer'", text: { en: "Incoming video call…", hi: "वीडियो कॉल आ रही है…" } },
];

const SIG =
  '<svg viewBox="0 0 34 12" width="30" height="11" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="18" y="1.2" width="14" height="9.6" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="20" y="3.2" width="9" height="5.6" rx="1.2"/></svg>';

const saved = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage blocked - lasts for this visit only */
    }
  },
};
const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? 0 : ms));
const lang = () => (state.lang === "hi" ? "hi" : "en");
const trimPunct = (s) => s.replace(/[\s.,;:!?।]+$/u, "");

// Message text as word tokens; words inside a marked phrase carry its index.
function tokens(q) {
  const text = q.text[lang()];
  const spans = q.marks
    .map((m, i) => ({ at: text.indexOf(m[lang()]), len: m[lang()].length, i }))
    .filter((s) => s.at >= 0)
    .sort((a, b) => a.at - b.at);
  const parts = [];
  let pos = 0;
  for (const s of spans) {
    if (s.at < pos) continue;
    if (s.at > pos) parts.push({ text: text.slice(pos, s.at), mark: -1 });
    parts.push({ text: text.slice(s.at, s.at + s.len), mark: s.i });
    pos = s.at + s.len;
  }
  if (pos < text.length) parts.push({ text: text.slice(pos), mark: -1 });
  return parts.map((p) =>
    p.text.split(/(\s+)/).map((w) => {
      if (!w) return "";
      if (/^\s+$/.test(w)) return p.mark < 0 ? w : html`<span class="gap" data-m="${p.mark}">${w}</span>`;
      return html`<span class="tok" data-m="${p.mark}">${w}</span>`;
    }),
  );
}

// Groups and channels get an icon; people and firms get initials ("II" would
// look like a pause button, so repeated letters collapse to one).
function avatar(name, q) {
  if (q && /group|ग्रुप/.test(q.meta?.en || "")) return "👥";
  if (q && /subscribers/.test(q.meta?.en || "")) return "📢";
  const clean = String(name).replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
  const ini = initials(clean || "?") || "?";
  return ini.length === 2 && ini[0] === ini[1] ? ini[0] : ini;
}

function phoneHtml(q) {
  const name = L(q.sender);
  const meta = q.meta ? L(q.meta) : "";
  const msg = html`<div class="ph-msg">${tokens(q)}</div>`;
  const typing = html`<div class="ph-typing" aria-hidden="true"><i></i><i></i><i></i></div>`;
  let head = "";
  let body;
  switch (q.app) {
    case "email":
      head = html`<div class="ph-bar"><span class="ph-back" aria-hidden="true">‹</span><b>${t("quiz.inbox")}</b></div>`;
      body = html`<div class="ph-body ph-mail"><div class="mail-from"><span class="ph-av">${avatar(name)}</span><div><b>${name}</b><span>${L(q.subject)}</span></div><time>${q.time}</time></div>${typing}${msg}</div>`;
      break;
    case "upi":
      head = html`<div class="ph-bar"><span class="ph-back" aria-hidden="true">‹</span><b>${q.scam ? t("quiz.request") : t("quiz.paying")}</b></div>`;
      body = html`<div class="ph-body ph-upi">
        <div class="upi-payee"><span class="ph-av big">${avatar(name)}</span><b>${name}</b><span class="upi-id">${meta}${q.valid ? html` <span class="upi-ok" title="Verified @valid handle">👍</span>` : ""}</span></div>
        <div class="upi-amt">${q.amount}</div>${typing}<div class="upi-note">${msg}</div>
        <div class="upi-btn" aria-hidden="true">${q.scam ? t("quiz.enterPin") : t("quiz.payBtn", { a: q.amount })}</div></div>`;
      break;
    case "call":
      body = html`<div class="ph-body ph-call">
        <div class="call-who"><span class="ph-av big">${avatar(name)}</span><b>${name}</b><span>${meta}</span></div>
        <div class="call-say"><span class="call-lbl">${icon("volume")} ${t("quiz.callSays")}</span>${typing}${msg}</div>
        <div class="call-btns" aria-hidden="true"><span class="c-mute">${icon("mic")}</span><span class="c-end">${icon("phone")}</span></div></div>`;
      break;
    case "web":
      head = html`<div class="ph-bar web-bar"><span class="url">${icon("lock")} ${name}</span></div>`;
      body = html`<div class="ph-body ph-web"><div class="web-h">${meta}</div>${typing}${msg}</div>`;
      break;
    case "ad":
      head = html`<div class="ph-bar"><span class="ph-av">${avatar(name)}</span><div class="ph-who"><b>${name}</b><span>${meta}</span></div></div>`;
      body = html`<div class="ph-body ph-ad"><div class="ad-video" aria-hidden="true"><span class="ad-play">▶</span><span class="ad-live">${t("quiz.live")}</span></div>${typing}${msg}<div class="ad-cta" aria-hidden="true">${t("quiz.adCta")}</div></div>`;
      break;
    default:
      head = html`<div class="ph-bar"><span class="ph-back" aria-hidden="true">‹</span><span class="ph-av">${avatar(name, q)}</span><div class="ph-who"><b>${name}</b><span>${meta}</span></div></div>`;
      body = html`<div class="ph-body ph-chat"><div class="bubble-in">${typing}${msg}<time>${q.time}</time></div></div>`;
  }
  return html`<div class="phone sk-${q.app}">
    <div class="ph-status"><span>${q.time}</span><i class="ph-notch"></i><span class="ph-sig">${raw(SIG)}</span></div>
    ${head}${body}
    <div class="ph-stamp scam" aria-hidden="true">${t("quiz.dragLeft")}</div><div class="ph-stamp safe" aria-hidden="true">${t("quiz.dragRight")}</div>
  </div>`;
}

export function mountQuiz(root, { openModule } = {}) {
  const S = {
    phase: "lobby",
    mode: saved.get("fs_quiz_mode", "relaxed") === "challenge" ? "challenge" : "relaxed",
    round: [],
    idx: 0,
    score: 0,
    shown: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    lives: LIVES,
    flagsFound: 0,
    flagsTotal: 0,
    answers: [],
    step: "decide",
    hunting: false,
    found: new Set(),
    left: TIME_LIMIT,
    timer: null,
    ticking: false,
    alive: true,
  };
  root.classList.add("qg");

  const stopTimer = () => {
    clearInterval(S.timer);
    S.timer = null;
  };
  const announce = (text) => {
    const live = $("#qg-live", root);
    if (live) live.textContent = text;
  };

  // ---- Lobby ---------------------------------------------------------------
  function renderLobby() {
    stopTimer();
    S.phase = "lobby";
    root.classList.remove("hunting");
    const best = saved.get("fs_quiz_best", 0);
    const [first, ...rest] = t("quiz.title").split(" ");
    mount(
      root,
      html`<div class="qg-lobby">
        <div class="qg-art" aria-hidden="true">
          <div class="phone mini sk-lock">
            <div class="ph-status"><span>9:41</span><i class="ph-notch"></i><span class="ph-sig">${raw(SIG)}</span></div>
            <div class="lock-time">9:41</div>
            ${LOBBY_NOTIFS.map((n, i) => html`<div class="notif n${i + 1} ${n.ok ? "ok" : ""}"><span class="ni">${n.icon}</span><div><b>${n.from}</b><span>${L(n.text)}</span></div></div>`)}
          </div>
          <span class="qg-badge b1">🚩</span><span class="qg-badge b2">✅</span><span class="qg-badge b3">🔍</span>
        </div>
        <div class="qg-copy">
          <span class="crumbs">${icon("target")}<b>${t("quiz.kicker")}</b></span>
          <h2 class="h-section">${first} <span class="soft">${rest.join(" ")}</span></h2>
          <p class="lead">${t("quiz.tagline")}</p>
          <ol class="qg-how">${["how1", "how2", "how3"].map((k, i) => html`<li><span class="n">${i + 1}</span><span>${t(`quiz.${k}`)}</span></li>`)}</ol>
          <div class="qg-modes" role="group" aria-label="${t("quiz.modeLabel")}">
            ${[
              ["relaxed", "🧘", t("quiz.relaxedHint")],
              ["challenge", "⚡", t("quiz.challengeHint", { s: TIME_LIMIT })],
            ].map(([m, e, hint]) => html`<button type="button" aria-pressed="${S.mode === m}" data-mode="${m}"><span class="me" aria-hidden="true">${e}</span><span><b>${t(`quiz.${m}`)}</b><small>${hint}</small></span></button>`)}
          </div>
          <div class="row qg-start-row">
            <button class="btn btn-primary btn-lg" type="button" id="qg-start">${icon("bolt")}${t("quiz.start")}</button>
            ${best ? html`<span class="small muted qg-best">${icon("trophy")} ${t("quiz.best", { n: best })}</span>` : ""}
          </div>
        </div>
      </div>`,
    );
    $$("[data-mode]", root).forEach((b) =>
      b.addEventListener("click", () => {
        S.mode = b.dataset.mode;
        saved.set("fs_quiz_mode", S.mode);
        $$("[data-mode]", root).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      }),
    );
    $("#qg-start", root).addEventListener("click", start);
  }

  function start() {
    Object.assign(S, { phase: "play", round: drawRound(), idx: 0, score: 0, shown: 0, correct: 0, streak: 0, bestStreak: 0, lives: LIVES, flagsFound: 0, flagsTotal: 0, answers: [] });
    renderPlay();
    showMessage();
    root.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  }

  // ---- Play screen -----------------------------------------------------------
  function renderPlay() {
    mount(
      root,
      html`<div class="qg-hud">
        <div class="qg-progress"><span class="qg-count" id="qg-count"></span><div class="qg-dots" id="qg-dots" aria-hidden="true"></div></div>
        <div class="qg-stats">
          <span class="qg-streak hidden" id="qg-streak"></span>
          ${S.mode === "challenge" ? html`<span class="qg-lives" id="qg-lives"></span><span class="qg-timer" id="qg-timer" role="timer"></span>` : ""}
          <span class="qg-score" id="qg-score-box"><small>${t("quiz.score")}</small><b id="qg-score">0</b></span>
          <button class="icon-btn qg-quit" type="button" id="qg-quit" aria-label="${t("quiz.quit")}" title="${t("quiz.quit")}">${icon("x")}</button>
        </div>
      </div>
      <div class="qg-play">
        <div class="qg-stage" id="qg-stage">
          <div class="qg-flash" id="qg-flash"></div>
          <div class="ph-wrap" id="qg-phone"></div>
        </div>
        <div class="qg-actions" id="qg-actions"></div>
        <p class="qg-hint xs muted" id="qg-hint">${t("quiz.swipe")}<span class="qg-keys"> · ${t("quiz.keys")}</span></p>
        <div class="qg-panel" id="qg-panel"></div>
      </div>
      <div class="sr-only" aria-live="assertive" id="qg-live"></div>`,
    );
    $("#qg-quit", root).addEventListener("click", renderLobby);
    updateHud();
  }

  function updateHud() {
    const n = S.round.length;
    $("#qg-count", root).textContent = t("quiz.round", { i: Math.min(S.idx + 1, n), n });
    mount(
      $("#qg-dots", root),
      html`${S.round.map((_, k) => {
        const a = S.answers[k];
        return html`<i class="${a ? (a.right ? "ok" : "bad") : k === S.idx ? "cur" : ""}"></i>`;
      })}`,
    );
    const streak = $("#qg-streak", root);
    streak.classList.toggle("hidden", S.streak < 2);
    streak.textContent = `🔥 ${t("quiz.streak", { n: S.streak })}`;
    const lives = $("#qg-lives", root);
    if (lives) {
      lives.setAttribute("aria-label", `${t("quiz.lives")}: ${S.lives}/${LIVES}`);
      mount(lives, html`${Array.from({ length: LIVES }, (_, k) => html`<span class="${k < S.lives ? "" : "lost"}" aria-hidden="true">${k < S.lives ? "❤️" : "🖤"}</span>`)}`);
    }
  }

  function tickScore() {
    const node = $("#qg-score", root);
    if (!node) return;
    const box = $("#qg-score-box", root);
    box.classList.remove("bump");
    void box.offsetWidth;
    box.classList.add("bump");
    if (reduced()) {
      S.shown = S.score;
      node.textContent = S.score;
      return;
    }
    if (S.ticking) return;
    S.ticking = true;
    const step = () => {
      if (!S.alive || !node.isConnected || S.shown === S.score) {
        S.ticking = false;
        return;
      }
      const diff = S.score - S.shown;
      S.shown += Math.sign(diff) * Math.max(1, Math.ceil(Math.abs(diff) / 6));
      node.textContent = S.shown;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function addPoints(n, kind = "", delay = 0) {
    S.score += n;
    tickScore();
    const label = { combo: `🔥 ${t("quiz.combo")}`, speed: `⚡ ${t("quiz.speed")}`, flag: "🚩", eagle: `🦅 ${t("quiz.eagle")}` }[kind] || "";
    setTimeout(() => {
      const stage = $("#qg-stage", root);
      if (!S.alive || !stage) return;
      const f = el(html`<span class="qg-float ${kind}" aria-hidden="true">+${n}${label ? ` ${label}` : ""}</span>`);
      stage.appendChild(f);
      setTimeout(() => f.remove(), 1200);
    }, reduced() ? 0 : delay);
  }

  function burst(count = 18) {
    if (reduced()) return;
    const stage = $("#qg-stage", root) || root;
    const box = el(html`<div class="qg-confetti" aria-hidden="true"></div>`);
    const colors = ["#8a4a2b", "#13875c", "#cf8a2a", "#d8b9a4", "#e8b04b", "#a8382a"];
    for (let i = 0; i < count; i++) {
      const p = document.createElement("i");
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const d = 70 + Math.random() * 110;
      p.style.setProperty("--dx", `${Math.cos(a) * d}px`);
      p.style.setProperty("--dy", `${Math.sin(a) * d - 50}px`);
      p.style.setProperty("--r", `${Math.random() * 600 - 300}deg`);
      p.style.background = colors[i % colors.length];
      box.appendChild(p);
    }
    stage.appendChild(box);
    setTimeout(() => box.remove(), 1300);
  }

  function setActions(kind) {
    const box = $("#qg-actions", root);
    $("#qg-hint", root).classList.toggle("hidden", kind !== "decide");
    root.classList.toggle("step-reveal", kind !== "decide");
    if (kind === "decide") {
      mount(
        box,
        html`<button class="qg-btn scam" type="button" data-say="scam"><span class="k" aria-hidden="true">←</span><span aria-hidden="true">🚩</span> ${t("quiz.scam")}</button>
        <button class="qg-btn safe" type="button" data-say="safe"><span aria-hidden="true">✅</span> ${t("quiz.safe")}<span class="k" aria-hidden="true">→</span></button>`,
      );
      $$("[data-say]", box).forEach((b) => b.addEventListener("click", () => decide(b.dataset.say)));
      return;
    }
    const last = S.idx + 1 >= S.round.length || S.lives <= 0;
    mount(
      box,
      html`${S.hunting ? html`<button class="btn btn-outline" type="button" id="qg-reveal">${icon("eye")}${t("quiz.revealRest")}</button>` : ""}
      <button class="btn btn-primary btn-lg" type="button" id="qg-next">${last ? t("quiz.seeResults") : t("quiz.next")} ${icon("arrowRight")}</button>`,
    );
    $("#qg-next", box).addEventListener("click", next);
    $("#qg-reveal", box)?.addEventListener("click", () => endHunt(true));
  }

  async function showMessage() {
    stopTimer();
    const q = S.round[S.idx];
    S.step = "decide";
    S.hunting = false;
    S.found = new Set();
    S.left = TIME_LIMIT;
    root.classList.remove("hunting");
    updateHud();
    // After tapping Next at the bottom on a phone, bring the new message into view.
    if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    const app = APPS[q.app];
    mount($("#qg-flash", root), html`<span class="qg-app"><span aria-hidden="true">${app.icon}</span>${L(app)}</span>`);
    mount($("#qg-phone", root), phoneHtml(q));
    const phone = $(".phone", root);
    phone.classList.add("enter", "typing");
    setActions("decide");
    mount(
      $("#qg-panel", root),
      html`<div class="qg-ask">
        <h3>${t("quiz.ask")}</h3>
        <p class="muted">${t("quiz.askText")}</p>
        ${S.mode === "relaxed"
          ? html`<div class="qg-clues"><div class="label">${icon("search")} ${t("quiz.clues")}</div><ul>${["clue1", "clue2", "clue3", "clue4"].map((k) => html`<li>${t(`quiz.${k}`)}</li>`)}</ul></div>`
          : html`<p class="small muted">⚡ ${t("quiz.challengeHint", { s: TIME_LIMIT })}</p>`}
      </div>`,
    );
    bindSwipe(phone);
    bindHunt(phone);
    await wait(800);
    if (!S.alive || S.round[S.idx] !== q || S.step !== "decide") return;
    phone.classList.remove("typing");
    announce(`${t("quiz.round", { i: S.idx + 1, n: S.round.length })}. ${APPS[q.app][lang()]}, ${L(q.sender)}: ${q.text[lang()]}`);
    if (S.mode === "challenge") startTimer();
  }

  function startTimer() {
    S.left = TIME_LIMIT;
    drawTimer();
    S.timer = setInterval(() => {
      S.left -= 1;
      drawTimer();
      if (S.left <= 0) {
        stopTimer();
        decide(null);
      }
    }, 1000);
  }

  function drawTimer() {
    const node = $("#qg-timer", root);
    if (!node) return;
    const c = 2 * Math.PI * 15;
    const left = Math.max(0, S.left);
    node.classList.toggle("low", left <= 5);
    node.setAttribute("aria-label", t("quiz.timeLeft", { s: left }));
    mount(
      node,
      html`<svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--surface-3)" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="${((left / TIME_LIMIT) * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 18 18)"/></svg><b>${left}</b>`,
    );
  }

  // ---- Deciding --------------------------------------------------------------
  function bindSwipe(phone) {
    let sx = 0;
    let sy = 0;
    let dx = 0;
    let dragging = false;
    let pid = null;
    phone.addEventListener("pointerdown", (e) => {
      if (S.step !== "decide" || e.button > 0) return;
      sx = e.clientX;
      sy = e.clientY;
      dx = 0;
      dragging = false;
      pid = e.pointerId;
    });
    phone.addEventListener("pointermove", (e) => {
      if (pid !== e.pointerId || S.step !== "decide") return;
      const mx = e.clientX - sx;
      const my = e.clientY - sy;
      if (!dragging) {
        if (Math.abs(mx) < 10 || Math.abs(mx) < Math.abs(my)) return;
        dragging = true;
        phone.setPointerCapture?.(pid);
        phone.classList.add("dragging");
      }
      dx = mx;
      phone.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
      $(".ph-stamp.scam", phone).style.opacity = String(Math.min(1, Math.max(0, -dx / 110)));
      $(".ph-stamp.safe", phone).style.opacity = String(Math.min(1, Math.max(0, dx / 110)));
    });
    const end = (e) => {
      if (pid !== e.pointerId) return;
      pid = null;
      if (!dragging) return;
      dragging = false;
      phone.classList.remove("dragging");
      if (Math.abs(dx) > 100 && S.step === "decide") decide(dx < 0 ? "scam" : "safe");
      else resetDrag(phone);
    };
    phone.addEventListener("pointerup", end);
    phone.addEventListener("pointercancel", end);
  }

  function resetDrag(phone) {
    if (!phone) return;
    phone.style.transform = "";
    $$(".ph-stamp", phone).forEach((s) => (s.style.opacity = ""));
  }

  function decide(said) {
    if (S.phase !== "play" || S.step !== "decide") return;
    stopTimer();
    S.step = "reveal";
    const q = S.round[S.idx];
    const phone = $(".phone", root);
    phone.classList.remove("typing", "enter");
    resetDrag(phone);
    const right = said !== null && (said === "scam") === q.scam;
    S.answers[S.idx] = { q, said, right };
    if (said) phone.classList.add(said === "scam" ? "stamp-scam" : "stamp-safe");
    phone.classList.add(right ? "is-right" : "is-wrong");
    if (q.scam) S.flagsTotal += q.marks.length;
    if (right) {
      S.correct += 1;
      S.streak += 1;
      S.bestStreak = Math.max(S.bestStreak, S.streak);
      addPoints(PTS.right);
      let delay = 320;
      if (S.streak >= 3) {
        addPoints(PTS.combo, "combo", delay);
        delay += 320;
      }
      if (S.mode === "challenge") {
        const speed = Math.ceil((S.left / TIME_LIMIT) * PTS.speedMax);
        if (speed > 0) addPoints(speed, "speed", delay);
      }
      burst(14);
    } else {
      S.streak = 0;
      if (S.mode === "challenge") S.lives -= 1;
      if (window.matchMedia?.("(pointer: coarse)").matches) {
        try {
          navigator.vibrate?.(90);
        } catch {
          /* not supported */
        }
      }
    }
    updateHud();
    renderReveal(q, said, right);
  }

  function renderReveal(q, said, right) {
    let cls;
    let emoji;
    let title;
    let sub;
    if (said === null) [cls, emoji, title, sub] = ["bad", "⏰", t("quiz.timeout"), q.scam ? t("quiz.timeoutScam") : t("quiz.timeoutSafe")];
    else if (q.scam && right) [cls, emoji, title, sub] = ["ok", "🎯", t("quiz.rightScam"), t("quiz.huntText", { n: q.marks.length })];
    else if (q.scam) [cls, emoji, title, sub] = ["bad", "😬", t("quiz.wrongScam"), t("quiz.wrongScamText")];
    else if (right) [cls, emoji, title, sub] = ["ok", "✅", t("quiz.rightSafe"), t("quiz.safeText")];
    else [cls, emoji, title, sub] = ["warn", "🤔", t("quiz.wrongSafe"), t("quiz.safeText")];
    const hunt = q.scam && right;
    const youSaid = said ? html`<span class="qg-said">${said === "scam" ? t("quiz.sayScam") : t("quiz.saySafe")}</span>` : "";

    mount($("#qg-flash", root), html`<span class="qg-verdict-pill ${cls}"><span aria-hidden="true">${emoji}</span>${title}</span>`);
    mount(
      $("#qg-panel", root),
      html`<div class="qg-verdict ${cls}"><span class="vi" aria-hidden="true">${emoji}</span><div><b>${title}</b>${youSaid}<span>${sub}</span></div></div>
      ${hunt
        ? html`<div class="qg-hunt"><b class="small" id="qg-found">${t("quiz.found", { f: 0, n: q.marks.length })}</b><div class="qg-meter"><i id="qg-meter"></i></div><p class="xs muted hidden" id="qg-miss">${t("quiz.miss")}</p></div>`
        : ""}
      <ol class="qg-notes" id="qg-notes"></ol>
      <div class="qg-why"><p>${L(q.why)}</p><p class="qg-tip"><b>${icon("shieldCheck")} ${t("quiz.tip")}:</b> ${L(q.tip)}</p>
        ${q.module && openModule ? html`<button class="link-btn small" type="button" id="qg-guide">${icon("book")} ${t("quiz.readGuide")}</button>` : ""}</div>
      ${S.lives <= 0 ? html`<div class="form-error">💔 ${t("quiz.outOfLives")}</div>` : ""}`,
    );
    $("#qg-guide", root)?.addEventListener("click", () => openModule(q.module));
    if (hunt) startHunt();
    else revealAll(q, q.scam ? "shown" : "good");
    setActions("reveal");
    announce(`${title} ${sub}`);
    if (!hunt) $("#qg-next", root)?.focus({ preventScroll: true });
  }

  // ---- Red-flag hunt ---------------------------------------------------------
  function startHunt() {
    S.hunting = true;
    root.classList.add("hunting");
    $$(".ph-msg .tok", root).forEach((tk) => {
      tk.setAttribute("role", "button");
      tk.tabIndex = 0;
    });
    // Focus the whole message (not its first word, which would look like a hint).
    const box = $(".ph-msg", root);
    box.tabIndex = -1;
    box.focus({ preventScroll: true });
  }

  function endHunt(revealRest) {
    if (!S.hunting) return;
    const q = S.round[S.idx];
    S.hunting = false;
    root.classList.remove("hunting");
    $$(".ph-msg .tok", root).forEach((tk) => {
      tk.removeAttribute("role");
      tk.removeAttribute("tabindex");
    });
    if (revealRest) revealAll(q, "shown");
    $("#qg-miss", root)?.classList.add("hidden");
    setActions("reveal");
    $("#qg-next", root)?.focus({ preventScroll: true });
  }

  function bindHunt(phone) {
    const box = $(".ph-msg", phone);
    const hit = (tk) => {
      if (!S.hunting || !tk) return;
      const q = S.round[S.idx];
      const m = Number(tk.dataset.m);
      if (m < 0) {
        tk.classList.remove("miss");
        void tk.offsetWidth;
        tk.classList.add("miss");
        $("#qg-miss", root)?.classList.remove("hidden");
        return;
      }
      if (S.found.has(m)) return;
      S.found.add(m);
      S.flagsFound += 1;
      markPhrase(m, "hit", S.found.size);
      addNote(q, m, S.found.size, "hit");
      addPoints(PTS.flag, "flag");
      const f = S.found.size;
      const n = q.marks.length;
      $("#qg-found", root).textContent = t("quiz.found", { f, n });
      $("#qg-meter", root).style.width = `${(f / n) * 100}%`;
      announce(`${trimPunct(q.marks[m][lang()])}. ${L(q.marks[m].why)}`);
      if (f === n) {
        addPoints(PTS.eagle, "eagle", 380);
        burst(28);
        mount($("#qg-flash", root), html`<span class="qg-verdict-pill ok"><span aria-hidden="true">🦅</span>${t("quiz.allFound")}</span>`);
        endHunt(false);
      }
    };
    box.addEventListener("click", (e) => hit(e.target.closest(".tok")));
    box.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.closest(".tok")) {
        e.preventDefault();
        hit(e.target.closest(".tok"));
      }
    });
  }

  function markPhrase(m, cls, n) {
    $$(`.ph-msg .gap[data-m="${m}"]`, root).forEach((g) => g.classList.add(cls));
    const toks = $$(`.ph-msg .tok[data-m="${m}"]`, root);
    toks.forEach((tk) => tk.classList.add(cls));
    toks.at(-1)?.insertAdjacentHTML("beforeend", `<sup class="tok-n">${Number(n)}</sup>`);
  }

  function addNote(q, m, n, kind) {
    const mark = q.marks[m];
    $("#qg-notes", root)?.appendChild(el(html`<li class="${kind}"><span class="n">${n}</span><div><b>“${trimPunct(mark[lang()])}”</b><span>${L(mark.why)}</span></div></li>`));
  }

  function revealAll(q, cls) {
    let n = S.found.size;
    q.marks.forEach((_, m) => {
      if (S.found.has(m)) return;
      n += 1;
      markPhrase(m, cls, n);
      addNote(q, m, n, cls);
    });
  }

  async function next() {
    const phone = $(".phone", root);
    const a = S.answers[S.idx];
    S.hunting = false;
    root.classList.remove("hunting");
    if (phone && !reduced()) {
      phone.classList.add(a?.said === "safe" ? "fly-right" : "fly-left");
      await wait(260);
    }
    if (!S.alive) return;
    S.idx += 1;
    if (S.idx >= S.round.length || S.lives <= 0) finish();
    else showMessage();
  }

  // ---- Results ---------------------------------------------------------------
  async function finish() {
    stopTimer();
    S.phase = "done";
    root.classList.remove("hunting");
    const total = S.round.length;
    const acc = S.correct / total;
    const rank = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.5 ? 1 : 0;
    const best = saved.get("fs_quiz_best", 0);
    const newBest = S.score > best;
    if (newBest) saved.set("fs_quiz_best", S.score);
    const c = 2 * Math.PI * 22;
    mount(
      root,
      html`<div class="qg-results">
        <div class="qg-res-hero">
          <div class="qg-medal r${rank}" aria-hidden="true">${RANK_EMOJI[rank]}</div>
          <div class="qg-res-copy">
            ${newBest ? html`<span class="chip ok">🎉 ${t("quiz.newBest")}</span>` : ""}
            <h3>${t("quiz.ranks")[rank]}</h3>
            <p class="muted">${t("quiz.rankText")[rank]}</p>
          </div>
          <div class="qg-final"><b id="qg-final">${reduced() ? S.score : 0}</b><small>${t("quiz.pts")}</small></div>
        </div>
        ${S.lives <= 0 ? html`<div class="form-error">💔 ${t("quiz.outOfLives")}</div>` : ""}
        <div class="qg-tiles">
          <div class="qg-tile"><svg viewBox="0 0 52 52" width="52" height="52" aria-hidden="true"><circle cx="26" cy="26" r="22" fill="none" stroke="var(--surface-3)" stroke-width="6"/><circle cx="26" cy="26" r="22" fill="none" stroke="var(--risk-low)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(acc * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 26 26)"/></svg><div><b>${S.correct}/${total}</b><span>${t("quiz.accuracy")}</span></div></div>
          <div class="qg-tile"><span class="ti" aria-hidden="true">🚩</span><div><b>${S.flagsFound}/${S.flagsTotal}</b><span>${t("quiz.flagsFound")}</span></div></div>
          <div class="qg-tile"><span class="ti" aria-hidden="true">🔥</span><div><b>${S.bestStreak}</b><span>${t("quiz.bestStreak")}</span></div></div>
        </div>
        <div class="qg-points small" id="qg-points"></div>
        <details class="qg-review"><summary>${icon("book")} ${t("quiz.review")} (${S.answers.length})</summary>
          <ol>${S.answers.map(
            (a) => html`<li class="${a.right ? "ok" : "bad"}"><span class="ri">${a.right ? icon("check") : icon("x")}</span><div>
              <b><span aria-hidden="true">${APPS[a.q.app].icon}</span> ${L(a.q.sender)}</b>
              <span class="xs muted">${t("quiz.youSaid")}: ${a.said ? (a.said === "scam" ? t("quiz.scam") : t("quiz.safe")) : t("quiz.noAnswer")} · ${t("quiz.was")}: ${a.q.scam ? t("quiz.scam") : t("quiz.genuine")}</span>
              <p class="small">${L(a.q.why)}</p></div></li>`,
          )}</ol>
        </details>
        <div class="row qg-res-actions">
          <button class="btn btn-primary btn-lg" type="button" id="qg-again">${icon("refresh")}${t("quiz.again")}</button>
          <button class="btn btn-outline" type="button" id="qg-share">${icon("share")}${t("quiz.share")}</button>
          <a class="btn btn-ghost" href="#/dost">${icon("chat")}${t("nav.dost")}</a>
        </div>
      </div>`,
    );
    $("#qg-again", root).addEventListener("click", start);
    $("#qg-share", root).addEventListener("click", async () => {
      const text = t("quiz.shareText", { s: S.score, a: Math.round(acc * 100) });
      if (navigator.share) {
        try {
          await navigator.share({ text });
        } catch {
          /* share sheet closed */
        }
        return;
      }
      if (await copyText(text)) toast(t("common.copied"));
    });
    if (!reduced()) {
      const node = $("#qg-final", root);
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 900);
        if (!node.isConnected) return;
        node.textContent = Math.round(S.score * (1 - (1 - p) ** 3));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      if (rank >= 2) setTimeout(() => burst(36), 300);
    }
    $("#qg-again", root).focus({ preventScroll: true });

    const pts = $("#qg-points", root);
    if (!state.user) {
      mount(pts, html`<span class="muted">${t("quiz.signin")}</span> <a href="#/login?next=learn">${t("nav.signin")}</a>`);
      return;
    }
    try {
      const out = await api.post("/api/me/quiz", { score: S.correct, total });
      state.user.points = out.points;
      emit("fs:auth");
      if (out.gained && pts.isConnected) mount(pts, html`<span class="chip brand">${icon("star")} ${t("learn.earned", { n: out.gained })}</span>`);
      if (out.badges?.length) toast(`🏅 ${out.badges.join(", ")}`);
    } catch {
      /* points are a bonus */
    }
  }

  function onKey(e) {
    if (S.phase !== "play" || S.step !== "decide" || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]") || document.querySelector(".modal-backdrop")) return;
    const r = root.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      decide("scam");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      decide("safe");
    }
  }

  document.addEventListener("keydown", onKey);
  renderLobby();
  return () => {
    S.alive = false;
    stopTimer();
    document.removeEventListener("keydown", onKey);
  };
}
