// SEBI registration-number checks and the @valid UPI handle check.
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./config.js";

export const SEBI_LINKS = {
  ia: "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13",
  ra: "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=14",
  home: "https://www.sebi.gov.in",
  sebiCheck: "https://siportal.sebi.gov.in/intermediary/sebi-check",
  scores: "https://scores.sebi.gov.in",
};

export const PREFIXES = {
  INA: { type: "Investment Adviser", hi: "निवेश सलाहकार", url: SEBI_LINKS.ia },
  INH: { type: "Research Analyst", hi: "रिसर्च एनालिस्ट", url: SEBI_LINKS.ra },
  INZ: { type: "Stock Broker", hi: "स्टॉक ब्रोकर", url: SEBI_LINKS.home },
  INP: { type: "Portfolio Manager", hi: "पोर्टफोलियो मैनेजर", url: SEBI_LINKS.home },
  INM: { type: "Merchant Banker", hi: "मर्चेंट बैंकर", url: SEBI_LINKS.home },
};

let snapshot = { entries: [], asOf: null, partial: true };
const byReg = new Map();

export function loadRegister(file = path.join(ROOT, "seed", "sebi_register_snapshot.json")) {
  try {
    snapshot = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    snapshot = { entries: [], asOf: null, partial: true };
  }
  byReg.clear();
  for (const e of snapshot.entries) byReg.set(e.regNo.toUpperCase(), e);
  return snapshot;
}
loadRegister();

export function registerInfo() {
  return { asOf: snapshot.asOf, count: snapshot.entries.length, partial: snapshot.partial !== false, sourceUrls: snapshot.sourceUrls || [] };
}

// Loose candidates (catch near-misses like "INA12345") so we can flag bad formats.
const CANDIDATE_RE = /\bIN[\s-]?[AHZPM](?:[\s-]?IFSC)?[\s-]?\d{3,12}\b/gi;
const LABELLED_RE = /\bsebi\s*(?:reg(?:istration|d|\.)?|registered)?\s*(?:no\.?|number|#)\s*[:\-]?\s*([A-Z0-9][A-Z0-9/-]{3,20})/gi;

export function extractRegNos(text) {
  const found = new Set();
  for (const m of String(text).matchAll(CANDIDATE_RE)) found.add(m[0].replace(/[\s-]/g, "").toUpperCase());
  for (const m of String(text).matchAll(LABELLED_RE)) {
    const v = m[1].replace(/[\s-]/g, "").toUpperCase();
    if (/\d/.test(v)) found.add(v);
  }
  return [...found];
}

export function validateRegNo(raw) {
  const v = String(raw || "").replace(/[\s-]/g, "").toUpperCase();
  const prefix = v.slice(0, 3);
  const info = PREFIXES[prefix];
  if (!info) return { input: raw, normalized: v, valid: false, reason: "Unknown prefix. SEBI numbers start with INA (adviser), INH (research analyst), INZ (broker), INP or INM." };
  const ok = /^IN[AHZPM]\d{9}$/.test(v) || /^INAIFSC\d{5}$/.test(v);
  return {
    input: raw,
    normalized: v,
    valid: ok,
    prefix,
    type: info.type,
    typeHi: info.hi,
    officialUrl: info.url,
    reason: ok ? null : `${prefix} numbers have 9 digits after the prefix (e.g. ${prefix}000012345).`,
  };
}

export function lookupRegNo(raw) {
  const check = validateRegNo(raw);
  const hit = check.valid ? byReg.get(check.normalized) : null;
  return {
    ...check,
    found: Boolean(hit),
    name: hit?.name || null,
    asOf: snapshot.asOf,
    partialSnapshot: snapshot.partial !== false,
  };
}

export function searchRegister(q, limit = 8) {
  const needle = String(q || "").trim().toLowerCase();
  if (needle.length < 2) return [];
  const asNo = needle.replace(/[\s-]/g, "").toUpperCase();
  const out = [];
  for (const e of snapshot.entries) {
    if (e.regNo === asNo || e.name.toLowerCase().includes(needle) || e.regNo.includes(asNo)) out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

// ---- UPI ----------------------------------------------------------------
// A trailing full stop is allowed (end of sentence); a dot followed by letters means an email domain.
export const UPI_RE = /\b[a-z0-9][a-z0-9._-]{1,63}@[a-z][a-z0-9]{2,30}\b(?![@\w-]|\.\w)/gi;
const CATEGORY = { brk: "Stock broker", mf: "Mutual fund" };

export function analyzeUpi(vpa) {
  const v = String(vpa || "").trim().toLowerCase();
  const [local = "", handle = ""] = v.split("@");
  const isValidHandle = handle.startsWith("valid");
  const suffix = local.includes(".") ? local.split(".").pop() : "";
  return {
    vpa: v,
    handle,
    validHandle: isValidHandle,
    category: isValidHandle ? CATEGORY[suffix] || "Registered intermediary" : null,
    looksLikePhone: /^\d{10}$/.test(local),
    sebiCheckUrl: SEBI_LINKS.sebiCheck,
  };
}
