// Keeps the SEBI register current by reading SEBI's public "Recognised
// intermediaries" lists directly (the same requests the page makes when you
// click through its pages), and checks single numbers live on a miss.
//
// Politeness and safety rules:
// - one request at a time, about one per second, during a sync;
// - a category counts as complete only when every page arrived and the rows
//   add up to SEBI's own stated total; otherwise the last good copy is kept;
// - SEBI's firewall answers blocked requests with an HTML page and status 200,
//   so every response must contain the record counter or it is a failure. A
//   failure is never read as "not registered".
// Only name, registration number, category and validity are kept.
import fs from "node:fs";
import path from "node:path";

const BASE = "https://www.sebi.gov.in";
const LIST_PAGE = (id) => `${BASE}/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=${id}`;
const AJAX = `${BASE}/sebiweb/ajax/other/getintmfpiinfo.jsp`;
const UA = "Mozilla/5.0 (compatible; FinSuraksha register sync; +https://github.com/) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";
const PAGE_SIZE = 25;

// SEBI list ids per registration-number prefix. A broker appears in one list
// per market segment, so all segments together make the full INZ list.
export const SEBI_LISTS = {
  INA: [13],
  INH: [14],
  INZ: [30, 31, 32, 37, 38, 2],
  INP: [33],
  INM: [9],
};
const TYPES = { INA: "Investment Adviser", INH: "Research Analyst", INZ: "Stock Broker", INP: "Portfolio Manager", INM: "Merchant Banker" };

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Parses one page of results (the AJAX fragment or a saved full page).
// Returns null when the response isn't a result page (blocked, error page).
export function parseListPage(htmlText) {
  const counter = htmlText.match(/(\d+)\s+to\s+(\d+)\s+of\s+(\d+)\s+records/i);
  const empty = /No\s+record\(s\)\s+available|No\s+records?\s+found/i.test(htmlText);
  if (!counter && !empty) return null;
  const pairs = [...htmlText.matchAll(/<div class=['"]title['"]><span>([^<]+)<\/span><\/div><div class=['"]value[^'"]*['"]><span>([^<]*)<\/span>/g)].map((m) => [decode(m[1]), decode(m[2])]);
  const records = [];
  let cur = null;
  for (const [title, value] of pairs) {
    if (title === "Name") {
      if (cur) records.push(cur);
      cur = { name: value };
    } else if (cur && /^Registration No/i.test(title)) cur.regNo = value.replace(/\s/g, "").toUpperCase();
    else if (cur && title === "Validity") cur.validity = value;
  }
  if (cur) records.push(cur);
  return {
    from: counter ? Number(counter[1]) : 0,
    to: counter ? Number(counter[2]) : 0,
    total: counter ? Number(counter[3]) : 0,
    records: records.filter((r) => r.name && /^IN[A-Z]/.test(r.regNo || "")),
  };
}

// A small client that keeps SEBI's session cookie, like a browser tab.
export function sebiClient({ fetch: fetchImpl = globalThis.fetch, timeoutMs = 20_000 } = {}) {
  let cookie = "";
  let referer = LIST_PAGE(13);
  async function open(id) {
    referer = LIST_PAGE(id);
    const res = await fetchImpl(referer, { headers: { "user-agent": UA, accept: "text/html" }, signal: AbortSignal.timeout(timeoutMs) });
    const set = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [res.headers.get("set-cookie")].filter(Boolean);
    const jar = set.map((c) => c.split(";")[0]).filter(Boolean);
    if (jar.length) cookie = jar.join("; ");
    const text = await res.text();
    const page = parseListPage(text);
    if (!res.ok || !page) throw new Error(`SEBI list ${id}: page not available (status ${res.status})`);
    return page;
  }
  async function query(id, { page = -1, regNo = "" } = {}) {
    const body = new URLSearchParams({ nextValue: "1", next: regNo ? "s" : "n", intmId: String(id), contPer: "", name: "", regNo, email: "", location: "", exchange: "", affiliate: "", alp: "", language: "2", model: "", esgCategory: "", doDirect: String(page), intmIds: "" });
    const res = await fetchImpl(AJAX, {
      method: "POST",
      headers: { "user-agent": UA, "content-type": "application/x-www-form-urlencoded", "x-requested-with": "XMLHttpRequest", referer, ...(cookie ? { cookie } : {}) },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const parsed = res.ok ? parseListPage(await res.text()) : null;
    if (!parsed) throw new Error(`SEBI list ${id}: request refused or not understood (status ${res.status})`);
    return parsed;
  }
  return { open, query };
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Downloads one list completely. Throws if any page is missing.
export async function fetchList(id, { client, delayMs = 1000, log = () => {} } = {}) {
  const first = await client.open(id);
  const total = first.total;
  const pages = Math.ceil(total / PAGE_SIZE);
  const rows = [];
  for (let p = 0; p < pages; p++) {
    await wait(delayMs);
    let page;
    for (let attempt = 0; ; attempt++) {
      try {
        page = await client.query(id, { page: p });
        if (page.from !== p * PAGE_SIZE + 1) throw new Error(`SEBI list ${id}: asked for page ${p + 1}, got records ${page.from}-${page.to}`);
        break;
      } catch (err) {
        if (attempt >= 2) throw err;
        await wait(delayMs * 5 * (attempt + 1));
      }
    }
    rows.push(...page.records);
    if ((p + 1) % 10 === 0) log(`  list ${id}: ${p + 1}/${pages} pages`);
  }
  if (rows.length !== total) throw new Error(`SEBI list ${id}: got ${rows.length} rows, SEBI says ${total}`);
  return { total, rows };
}

// Syncs the given prefixes into `previous` (a snapshot object) and returns a
// new snapshot. Prefixes that fail keep their previous entries and status.
export async function syncRegister(previous, { prefixes = Object.keys(SEBI_LISTS), fetch: fetchImpl, delayMs = 1000, log = console.log } = {}) {
  const client = sebiClient({ fetch: fetchImpl });
  const prevEntries = previous?.entries || [];
  const completeTypes = { ...(previous?.completeTypes || {}) };
  const counts = { ...(previous?.counts || {}) };
  const byPrefix = new Map();
  for (const e of prevEntries) {
    const p = e.regNo.slice(0, 3);
    if (!byPrefix.has(p)) byPrefix.set(p, new Map());
    byPrefix.get(p).set(e.regNo, e);
  }
  const results = {};
  for (const prefix of prefixes) {
    const fresh = new Map();
    try {
      for (const id of SEBI_LISTS[prefix]) {
        log(`Fetching SEBI list ${id} (${TYPES[prefix]})...`);
        const { rows } = await fetchList(id, { client, delayMs, log });
        for (const r of rows) {
          if (r.regNo.slice(0, 3) !== prefix || fresh.has(r.regNo)) continue;
          fresh.set(r.regNo, { regNo: r.regNo, name: r.name, type: TYPES[prefix], ...(r.validity ? { validity: r.validity } : {}) });
        }
        await wait(delayMs);
      }
      byPrefix.set(prefix, fresh);
      completeTypes[prefix] = true;
      counts[prefix] = fresh.size;
      results[prefix] = { ok: true, count: fresh.size };
      log(`${TYPES[prefix]}: ${fresh.size} registered (complete)`);
    } catch (err) {
      // Keep what we had; add anything new we did manage to read.
      const kept = byPrefix.get(prefix) || new Map();
      for (const [k, v] of fresh) kept.set(k, v);
      byPrefix.set(prefix, kept);
      results[prefix] = { ok: false, error: err.message, count: kept.size };
      log(`${TYPES[prefix]}: sync failed (${err.message}); kept ${kept.size} entries, status unchanged`);
    }
  }
  const entries = [...byPrefix.values()].flatMap((m) => [...m.values()]).sort((a, b) => a.regNo.localeCompare(b.regNo));
  const anySynced = Object.values(results).some((r) => r.ok);
  const asOf = anySynced ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" }) : previous?.asOf || null;
  return {
    snapshot: {
      source: "SEBI - Recognised intermediaries (public lists, synced automatically)",
      sourceUrls: Object.values(SEBI_LISTS).flat().map(LIST_PAGE),
      asOf,
      syncedAt: anySynced ? new Date().toISOString() : previous?.syncedAt || null,
      completeTypes,
      counts,
      partial: !Object.keys(TYPES).every((p) => completeTypes[p]),
      note: "A valid number missing here is reported as not registered only for categories marked complete.",
      entries,
    },
    results,
  };
}

export function writeSnapshot(file, snapshot) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(snapshot, null, 1));
  fs.renameSync(tmp, file);
}

// Live check of one number against SEBI's own search. Returns
// { found: true, name, validity } | { found: false } | null (couldn't ask).
export async function lookupSebiLive(regNo, { fetch: fetchImpl, timeoutMs = 8_000 } = {}) {
  const lists = SEBI_LISTS[regNo.slice(0, 3)];
  if (!lists) return null;
  try {
    const client = sebiClient({ fetch: fetchImpl, timeoutMs });
    await client.open(lists[0]);
    for (const id of lists) {
      const page = await client.query(id, { regNo });
      const hit = page.records.find((r) => r.regNo === regNo);
      if (hit) return { found: true, name: hit.name, validity: hit.validity || null, type: TYPES[regNo.slice(0, 3)] };
    }
    return { found: false };
  } catch {
    return null;
  }
}
