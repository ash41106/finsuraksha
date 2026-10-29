// Retention rule for community reports: after 12 months a report keeps only
// what the Alert Wall needs (entity, category, status, vote counts). The
// reporter link, supporters, OCR text and evidence screenshot are removed.
import fs from "node:fs";
import path from "node:path";

export const REPORT_RETENTION_DAYS = 365;
const DAY = 24 * 60 * 60_000;

export function applyRetention(store, now = Date.now()) {
  let changed = 0;
  for (const rep of store.data.reports) {
    if (rep.anonymisedAt || now - Date.parse(rep.createdAt) < REPORT_RETENTION_DAYS * DAY) continue;
    if (rep.evidence) {
      try {
        fs.unlinkSync(path.join(store.uploadsDir, path.basename(rep.evidence)));
      } catch {
        /* already gone */
      }
    }
    rep.evidence = null;
    rep.reporterId = null;
    rep.supporters = [];
    rep.ocrText = "";
    rep.anonymisedAt = new Date(now).toISOString();
    changed++;
  }
  if (changed) store.save();
  return changed;
}

// Runs at startup and then once a day.
export function scheduleRetention(store) {
  applyRetention(store);
  const timer = setInterval(() => applyRetention(store), DAY);
  timer.unref?.();
  return timer;
}
