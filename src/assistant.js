// Suraksha-Dost orchestration: rule-based analysis always runs; AI mode (if
// configured) refines the explanation and writes it in the user's language.
import { analyzeMessage } from "./analyzer.js";
import { redact } from "./redact.js";
import { describeAiError } from "./ai.js";
import { ACTIONS, FLAG_ACTIONS, VERIFIED_TEXT, VERDICT_TEXT, AUDIO_TEXT, FAQ, GENERAL_TIPS, LANGS } from "./knowledge.js";

const SUPPORT_RE =
  /\b(?:i|we|my\s+\w+|maine|mere|humne)\b[^.?!]{0,50}\b(?:lost|been\s+scammed|got\s+scammed|was\s+scammed|cheated|duped|defrauded|paid|transferred|sent\s+(?:money|rs|₹))\b|\b(?:scammed|cheated|duped|defrauded)\b|ठगी\s*हो|धोखा\s*हो|पैसे\s*(?:चले|गए|डूब)|fraud\s+(?:ho\s+gaya|hua|happened\s+with)|shared\s+(?:my\s+)?otp|otp\s+(?:de\s+diya|bata\s+diya)/i;
const QUESTION_START =
  /^(?:what|how|why|when|where|who|which|is|are|can|should|could|does|do|will|explain|tell\s+me|kya|kaise|kyun|kyon|kab|kaun|kaunsa|kitna|batao|bataiye|समझाओ|क्या|कैसे|क्यों|कब|कौन)\b/i;

export function detectIntent(text, analysis) {
  const t = String(text || "").normalize("NFC").trim();
  if (SUPPORT_RE.test(t)) return "support";
  const e = analysis.entities;
  const hasEntities = e.urls.length + e.upis.length + e.phones.length + e.regNos.length > 0;
  const looksQuestion = /\?\s*$/.test(t) || QUESTION_START.test(t);
  // "Is this a scam? <pasted message>" - content after the question means "check it".
  const contentAfterQuestion = /\?\s*\S/.test(t);
  if (looksQuestion && !hasEntities && !contentAfterQuestion && t.length <= 120 && analysis.flags.length <= 1) return "question";
  if (!hasEntities && analysis.flags.length === 0 && t.length < 60) return "question";
  return "check";
}

function pickFaq(text, L) {
  const t = String(text || "").normalize("NFC");
  const hit = FAQ.find((f) => f.re.test(t));
  return hit ? hit[L] : GENERAL_TIPS[L];
}

// "Verify on SEBI's site / SEBI Check" style steps. FinSuraksha does that check
// itself, so such steps are replaced by the verified result.
const SELF_VERIFY_RE = /\b(?:verify|check|confirm|search|look\s+up|match)\b[^.]*(?:\bsebi\b|intermediary|@valid|\bin[ah]\b)|(?:जाँच|पुष्टि|मिला)[^।]*(?:sebi|सेबी|@valid)|(?:sebi|सेबी)[^।]*(?:जाँच|पुष्टि)/i;

function verifiedLines(analysis, L) {
  const out = [];
  for (const s of analysis.checks.sebi.filter((x) => x.verified)) {
    out.push(VERIFIED_TEXT.sebi[L].replace("{x}", s.normalized).replace("{y}", s.name).replace("{z}", L === "hi" ? s.typeHi : s.type));
  }
  for (const u of analysis.checks.upi.filter((x) => x.verified)) {
    const what = [u.category, u.bank].filter(Boolean).join(", ");
    out.push(VERIFIED_TEXT.upi[L].replace("{x}", u.vpa).replace("{y}", what || "registered intermediary"));
  }
  return out;
}

export function withVerified(actions, analysis, L) {
  const verified = verifiedLines(analysis, L);
  if (!verified.length) return actions;
  return [...verified, ...actions.filter((a) => !SELF_VERIFY_RE.test(a))].slice(0, 5);
}

function actionsFor(analysis, mode, L) {
  const ids = [];
  const push = (id) => !ids.includes(id) && ids.push(id);
  if (mode === "support") {
    push("lost_money");
    push("never_otp");
    push("chakshu");
    push("exit_report");
  } else if (analysis.level === "unknown") {
    push("share_more");
  } else if (analysis.level === "low") {
    push("stay_careful");
  } else {
    push("verify_first");
    for (const f of analysis.flags) for (const a of FLAG_ACTIONS[f.id] || []) push(a);
  }
  const list = ids.slice(0, 5).map((id) => ACTIONS[id][L]);
  return mode === "check" ? withVerified(list, analysis, L) : list;
}

function ruleBasedReply(analysis, mode, text, L) {
  if (mode === "question") return pickFaq(text, L);
  if (mode === "support") return FAQ.find((f) => f.id === "scammed")[L];
  const lines = [];
  const n = analysis.flags.length;
  if (n) {
    // The flag list is shown separately in the UI, so the reply stays a short summary.
    const top = analysis.flags.slice(0, 3).map((f) => `**${f.title.replace(/\s*\(.*?\)\s*$/, "")}**`);
    const list = top.length > 1 ? `${top.slice(0, -1).join(", ")}${L === "hi" ? " और " : " and "}${top[top.length - 1]}` : top[0];
    lines.push(
      L === "hi"
        ? `मुझे इस संदेश में **${n} ख़तरे के संकेत** मिले। सबसे गंभीर: ${list}।`
        : `I found **${n} warning sign${n > 1 ? "s" : ""}** in this message. The most serious: ${list}.`,
    );
    if (analysis.level === "high") lines.push(L === "hi" ? "ऐसे संदेश आम तौर पर ठगी होते हैं। नीचे दिए क़दम अपनाएँ।" : "Messages like this are usually scams. Follow the steps below.");
  } else if (analysis.level === "low") {
    lines.push(L === "hi" ? "इस संदेश में ठगी के आम संकेत नहीं मिले।" : "I didn't find the usual scam signs in this message.");
  } else {
    lines.push(L === "hi" ? "जाँचने के लिए पूरी जानकारी नहीं है।" : "There isn't enough here to check yet.");
  }
  for (const s of analysis.checks.sebi.filter((x) => x.found)) {
    lines.push(
      L === "hi"
        ? `- ✓ **${s.normalized}** SEBI सूची में **${s.name}** (${s.typeHi}) के नाम से है। देखें कि आपसे संपर्क करने वाला यही है — ठग असली नंबर चुरा लेते हैं।`
        : `- ✓ **${s.normalized}** is listed for **${s.name}** (${s.type}). Make sure that's who actually contacted you — scammers copy real numbers.`,
    );
  }
  if (analysis.positives.length && n) {
    lines.push((L === "hi" ? "अच्छे संकेत: " : "Good signs: ") + analysis.positives.map((p) => p.text).join("; ") + ".");
  }
  return lines.join("\n");
}

function audioFor(analysis, mode, L) {
  if (mode === "question") return "";
  if (mode === "support") return L === "hi" ? "घबराइए नहीं। तुरंत 1930 पर कॉल करें, अपने बैंक को बताएँ और cybercrime.gov.in पर शिकायत करें। किसी रिकवरी एजेंट को पैसे न दें।" : "Stay calm. Call 1930 right away, tell your bank to block the transaction, and report it on cybercrime dot gov dot in. Never pay a recovery agent.";
  const top = analysis.flags
    .slice(0, 2)
    .map((f) => f.title.replace(/\s*\(.*?\)\s*/g, " ").trim().toLowerCase())
    .join(L === "hi" ? " और " : " and ");
  return AUDIO_TEXT[analysis.level][L].replace("{n}", String(analysis.flags.length)).replace("{top}", top);
}

function levelFromScore(score) {
  return score >= 60 ? "high" : score >= 30 ? "medium" : "low";
}

function recordStats(store, mode, level, flags) {
  if (!store || mode !== "check") return;
  const c = store.data.counters;
  c.checks = (c.checks || 0) + 1;
  c.verdicts[level] = (c.verdicts[level] || 0) + 1;
  for (const f of flags) c.flags[f.id] = (c.flags[f.id] || 0) + 1;
  const day = new Date().toISOString().slice(0, 10);
  const d = (c.daily[day] = c.daily[day] || { checks: 0, flagged: 0 });
  d.checks += 1;
  if (level === "high" || level === "medium") d.flagged += 1;
  const days = Object.keys(c.daily).sort();
  for (const old of days.slice(0, Math.max(0, days.length - 120))) delete c.daily[old];
  store.save();
}

export async function runAssistant({ message, history, lang, image, store, cfg, ai }) {
  const L = lang === "hi" ? "hi" : "en";
  const uiLang = LANGS[lang] ? lang : "en";
  const analysis = await analyzeMessage(message, { store, cfg, lang: L });
  let mode = image && !String(message || "").trim() ? "check" : detectIntent(message, analysis);
  const red = redact(message);

  const base = {
    mode,
    level: mode === "question" ? "info" : mode === "support" ? "high" : analysis.level,
    score: mode === "check" ? analysis.score : mode === "support" ? 90 : 0,
    headline: null,
    reply: ruleBasedReply(analysis, mode, message, L),
    flags: mode === "check" ? analysis.flags.map(({ id, sev, title, why, evidence }) => ({ id, sev, title, why, evidence })) : [],
    ruleFlags: analysis.flags.map(({ id, sev, title, why, evidence }) => ({ id, sev, title, why, evidence })),
    positives: analysis.positives,
    checks: analysis.checks,
    actions: mode === "question" ? [] : actionsFor(analysis, mode, L),
    audio: audioFor(analysis, mode, L),
    lang: L,
    replyLang: L,
    redactions: red.counts,
    ai: { used: false, available: Boolean(ai?.enabled) },
  };
  if (mode === "check") base.headline = VERDICT_TEXT[analysis.level][L].headline;
  if (mode === "support") base.headline = L === "hi" ? "चिंता न करें — अभी ये क़दम उठाएँ।" : "Stay calm — take these steps right now.";
  if (mode === "question") base.headline = null;
  if (uiLang !== L && !ai?.enabled) base.note = "Rule-based mode answers in English or Hindi. Add an AI key to reply in other Indian languages.";

  let result = base;
  if (ai?.enabled) {
    try {
      const r = await ai.analyze({ message: red.text, history, lang: uiLang, analysis, mode, image });
      if (r?.refused) {
        result.ai = { used: false, available: true, note: "AI declined this request - showing rule-based analysis." };
      } else if (r) {
        const aiMode = ["check", "question", "support"].includes(r.mode) ? r.mode : mode;
        mode = aiMode === "question" && analysis.score >= 60 ? "check" : aiMode;
        let score = 0;
        let level = "info";
        if (mode === "check") {
          const aiScore = Math.max(0, Math.min(100, Number(r.risk_score) || 0));
          score = analysis.flags.length ? Math.round((analysis.score + aiScore) / 2) : aiScore;
          score = Math.max(score, analysis.floor);
          level = r.verdict === "need_info" && !analysis.flags.length ? "unknown" : levelFromScore(score);
        } else if (mode === "support") {
          score = 90;
          level = "high";
        }
        result = {
          ...base,
          mode,
          level,
          score,
          headline: r.headline || base.headline,
          reply: r.reply || base.reply,
          flags: mode === "check" ? (r.red_flags || []).slice(0, 5).map((f, i) => ({ id: `ai_${i}`, sev: i === 0 && level === "high" ? "high" : "medium", title: f.title, why: f.why })) : [],
          actions: mode === "check" ? withVerified((r.actions || []).slice(0, 5), analysis, L) : (r.actions || []).slice(0, 5),
          audio: r.audio_summary || "",
          replyLang: uiLang,
          note: undefined,
          ai: { used: true, available: true, model: r.model },
        };
      }
    } catch (err) {
      result.ai = { used: false, available: true, note: describeAiError(err) };
      if (!cfg.quiet) console.error("[ai]", err?.status || "", err?.message || err);
    }
  }
  recordStats(store, result.mode, result.level, analysis.flags);
  return result;
}
