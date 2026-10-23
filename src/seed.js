// First-run sample data so the community features aren't empty in a demo.
// Everything seeded here is flagged `sample: true` / `isSample: true` and the UI
// labels it as sample data. Disable with SEED_DEMO=false.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { hashPassword } from "./auth.js";
import { analyzeMessage, entityKeys } from "./analyzer.js";
import { grantBadges } from "./gamify.js";
import { LEARN_MODULES } from "./constants.js";

const HUNTERS = [
  ["Aarav S.", "student", "Sunrise College of Commerce"],
  ["Diya K.", "student", "Riverside Institute of Technology"],
  ["Kabir M.", "student", "Lakeview University"],
  ["Ishita R.", "student", "Sunrise College of Commerce"],
  ["Rohan P.", "investor", "Greenfield Arts & Science College"],
  ["Meera J.", "student", "Riverside Institute of Technology"],
  ["Arjun T.", "student", "Lakeview University"],
  ["Sana Q.", "senior", ""],
];

// [category, platform, entityType, entityValue, link, description, status, daysAgo, reporter, votes{confirm,legit,info}]
const REPORTS = [
  ["fno_tips", "telegram", "telegram", "t.me/+NiftySureShotVIP", "https://t.me/+NiftySureShotVIP", "Channel promises 'guaranteed 300 points daily in BankNifty' and asks a ₹4,999 VIP membership fee via a personal UPI ID. Admin says the group is 'SEBI approved' but shows no registration number.", "verified", 40, 0, [4, 0, 0]],
  ["dabba", "app", "app", "TradeKing Pro", "", "App shared in a WhatsApp group: 'Trade without demat, 500x leverage, no tax, instant cash settlement'. The download link was an APK file, not the Play Store.", "verified", 33, 1, [5, 0, 1]],
  ["finfluencer", "instagram", "handle", "@crorepati.trader.official", "", "Reels claim 'my students made ₹2 lakh in a week' and sell paid option calls with 'guaranteed 20% monthly returns'. The bio has no SEBI registration number.", "verified", 28, 2, [4, 1, 0]],
  ["phishing", "website", "url", "zer0dha-kyc-update.top", "https://zer0dha-kyc-update.top/login", "SMS said 'Your demat account will be blocked today, update KYC' with this link. The page copies a broker login screen and then asks for the OTP.", "verified", 21, 3, [6, 0, 0]],
  ["fake_app", "whatsapp", "whatsapp", "Institutional IPO Club 88", "", "WhatsApp group shares daily tips, then asks members to install an app from a link and open an 'institutional account' for guaranteed IPO allotment. The app shows 3x profit but withdrawal needs 15% advance tax.", "verified", 16, 4, [5, 0, 0]],
  ["pump_dump", "youtube", "handle", "@MultibaggerOperatorCalls", "", "Videos push an unknown penny stock as an 'operator stock, upper circuit for 10 days, buy before the news'. The price crashed a week later.", "verified", 12, 5, [4, 0, 1]],
  ["ponzi", "telegram", "telegram", "t.me/DailyIncomeClub", "https://t.me/DailyIncomeClub", "'Invest ₹10,000 and get ₹500 daily plus level income for adding members.' Withdrawals were blocked after two weeks.", "verified", 9, 6, [4, 0, 0]],
  ["forex_crypto", "instagram", "handle", "@forex.signals.king", "", "DMs offering forex signals with 'guaranteed 5% daily' on an overseas platform and asking for a deposit in USDT.", "verified", 6, 7, [3, 0, 0]],
  ["deepfake", "facebook", "other", "Quantum AI investment ad", "", "Video ad uses a famous businessman's face saying the Quantum AI platform turns ₹21,000 into ₹2 lakh in a month. Comments are turned off.", "pending", 4, 0, [2, 0, 0]],
  ["phishing", "call_sms", "upi", "investprofit.vip@ybl", "", "Caller posing as broker support asked me to pay an 'account activation fee' to this UPI ID to open an institutional trading account.", "pending", 3, 2, [2, 0, 1]],
  ["fno_tips", "telegram", "telegram", "t.me/BankNiftyJackpotCalls", "https://t.me/BankNiftyJackpotCalls", "'Jackpot option calls with 100% accuracy.' Charges ₹2,999 per week. Asks members to send money to the admin's personal account.", "pending", 2, 5, [1, 0, 1]],
];

function rng(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export async function seedIfEmpty(store, cfg) {
  const d = store.data;
  if (d.users.length || d.reports.length) return null;
  const now = Date.now();
  const iso = (daysAgo, hours = 0) => new Date(now - daysAgo * 864e5 - hours * 36e5).toISOString();

  // Moderator with a random password (printed once and saved locally).
  const modPassword = crypto.randomBytes(9).toString("base64url");
  const moderator = {
    id: store.id("usr"),
    name: "FinSuraksha Moderator",
    email: "moderator@finsuraksha.local",
    passHash: await hashPassword(modPassword),
    role: "other",
    college: "",
    collegeKey: "",
    leaderboard: false,
    isModerator: true,
    points: 0,
    badges: [],
    learned: [],
    quiz: { best: 0, lastDay: null, attempts: 0 },
    consentAt: iso(45),
    createdAt: iso(45),
  };
  d.users.push(moderator);

  const hunters = HUNTERS.map(([name, role, college], i) => ({
    id: store.id("usr"),
    name,
    email: `sample${i + 1}@finsuraksha.local`,
    passHash: "disabled",
    role,
    college,
    collegeKey: college.toLowerCase(),
    leaderboard: true,
    isModerator: false,
    isSample: true,
    points: 0,
    badges: [],
    learned: LEARN_MODULES.slice(0, 3 + (i % 5)),
    quiz: { best: i % 3 === 0 ? 1 : 0.8, lastDay: null, attempts: 2 },
    consentAt: iso(50),
    createdAt: iso(50 - i),
  }));
  d.users.push(...hunters);

  for (const [category, platform, entityType, entityValue, link, description, status, daysAgo, reporterIdx, [confirm, legit, info]] of REPORTS) {
    const reporter = hunters[reporterIdx];
    const a = await analyzeMessage([entityValue, link, description].filter(Boolean).join("\n"), { lang: "en" });
    const rep = {
      id: store.id("rep"),
      createdAt: iso(daysAgo, 3),
      reporterId: reporter.id,
      category,
      platform,
      entityType,
      entityValue,
      link,
      description,
      ocrText: "",
      evidence: null,
      matchKeys: entityKeys(entityType, entityValue, link),
      analysis: {
        score: a.score,
        level: a.level,
        flags: a.flags.slice(0, 8).map((f) => ({ id: f.id, sev: f.sev, title: f.title })),
        sebi: [],
        disclosedRegistration: false,
        guaranteedReturns: a.flags.some((f) => f.id === "guaranteed" || f.id === "high_return"),
      },
      status,
      votes: { confirm, legit, info },
      supporters: [],
      notes: [],
      underReview: false,
      resolvedAt: status === "verified" ? iso(Math.max(0, daysAgo - 2)) : null,
      resolvedBy: status === "verified" ? "community" : undefined,
      sample: true,
    };
    d.reports.push(rep);
    const voters = hunters.filter((h) => h.id !== reporter.id);
    let k = reporterIdx;
    const castVote = (vote) => {
      const voter = voters[k++ % voters.length];
      d.votes.push({ reportId: rep.id, userId: voter.id, vote, reason: "", createdAt: iso(Math.max(0, daysAgo - 1)) });
    };
    for (let i = 0; i < confirm; i++) castVote("confirm");
    for (let i = 0; i < legit; i++) castVote("legit");
    for (let i = 0; i < info; i++) castVote("info");
  }

  // Points consistent with the seeded history (same rules as live play).
  for (const h of hunters) {
    const mine = d.reports.filter((r) => r.reporterId === h.id);
    const verified = mine.filter((r) => r.status === "verified").length;
    const myVotes = d.votes.filter((v) => v.userId === h.id);
    const aligned = myVotes.filter((v) => d.reports.find((r) => r.id === v.reportId)?.status === "verified" && v.vote === "confirm").length;
    h.points = mine.length * 2 + verified * 40 + myVotes.length + aligned * 4 + h.learned.length * 2 + 10;
    grantBadges(store, h, LEARN_MODULES.length);
  }

  // Sample anonymous check counters for the last 14 days.
  const rand = rng(42);
  const c = d.counters;
  for (let i = 13; i >= 1; i--) {
    const day = new Date(now - i * 864e5).toISOString().slice(0, 10);
    const checks = 18 + Math.round(rand() * 40);
    const flagged = Math.round(checks * (0.38 + rand() * 0.2));
    c.daily[day] = { checks, flagged };
    c.checks += checks;
  }
  const total = c.checks;
  c.verdicts = { high: Math.round(total * 0.31), medium: Math.round(total * 0.19), low: Math.round(total * 0.41), unknown: Math.round(total * 0.09) };
  c.flags = { guaranteed: 128, group_invite: 117, urgency: 96, pay_personal: 83, unregistered_tips: 71, credentials: 62, upi_personal: 47, institutional: 36, link_shortener: 31, dabba: 26 };
  d.meta.sampleData = true;
  d.meta.seededAt = new Date().toISOString();
  store.flush();

  const credFile = path.join(store.dataDir, "FIRST_RUN_CREDENTIALS.txt");
  fs.writeFileSync(
    credFile,
    `FinSuraksha moderator account (created on first run)\nEmail:    ${moderator.email}\nPassword: ${modPassword}\n\nDelete data/db.json to reset everything.\n`,
  );
  return { email: moderator.email, password: modPassword, file: credFile };
}
