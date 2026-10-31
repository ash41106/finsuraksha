import express from "express";
import { analyzeMessage, analyzeLink, displayEntity } from "../analyzer.js";
import { verifyRegNo, validateRegNo, searchRegister, analyzeUpi, registerInfo, setRegisterExtras, SEBI_LINKS } from "../sebi.js";
import { requireModerator } from "../auth.js";
import { byUserOrIp } from "../security.js";
import { checkApp } from "../apps.js";
import { str, asyncRoute, HttpError } from "../validate.js";

// Quick Check: one search box for a SEBI number, adviser name, UPI ID, link,
// phone number or social handle.
function detectType(q) {
  const s = q.trim();
  if (/^IN[\s-]?[AHZPM]/i.test(s) && /\d{3,}/.test(s)) return "sebi";
  if (/^[a-z0-9][a-z0-9._-]{1,63}@[a-z][a-z0-9]{2,30}$/i.test(s)) return "upi";
  if (/^(?:\+?91|0)?[\s-]?[6-9]\d{4}[\s-]?\d{5}$/.test(s)) return "phone";
  if (/^@[a-z0-9_.]{3,30}$/i.test(s)) return "handle";
  if (/^(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/?#]\S*)?$/i.test(s)) return "link";
  return "name";
}

export function checkRoutes({ store, cfg, limit }) {
  const r = express.Router();

  r.get(
    "/check",
    limit("check", 150, 10 * 60_000, byUserOrIp),
    asyncRoute(async (req, res) => {
      const q = str(req.query.q, { field: "Search", min: 2, max: 300, required: true });
      const type = detectType(q);
      const out = { query: q, type, register: registerInfo(), links: SEBI_LINKS };
      if (type === "sebi") out.sebi = await verifyRegNo(q, cfg);
      if (type === "upi") out.upi = analyzeUpi(q);
      if (type === "link") out.link = analyzeLink(q);
      if (type === "name") {
        out.matches = searchRegister(q);
        out.app = checkApp(q);
      }
      if (type === "phone") out.phone = displayEntity("phone", q);
      // Community + red-flag pass over the same input.
      const a = await analyzeMessage(q, { store, cfg, lang: req.query.lang === "hi" ? "hi" : "en" });
      out.community = a.checks.community;
      out.flags = a.flags.filter((f) => !["group_invite"].includes(f.id)).map(({ id, sev, title, why }) => ({ id, sev, title, why }));
      out.score = a.score;
      out.level = a.level;
      // A clone of a real broker's app is high risk on its own.
      if (out.app?.verdict === "impersonation") {
        out.score = Math.max(out.score, 70);
        out.level = "high";
      }
      if (out.link && a.checks.links[0]) out.link.safeBrowsing = a.checks.links[0].safeBrowsing || (cfg.safeBrowsingKey ? "unavailable" : "not_configured");
      res.json(out);
    }),
  );

  r.get("/sebi/search", limit("sebi", 120, 10 * 60_000, byUserOrIp), (req, res) => {
    const q = str(req.query.q, { field: "Search", min: 2, max: 120, required: true });
    res.json({ results: searchRegister(q, 12), register: registerInfo() });
  });

  // A moderator adds an entity that registered after the last import, once they
  // have seen its SEBI registration certificate.
  r.post("/sebi/register", requireModerator, limit("register-add", 30, 60 * 60_000), (req, res) => {
    const check = validateRegNo(str(req.body?.regNo, { field: "Registration number", max: 20, required: true }));
    if (!check.valid) throw new HttpError(400, check.reason || "Not a valid SEBI registration number.");
    const name = str(req.body?.name, { field: "Name", min: 2, max: 200, required: true });
    const list = store.data.registerAdditions.filter((e) => e.regNo !== check.normalized);
    const entry = { regNo: check.normalized, name, type: check.type, addedBy: req.user.id, addedAt: new Date().toISOString() };
    list.push(entry);
    store.data.registerAdditions = list;
    setRegisterExtras(list);
    store.save();
    res.json({ ok: true, entry: { regNo: entry.regNo, name: entry.name, type: entry.type }, register: registerInfo() });
  });

  return r;
}
