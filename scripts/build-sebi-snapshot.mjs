// Builds seed/sebi_register_snapshot.json from saved copies of SEBI's public
// "Recognised intermediaries" pages (normal page views, saved from a browser).
//
// Usage:
//   node scripts/build-sebi-snapshot.mjs [--complete] <page1.html> <page2.html> ...
//   node scripts/build-sebi-snapshot.mjs --complete register-pages/   (a folder of saved pages)
//
// Pass every saved page of every category you cover. Add --complete only when
// the pages hold SEBI's whole list: FinSuraksha then treats a number that isn't
// in the register as "not registered with SEBI" instead of "could not verify".
//
// Only the entity name, registration number and category are kept. Contact
// details of advisers (many are individuals) are deliberately dropped.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "seed", "sebi_register_snapshot.json");

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

function parse(file) {
  const htmlText = fs.readFileSync(file, "utf8");
  const asOf = (htmlText.match(/Registered intermediaries as on date ([A-Za-z]{3} \d{1,2}, \d{4})/) || [])[1] || null;
  const pairs = [...htmlText.matchAll(/<div class="title"><span>([^<]+)<\/span><\/div><div class="value[^"]*"><span>([^<]*)<\/span>/g)].map(
    (m) => [decode(m[1]), decode(m[2])],
  );
  const records = [];
  let cur = null;
  for (const [title, value] of pairs) {
    if (title === "Name") {
      if (cur) records.push(cur);
      cur = { name: value };
    } else if (cur && title === "Registration No.") {
      cur.regNo = value.toUpperCase();
    }
  }
  if (cur) records.push(cur);
  return { asOf, records: records.filter((r) => r.name && r.regNo) };
}

const complete = process.argv.includes("--complete");
// Arguments can be saved .html pages or folders that hold them.
const files = process.argv
  .slice(2)
  .filter((a) => a !== "--complete")
  .flatMap((a) => (fs.statSync(a).isDirectory() ? fs.readdirSync(a).filter((f) => /\.html?$/i.test(f)).sort().map((f) => path.join(a, f)) : [a]));
if (!files.length) {
  console.error("Usage: node scripts/build-sebi-snapshot.mjs <saved-sebi-page.html> [...]");
  process.exit(1);
}

const TYPES = { INA: "Investment Adviser", INH: "Research Analyst", INZ: "Stock Broker", INP: "Portfolio Manager", INM: "Merchant Banker" };
const entries = new Map();
let asOf = null;
for (const f of files) {
  const { asOf: a, records } = parse(f);
  asOf = asOf || a;
  for (const r of records) {
    const prefix = r.regNo.slice(0, 3);
    entries.set(r.regNo, { regNo: r.regNo, name: r.name, type: TYPES[prefix] || "Intermediary" });
  }
  console.log(`${path.basename(f)}: ${records.length} records`);
}

const snapshot = {
  source: `SEBI - Recognised intermediaries (public list, ${files.length} saved page${files.length > 1 ? "s" : ""})`,
  sourceUrls: [
    "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13",
    "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=14",
  ],
  asOf,
  partial: !complete,
  note: complete
    ? "Complete register: a valid number missing here is reported as not registered with SEBI."
    : "Partial register: a number missing here is reported as 'could not verify', not as fake.",
  entries: [...entries.values()].sort((a, b) => a.regNo.localeCompare(b.regNo)),
};
fs.writeFileSync(out, JSON.stringify(snapshot, null, 2));
console.log(`Wrote ${snapshot.entries.length} entries (as of ${asOf}, ${complete ? "COMPLETE" : "partial"}) -> ${path.relative(process.cwd(), out)}`);
