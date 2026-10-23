import { state, savePrefs, go } from "../state.js";
import { api } from "../api.js";
import { t, L } from "../i18n.js";
import { html, mount, icon, $, $$, md, plain, toast, copyText, ring, el, raw } from "../ui.js";
import { CHAT_LANGS, EXAMPLES } from "../content.js";
import { prepareImage, readText, decodeQr, parseUpiUri, speak, stopSpeaking, speechSupported, recognitionSupported, listen } from "../media.js";

const LEVEL_ICON = { high: "alert", medium: "alert", low: "check", unknown: "question", info: "info" };

export async function render(root, { query } = {}) {
  const messages = []; // { role, text, image?, result? }
  let attachment = null; // { dataUrl, canvas, ocr, qr, aiConsent }
  let busy = false;
  let rec = null;
  const langInfo = () => CHAT_LANGS.find((l) => l.code === state.chatLang) || CHAT_LANGS[0];
  const aiOn = Boolean(state.config.aiEnabled);

  mount(
    root,
    html`<section class="page-hero" style="padding-bottom:18px"><div class="blob b1"></div>
      <div class="container" style="position:relative;z-index:1">
        <span class="crumbs">${icon("sparkle")}<b>${t("dost.kicker")}</b></span>
        <h1 class="page-title">${t("dost.titleA")} <span class="soft">${t("dost.titleB")}</span></h1>
        <p class="lead">${t("dost.lead")}</p>
      </div></section>
    <section class="container">
      <div class="dost-layout">
        <div class="chat-shell" id="shell" style="position:relative">
          <div class="chat-head">
            <div class="bot-avatar">${icon("shieldCheck")}</div>
            <div><div class="name">${t("dost.titleA")}</div><div class="xs muted"><span class="status-dot"></span>${t("dost.online")} · ${aiOn ? t("dost.modeAi") : t("dost.modeRules")}</div></div>
            <span class="spacer"></span>
            <label class="sr-only" for="chat-lang">${t("dost.lang")}</label>
            <select class="select" id="chat-lang" style="width:auto;border-radius:999px;padding:8px 12px">${CHAT_LANGS.map((l) => html`<option value="${l.code}" ${l.code === state.chatLang ? "selected" : ""}>${l.name}</option>`)}</select>
            <button class="icon-btn" id="clear" title="${t("dost.clear")}" aria-label="${t("dost.clear")}">${icon("refresh")}</button>
          </div>
          <div class="chat-log" id="log" aria-live="polite"></div>
          <div class="composer">
            <div id="attach"></div>
            <div class="composer-row">
              <label class="round-btn" for="file" title="${t("dost.attach")}" aria-label="${t("dost.attach")}" style="cursor:pointer">${icon("clip")}</label>
              <input type="file" id="file" accept="image/*" class="sr-only" />
              <textarea id="input" rows="1" placeholder="${t("dost.placeholder")}" aria-label="${t("dost.placeholder")}" maxlength="6000"></textarea>
              <button class="round-btn" id="mic" type="button" title="${t("dost.mic")}" aria-label="${t("dost.mic")}">${icon("mic")}</button>
              <button class="round-btn send" id="send" type="button" title="${t("dost.send")}" aria-label="${t("dost.send")}">${icon("send")}</button>
            </div>
            <div class="composer-foot"><span>${icon("lock", "")} ${t("dost.footPrivacy")}</span><span>${t("dost.footEnter")}</span></div>
          </div>
        </div>
        <aside class="stack lg">
          <div class="card side-card"><h4>${icon("search")}${t("dost.sideCan")}</h4>
            <ul class="tick-list">${["can1", "can2", "can3", "can4", "can5"].map((k) => html`<li>${icon("check")}<span>${t(`dost.${k}`)}</span></li>`)}</ul></div>
          <div class="card side-card"><h4>${icon("volume")}${t("dost.lang")}</h4>
            <label class="check"><input type="checkbox" id="autospeak" ${state.autoSpeak ? "checked" : ""} /> <span>${t("dost.autoSpeak")}</span></label>
            ${!aiOn ? html`<p class="xs muted" style="margin:10px 0 0">${state.lang === "hi" ? "नियम-आधारित मोड अंग्रेज़ी और हिंदी में जवाब देता है। बाक़ी भाषाओं के लिए AI मोड चालू करें।" : "Rule-based mode replies in English and Hindi. Turn on AI mode for the other languages."}</p>` : ""}</div>
          <div class="card side-card"><h4>${icon("lock")}${t("dost.sidePrivacy")}</h4>
            <ul class="tick-list">${["priv1", "priv2", "priv3"].map((k) => html`<li>${icon("check")}<span>${t(`dost.${k}`)}</span></li>`)}</ul></div>
          <div class="card card-brown side-card"><h4 style="color:#fff">${icon("phone")}${t("dost.sideHelp")}</h4><p class="small" style="margin:0 0 12px">${t("dost.sideHelpText")}</p>
            <div class="row"><a class="btn btn-light btn-sm" href="tel:1930">1930</a><a class="btn btn-on-brown btn-sm" href="#/help">${t("nav.help")}</a></div></div>
        </aside>
      </div>
    </section>`,
  );

  const log = $("#log", root);
  const input = $("#input", root);
  const shell = $("#shell", root);

  // ---------------------------------------------------------------- rendering
  const scrollDown = () => requestAnimationFrame(() => (log.scrollTop = log.scrollHeight));

  function welcome() {
    const node = el(html`<div class="msg bot"><div class="bot-avatar">${icon("shieldCheck")}</div><div class="bubble">${md(t("dost.welcome"))}
      <div class="small muted" style="margin-top:10px">${t("dost.try")}</div>
      <div class="quick-chips">${["ex1", "ex2", "ex3", "ex4", "ex5", "ex6"].map((k) => html`<button class="chip" type="button" data-ex="${k}">${t(`dost.${k}`)}</button>`)}</div></div></div>`);
    log.appendChild(node);
  }

  function userBubble(m) {
    return el(html`<div class="msg user"><div class="bubble">${m.image ? html`<img src="${m.image}" alt="Attached screenshot" />` : ""}${m.text}</div></div>`);
  }

  function checksBlock(c) {
    const rows = [];
    for (const s of c.sebi || []) {
      if (!s.valid) rows.push(html`<div class="check-row" style="color:var(--risk-high)">${icon("x")}<span>${t("dost.sebiBad", { no: s.normalized })}</span></div>`);
      else if (s.found) rows.push(html`<div class="check-row">${icon("check")}<span>${t("dost.sebiFound", { no: s.normalized, name: s.name, type: state.lang === "hi" ? s.typeHi : s.type })} <a href="${s.officialUrl}" target="_blank" rel="noopener noreferrer">${t("dost.verifyOn")}</a></span></div>`);
      else rows.push(html`<div class="check-row">${icon("info")}<span>${t("dost.sebiNotFound", { no: s.normalized })} <a href="${s.officialUrl}" target="_blank" rel="noopener noreferrer">${t("dost.verifyOn")}</a></span></div>`);
    }
    for (const u of c.upi || []) {
      rows.push(
        u.validHandle
          ? html`<div class="check-row">${icon("check")}<span>${t("dost.upiValid", { vpa: u.vpa, cat: u.category || "" })} <a href="${u.sebiCheckUrl}" target="_blank" rel="noopener noreferrer">${t("dost.checkOn")}</a></span></div>`
          : html`<div class="check-row">${icon("alert")}<span>${t("dost.upiPersonal", { vpa: u.vpa })} <a href="${u.sebiCheckUrl}" target="_blank" rel="noopener noreferrer">${t("dost.checkOn")}</a></span></div>`,
      );
    }
    for (const l of c.links || []) {
      if (l.official) rows.push(html`<div class="check-row">${icon("check")}<span>${t("dost.linkOfficial", { host: l.host })}</span></div>`);
      else if (l.flags.length) rows.push(html`<div class="check-row">${icon("alert")}<span>${t("dost.linkFlags", { host: l.host, flags: l.flags.map((f) => f.id.replace("link_", "").replace(/_/g, " ")).join(", ") })}${l.safeBrowsing === "unsafe" ? " · Google Safe Browsing: unsafe" : ""}</span></div>`);
      else rows.push(html`<div class="check-row">${icon("info")}<span>${t("dost.linkClean", { host: l.host })}${l.safeBrowsing === "clean" ? " · Safe Browsing: clean" : ""}</span></div>`);
    }
    for (const x of c.community || []) rows.push(html`<div class="check-row">${icon("users")}<span>${t("dost.community", { entity: x.display, status: x.status === "verified" ? t("hunt.verified") : t("hunt.pending") })}</span></div>`);
    return rows;
  }

  function botBubble(m) {
    const r = m.result;
    const check = r.mode === "check";
    const lvl = r.level;
    const redList = Object.entries(r.redactions || {})
      .map(([k, n]) => `${k} ×${n}`)
      .join(", ");
    const checkRows = checksBlock(r.checks || {});
    const node = el(html`<div class="msg bot"><div class="bot-avatar">${icon("shieldCheck")}</div><div class="bubble" style="min-width:0;flex:1">
      ${check || r.mode === "support"
        ? html`<div class="verdict ${lvl}">${check ? ring(r.score, lvl) : ""}<div><span class="level-pill level-${lvl}">${icon(LEVEL_ICON[lvl] || "info")}${t(`level.${lvl}`)}</span>${r.headline ? html`<div class="vh">${r.headline}</div>` : ""}</div></div>`
        : ""}
      <div class="reply">${md(r.reply)}</div>
      ${check && r.flags?.length ? html`<div class="label" style="margin-top:12px">${t("dost.redFlags")}</div><ul class="flag-list">${r.flags.map((f) => html`<li><span class="sev-dot sev-${f.sev || "medium"}"></span><div><div class="ft">${f.title}</div><div class="fw">${f.why}</div></div></li>`)}</ul>` : ""}
      ${r.actions?.length ? html`<div class="label" style="margin-top:12px">${t("dost.nextSteps")}</div><ol class="actions-list">${r.actions.map((a) => html`<li>${md(a)}</li>`)}</ol>` : ""}
      ${checkRows.length || (r.ai?.used && r.ruleFlags?.length)
        ? html`<details class="checks"><summary>${icon("search")}${t("dost.checks")}</summary><div class="cbody">${checkRows}
            ${r.ai?.used && r.ruleFlags?.length ? html`<div class="label">${t("dost.ruleFlags")}</div>${r.ruleFlags.map((f) => html`<div class="check-row"><span class="sev-dot sev-${f.sev}" style="margin-top:6px"></span><span>${f.title}</span></div>`)}` : ""}</div></details>`
        : ""}
      <div class="msg-actions">
        ${speechSupported() ? html`<button type="button" data-act="listen">${icon("volume")}<span>${t("dost.listen")}</span></button>` : ""}
        ${check && (lvl === "high" || lvl === "medium") ? html`<button type="button" data-act="report">${icon("flag")}${t("dost.report")}</button>` : ""}
        <button type="button" data-act="copy">${icon("copy")}${t("dost.copy")}</button>
        ${check ? html`<button type="button" data-act="share">${icon("share")}${t("dost.share")}</button>` : ""}
      </div>
      <div class="ai-note">${icon(r.ai?.used ? "sparkle" : "shield")}${r.ai?.used ? t("dost.aiUsed", { model: r.ai.model || "AI" }) : t("dost.rulesUsed")}${r.ai?.note ? ` · ${r.ai.note}` : ""}${r.note ? ` · ${r.note}` : ""}${redList ? ` · ${t("dost.redacted", { list: redList })}` : ""}</div>
    </div></div>`);
    node.__msg = m;
    return node;
  }

  function addMessage(m) {
    messages.push(m);
    const node = m.role === "user" ? userBubble(m) : botBubble(m);
    log.appendChild(node);
    // Long answers: show the start of the reply (the verdict), not its end.
    if (m.role === "user") scrollDown();
    else log.scrollTop = Math.max(0, node.offsetTop - log.offsetTop - 12);
  }

  function typing() {
    const node = el(html`<div class="msg bot" id="typing"><div class="bot-avatar">${icon("shieldCheck")}</div><div class="bubble"><div class="typing"><i></i><i></i><i></i></div><div class="xs muted">${t("dost.thinking")}</div></div></div>`);
    log.appendChild(node);
    scrollDown();
    return node;
  }

  function renderAttachment() {
    const box = $("#attach", root);
    if (!attachment) return mount(box, "");
    const a = attachment;
    mount(
      box,
      html`<div class="attach-preview">
        <img src="${a.dataUrl}" alt="" />
        <div style="flex:1;min-width:0">
          ${a.reading ? html`<div>${t("dost.reading")}</div><div class="progress"><i style="width:${Math.round((a.progress || 0) * 100)}%"></i></div>` : html`<div>${a.ocrFailed ? t("dost.readFail") : t("dost.readDone")}</div>`}
          ${a.qr ? html`<div class="chip brand" style="margin-top:6px">${icon("qr")}${t("dost.qrFound")}: ${a.qr.pa}</div>` : ""}
          ${aiOn && state.config.aiVision ? html`<label class="check" style="margin-top:6px"><input type="checkbox" id="ai-consent" ${a.aiConsent ? "checked" : ""} /> <span class="xs">${t("dost.letAi")}</span></label>` : ""}
        </div>
        <button class="icon-btn" type="button" id="rm-attach" aria-label="${t("dost.remove")}">${icon("x")}</button></div>`,
    );
    $("#rm-attach", root)?.addEventListener("click", () => {
      attachment = null;
      renderAttachment();
    });
    $("#ai-consent", root)?.addEventListener("change", (e) => (attachment.aiConsent = e.target.checked));
  }

  // ---------------------------------------------------------------- actions
  async function send(textOverride) {
    if (busy) return;
    const text = (textOverride ?? input.value).trim();
    const useImage = attachment && aiOn && state.config.aiVision && attachment.aiConsent;
    if (!text && !useImage) {
      input.focus();
      return;
    }
    if (attachment?.reading) {
      toast(t("dost.reading"), "info");
      return;
    }
    busy = true;
    stopSpeaking();
    const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.role === "user" ? m.text : [m.result?.headline, plain(m.result?.reply)].filter(Boolean).join("\n") }));
    addMessage({ role: "user", text: text || "📎", image: attachment?.dataUrl });
    const payload = { message: text, lang: state.chatLang, history };
    if (useImage) {
      payload.image = attachment.dataUrl;
      payload.imageConsent = true;
    }
    input.value = "";
    autosize();
    attachment = null;
    renderAttachment();
    const tnode = typing();
    try {
      const result = await api.post("/api/dost/analyze", payload);
      tnode.remove();
      addMessage({ role: "assistant", text: result.reply, result });
      if (state.autoSpeak) speakFor(log.lastElementChild);
    } catch (err) {
      tnode.remove();
      log.appendChild(el(html`<div class="msg bot"><div class="bot-avatar">${icon("alert")}</div><div class="bubble"><div class="form-error">${err.message}</div></div></div>`));
      scrollDown();
    } finally {
      busy = false;
    }
  }

  async function speakFor(node) {
    const m = node?.__msg;
    if (!m) return;
    const btn = node.querySelector('[data-act="listen"]');
    if (btn?.classList.contains("speaking")) {
      stopSpeaking();
      btn.classList.remove("speaking");
      mount(btn, html`${icon("volume")}<span>${t("dost.listen")}</span>`);
      return;
    }
    $$(".msg-actions .speaking", log).forEach((b) => {
      b.classList.remove("speaking");
      mount(b, html`${icon("volume")}<span>${t("dost.listen")}</span>`);
    });
    const r = m.result;
    const text = r.audio || [r.headline, plain(r.reply)].filter(Boolean).join(". ");
    const code = CHAT_LANGS.find((l) => l.code === r.replyLang)?.speech || langInfo().speech;
    if (btn) {
      btn.classList.add("speaking");
      mount(btn, html`${icon("stop")}<span>${t("dost.stop")}</span>`);
    }
    const out = await speak(text, code, {
      onEnd: () => {
        if (btn) {
          btn.classList.remove("speaking");
          mount(btn, html`${icon("volume")}<span>${t("dost.listen")}</span>`);
        }
      },
    });
    if (!out.matched) toast(t("dost.noVoice"), "info");
  }

  function summaryText(r) {
    const lines = [`FinSuraksha · Suraksha-Dost`, `${t(`level.${r.level}`)}${r.mode === "check" ? ` (${r.score}/100)` : ""}`];
    if (r.headline) lines.push(r.headline);
    if (r.flags?.length) lines.push(...r.flags.map((f) => `🚩 ${f.title}`));
    if (r.actions?.length) lines.push("", ...r.actions.map((a, i) => `${i + 1}. ${plain(a)}`));
    lines.push("", state.lang === "hi" ? "पैसे गए? 1930 पर कॉल करें।" : "Lost money? Call 1930.");
    return lines.join("\n");
  }

  log.addEventListener("click", async (e) => {
    const ex = e.target.closest("[data-ex]");
    if (ex) {
      const sample = L(EXAMPLES[ex.dataset.ex]);
      if (["ex5", "ex6"].includes(ex.dataset.ex)) return send(sample);
      input.value = sample;
      autosize();
      input.focus();
      return;
    }
    const act = e.target.closest("[data-act]");
    if (!act) return;
    const node = act.closest(".msg");
    const m = node?.__msg;
    if (!m) return;
    if (act.dataset.act === "listen") return speakFor(node);
    if (act.dataset.act === "copy") {
      if (await copyText(summaryText(m.result))) toast(t("common.copied"));
    }
    if (act.dataset.act === "share") {
      const text = summaryText(m.result);
      if (navigator.share) navigator.share({ title: "FinSuraksha warning", text }).catch(() => {});
      else if (await copyText(text)) toast(t("common.copied"));
    }
    if (act.dataset.act === "report") {
      const idx = messages.indexOf(m);
      const userText = messages[idx - 1]?.text || "";
      const r = m.result;
      const link = r.checks?.links?.[0]?.url || "";
      const upi = r.checks?.upi?.find((u) => !u.validHandle)?.vpa;
      const tg = (r.checks?.links || []).find((l) => /^t\.me$|telegram/.test(l.host));
      const prefill = {
        description: userText.slice(0, 2000),
        link,
        entityType: tg ? "telegram" : upi ? "upi" : link ? "url" : "other",
        entityValue: tg ? tg.url.replace(/^https?:\/\//, "") : upi || (link ? r.checks.links[0].host : ""),
        platform: tg ? "telegram" : upi ? "call_sms" : link ? "website" : "whatsapp",
        category: r.ruleFlags?.some((f) => f.id === "dabba") ? "dabba" : r.ruleFlags?.some((f) => f.id === "credentials") ? "phishing" : r.ruleFlags?.some((f) => f.id === "institutional" || f.id === "withdrawal_fee") ? "fake_app" : "fno_tips",
      };
      try {
        sessionStorage.setItem("fs_prefill", JSON.stringify(prefill));
      } catch {
        /* ignore */
      }
      go("hunt?tab=report");
    }
  });

  // ---------------------------------------------------------------- composer
  function autosize() {
    input.style.height = "auto";
    input.style.height = `${Math.min(180, input.scrollHeight)}px`;
  }
  input.addEventListener("input", autosize);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send();
    }
  });
  $("#send", root).addEventListener("click", () => send());

  async function handleFile(file) {
    if (!file) return;
    try {
      const prepared = await prepareImage(file);
      attachment = { dataUrl: prepared.dataUrl, canvas: prepared.canvas, reading: true, progress: 0, aiConsent: false };
      renderAttachment();
      const qrText = await decodeQr(prepared.canvas).catch(() => null);
      const upi = parseUpiUri(qrText);
      if (upi) attachment.qr = upi;
      const ocrLang = ["eng", langInfo().ocr].filter((v, i, a) => a.indexOf(v) === i).join("+");
      let text = "";
      try {
        text = await readText(prepared.canvas, ocrLang, (p) => {
          attachment.progress = p;
          const bar = $("#attach .progress i", root);
          if (bar) bar.style.width = `${Math.round(p * 100)}%`;
        });
      } catch {
        attachment.ocrFailed = true;
      }
      if (!attachment) return;
      attachment.reading = false;
      const parts = [];
      if (upi) parts.push(`QR code: upi://pay?pa=${upi.pa}${upi.pn ? ` (name: ${upi.pn})` : ""}${upi.am ? ` amount ₹${upi.am}` : ""}`);
      if (text) parts.push(text);
      else if (!upi) attachment.ocrFailed = true;
      if (parts.length) {
        input.value = [input.value.trim(), parts.join("\n")].filter(Boolean).join("\n\n");
        autosize();
      }
      renderAttachment();
    } catch (err) {
      attachment = null;
      renderAttachment();
      toast(err.message, "err");
    }
  }
  $("#file", root).addEventListener("change", (e) => {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  });
  input.addEventListener("paste", (e) => {
    const file = [...(e.clipboardData?.files || [])].find((f) => f.type.startsWith("image/"));
    if (file) {
      e.preventDefault();
      handleFile(file);
    }
  });
  let dragDepth = 0;
  shell.addEventListener("dragenter", (e) => {
    if (![...(e.dataTransfer?.types || [])].includes("Files")) return;
    e.preventDefault();
    if (dragDepth++ === 0) shell.appendChild(el(html`<div class="drop-overlay" id="drop">${icon("image")} ${t("dost.attach")}</div>`));
  });
  shell.addEventListener("dragover", (e) => e.preventDefault());
  shell.addEventListener("dragleave", () => {
    if (--dragDepth <= 0) {
      dragDepth = 0;
      $("#drop", root)?.remove();
    }
  });
  shell.addEventListener("drop", (e) => {
    e.preventDefault();
    dragDepth = 0;
    $("#drop", root)?.remove();
    handleFile([...(e.dataTransfer?.files || [])].find((f) => f.type.startsWith("image/")));
  });

  const mic = $("#mic", root);
  mic.addEventListener("click", () => {
    if (!recognitionSupported()) return toast(t("dost.noMic"), "info");
    if (rec) {
      rec.stop();
      return;
    }
    const before = input.value.trim();
    mic.classList.add("listening");
    mic.setAttribute("aria-label", t("dost.stopMic"));
    input.placeholder = t("dost.listening");
    rec = listen(langInfo().speech, {
      onText: (txt) => {
        input.value = [before, txt].filter(Boolean).join(" ");
        autosize();
      },
      onEnd: () => {
        rec = null;
        mic.classList.remove("listening");
        mic.setAttribute("aria-label", t("dost.mic"));
        input.placeholder = t("dost.placeholder");
        input.focus();
      },
      onError: (e) => {
        if (e?.error && e.error !== "no-speech" && e.error !== "aborted") toast(`${t("dost.noMic")} (${e.error})`, "info");
      },
    });
  });

  $("#chat-lang", root).addEventListener("change", (e) => {
    state.chatLang = e.target.value;
    state.chatLangChosen = true;
    savePrefs();
  });
  $("#autospeak", root).addEventListener("change", (e) => {
    state.autoSpeak = e.target.checked;
    savePrefs();
  });
  $("#clear", root).addEventListener("click", () => {
    stopSpeaking();
    messages.length = 0;
    log.innerHTML = "";
    welcome();
  });

  welcome();
  // Deep link: #/dost?q=<text> opens the chat with that message already checked.
  const preset = query?.get("q");
  if (preset) send(preset.slice(0, 6000));
  void raw;
  return () => {
    stopSpeaking();
    rec?.abort?.();
  };
}
