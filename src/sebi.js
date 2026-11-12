// SEBI registration-number checks and the @valid UPI handle check.
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./config.js";
import { lookupSebiLive } from "./sebi-sync.js";

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
// Entities a moderator added after checking their SEBI certificate (registered
// after the last import). Kept in the app database, merged on top of the file.
let extras = [];

export const SEED_REGISTER = path.join(ROOT, "seed", "sebi_register_snapshot.json");

export function loadRegister(file = SEED_REGISTER) {
  try {
    snapshot = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    snapshot = { entries: [], asOf: null, partial: true };
  }
  byReg.clear();
  for (const e of snapshot.entries) byReg.set(e.regNo.toUpperCase(), e);
  for (const e of extras) byReg.set(e.regNo, e);
  providerCache.clear();
  return snapshot;
}

export function setRegisterExtras(list = []) {
  for (const e of extras) if (byReg.get(e.regNo) === e) byReg.delete(e.regNo);
  extras = list.map((e) => ({ ...e, regNo: e.regNo.toUpperCase() }));
  for (const e of extras) byReg.set(e.regNo, e);
  providerCache.clear();
}

// "Not found" means "not registered" only for categories whose whole list we
// hold. Older snapshots have a single `partial` flag for everything.
export function isComplete(prefix) {
  if (snapshot.completeTypes) return snapshot.completeTypes[prefix] === true;
  return snapshot.partial === false;
}

export function currentSnapshot() {
  return snapshot;
}

const STALE_DAYS = 14;
export function registerInfo() {
  const t = Date.parse(snapshot.asOf || "");
  const ageDays = Number.isFinite(t) ? Math.floor((Date.now() - t) / 86_400_000) : null;
  return {
    asOf: snapshot.asOf,
    count: byReg.size,
    // A complete register means "not found" really is "not registered".
    complete: Object.keys(PREFIXES).every(isComplete),
    partial: !Object.keys(PREFIXES).every(isComplete),
    completeTypes: Object.fromEntries(Object.keys(PREFIXES).map((p) => [p, isComplete(p)])),
    syncedAt: snapshot.syncedAt || null,
    ageDays,
    stale: ageDays === null || ageDays > STALE_DAYS,
    sourceUrls: snapshot.sourceUrls || [],
  };
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
  const complete = check.valid && isComplete(check.prefix);
  return {
    ...check,
    found: Boolean(hit),
    // FinSuraksha checks the number itself, so the user isn't sent to SEBI's site.
    verified: Boolean(hit),
    verifiedBy: hit ? "SEBI register" : null,
    notRegistered: check.valid && !hit && complete,
    name: hit?.name || null,
    validity: hit?.validity || null,
    asOf: snapshot.asOf,
    partialSnapshot: !complete,
  };
}

// Optional lookup service for numbers the local register doesn't have
// (SEBI_LOOKUP_URL + SEBI_LOOKUP_KEY). Contract:
//   GET <url>?regNo=INA000012345   Authorization: Bearer <key>
//   -> { "found": true, "name": "...", "type": "Investment Adviser" } or { "found": false }
// Answers are cached for a day so the same number isn't paid for twice.
const providerCache = new Map();
const CACHE_MS = 24 * 60 * 60_000;

async function askProvider(regNo, cfg, fetchImpl) {
  const hit = providerCache.get(regNo);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  let value = null;
  try {
    const url = new URL(cfg.sebiLookupUrl);
    url.searchParams.set("regNo", regNo);
    const res = await fetchImpl(url, {
      headers: { accept: "application/json", ...(cfg.sebiLookupKey ? { authorization: `Bearer ${cfg.sebiLookupKey}` } : {}) },
      signal: AbortSignal.timeout(8_000),
    });
    const data = res.ok ? await res.json().catch(() => null) : null;
    if (data && typeof data.found === "boolean") value = { found: data.found, name: data.found ? String(data.name || "").slice(0, 200) || null : null, type: data.type ? String(data.type).slice(0, 60) : null };
  } catch {
    value = null; // provider down: fall back to the local answer
  }
  if (value) providerCache.set(regNo, { at: Date.now(), value });
  return value;
}

// Built-in live check: asks SEBI's own search about one number. One request at
// a time, at least a second apart, answers cached for a day.
const liveCache = new Map();
let liveQueue = Promise.resolve();
function askSebiLive(regNo, fetchImpl) {
  const cached = liveCache.get(regNo);
  if (cached && Date.now() - cached.at < CACHE_MS) return Promise.resolve(cached.value);
  const run = liveQueue.then(async () => {
    const again = liveCache.get(regNo);
    if (again && Date.now() - again.at < CACHE_MS) return again.value;
    const value = await lookupSebiLive(regNo, { fetch: fetchImpl });
    if (value) liveCache.set(regNo, { at: Date.now(), value });
    await new Promise((r) => setTimeout(r, 1000));
    return value;
  });
  liveQueue = run.catch(() => null);
  // Don't keep the visitor waiting behind a long queue.
  return Promise.race([run, new Promise((r) => setTimeout(() => r(null), 12_000))]);
}

export async function verifyRegNo(raw, cfg = {}, { fetch: fetchImpl = globalThis.fetch } = {}) {
  const local = lookupRegNo(raw);
  if (!local.valid || local.found) return local;
  if (!cfg.sebiLookupUrl) {
    if (!cfg.sebiLive) return local;
    const live = await askSebiLive(local.normalized, fetchImpl);
    if (!live) return local;
    if (live.found) return { ...local, found: true, verified: true, verifiedBy: "SEBI website (live check)", notRegistered: false, name: live.name, validity: live.validity };
    return { ...local, notRegistered: true, verifiedBy: "SEBI website (live check)" };
  }
  const p = await askProvider(local.normalized, cfg, fetchImpl);
  if (!p) return local;
  if (p.found) return { ...local, found: true, verified: true, verifiedBy: "SEBI lookup service", notRegistered: false, name: p.name, type: p.type || local.type };
  return { ...local, notRegistered: true, verifiedBy: "SEBI lookup service" };
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
// Banks that issue @valid handles under SEBI's validated-UPI framework (@valid<bank>).
const VALID_BANKS = { hdfc: "HDFC Bank", icici: "ICICI Bank", axis: "Axis Bank", sbi: "State Bank of India", kotak: "Kotak Mahindra Bank", yes: "Yes Bank", idbi: "IDBI Bank", indus: "IndusInd Bank", pnb: "Punjab National Bank", boi: "Bank of India", bob: "Bank of Baroda", union: "Union Bank of India", canara: "Canara Bank", idfc: "IDFC FIRST Bank", federal: "Federal Bank", hsbc: "HSBC" };

export function analyzeUpi(vpa) {
  const v = String(vpa || "").trim().toLowerCase();
  const [local = "", handle = ""] = v.split("@");
  const isValidHandle = handle.startsWith("valid");
  const suffix = local.includes(".") ? local.split(".").pop() : "";
  const bank = isValidHandle ? VALID_BANKS[handle.slice(5)] || null : null;
  return {
    vpa: v,
    handle,
    validHandle: isValidHandle,
    category: isValidHandle ? CATEGORY[suffix] || "Registered intermediary" : null,
    bank,
    // @valid handles are issued only to SEBI-registered intermediaries, so the handle itself is the check.
    verified: isValidHandle,
    verifiedBy: isValidHandle ? "SEBI @valid UPI framework" : null,
    looksLikePhone: /^\d{10}$/.test(local),
    sebiCheckUrl: SEBI_LINKS.sebiCheck,
  };
}

loadRegister();
