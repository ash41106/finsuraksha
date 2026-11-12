// Downloads SEBI's public lists of registered intermediaries into the register.
//
//   npm run sync-register                       all categories -> seed snapshot
//   npm run sync-register -- --only INA,INH     just advisers and research analysts
//   npm run sync-register -- --out data/sebi_register.json
//
// About one request per second. A category is marked complete only when every
// page arrived and the rows match SEBI's own total; otherwise the previous
// entries for it are kept and it stays "could not verify".
import fs from "node:fs";
import { syncRegister, writeSnapshot, SEBI_LISTS } from "../src/sebi-sync.js";
import { SEED_REGISTER } from "../src/sebi.js";

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : null;
};
const out = arg("--out") || SEED_REGISTER;
const prefixes = (arg("--only") || Object.keys(SEBI_LISTS).join(","))
  .split(",")
  .map((s) => s.trim().toUpperCase())
  .filter((p) => SEBI_LISTS[p]);
const previous = JSON.parse(fs.readFileSync(fs.existsSync(out) ? out : SEED_REGISTER, "utf8"));

const { snapshot, results } = await syncRegister(previous, { prefixes });
if (Object.values(results).some((r) => r.ok)) {
  writeSnapshot(out, snapshot);
  console.log(`\nWrote ${snapshot.entries.length} entries -> ${out}`);
}
for (const [p, r] of Object.entries(results)) console.log(`  ${p}: ${r.ok ? "complete" : "FAILED"} - ${r.count} entries${r.ok ? "" : ` (${r.error})`}`);
process.exit(Object.values(results).every((r) => r.ok) ? 0 : 1);
