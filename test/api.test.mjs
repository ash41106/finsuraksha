import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../src/app.js";

const TINY_JPEG =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

let server;
let base;
let ctx;
let dir;

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "finsuraksha-test-"));
  ctx = await createApp({ dataDir: dir, seedDemo: false, rateLimits: false, quiet: true, aiEnabled: false, moderatorEmails: ["mod@test.local"], verifyThreshold: 3 });
  server = ctx.app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  ctx.store.flush();
  fs.rmSync(dir, { recursive: true, force: true });
});

function client() {
  let cookie = "";
  const call = async (method, url, body, headers = {}) => {
    const res = await fetch(base + url, {
      method,
      headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0].startsWith("fs_sid=;") ? "" : set.split(";")[0];
    const json = await res.json().catch(() => null);
    return { status: res.status, body: json, headers: res.headers };
  };
  return {
    get: (u, h) => call("GET", u, undefined, h),
    post: (u, b = {}, h) => call("POST", u, b, h),
    patch: (u, b = {}) => call("PATCH", u, b),
    del: (u, b = {}) => call("DELETE", u, b),
    get cookie() {
      return cookie;
    },
  };
}

const signupBody = (n, extra = {}) => ({ name: `Tester ${n}`, email: `t${n}@test.local`, password: "Passw0rd!", role: "student", college: "Test College", ageOk: true, consent: true, leaderboard: true, ...extra });

async function newUser(n, extra) {
  const c = client();
  const body = signupBody(n, extra);
  const r = await c.post("/api/auth/signup", body);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const login = await c.post("/api/auth/login", { email: body.email, password: body.password });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  return c;
}

test("security headers and config", async () => {
  const c = client();
  const r = await c.get("/api/config");
  assert.equal(r.status, 200);
  assert.equal(r.body.aiEnabled, false);
  assert.ok(r.body.register.count >= 1);
  const page = await fetch(`${base}/`);
  assert.match(page.headers.get("content-security-policy"), /default-src 'self'/);
  assert.equal(page.headers.get("x-frame-options"), "DENY");
  assert.equal(page.headers.get("x-content-type-options"), "nosniff");
});

test("CSRF guard rejects cross-origin and non-JSON writes", async () => {
  const r1 = await fetch(`${base}/api/dost/analyze`, { method: "POST", headers: { "content-type": "application/json", origin: "https://evil.example" }, body: "{}" });
  assert.equal(r1.status, 403);
  const r2 = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "email=a&password=b" });
  assert.equal(r2.status, 415);
});

test("signup validation, then sign in, session cookie and lockout", async () => {
  const c = client();
  assert.equal((await c.post("/api/auth/signup", signupBody(1, { ageOk: false }))).status, 400);
  assert.equal((await c.post("/api/auth/signup", signupBody(1, { consent: false }))).status, 400);
  assert.equal((await c.post("/api/auth/signup", signupBody(1, { password: "short" }))).status, 400);
  assert.equal((await c.post("/api/auth/signup", signupBody(1, { name: "<script>" }))).status, 400);
  const ok = await c.post("/api/auth/signup", signupBody(1));
  assert.equal(ok.status, 201);
  assert.equal(ok.body.created, true);
  assert.equal(ok.body.user.passHash, undefined, "password hash must never be sent");
  assert.equal(c.cookie, "", "sign-up does not sign in - the person signs in next");
  assert.equal((await c.get("/api/auth/me")).body.user, null);
  assert.equal((await c.post("/api/auth/login", { email: "T1@test.local", password: "Passw0rd!" })).status, 200, "email is case-insensitive");
  assert.ok(c.cookie.startsWith("fs_sid="));
  const rawToken = c.cookie.replace("fs_sid=", "");
  assert.ok(rawToken.length > 20);
  assert.equal((await c.get("/api/auth/me")).body.user.email, "t1@test.local");
  assert.equal((await c.post("/api/auth/signup", signupBody(1))).status, 409);

  await c.post("/api/auth/logout");
  assert.equal((await c.get("/api/auth/me")).body.user, null);

  const other = client();
  for (let i = 0; i < 5; i++) assert.equal((await other.post("/api/auth/login", { email: "t1@test.local", password: "wrong-pass1" })).status, 401);
  assert.equal((await other.post("/api/auth/login", { email: "t1@test.local", password: "Passw0rd!" })).status, 429, "locked after 5 failures");
  const third = client();
  assert.equal((await third.post("/api/auth/login", { email: "nobody@test.local", password: "Passw0rd!" })).status, 401);

  // Stored passwords are scrypt hashes, sessions are stored hashed.
  const u = ctx.store.data.users.find((x) => x.email === "t1@test.local");
  assert.match(u.passHash, /^scrypt\$/);
  assert.ok(!JSON.stringify(ctx.store.data).includes(rawToken), "raw session tokens are never stored");
});

test("Suraksha-Dost: scam, question, support and Hindi", async () => {
  const c = client();
  const scam = await c.post("/api/dost/analyze", {
    lang: "en",
    message: "URGENT! Join our VIP Telegram group t.me/+NiftySureShotVIP for guaranteed 30% monthly returns. Pay ₹4999 joining fee to investprofit.vip@ybl. Only 10 seats left!",
  });
  assert.equal(scam.status, 200);
  assert.equal(scam.body.mode, "check");
  assert.equal(scam.body.level, "high");
  const ids = scam.body.flags.map((f) => f.id);
  for (const id of ["guaranteed", "pay_personal", "urgency", "upi_personal", "link_telegram_private"]) assert.ok(ids.includes(id), `missing ${id}`);
  assert.ok(scam.body.actions.length >= 2);
  assert.ok(scam.body.audio.length > 20);

  const q = await c.post("/api/dost/analyze", { lang: "en", message: "What is dabba trading?" });
  assert.equal(q.body.mode, "question");
  assert.match(q.body.reply, /Securities Contracts/);

  const advice = await c.post("/api/dost/analyze", { lang: "en", message: "Which stock should I buy today?" });
  assert.equal(advice.body.mode, "question");
  assert.match(advice.body.reply, /can't recommend/);

  const sup = await c.post("/api/dost/analyze", { lang: "en", message: "I lost 50000 rupees to a fake trading app, please help" });
  assert.equal(sup.body.mode, "support");
  assert.match(sup.body.reply, /1930/);

  const hi = await c.post("/api/dost/analyze", { lang: "hi", message: "kya ye scam hai? 100% पक्का मुनाफ़ा, आज ही जुड़ें, फ़ीस जमा करें" });
  assert.equal(hi.body.mode, "check");
  assert.ok(["high", "medium"].includes(hi.body.level));
  assert.match(hi.body.headline, /[ऀ-ॿ]/, "Hindi headline");

  const legit = await c.post("/api/dost/analyze", { lang: "en", message: "Our research analyst INH000011431 publishes a monthly market note. Investments in securities market are subject to market risks." });
  assert.equal(legit.body.level, "low");
  assert.equal(legit.body.checks.sebi[0].found, true);

  const empty = await c.post("/api/dost/analyze", { lang: "en", message: "" });
  assert.equal(empty.status, 400);
  const imgNoAi = await c.post("/api/dost/analyze", { lang: "en", message: "x", image: TINY_JPEG, imageConsent: true });
  assert.equal(imgNoAi.status, 400, "image analysis requires AI mode");

  // Only anonymous counters are stored - never the message text.
  const db = JSON.stringify(ctx.store.data);
  assert.ok(!db.includes("NiftySureShotVIP"), "chat content must not be stored");
  assert.ok(ctx.store.data.counters.checks >= 2);
});

test("Quick Check: SEBI number, UPI, links", async () => {
  const c = client();
  const sebi = await c.get("/api/check?q=INA000017523");
  assert.equal(sebi.body.type, "sebi");
  assert.equal(sebi.body.sebi.found, true);
  assert.equal(sebi.body.sebi.type, "Investment Adviser");
  const bad = await c.get("/api/check?q=INA12345");
  assert.equal(bad.body.sebi.valid, false);
  const valid = await c.get(`/api/check?q=${encodeURIComponent("abc.brk@validhdfc")}`);
  assert.equal(valid.body.upi.validHandle, true);
  assert.equal(valid.body.upi.category, "Stock broker");
  const personal = await c.get(`/api/check?q=${encodeURIComponent("9876543210@ybl")}`);
  assert.equal(personal.body.upi.validHandle, false);
  const look = await c.get(`/api/check?q=${encodeURIComponent("https://zer0dha-kyc-update.top/login")}`);
  const lf = look.body.link.flags.map((f) => f.id);
  assert.ok(lf.includes("link_lookalike") && lf.includes("link_tld"));
  const official = await c.get(`/api/check?q=${encodeURIComponent("https://www.sebi.gov.in")}`);
  assert.equal(official.body.link.official, true);
  const apk = await c.get(`/api/check?q=${encodeURIComponent("bit.ly/abc123")}`);
  assert.ok(apk.body.link.flags.some((f) => f.id === "link_shortener"));
  const names = await c.get("/api/sebi/search?q=360%20ONE");
  assert.ok(names.body.results.length >= 1);
});

test("FinScam Hunter: report, dedupe, community verification, points, badges", async () => {
  const anon = client();
  assert.equal((await anon.post("/api/hunt/reports", {})).status, 401);

  const a = await newUser(10);
  const report = {
    category: "fno_tips",
    platform: "telegram",
    entityType: "telegram",
    entityValue: "t.me/JackpotCallsDemo",
    link: "https://t.me/JackpotCallsDemo",
    description: "Guaranteed 100% accuracy option calls, pay ₹2,999 to my UPI 9876543210@ybl <script>alert(1)</script>",
    consent: true,
    image: TINY_JPEG,
  };
  assert.equal((await a.post("/api/hunt/reports", { ...report, consent: false })).status, 400);
  const created = await a.post("/api/hunt/reports", report);
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const id = created.body.id;
  assert.equal(created.body.report.status, "pending");
  assert.ok(created.body.badges.includes("first_report"));
  const stored = ctx.store.data.reports.find((r) => r.id === id);
  assert.ok(!stored.description.includes("9876543210"), "personal numbers in free text are masked");
  assert.ok(stored.description.includes("<script>"), "stored as plain text; the UI escapes it");
  assert.ok(stored.analysis.guaranteedReturns);
  assert.equal(stored.analysis.disclosedRegistration, false);
  assert.ok(fs.existsSync(path.join(ctx.store.uploadsDir, stored.evidence)));

  // Public wall hides pending reports; evidence needs sign-in.
  assert.equal((await anon.get("/api/hunt/reports?status=pending")).status, 401);
  assert.equal((await anon.get(`/api/hunt/reports/${id}/evidence`)).status, 401);
  assert.equal((await a.get(`/api/hunt/reports/${id}`)).body.report.link, "hxxps://t[.]me/JackpotCallsDemo");

  // Same entity reported again -> merged as supporting evidence.
  const b = await newUser(11);
  const dup = await b.post("/api/hunt/reports", { ...report, entityValue: "@JackpotCallsDemo", entityType: "handle", link: "", image: undefined });
  assert.equal(dup.body.merged, true);
  assert.equal(dup.body.id, id);

  // Reporter and supporters can't vote; three others confirm -> verified.
  assert.equal((await a.post(`/api/hunt/reports/${id}/vote`, { vote: "confirm" })).status, 403);
  assert.equal((await b.post(`/api/hunt/reports/${id}/vote`, { vote: "confirm" })).status, 403);
  const voters = [await newUser(12), await newUser(13), await newUser(14)];
  let last;
  for (const v of voters) last = await v.post(`/api/hunt/reports/${id}/vote`, { vote: "confirm" });
  assert.equal((await voters[0].post(`/api/hunt/reports/${id}/vote`, { vote: "confirm" })).status, 409, "no double votes");
  assert.equal(last.body.resolved, "verified");

  const me = await a.get("/api/me");
  assert.equal(me.body.stats.verified, 1);
  assert.equal(me.body.user.points, 2 + 40);
  assert.ok(me.body.user.badges.includes("verified_hunter"));
  assert.ok(me.body.user.badges.includes("telegram_tracker"));
  const voterMe = await voters[0].get("/api/me");
  assert.equal(voterMe.body.user.points, 1 + 4, "vote + aligned-vote bonus");

  // Now public, and matched by Suraksha-Dost.
  const wall = await anon.get("/api/hunt/reports?status=verified");
  assert.ok(wall.body.reports.some((r) => r.id === id));
  const chat = await anon.post("/api/dost/analyze", { lang: "en", message: "Is t.me/JackpotCallsDemo genuine?" });
  assert.ok(chat.body.checks.community.some((m) => m.status === "verified"));
  assert.equal(chat.body.level, "high");

  // Leaderboard and stats.
  const lb = await anon.get("/api/hunt/leaderboard");
  assert.equal(lb.body.users[0].name, "Tester 10");
  assert.equal(lb.body.colleges[0].name, "Test College");
  const stats = await anon.get("/api/stats");
  assert.equal(stats.body.verified, 1);

  // Right of reply.
  const appeal = await anon.post(`/api/hunt/reports/${id}/appeal`, { name: "Channel owner", message: "This is an education channel, please review the report." });
  assert.equal(appeal.status, 201);
  assert.equal((await anon.get(`/api/hunt/reports/${id}`)).body.report.underReview, true);
});

test("moderation, certificate, export and account deletion", async () => {
  const mod = client();
  assert.equal((await mod.post("/api/auth/signup", signupBody(20, { email: "mod@test.local" }))).body.user.isModerator, true);
  assert.equal((await mod.post("/api/auth/login", { email: "mod@test.local", password: "Passw0rd!" })).status, 200);
  const user = await newUser(21);
  const rep = await user.post("/api/hunt/reports", {
    category: "dabba",
    platform: "app",
    entityType: "app",
    entityValue: "Dabba Pro Terminal",
    description: "Trade without demat, 500x leverage, no tax, cash settlement every evening.",
    consent: true,
  });
  assert.equal((await user.post(`/api/hunt/reports/${rep.body.id}/moderate`, { action: "verify" })).status, 403);
  assert.equal((await mod.post(`/api/hunt/reports/${rep.body.id}/moderate`, { action: "verify" })).status, 200);
  assert.equal((await mod.get("/api/hunt/appeals")).status, 200);

  // Not eligible yet -> 403; then give enough points -> certificate + public verification.
  assert.equal((await user.post("/api/me/certificate")).status, 403);
  ctx.store.data.users.find((u) => u.email === "t21@test.local").points = 200;
  const cert = await user.post("/api/me/certificate");
  assert.equal(cert.status, 200);
  const verify = await client().get(`/api/verify/${cert.body.certificate.id}`);
  assert.equal(verify.body.valid, true);
  assert.equal(verify.body.certificate.name, "Tester 21");
  assert.equal((await client().get("/api/verify/FS-NOTREAL")).status, 404);

  // Quiz + learn points are awarded once per day / module.
  assert.equal((await user.post("/api/me/quiz", { score: 10, total: 10 })).body.gained, 5);
  assert.equal((await user.post("/api/me/quiz", { score: 10, total: 10 })).body.gained, 0);
  assert.equal((await user.post("/api/me/learn", { moduleId: "dabba" })).body.gained, 2);
  assert.equal((await user.post("/api/me/learn", { moduleId: "dabba" })).body.gained, 0);
  assert.equal((await user.post("/api/me/learn", { moduleId: "nope" })).status, 400);

  const exp = await user.get("/api/me/export");
  assert.equal(exp.status, 200);
  assert.equal(exp.body.profile.passHash, undefined);
  assert.equal(exp.body.reports.length, 1);

  assert.equal((await user.del("/api/me", { password: "wrong" })).status, 401);
  assert.equal((await user.del("/api/me", { password: "Passw0rd!" })).status, 200);
  assert.equal((await user.get("/api/me")).status, 401);
  const anonymised = ctx.store.data.reports.find((r) => r.id === rep.body.id);
  assert.equal(anonymised.reporterId, null);
  assert.ok(!ctx.store.data.certificates.some((c) => c.id === cert.body.certificate.id));
});

test("rate limiter returns 429 when enabled", async () => {
  const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), "finsuraksha-rl-"));
  const app2 = await createApp({ dataDir: dir2, seedDemo: false, rateLimits: true, quiet: true, aiEnabled: false });
  const s2 = app2.app.listen(0);
  const url = `http://127.0.0.1:${s2.address().port}/api/check?q=INA000017523`;
  let status = 200;
  for (let i = 0; i < 62 && status !== 429; i++) status = (await fetch(url)).status;
  s2.close();
  app2.store.flush();
  fs.rmSync(dir2, { recursive: true, force: true });
  assert.equal(status, 429);
});

test("forgotten password: moderator reset, then the member sets a new one", async () => {
  const mod = client();
  await mod.post("/api/auth/signup", signupBody(40, { email: "mod@test.local" }));
  await mod.post("/api/auth/login", { email: "mod@test.local", password: "Passw0rd!" });
  const member = await newUser(41);
  assert.equal((await member.post("/api/auth/reset", { email: "t41@test.local" })).status, 403, "members can't reset others");
  assert.equal((await mod.post("/api/auth/reset", { email: "nobody@test.local" })).status, 404);
  const r = await mod.post("/api/auth/reset", { email: "T41@test.local" });
  assert.equal(r.status, 200);
  assert.match(r.body.tempPassword, /^[a-z]{6}\d{2}$/);
  assert.equal((await member.get("/api/auth/me")).body.user, null, "old sessions end on reset");

  const again = client();
  assert.equal((await again.post("/api/auth/login", { email: "t41@test.local", password: "Passw0rd!" })).status, 401);
  assert.equal((await again.post("/api/auth/login", { email: "t41@test.local", password: r.body.tempPassword })).status, 200);
  assert.equal((await again.post("/api/me/password", { current: "wrong-pass1", next: "NewPass123" })).status, 401);
  assert.equal((await again.post("/api/me/password", { current: r.body.tempPassword, next: "short" })).status, 400);
  assert.equal((await again.post("/api/me/password", { current: r.body.tempPassword, next: "नयापासवर्ड2024" })).status, 200, "non-Latin passwords are fine");
  assert.equal((await again.get("/api/auth/me")).body.user.email, "t41@test.local", "stays signed in after changing");
  assert.equal((await client().post("/api/auth/login", { email: "t41@test.local", password: "नयापासवर्ड2024" })).status, 200);
});

test("moderator adds a newly registered entity to the SEBI register", async () => {
  const mod = client();
  await mod.post("/api/auth/login", { email: "mod@test.local", password: "Passw0rd!" });
  const member = await newUser(51);
  const body = { regNo: "INA000099991", name: "New Advisers Pvt Ltd" };
  assert.equal((await member.post("/api/sebi/register", body)).status, 403, "members can't add");
  assert.equal((await mod.post("/api/sebi/register", { regNo: "INA123", name: "Bad" })).status, 400);
  assert.equal((await member.get("/api/check?q=INA000099991")).body.sebi.found, false);
  const r = await mod.post("/api/sebi/register", body);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const after = (await member.get("/api/check?q=INA000099991")).body.sebi;
  assert.equal(after.verified, true);
  assert.equal(after.name, "New Advisers Pvt Ltd");
  assert.ok(ctx.store.data.registerAdditions.some((e) => e.regNo === "INA000099991"), "saved in the database");
});
