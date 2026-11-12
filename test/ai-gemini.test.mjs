// AI mode with Google Gemini, tested offline against a fake fetch: we check the
// exact generateContent request we send and how the reply is merged - no network.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../src/app.js";

let server;
let base;
let ctx;
let dir;
const seen = [];
let nextReply = null;

const AI_JSON = {
  mode: "check",
  verdict: "high_risk",
  risk_score: 90,
  headline: "This shows signs of an investment scam.",
  reply: "It promises **guaranteed returns** and asks you to pay a personal UPI ID.",
  red_flags: [{ title: "Guaranteed returns", why: "No real investment can promise a fixed profit." }],
  actions: ["Do not pay.", "Call 1930 if you already paid."],
  audio_summary: "This message shows signs of a scam. Do not pay anyone.",
};
const gen = (obj, finishReason = "STOP") => ({
  candidates: [{ content: { role: "model", parts: [{ text: typeof obj === "string" ? obj : JSON.stringify(obj) }] }, finishReason }],
  modelVersion: "gemini-2.5-flash",
});

function fakeFetch(url, init) {
  seen.push({ url: String(url), headers: init.headers, body: JSON.parse(init.body) });
  const { status = 200, body = gen(AI_JSON) } = nextReply || {};
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));
}

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "finsuraksha-gemini-"));
  ctx = await createApp({ dataDir: dir, seedDemo: false, rateLimits: false, quiet: true, aiEnabled: true, aiProvider: "gemini", geminiKey: "AIza_test", aiModel: "gemini-2.5-flash", aiEffort: "low", aiFetch: fakeFetch });
  server = ctx.app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  ctx.store.flush();
  fs.rmSync(dir, { recursive: true, force: true });
});

const post = async (body) => {
  const r = await fetch(`${base}/api/dost/analyze`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ useAi: true, ...body }) });
  return { status: r.status, body: await r.json() };
};

test("Gemini request: endpoint, key header, JSON schema, no thinking at low effort, PII masked", async () => {
  seen.length = 0;
  nextReply = null;
  const r = await post({ lang: "hi", message: "Guaranteed 30% monthly returns! Pay joining fee to 9876543210@ybl or call 9876543210 now", history: [{ role: "user", text: "hi" }, { role: "assistant", text: "Hello" }] });
  assert.equal(r.status, 200);
  const req = seen[0];
  assert.equal(req.url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
  assert.equal(req.headers["x-goog-api-key"], "AIza_test");
  const g = req.body.generationConfig;
  assert.equal(g.responseMimeType, "application/json");
  assert.deepEqual(g.responseSchema.required, ["mode", "verdict", "risk_score", "headline", "reply", "red_flags", "actions", "audio_summary"]);
  assert.ok(!JSON.stringify(g.responseSchema).includes("additionalProperties"), "Gemini schema must not use additionalProperties");
  assert.equal(g.thinkingConfig.thinkingBudget, 0);
  assert.match(req.body.systemInstruction.parts[0].text, /Suraksha-Dost/);
  assert.deepEqual(req.body.contents.map((c) => c.role), ["user", "model", "user"]);
  const sent = JSON.stringify(req.body.contents);
  assert.ok(!sent.includes("9876543210"), "phone number must be masked before it reaches Gemini");
  assert.match(sent, /Hindi/);
  assert.equal(r.body.ai.used, true);
  assert.match(r.body.ai.model, /gemini/);
});

test("Gemini reads a screenshot only with consent, sent as inline_data", async () => {
  seen.length = 0;
  nextReply = null;
  const png = "data:image/png;base64," + Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]).toString("base64");
  const noConsent = await post({ message: "", image: png });
  assert.equal(noConsent.status, 400);
  assert.equal(seen.length, 0);
  const r = await post({ message: "is this real?", image: png, imageConsent: true });
  assert.equal(r.status, 200);
  const parts = seen[0].body.contents.at(-1).parts;
  assert.equal(parts[1].inline_data.mime_type, "image/png");
  const cfg = await (await fetch(`${base}/api/config`)).json();
  assert.equal(cfg.aiVision, true);
});

test("Gemini errors and cut-off answers fall back to the rule-based verdict", async () => {
  nextReply = { status: 429, body: { error: { code: 429, message: "Resource exhausted" } } };
  const a = await post({ message: "Guaranteed 30% monthly returns, pay to 9876543210@ybl" });
  assert.equal(a.status, 200);
  assert.equal(a.body.ai.used, false);
  assert.ok(a.body.score >= 60);
  nextReply = { body: gen('{"mode":"check","verd', "MAX_TOKENS") };
  const b = await post({ message: "Guaranteed 30% monthly returns, pay to 9876543210@ybl" });
  assert.equal(b.body.ai.used, false);
  nextReply = null;
});
