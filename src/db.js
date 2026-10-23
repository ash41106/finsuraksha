// Tiny JSON-file data store. Everything lives in memory and is flushed to
// data/db.json (atomic write via temp file + rename). Good for a prototype and
// for a single Node process; swap this module for SQLite/Postgres in production.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const EMPTY = () => ({
  meta: { createdAt: new Date().toISOString(), version: 1 },
  users: [],
  sessions: [],
  reports: [],
  votes: [],
  appeals: [],
  certificates: [],
  // Anonymous aggregate counters only - never message content.
  counters: { checks: 0, verdicts: {}, flags: {}, daily: {} },
});

export function createStore(dataDir) {
  fs.mkdirSync(path.join(dataDir, "uploads"), { recursive: true });
  const file = path.join(dataDir, "db.json");
  let data = EMPTY();
  if (fs.existsSync(file)) {
    try {
      data = { ...EMPTY(), ...JSON.parse(fs.readFileSync(file, "utf8")) };
    } catch (err) {
      const backup = `${file}.corrupt-${Date.now()}`;
      fs.copyFileSync(file, backup);
      console.error(`[db] Could not parse ${file}; started fresh. Backup saved to ${backup}`);
    }
  }

  let timer = null;
  function flush() {
    clearTimeout(timer);
    timer = null;
    const tmp = `${file}.tmp`;
    const body = JSON.stringify(data);
    try {
      fs.writeFileSync(tmp, body);
      fs.renameSync(tmp, file);
    } catch {
      // Windows can refuse the rename while another process holds the file.
      try {
        fs.writeFileSync(file, body);
      } catch (err) {
        console.error(`[db] Could not save ${file}: ${err.message}`);
      }
    }
  }
  function save() {
    if (!timer) timer = setTimeout(flush, 150);
  }

  return {
    get data() {
      return data;
    },
    dataDir,
    uploadsDir: path.join(dataDir, "uploads"),
    save,
    flush,
    id: (prefix) => `${prefix}_${crypto.randomBytes(8).toString("hex")}`,
  };
}
