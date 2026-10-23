import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeMessage, analyzeLink } from "../src/analyzer.js";
import { redact } from "../src/redact.js";
import { validateRegNo, analyzeUpi } from "../src/sebi.js";

const level = async (text, lang = "en") => (await analyzeMessage(text, { lang })).level;

test("scam messages are flagged high risk", async () => {
  const cases = [
    "Dear customer, your demat KYC has expired and your account will be blocked today. Click https://bit.ly/kycupd and share the OTP.",
    "Download TradeKing Pro apk from tradeking-pro.xyz/app.apk - trade without demat, 500x leverage, no tax",
    "Open an institutional account in our app for guaranteed IPO allotment. Withdrawal needs 15% advance tax first.",
    "I am calling from CBI. A parcel in your name had drugs; you are under digital arrest. Transfer money for verification.",
    "Trade on Exness with 1:2000 leverage, forex signals guaranteed",
    "Narayana Murthy recommends Quantum AI trading platform, invest 21000 earn 2 lakh",
    "100% पक्का मुनाफ़ा! आज ही जुड़ें, फ़ीस जमा करें और रोज़ 2% कमाएँ",
  ];
  for (const c of cases) assert.equal(await level(c, /[ऀ-ॿ]/.test(c) ? "hi" : "en"), "high", c);
});

test("ordinary messages are not flagged", async () => {
  const cases = [
    "Your SIP of ₹2,000 was processed. Mutual fund investments are subject to market risks, read all scheme related documents carefully.",
    "Reminder: the quarterly results of the company will be announced on 25 October on the exchange website.",
    "Hi! Are we still meeting at 5 pm for the investment club study session at the library?",
    "No investment can guarantee returns, so always diversify and verify advisers on SEBI's website.",
  ];
  for (const c of cases) assert.equal(await level(c), "low", c);
});

test("negated guarantees don't trigger the guarantee flag", async () => {
  const a = await analyzeMessage("Registration granted by SEBI in no way guarantees performance of the intermediary.");
  assert.ok(!a.flags.some((f) => f.id === "guaranteed"));
});

test("link analysis", () => {
  const ids = (u) => analyzeLink(u).flags.map((f) => f.id);
  assert.ok(ids("https://zer0dha-kyc-update.top/login").includes("link_lookalike"));
  assert.ok(ids("http://192.168.10.4/upi").includes("link_ip"));
  assert.ok(ids("https://t.me/+AbCdEf123").includes("link_telegram_private"));
  assert.ok(ids("https://chat.whatsapp.com/Gx12").includes("link_whatsapp_group"));
  assert.ok(ids("files.example.com/app.apk").includes("link_apk"));
  assert.deepEqual(ids("https://kite.zerodha.com"), []);
  assert.deepEqual(ids("https://www.sebi.gov.in/intermediaries.html"), []);
  assert.equal(analyzeLink("https://scores.sebi.gov.in").official, true);
});

test("SEBI number format and @valid UPI", () => {
  assert.equal(validateRegNo("INH000011431").valid, true);
  assert.equal(validateRegNo("INA12345").valid, false);
  assert.equal(validateRegNo("XYZ000011431").valid, false);
  assert.equal(validateRegNo("INAIFSC10001").valid, true);
  assert.equal(analyzeUpi("abc.mf@validicici").category, "Mutual fund");
  assert.equal(analyzeUpi("rahul@okaxis").validHandle, false);
});

test("PII redaction keeps the useful part", () => {
  const { text, counts } = redact("Call 9876543210, mail me at a.b@gmail.com, OTP is 482913, PAN ABCDE1234F, pay to 9876543210@ybl, a/c 123456789012");
  assert.ok(!/9876543210|482913|ABCDE1234F|a\.b@gmail|123456789012/.test(text), text);
  assert.match(text, /\[upi\]@ybl/);
  assert.match(text, /OTP is \[code\]/);
  assert.ok(counts.phone >= 1 && counts.email === 1 && counts.otp === 1 && counts.pan === 1);
});
