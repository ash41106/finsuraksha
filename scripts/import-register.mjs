// Merge a CSV of SEBI-registered intermediaries into the local register snapshot.
//
//   npm run import-register -- path/to/file.csv [--complete]
//
// Add --complete only when the register now holds SEBI's whole list (for
// example a full export). FinSuraksha then reports missing numbers as
// "not registered with SEBI" instead of "could not verify".
//
// CSV columns (header row required): regNo,name[,type]
// Use data you are allowed to use (e.g. exported from SEBI's public lists by
// hand, or an official data feed). Contact details are intentionally ignored.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const snapshotFile = path.join(here, "..", "seed", "sebi_register_snapshot.json");
const TYPES = { INA: "Investment Adviser", INH: "Research Analyst", INZ: "Stock Broker", INP: "Portfolio Manager", INM: "Merchant Banker" };

const complete = process.argv.includes("--complete");
const file = process.argv.slice(2).find((a) => a !== "--complete");
if (!file) {
  console.error("Usage: npm run import-register -- <file.csv>");
  process.exit(1);
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter((l) => l.trim());
const header = parseCsvLine(lines.shift()).map((h) => h.toLowerCase());
const iReg = header.findIndex((h) => /reg/.test(h));
const iName = header.findIndex((h) => /name/.test(h));
const iType = header.findIndex((h) => /type|category/.test(h));
if (iReg < 0 || iName < 0) {
  console.error("CSV needs 'regNo' and 'name' columns.");
  process.exit(1);
}

const snapshot = JSON.parse(fs.readFileSync(snapshotFile, "utf8"));
const byReg = new Map(snapshot.entries.map((e) => [e.regNo, e]));
let added = 0;
let skipped = 0;
for (const line of lines) {
  const cols = parseCsvLine(line);
  const regNo = (cols[iReg] || "").replace(/[\s-]/g, "").toUpperCase();
  const name = cols[iName] || "";
  if (!/^IN[AHZPM]\d{9}$/.test(regNo) && !/^INAIFSC\d{5}$/.test(regNo)) {
    skipped++;
    continue;
  }
  if (!byReg.has(regNo)) added++;
  byReg.set(regNo, { regNo, name, type: (iType >= 0 && cols[iType]) || TYPES[regNo.slice(0, 3)] || "Intermediary" });
}
snapshot.entries = [...byReg.values()].sort((a, b) => a.regNo.localeCompare(b.regNo));
snapshot.asOf = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
snapshot.source = `${snapshot.source} + manual import (${path.basename(file)})`;
if (complete) {
  snapshot.partial = false;
  snapshot.note = "Complete register: a valid number missing here is reported as not registered with SEBI.";
}
fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));
console.log(`Imported ${added} new entries (${skipped} invalid rows skipped). Snapshot now has ${snapshot.entries.length} entries${snapshot.partial === false ? " (COMPLETE)" : " (partial)"}.`);
