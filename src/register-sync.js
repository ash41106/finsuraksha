// Daily refresh of the SEBI register. The synced copy lives in the data folder
// (DATA_DIR/sebi_register.json), so it survives redeploys; the snapshot in
// seed/ is only the starting point for a fresh server.
import fs from "node:fs";
import path from "node:path";
import { loadRegister, currentSnapshot, SEED_REGISTER } from "./sebi.js";
import { syncRegister, writeSnapshot } from "./sebi-sync.js";

const DAY = 24 * 60 * 60_000;

export function scheduleRegisterSync(cfg) {
  const file = path.join(cfg.dataDir, "sebi_register.json");
  // Use whichever copy is newer: the synced one, or a newer seed after a deploy.
  const synced = fs.existsSync(file) ? fs.statSync(file).mtimeMs : 0;
  if (synced && synced >= fs.statSync(SEED_REGISTER).mtimeMs) loadRegister(file);
  if (!cfg.sebiSync) return null;

  let running = false;
  async function run() {
    if (running) return;
    running = true;
    try {
      const log = cfg.quiet ? () => {} : (m) => console.log(`[register] ${m}`);
      const { snapshot, results } = await syncRegister(currentSnapshot(), { log });
      if (Object.values(results).some((r) => r.ok)) {
        writeSnapshot(file, snapshot);
        loadRegister(file);
      }
    } catch (err) {
      console.error(`[register] sync failed: ${err.message}`);
    } finally {
      running = false;
    }
  }
  // Skip the start-up sync while the copy is less than a day old.
  const age = Date.now() - Date.parse(currentSnapshot().syncedAt || "");
  const first = setTimeout(run, Number.isFinite(age) && age < DAY ? DAY - age : 60_000);
  first.unref?.();
  const timer = setInterval(run, DAY);
  timer.unref?.();
  return { run, file };
}
