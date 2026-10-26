// Trading-app impersonation check. Clone apps of well-known brokers ("Zerodha
// Pro VIP", "Gr0ww Institutional") are spread as APK links in WhatsApp and
// Telegram groups, where Google Play's "Verified" badge never appears.

// Genuine apps of SEBI-registered brokers: [brand, official app names, aliases, official domains]
export const GENUINE_APPS = [
  { brand: "Zerodha", apps: ["Kite", "Coin", "Console"], aliases: ["zerodha", "kite"], domains: ["zerodha.com", "kite.zerodha.com"] },
  { brand: "Groww", apps: ["Groww"], aliases: ["groww"], domains: ["groww.in"] },
  { brand: "Upstox", apps: ["Upstox"], aliases: ["upstox"], domains: ["upstox.com"] },
  { brand: "Angel One", apps: ["Angel One"], aliases: ["angel one", "angelone", "angel broking"], domains: ["angelone.in"] },
  { brand: "ICICI Direct", apps: ["ICICI Direct", "iMobile"], aliases: ["icici direct", "icicidirect"], domains: ["icicidirect.com"] },
  { brand: "HDFC Securities", apps: ["HDFC Securities", "HDFC Sky"], aliases: ["hdfc securities", "hdfcsec", "hdfc sky"], domains: ["hdfcsec.com"] },
  { brand: "Kotak Securities", apps: ["Kotak Neo"], aliases: ["kotak neo", "kotak securities"], domains: ["kotaksecurities.com"] },
  { brand: "Paytm Money", apps: ["Paytm Money"], aliases: ["paytm money", "paytmmoney"], domains: ["paytmmoney.com"] },
  { brand: "5paisa", apps: ["5paisa"], aliases: ["5paisa"], domains: ["5paisa.com"] },
  { brand: "Motilal Oswal", apps: ["Motilal Oswal Riise"], aliases: ["motilal oswal", "motilaloswal"], domains: ["motilaloswal.com"] },
  { brand: "Sharekhan", apps: ["Sharekhan"], aliases: ["sharekhan"], domains: ["sharekhan.com"] },
];

// Words scam clones add to a real brand to sound exclusive.
const BAIT = "pro|vip|plus|prime|elite|premium|gold|max|institutional|institution|ipo|block\\s*deal|global|international|mod|apk|official\\s*vip|wealth\\s*club|smart\\s*money|ai|signals?|trader\\s*club";
const BAIT_RE = new RegExp(`\\b(?:${BAIT})\\b`, "i");

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const unLeet = (s) => s.replace(/0/g, "o").replace(/1/g, "l").replace(/3/g, "e").replace(/4/g, "a").replace(/\$/g, "s");

function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

// Which brand does this text name or imitate? exact: spelled right; misspelt: 1-2 letters off.
function findBrand(text) {
  const n = norm(text);
  const words = n.split(" ");
  for (const g of GENUINE_APPS) {
    for (const a of g.aliases) {
      if (new RegExp(`(?:^| )${a}(?: |$)`).test(n)) return { app: g, exact: true };
    }
  }
  for (const g of GENUINE_APPS) {
    for (const a of g.aliases.filter((x) => !x.includes(" ") && x.length >= 5)) {
      if (words.some((w) => w.length >= 4 && w !== a && (unLeet(w) === a || lev(unLeet(w), a) <= (a.length >= 7 ? 2 : 1)))) return { app: g, exact: false };
    }
  }
  return null;
}

// Quick Check: the user typed an app name.
export function checkApp(query) {
  const q = String(query || "").trim();
  const hit = findBrand(q);
  if (!hit) return null;
  const { app, exact } = hit;
  const bait = q.match(BAIT_RE)?.[0] || null;
  const apk = /\bapk\b|\.apk\b/i.test(q);
  const verdict = !exact || bait || apk ? "impersonation" : "genuine";
  return {
    query: q,
    brand: app.brand,
    officialApps: app.apps,
    officialDomains: app.domains,
    verdict,
    reason: !exact ? "misspelt" : apk ? "apk" : bait ? "bait" : null,
    bait,
  };
}

// Analyzer: clone-app names inside a pasted message.
export function findFakeApps(text) {
  const out = [];
  const t = String(text || "");
  for (const g of GENUINE_APPS) {
    for (const a of g.aliases) {
      const re = new RegExp(`\\b${a.replace(/ /g, "\\s+")}\\s+(?:${BAIT})\\b(?:\\s+app)?`, "gi");
      for (const m of t.matchAll(re)) out.push({ brand: g.brand, text: m[0] });
    }
  }
  return out;
}
