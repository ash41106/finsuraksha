// Builds seed/sebi_register_snapshot.json from saved copies of SEBI's public
// "Recognised intermediaries" pages (normal page views, saved from a browser).
//
// Usage:
//   node scripts/build-sebi-snapshot.mjs <ia-page.html> <ra-page.html>
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

const files = process.argv.slice(2);
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
  source: "SEBI - Recognised intermediaries (public list, first page of each category)",
  sourceUrls: [
    "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13",
    "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=14",
  ],
  asOf,
  partial: true,
  note: "Partial snapshot for demonstration. A number missing here is NOT proof of a fake - always confirm on sebi.gov.in.",
  entries: [...entries.values()].sort((a, b) => a.regNo.localeCompare(b.regNo)),
};
fs.writeFileSync(out, JSON.stringify(snapshot, null, 2));
console.log(`Wrote ${snapshot.entries.length} entries (as of ${asOf}) -> ${path.relative(process.cwd(), out)}`);
