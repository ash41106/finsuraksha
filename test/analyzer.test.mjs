import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeMessage, analyzeLink } from "../src/analyzer.js";
import { redact } from "../src/redact.js";
import { validateRegNo, analyzeUpi } from "../src/sebi.js";
import { runAssistant, withVerified } from "../src/assistant.js";

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

// What students, first-time investors and senior citizens actually paste or ask.
test("everyday scams in English, Hinglish and Hindi are high risk", async () => {
  const cases = [
    "Sir aapka KYC expire ho gaya hai, OTP batao",
    "OTP bata do sir, refund aa jayega",
    "ओटीपी बताइए वरना खाता बंद हो जाएगा",
    "Dear customer your electricity will be disconnected tonight at 9.30 pm, call 9876543210",
    "बिजली बिल बकाया है, आज रात कनेक्शन कट जाएगा, इस नंबर पर कॉल करें",
    "Earn ₹5000 daily by liking YouTube videos. pay ₹500 registration",
    "Bhai ek app hai jisme 2 din me paisa double hota hai, link: bit.ly/dbl",
    "my students got guaranteed 30% monthly returns",
    "You have received a cashback of ₹4,999! Enter your UPI PIN to receive the money in your account.",
    "भाई, बिना डीमैट ट्रेड करो! 500 गुना लीवरेज, कोई टैक्स नहीं, हर शाम तुरंत नकद मुनाफ़ा।",
  ];
  for (const c of cases) assert.equal(await level(c, /[ऀ-ॿ]/.test(c) ? "hi" : "en"), "high", c);
});

test("genuine alerts and ordinary questions are not flagged", async () => {
  const cases = [
    "OTP 482913 for your login is valid for 3 minutes. Do not share it with anyone; bank staff will never ask for it.",
    "Reminder: your KYC is due for its periodic update. Update it from Profile → KYC inside this app. We will never ask for your OTP or password.",
    "Your contract note is attached as a password-protected PDF. We will never ask you to send us your password or OTP.",
    "रजिस्टर्ड रिसर्च एनालिस्ट। SEBI द्वारा दिया गया रजिस्ट्रेशन किसी भी तरह प्रदर्शन की गारंटी नहीं है।",
    "Mera SIM card band ho gaya, naya kaise milega?",
    "Light chali gayi hai, power cut hai area mein",
    "what is dabba trading?",
    "My broker says there is no tax on mutual fund SIP below 1 lakh, is it true?",
    "How do I enter my UPI PIN safely to pay my electricity bill?",
  ];
  for (const c of cases) assert.ok(["low", "unknown"].includes(await level(c, /[ऀ-ॿ]/.test(c) ? "hi" : "en")), c);
});

test("FinSuraksha verifies SEBI numbers and @valid UPI IDs itself", async () => {
  const upi = await runAssistant({ message: "My broker asked me to pay margin to abc.brk@validhdfc. Is that okay?", lang: "en", cfg: { quiet: true } });
  assert.match(upi.actions[0], /Verified by FinSuraksha.*abc\.brk@validhdfc.*Stock broker, HDFC Bank/);
  const reg = await runAssistant({ message: "My adviser INA000000888 wants fees", lang: "en", cfg: { quiet: true } });
  assert.match(reg.actions[0], /Verified by FinSuraksha.*INA000000888.*360 ONE/);
  for (const r of [upi, reg]) assert.ok(!r.actions.some((a) => /intermediary search|SEBI Check|sebi\.gov\.in/i.test(a)));

  // AI-written "go verify on SEBI yourself" steps are replaced by the verified result.
  const a = await analyzeMessage("pay to abc.brk@validhdfc", {});
  const out = withVerified(["Verify the broker's registration on SEBI's intermediary search (sebi.gov.in).", "Check your financial statements monthly."], a, "en");
  assert.equal(out.length, 2);
  assert.match(out[0], /Verified by FinSuraksha/);
  assert.equal(out[1], "Check your financial statements monthly.");
});

test("complete register: a missing number is 'not registered'; lookup service fills gaps", async () => {
  const { loadRegister, verifyRegNo, registerInfo } = await import("../src/sebi.js");
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "fs-reg-")), "reg.json");
  try {
    // Partial register: unknown numbers are only "could not verify".
    fs.writeFileSync(file, JSON.stringify({ asOf: "Oct 20, 2026", partial: true, entries: [{ regNo: "INA000000888", name: "Real Adviser", type: "Investment Adviser" }] }));
    loadRegister(file);
    let a = await analyzeMessage("My adviser INA000012345 wants fees", {});
    assert.ok(a.flags.some((f) => f.id === "sebi_not_found"));
    assert.ok(!a.flags.some((f) => f.id === "sebi_not_registered"));

    // Complete register: unknown numbers are "not registered"; with a payment ask it's high risk.
    fs.writeFileSync(file, JSON.stringify({ asOf: "Oct 20, 2026", partial: false, entries: [{ regNo: "INA000000888", name: "Real Adviser", type: "Investment Adviser" }] }));
    loadRegister(file);
    assert.equal(registerInfo().complete, true);
    a = await analyzeMessage("SEBI adviser INA000012345: pay 5000 to 9876543210@ybl for guaranteed profit", {});
    assert.ok(a.flags.some((f) => f.id === "sebi_not_registered"));
    assert.equal(a.level, "high");

    // Lookup service: asked only for numbers we don't hold, answers cached.
    let calls = 0;
    const fakeFetch = async (url) => {
      calls++;
      const no = new URL(url).searchParams.get("regNo");
      return { ok: true, json: async () => (no === "INA000077777" ? { found: true, name: "Fresh Adviser", type: "Investment Adviser" } : { found: false }) };
    };
    const cfg = { sebiLookupUrl: "https://lookup.example/sebi", sebiLookupKey: "k" };
    const hit = await verifyRegNo("INA000077777", cfg, { fetch: fakeFetch });
    assert.equal(hit.verified, true);
    assert.equal(hit.name, "Fresh Adviser");
    await verifyRegNo("INA000077777", cfg, { fetch: fakeFetch });
    assert.equal(calls, 1, "second lookup comes from the cache");
    await verifyRegNo("INA000000888", cfg, { fetch: fakeFetch });
    assert.equal(calls, 1, "local hits never call the service");
    const down = await verifyRegNo("INA000066666", cfg, { fetch: async () => { throw new Error("down"); } });
    assert.equal(down.found, false, "service down falls back to the local answer");
  } finally {
    loadRegister(); // back to the bundled register for other tests
  }
});
