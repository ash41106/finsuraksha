// Rule-based scam analysis engine: text red flags (English, Hindi, Hinglish),
// link analysis, SEBI number checks, @valid UPI checks, community matches and
// an optional Google Safe Browsing lookup. Deterministic and explainable - it
// runs on every request, and grounds the AI mode when that is enabled.
import { FLAG_TEXT, POSITIVE_TEXT } from "./knowledge.js";
import { extractRegNos, verifyRegNo, analyzeUpi, UPI_RE } from "./sebi.js";
import { maskPhone } from "./redact.js";

// id -> [severity, weight]
export const META = {
  guaranteed: ["high", 30],
  high_return: ["high", 25],
  urgency: ["medium", 15],
  insider: ["medium", 20],
  institutional: ["high", 25],
  pay_personal: ["high", 30],
  withdrawal_fee: ["high", 30],
  credentials: ["critical", 35],
  remote_apk: ["critical", 30],
  authority: ["high", 25],
  threat: ["critical", 35],
  dabba: ["high", 30],
  unregistered_tips: ["medium", 20],
  group_invite: ["low", 10],
  fake_proof: ["low", 10],
  forex_crypto: ["medium", 15],
  rbi_alert: ["high", 25],
  celebrity: ["high", 30],
  ponzi: ["medium", 15],
  utility_threat: ["critical", 35],
  task_job: ["high", 30],
  link_apk: ["critical", 35],
  link_shortener: ["medium", 12],
  link_lookalike: ["high", 30],
  link_ip: ["high", 25],
  link_punycode: ["high", 25],
  link_tld: ["low", 8],
  link_http: ["low", 5],
  link_telegram_private: ["medium", 12],
  link_whatsapp_group: ["medium", 12],
  link_userinfo: ["high", 25],
  safe_browsing: ["critical", 50],
  sebi_bad_format: ["high", 30],
  sebi_not_found: ["medium", 12],
  sebi_not_registered: ["high", 35],
  sebi_claim_no_number: ["medium", 15],
  upi_personal: ["high", 25],
  community_verified: ["critical", 35],
  community_pending: ["medium", 10],
};
const POS_WEIGHT = { risk_disclaimer: 5, sebi_found: 10, upi_valid: 10, official_link: 5 };
const SEV_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };

// ---- Text patterns --------------------------------------------------------
// Devanagari has no \b in JS regex, so Hindi alternatives are plain substrings.
// Input is NFC-normalised, which splits nukta letters (फ़ -> फ + U+093C), so the
// patterns spell nukta as an optional ़.
const P = {
  guaranteed: [
    /\bguarantee(?:d|s)?\b/gi,
    /\b(?:100|hundred)\s?%\s?(?:sure|safe|guaranteed|profit|returns?|accurate|accuracy|success|winning)\b/gi,
    /\b(?:assured|fixed|confirmed)\s+(?:daily\s+|weekly\s+|monthly\s+)?(?:returns?|profits?|income|payouts?)\b/gi,
    /\b(?:assured|fixed|confirmed|guaranteed)\s+\d{1,3}(?:\.\d+)?\s?%\s*(?:daily\s+|weekly\s+|monthly\s+)?(?:returns?|profits?|income|interest)\b/gi,
    /\b(?:100|hundred)\s?%\s?सटीक|सटीक\s*(?:कॉल|टिप)|पक्का\s*(?:\d+\s*%|IPO|आईपीओ|अलॉटमेंट|रिटर्न)|अपर\s*सर्किट\s*लगेगा/gi,
    /\b(?:risk[- ]?free|zero[- ]?risk|no[- ]?risk|no[- ]?loss|loss[- ]?free)\b/gi,
    /\b(?:double|triple|2x|3x|10x)\s+(?:your\s+)?(?:money|investment|capital|amount)\b/gi,
    /\bmoney\s+(?:will\s+)?(?:be\s+)?double[ds]?\b/gi,
    /\bpaisa\s+(?:double|dugna|dogna|doguna)\b/gi,
    /\b(?:pakka|pakki)\s+(?:profit|munafa|kamai|return)/gi,
    /गारंटी|पक्का\s*मुनाफ़?ा|पक्की\s*कमाई|दोगुना|दुगना|पैसा\s*डबल|बिना\s*जोखिम|100\s*%\s*(?:पक्का|सुरक्षित)/g,
  ],
  urgency: [
    /\b(?:limited|few|last|only\s+\d+)\s+(?:seats?|slots?|spots?|places?|members?)\b/gi,
    /\b(?:only|just)\s+(?:today|tonight|for\s+today)\b/gi,
    /\btoday\s+only\b/gi,
    /\b(?:last|final)\s+(?:chance|call|day|opportunity)\b/gi,
    /\b(?:hurry|act\s+now|join\s+now|urgent(?:ly)?|asap|don'?t\s+miss|before\s+it'?s\s+too\s+late)\b/gi,
    /\b(?:within|in\s+the\s+next|in)\s+\d+\s*(?:mins?|minutes|hours?|hrs?)\b/gi,
    /\boffer\s+(?:ends|expires|valid\s+till)\b/gi,
    /\b(?:jaldi|abhi)\s+(?:karo|join|kare|karein|kijiye)\b/gi,
    /सीटें\s*बच|तुरंत\s*(?:KYC|केवाईसी|अपडेट|भेज|जमा|कॉल)|घंटे\s*के\s*लिए|मौक़?ा\s*सीमित/gi,
    /जल्दी\s*कर|आज\s*ही|सिर्फ़?\s*आज|अभी\s*जुड़?|आख़?िरी\s*मौक़?ा|सीमित\s*सीट/g,
  ],
  insider: [
    /\b(?:insider|inside)\s+(?:news|info|information|tips?|calls?)\b/gi,
    /\boperators?\s+(?:call|game|stocks?|tips?|news|driven|based|entry)\b/gi,
    /\b(?:jackpot|sure[- ]?shot)\b/gi,
    /\bmultibagger\s+(?:guaranteed|confirmed|sure|pakka)\b/gi,
    /\bupper\s+circuit\b/gi,
    /\bipo\s+(?:allotment|allocation|quota)\s+(?:is\s+)?(?:guaranteed|confirmed|assured|100%|sure|pakka)\b/gi,
    /\b(?:guaranteed|confirmed|assured)\s+ipo\b/gi,
    /\bpre[- ]?ipo\s+(?:shares?|allotment|quota|offer)\b/gi,
    /\bblock\s+deals?\s+(?:tips?|offer|access|allotment|shares?)\b/gi,
    /\b(?:btst|stbt)\b/gi,
    /\b(?:leak(?:ed)?|secret)\s+(?:news|tips?|stock|info)\b/gi,
    /अंदर\s*की\s*ख़?बर|ऑपरेटर|पक्की\s*टिप|जैकपॉट|अपर\s*सर्किट/g,
  ],
  institutional: [
    /\binstitutional\s+(?:trading\s+)?(?:account|a\/c|quota|investor\s+account|channel|seats?)\b/gi,
    /\b(?:fii|qib|dii)\s+(?:account|quota|channel)\b/gi,
    /\b(?:vip|special|exclusive|privileged)\s+(?:trading\s+)?account\b/gi,
    /\botc\s+(?:trading|stocks?|shares?)\b/gi,
    /\bdiscount(?:ed)?\s+(?:shares?|stocks?|ipo)\b/gi,
    /इंस्टीट्यूशनल\s*(?:अकाउंट|खाता)/g,
  ],
  pay_personal: [
    /\b(?:send|transfer|pay|deposit)\b[^.\n]{0,40}\b(?:personal|my|this|below|following|given)\s+(?:upi|account|a\/c|number|qr|gpay|phonepe|paytm)\b/gi,
    /\b(?:joining|registration|membership|activation|subscription|onboarding|entry)\s+(?:fees?|charges?|amount)\b/gi,
    /\bvip\s+(?:membership|plan|tier|group|access|package|subscription|channel)\b/gi,
    /\b(?:premium|paid)\s+(?:group|channel|membership|calls)\b/gi,
    /\b(?:paise|paisa|amount)\s+(?:bhejo|bhejiye|transfer\s+karo|daalo|dalo)\b/gi,
    /\b(?:deposit|pay|send|transfer)\b[^.\n]{0,30}\bto\s+(?:our|my|the|his|her)\s+(?:manager|agent|admin|mentor|coordinator|team\s+leader)(?:'s)?\b/gi,
    /\b(?:pay|deposit)\s+(?:₹|rs\.?|inr)?\s*[\d,]+\s+(?:as\s+)?(?:registration|joining|activation|membership|entry)\b/gi,
    /(?:मैनेजर|एजेंट)\s*(?:को|के\s*खाते)|(?:₹|रु\.?)\s*[\d,]+\s*भेजें|पैसे\s*भेजें/g,
    /फ़?ीस\s*(?:जमा|भर)|पैसे\s*(?:भेज|ट्रांसफर)|मेरे\s*खाते\s*में/g,
  ],
  withdrawal_fee: [
    /\bwithdraw(?:al|ing)?\b[^.\n]{0,40}\b(?:fees?|charges?|tax|taxes|commission|unlock|clearance|verification\s+fee)\b/gi,
    /\b(?:advance|income|service)\s+tax\b[^.\n]{0,40}\b(?:withdraw|release|unlock|profit)\b/gi,
    /\b(?:pay|deposit)\b[^.\n]{0,30}\bto\s+(?:withdraw|release|unlock|get\s+your)\b/gi,
    /\b(?:account|funds?|wallet)\s+(?:is\s+)?(?:frozen|freezed|locked|on\s+hold)\b/gi,
    /\bunlock\s+(?:fee|charges?|amount)\b/gi,
    /निकासी\s*(?:शुल्क|फ़?ीस|टैक्स)|पैसे\s*निकालने\s*के\s*लिए/g,
  ],
  credentials: [
    /\b(?:share|send|tell|give|forward|read|enter|batao|bataiye|bata\s+do|bhejo|bhej\s+do|de\s+do|type)\b[^.\n]{0,25}\botp\b/gi,
    /\botp\b[^.\n]{0,25}\b(?:batao|bataiye|bata\s+do|bhejo|bhej\s+do|share\s+karo|bolo|de\s+do|send\s+(?:it|me|us)|tell\s+(?:me|us)|read\s+(?:it\s+)?out)\b/gi,
    /\botp\b[^।.\n]{0,25}(?:बता|भेज|सुना|पढ़)/gi,
    /\b(?:upi\s+)?pin\b[^.\n]{0,20}\bto\s+(?:receive|get|claim|accept)\b|\bto\s+(?:receive|get|claim|accept)\b[^.\n]{0,30}\b(?:upi\s+)?pin\b/gi,
    /(?:पाने|लेने)\s*के\s*लिए[^।.\n]{0,30}(?:PIN|पिन)/gi,
    /\b(?:share|send|tell|give|forward|batao|bataiye|bhejo)\b[^.\n]{0,20}\b(?:pin|password|cvv|mpin|upi\s+pin)\b/gi,
    /\bkyc\b[^.\n]{0,30}\b(?:expir\w*|block\w*|suspend\w*|deactivat\w*|re-?kyc|band|immediately|today|turant)\b/gi,
    /\b(?:demat|trading|bank|account|card|sim)\b[^.\n]{0,25}\b(?:block(?:ed)?|suspend\w*|deactivat\w*|frozen|freez\w*|closed|band)\b/gi,
    /\b(?:verify|update|confirm)\s+(?:your\s+)?(?:account|kyc|pan|details|demat)\b/gi,
    /\bclick\b[^.\n]{0,25}\b(?:link|here|below)\b[^.\n]{0,30}\b(?:verify|update|kyc|unblock|activate|claim)\b/gi,
    /ओटीपी\s*(?:बता|भेज|दे|शेयर)|(?:बता|भेज)[^।.\n]{0,10}ओटीपी|केवाईसी[^।.\n]{0,20}(?:बंद|ब्लॉक|समाप्त|एक्सपायर)|खात[ाे][^।.\n]{0,15}(?:बंद|ब्लॉक)\s*(?:हो\s*जाएगा|कर\s*दिया\s*जाएगा)|पिन\s*बता/g,
  ],
  remote_apk: [
    /\.apk\b/gi,
    /\b(?:download|install)\b[^.\n]{0,40}\b(?:apk|app|application)\b[^.\n]{0,40}\b(?:link|below|telegram|whatsapp|website|from\s+here)\b/gi,
    /\b(?:anydesk|any\s+desk|teamviewer|team\s+viewer|quick\s?support|rustdesk|airdroid|ammyy|ultraviewer)\b/gi,
    /\bscreen[- ]?shar(?:e|ing)\b/gi,
    /\b(?:download|install)\b[^.\n]{0,15}\b(?:it|app|apk)?\s*(?:here|from\s+(?:this|the)\s+link)\b/gi,
    /स्क्रीन[- ]?शेयर|(?:यहाँ|लिंक)\s*से\s*(?:ऐप\s*)?डाउनलोड/g,
  ],
  authority: [
    /\bsebi\b[^.\n]{0,15}\b(?:approved|certified|authori[sz]ed|verified|recommended|endorsed|officer|official|department)\b/gi,
    /\b(?:rbi|nse|bse|government|govt)\b[^.\n]{0,15}\b(?:approved|certified|backed|guaranteed|authori[sz]ed)\s+(?:scheme|plan|investment|returns?|app|platform|group|channel)\b/gi,
    /\b(?:i\s+am|this\s+is|calling\s+from)\b[^.\n]{0,30}\b(?:sebi|rbi|nse|bse|cbi|customs|income\s+tax|trai|cyber\s+(?:cell|police))\b/gi,
    /\b(?:government|govt|sebi|rbi)[- ](?:approved|certified)\b/gi,
    /(?:सरकार|सेबी)\s*से\s*मंज़?ूर(?![^।.\n]*\?)/g,
  ],
  threat: [
    /\bdigital\s+arrest\b/gi,
    /\b(?:cbi|ed|enforcement\s+directorate|customs|narcotics|ncb|cyber\s+(?:cell|police)|police|trai)\b[^.\n]{0,40}\b(?:arrest|warrant|money\s+laundering|parcel|drugs|case\s+(?:is\s+)?registered)\b/gi,
    /\bmoney\s+laundering\s+(?:case|charges?|complaint)\b/gi,
    /\b(?:arrest|warrant)\b[^.\n]{0,40}\b(?:video\s+call|skype|whatsapp\s+call)\b/gi,
    /डिजिटल\s*अरेस्ट|मनी\s*लॉन्ड्रिंग|गिरफ़?़?्तारी\s*वारंट/g,
  ],
  dabba: [
    /\bdabba\b/gi,
    /\b(?:off[- ]?market|parallel|unofficial|private)\s+(?:trading|trade|exchange|terminal)\b/gi,
    /\b(?:no|without)\s+(?:demat|kyc|broker(?:age)?\s+account)\b/gi,
    /\b\d{2,4}\s?x\s+(?:leverage|margin|exposure)\b/gi,
    /\b(?:leverage|margin|exposure)\s+(?:of\s+)?(?:up\s?to\s+)?\d{2,4}\s?x\b/gi,
    /\b(?:unlimited|huge|1:\d{3,4})\s+(?:leverage|margin)\b/gi,
    /\b(?:no|zero|without)\s+(?:tax|taxes|stt)\b[^.\n]{0,40}\b(?:trad\w*|leverage|profit|terminal|cash)\b|\b(?:trad\w*|leverage|terminal)\b[^.\n]{0,40}\b(?:no|zero|without)\s+(?:tax|taxes|stt)\b/gi,
    /\bbucket\s+shop\b/gi,
    /बिना\s*डीमैट|\d+\s*गुना\s*लीवरेज|कोई\s*टैक्स\s*नहीं|प्राइवेट\s*टर्मिनल/g,
    /डब्बा/g,
  ],
  unregistered_tips: [
    /\b(?:buy|sell|short|long)\b[^.\n]{0,40}\b(?:target|tgt|tp)\s*[:\-–@]?\s*\d+/gi,
    /\b(?:sl|stop\s?loss|stoploss)\s*[:\-–@]?\s*\d+/gi,
    /\b(?:entry|cmp|buy\s+above|sell\s+below|buy\s+range)\s*[:\-–@]?\s*\d+/gi,
    /\b\d{4,6}\s?(?:ce|pe)\b/gi,
  ],
  group_invite: [
    /\btelegram\b/gi,
    /\bwhatsapp\s+(?:group|community|channel)\b/gi,
    /\bjoin\b[^.\n]{0,20}\b(?:group|channel|community)\b/gi,
    /टेलीग्राम|व्हाट्सएप\s*ग्रुप/g,
  ],
  fake_proof: [
    /\b(?:profit|payout|withdrawal|pnl|p&l)\s+(?:proof|screenshots?|ss)\b/gi,
    /\b\d+(?:\.\d+)?\s?(?:k|lakh|lac|lakhs|crore|cr)\b[^.\n]{0,20}\b(?:profit|earned|made|returns?|income|kamaye|kamaya)\b/gi,
    /\b(?:my|our)\s+(?:students|members|clients|subscribers)\s+(?:earned|made|are\s+earning|got)\b/gi,
    /\btestimonials?\b/gi,
  ],
  forex_crypto: [
    /\bforex\b/gi,
    /\bbinary\s+options?\b/gi,
    /\b(?:crypto|bitcoin|btc|usdt|ethereum)\b[^.\n]{0,25}\b(?:signals?|guaranteed|double|bot|arbitrage|mining\s+returns?)\b/gi,
    /\bcurrency\s+trading\b/gi,
    /\bmt[45]\b/gi,
    /फ़?ॉरेक्स/g,
  ],
  utility_threat: [
    /\b(?:electricity|bijli|light|power|gas|water|sim|connection)\b[^.\n]{0,40}\b(?:will\s+be\s+(?:disconnected|cut|blocked|deactivated|suspended)|(?:disconnected|cut)\s+(?:today|tonight)|kat\s+jayega|katega|kat\s+diya\s+jayega|band\s+ho\s+jayega|band\s+kar\s+diya\s+jayega|block\s+ho\s+jayega)\b/gi,
    /\b(?:electricity|bijli|light)\s+bill\b[^.\n]{0,40}\b(?:pending|due|unpaid|not\s+(?:paid|updated)|update)\b/gi,
    /(?:बिजली|कनेक्शन|सिम)[^।.\n]{0,30}(?:कट\s*जाएगा|काट\s*दिया\s*जाएगा|बंद\s*हो\s*जाएगा|बंद\s*कर\s*दिया\s*जाएगा|ब्लॉक\s*हो\s*जाएगा)/g,
  ],
  task_job: [
    /\b(?:like|subscribe|rate|review|follow)\w*\b[^.\n]{0,40}\b(?:videos?|hotels?|products?|pages?|posts?|channels?|movies?)\b[^.\n]{0,40}\b(?:earn|income|pay|paid|₹|rs\.?|salary|commission)\b/gi,
    /\b(?:earn|kamao|kamaye)\b[^.\n]{0,40}\b(?:by|from)\s+(?:liking|subscribing|rating|reviewing|following)\b/gi,
    /\b(?:task|prepaid\s+task|part[- ]?time|work\s+from\s+home|ghar\s+baithe)\b[^.\n]{0,40}\b(?:job|earn|income|kamai|daily|₹)/gi,
    /घर\s*बैठे[^।.\n]{0,30}(?:कमा|कमाई)|टास्क[^।.\n]{0,30}(?:कमा|कमाई|पैसे)/g,
  ],
  ponzi: [
    /\b(?:level|team|downline|matrix)\s+(?:income|bonus|commission|plan)\b/gi,
    /\bchain\s+(?:system|scheme|plan)\b/gi,
    /\bmlm\b/gi,
    /\b(?:recruit|add|join)\s+(?:\d+\s+)?(?:members|people|friends)\b[^.\n]{0,30}\b(?:earn|income|bonus)\b/gi,
  ],
};
const NEGATABLE = new Set(["guaranteed", "credentials"]);
// "What is dabba trading?" asks about the word; it isn't a dabba pitch.
const QUESTION_RE = /^\s*(?:what|how|why|is|are|can|should|explain|tell\s+me)\b|\?\s*$|\b(?:kya\s+hai|kya\s+hota)\b|क्या\s*(?:है|होता)/i;

// RBI Alert List names (unauthorised forex platforms) as reported up to Nov 2025.
const RBI_ALERT = [
  "alpari", "anyfx", "avatrade", "ava trade", "binomo", "etoro", "exness", "expert option", "expertoption", "finfxpro",
  "qfx markets", "2wintrade", "guru trade7", "bric trade", "rubik trade", "dream trade", "mini trade", "trust trade",
  "gate trade", "starnet fx", "starnetfx", "capplace", "mirrox", "fusion markets", "nxg markets", "nord fx", "nordfx",
];
const RBI_RE = new RegExp(`\\b(?:${RBI_ALERT.map((n) => n.replace(/\s+/g, "\\s+")).join("|")})\\b`, "gi");

// Public figures and "AI trading" brands frequently used in deepfake investment ads.
const CELEB_RE =
  /\b(?:narayana\s+murthy|mukesh\s+ambani|ratan\s+tata|nirmala\s+sitharaman|sudha\s+murty|anand\s+mahindra|raghuram\s+rajan)\b[^.\n]{0,60}\b(?:recommend\w*|invest\w*|platform|app|scheme|earn\w*|returns?|trading)\b/gi;
const SCAM_BRAND_RE = /\b(?:quantum\s+ai|immediate\s+(?:edge|connect|momentum|matrix)|bitcoin\s+(?:era|code|profit|prime|revolution))\b/gi;
const CELEB_GENERIC_RE = /\b(?:famous|celebrity|billionaire|business\s+tycoon|actor|cricketer)\b[^.\n]{0,40}\b(?:reveals?|secret|app|platform)\b|मशहूर[^।.\n]{0,30}(?:सीक्रेट|ऐप|राज़?)/gi;

const RISK_DISCLAIMER_RE = /investments?\s+in\s+(?:the\s+)?securities\s+markets?\s+(?:is|are)\s+subject\s+to\s+market\s+risks?/i;
const SEBI_CLAIM_RE = /\bsebi[\s-]*(?:registered|regd\.?|licensed|certified|approved|authori[sz]ed)\b|सेबी\s*(?:रजिस्टर्ड|पंजीकृत)/i;

// "We will never ask for your OTP", "गारंटी नहीं है", "my SIM got blocked" are
// warnings or the person's own situation, not a scammer's claim or demand.
function negated(text, index, len = 0, id = "") {
  const pre = text.slice(Math.max(0, index - 32), index).toLowerCase();
  const post = text.slice(index + len, index + len + 24);
  return (
    /\b(?:no|not|never|cannot|can't|cant|doesn't|does not|don't|do not|in no way|nobody|no one|isn't|is not|nahi|nahin|mat)\b[^.!?\n]*$/.test(pre) ||
    /नहीं[^।.!?\n]*$|मत\s*$/.test(pre) ||
    /^[^।.!?\n]{0,12}(?:नहीं|नही|न\s+करें|न\s+बताएँ)/.test(post) ||
    /\b(?:not|never)\b/.test(post.slice(0, 8)) ||
    (id === "credentials" && (/\b(?:my|mera|meri|mere)\b[^.!?\n]{0,12}$/.test(pre) || /मेरा|मेरी|मेरे/.test(pre.slice(-14))))
  );
}

function findHighReturns(text) {
  const out = [];
  const re =
    /(\d{1,3}(?:\.\d+)?)\s?%\s*(?:returns?|profit|interest|gain)?\s*(?:per|a|every|each|\/|in\s+a|in\s+one|har)?\s*(day|daily|week|weekly|month|monthly|pm\b|p\.m\.|mahina|mahine|roz|रोज़?|हफ़?्ते|महीने|महीना|प्रति\s*माह|मासिक)/gi;
  for (const m of text.matchAll(re)) {
    const pct = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    const daily = /day|daily|roz|रोज/.test(unit);
    const weekly = /week|हफ/.test(unit);
    if ((daily && pct >= 0.5) || (weekly && pct >= 1.5) || (!daily && !weekly && pct >= 3)) out.push(m[0].trim());
  }
  // Unit before the number: "daily 2%", "रोज़ 2%".
  for (const m of text.matchAll(/(?:daily|every\s+day|roz|रोज़?|हर\s*दिन)\s*(\d{1,3}(?:\.\d+)?)\s?%/gi)) if (parseFloat(m[1]) >= 0.5) out.push(m[0]);
  for (const m of text.matchAll(/(?:monthly|every\s+month|har\s+mahine|हर\s*महीने|महीने\s*में)\s*(\d{1,3}(?:\.\d+)?)\s?%/gi)) if (parseFloat(m[1]) >= 3) out.push(m[0]);
  // "money doubles in 2 days" style promises.
  for (const m of text.matchAll(/\b(?:double|dugna|dogna|doguna|2x|triple|3x)\b[^.\n]{0,30}?\b\d+\s*(?:din|days?|hafte|weeks?|mahine|months?)\b|\b\d+\s*(?:din|days?|hafte|weeks?|mahine|months?)\b[^.\n]{0,30}?\b(?:double|dugna|dogna|doguna|2x|triple|3x)\b|(?:दोगुना|दुगना|डबल)[^।.\n]{0,25}\d+\s*(?:दिन|हफ़?्ते|महीने)|\d+\s*(?:दिन|हफ़?्ते|महीने)[^।.\n]{0,25}(?:दोगुना|दुगना|डबल)/gi)) out.push(m[0].trim());
  // "invest 21,000 earn 2 lakh" style multipliers.
  const amount = (n, unit) => parseFloat(String(n).replace(/,/g, "")) * ({ k: 1e3, lakh: 1e5, lac: 1e5, lakhs: 1e5, crore: 1e7, cr: 1e7 }[String(unit || "").toLowerCase()] || 1);
  const hiAmount = (n, unit) => parseFloat(String(n).replace(/,/g, "")) * ({ "हजार": 1e3, "लाख": 1e5, "करोड": 1e7 }[String(unit || "").replace(/़/g, "")] || 1);
  for (const m of text.matchAll(/([\d,]+(?:\.\d+)?)\s*(हज़?ार|लाख|करोड़?)?\s*(?:लगाएँ|लगाओ|लगाइए|जमा\s*करें|निवेश\s*करें)[^।.\n]{0,30}?([\d,]+(?:\.\d+)?)\s*(हज़?ार|लाख|करोड़?)?\s*(?:कमाएँ|कमाओ|कमाइए|पाएँ|पाओ)/g)) {
    const a = hiAmount(m[1], m[2]);
    const b = hiAmount(m[3], m[4]);
    if (a > 0 && b / a >= 1.5) out.push(m[0].trim());
  }
  for (const m of text.matchAll(
    /\b(?:invest|deposit|put|lagao|lagaiye)\w*\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(k|lakhs?|lac|crore|cr)?\b[^.\n]{0,30}?\b(?:earn|get|make|receive|kamao|paao|pao|withdraw)\w*\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(k|lakhs?|lac|crore|cr)?\b/gi,
  )) {
    const a = amount(m[1], m[2]);
    const b = amount(m[3], m[4]);
    if (a > 0 && b / a >= 1.5) out.push(m[0].trim());
  }
  // "turns ₹21,000 into ₹2 lakh" style promises.
  for (const m of text.matchAll(/\b(?:turns?|turned|converts?|grows?|makes?)\s+(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(k|lakhs?|lac|crore|cr)?\s+into\s+(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(k|lakhs?|lac|crore|cr)?\b/gi)) {
    const a = amount(m[1], m[2]);
    const b = amount(m[3], m[4]);
    if (a > 0 && b / a >= 1.5) out.push(m[0].trim());
  }
  for (const m of text.matchAll(/\b(\d{2,4})\s?(?:points?|pts)\s+(?:daily|per\s+day|every\s+day|roz|a\s+day)\b/gi)) out.push(m[0]);
  for (const m of text.matchAll(/\b(\d{1,3})\s?x\s+(?:returns?|profits?|money|gains?)\b/gi)) out.push(m[0]);
  for (const m of text.matchAll(/\bdouble\s+(?:your\s+)?(?:money|investment|capital)?\s*in\s+(\d+)\s*(?:days?|weeks?|months?)\b/gi)) out.push(m[0]);
  return out;
}

// ---- Links -----------------------------------------------------------------
const URL_RE =
  /\b(?:https?:\/\/[^\s<>"'`]+|www\.[^\s<>"'`]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|in|net|org|io|co|xyz|top|click|app|info|online|site|live|vip|shop|store|me|ly|gl|gd|cc|to|link|pro|club|biz|tk|ml|ga|cf|gq|icu|buzz|cyou|sbs|cfd|fun|space|pw|win|bid|loan|work|tech|trade|finance|money|capital|ltd|lol|quest|bond|rest|monster)\b(?:\/[^\s<>"'`]*)?)/gi;

const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "cutt.ly", "rb.gy", "is.gd", "shorturl.at", "rebrand.ly", "tiny.cc", "t.ly", "ow.ly", "s.id",
  "v.gd", "buff.ly", "shorte.st", "adf.ly", "goo.gl", "lnkd.in", "bitly.com", "tny.im", "short.io", "shrtco.de",
]);
const RISKY_TLDS = new Set([
  "xyz", "top", "click", "icu", "buzz", "rest", "monster", "cyou", "sbs", "cfd", "vip", "win", "bid", "loan", "work", "pw",
  "tk", "ml", "ga", "cf", "gq", "lol", "quest", "bond", "online", "site", "live", "fun", "space",
]);
const OFFICIAL_DOMAINS = new Set([
  "sebi.gov.in", "nseindia.com", "bseindia.com", "cdslindia.com", "nsdl.co.in", "rbi.org.in", "amfiindia.com",
  "cybercrime.gov.in", "sancharsaathi.gov.in", "mcxindia.com", "ncdex.com", "npci.org.in", "smartodr.in", "incometax.gov.in",
]);
// [token in a domain label, official registrable domain, display name]
const BRANDS = [
  ["sebi", "sebi.gov.in", "SEBI"], ["nseindia", "nseindia.com", "NSE"], ["nse", "nseindia.com", "NSE"], ["bseindia", "bseindia.com", "BSE"],
  ["cdsl", "cdslindia.com", "CDSL"], ["cdslindia", "cdslindia.com", "CDSL"], ["nsdl", "nsdl.co.in", "NSDL"], ["rbi", "rbi.org.in", "RBI"],
  ["amfi", "amfiindia.com", "AMFI"], ["npci", "npci.org.in", "NPCI"], ["zerodha", "zerodha.com", "Zerodha"], ["groww", "groww.in", "Groww"],
  ["upstox", "upstox.com", "Upstox"], ["angelone", "angelone.in", "Angel One"], ["angelbroking", "angelone.in", "Angel One"],
  ["icicidirect", "icicidirect.com", "ICICI Direct"], ["hdfcsec", "hdfcsec.com", "HDFC Securities"], ["kotaksecurities", "kotaksecurities.com", "Kotak Securities"],
  ["paytmmoney", "paytmmoney.com", "Paytm Money"], ["5paisa", "5paisa.com", "5paisa"], ["motilaloswal", "motilaloswal.com", "Motilal Oswal"],
  ["sharekhan", "sharekhan.com", "Sharekhan"],
];
const BRAND_DOMAINS = new Set(BRANDS.map((b) => b[1]));
const SLD2 = new Set(["co.in", "net.in", "org.in", "gen.in", "firm.in", "ind.in", "ac.in", "edu.in", "res.in", "gov.in", "nic.in", "co.uk", "org.uk", "com.au", "co.jp", "com.sg", "co.za", "com.br"]);
const SOCIAL = { "instagram.com": "instagram", "youtube.com": "youtube", "m.youtube.com": "youtube", "x.com": "x", "twitter.com": "x", "facebook.com": "facebook" };

export function registrable(host) {
  const parts = host.split(".");
  if (parts.length <= 2) return host;
  const last2 = parts.slice(-2).join(".");
  return SLD2.has(last2) ? parts.slice(-3).join(".") : last2;
}

function lev(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 9;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}
const unLeet = (s) => s.replace(/0/g, "o").replace(/1/g, "l").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t");

function brandLookalike(host, reg) {
  if (OFFICIAL_DOMAINS.has(reg) || BRAND_DOMAINS.has(reg) || reg.endsWith(".gov.in") || reg.endsWith(".nic.in")) return null;
  const labels = host.replace(/\.(?:co|net|org|gov|ac)\.in$|\.[a-z]+$/, "").split(".");
  const tokens = labels.flatMap((l) => l.split("-")).filter(Boolean);
  const joined = unLeet(labels.join("").replace(/-/g, ""));
  for (const [token, domain, name] of BRANDS) {
    if (token.length <= 4) {
      if (tokens.some((t) => unLeet(t) === token)) return { domain, name };
    } else if (joined.includes(token) || tokens.some((t) => lev(unLeet(t), token) === 1)) {
      return { domain, name };
    }
  }
  return null;
}

export function parseLink(raw) {
  let s = String(raw || "").trim().replace(/[)\].,;:!?'"]+$/, "");
  if (!s) return null;
  const explicitHttp = /^http:\/\//i.test(s);
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = `https://${s}`;
  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  return { url: u.toString(), u, host, reg: registrable(host), explicitHttp };
}

// Stable keys used to match links/entities against community reports.
export function linkKeys(p) {
  if (!p) return [];
  const seg = p.u.pathname.split("/").filter(Boolean);
  if (["t.me", "telegram.me", "telegram.dog"].includes(p.host)) {
    const first = (seg[0] === "joinchat" ? `+${seg[1] || ""}` : seg[0] || "").toLowerCase();
    if (!first) return [];
    return first.startsWith("+") ? [`t:${first}`] : [`t:${first}`, `h:${first}`];
  }
  if (p.host === "chat.whatsapp.com") return seg[0] ? [`w:${seg[0].toLowerCase()}`] : [];
  if (p.host === "wa.me") return seg[0] ? [`p:${seg[0].replace(/\D/g, "").slice(-10)}`] : [];
  if (SOCIAL[p.host]) {
    const h = (seg[0] || "").replace(/^@/, "").toLowerCase();
    return h && !["watch", "shorts", "p", "reel", "channel", "c"].includes(h) ? [`h:${h}`] : [];
  }
  if (SHORTENERS.has(p.host)) return [`d:${p.host}${p.u.pathname.toLowerCase()}`];
  return [`d:${p.reg}`];
}

export function analyzeLink(raw) {
  const p = parseLink(raw);
  if (!p) return null;
  const flags = [];
  const tld = p.host.split(".").pop();
  const official = OFFICIAL_DOMAINS.has(p.reg) || BRAND_DOMAINS.has(p.reg) || p.reg.endsWith(".gov.in") || p.reg.endsWith(".nic.in");
  if (p.u.username || p.u.password) flags.push({ id: "link_userinfo" });
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(p.host) || p.host.startsWith("[")) flags.push({ id: "link_ip" });
  if (p.host.includes("xn--")) flags.push({ id: "link_punycode" });
  if (/\.apk$/i.test(p.u.pathname)) flags.push({ id: "link_apk" });
  if (SHORTENERS.has(p.host)) flags.push({ id: "link_shortener", x: p.host });
  const seg = p.u.pathname.split("/").filter(Boolean);
  if (["t.me", "telegram.me", "telegram.dog"].includes(p.host) && (seg[0]?.startsWith("+") || seg[0] === "joinchat")) flags.push({ id: "link_telegram_private" });
  if (p.host === "chat.whatsapp.com") flags.push({ id: "link_whatsapp_group" });
  if (!official && RISKY_TLDS.has(tld)) flags.push({ id: "link_tld", x: tld });
  if (p.explicitHttp && !official) flags.push({ id: "link_http" });
  const look = official ? null : brandLookalike(p.host, p.reg);
  if (look) flags.push({ id: "link_lookalike", x: p.host, y: look.name });
  return { url: p.url, host: p.host, registrable: p.reg, official, flags, keys: linkKeys(p) };
}

// ---- Entities -------------------------------------------------------------
const PHONE_RE = /(?<![\d+])(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?!\d)/g;
const HANDLE_RE = /(?<![\w.@/])@([a-z0-9_.]{3,30})\b/gi;

export function extractEntities(text) {
  const t = String(text || "");
  const urls = [];
  for (const m of t.matchAll(URL_RE)) {
    if (m.index > 0 && t[m.index - 1] === "@") continue; // part of an email
    const v = m[0].replace(/[)\].,;:!?'"]+$/, "");
    if (!urls.includes(v)) urls.push(v);
  }
  const upis = [...new Set([...t.matchAll(UPI_RE)].map((m) => m[0].toLowerCase()))];
  const phones = [...new Set([...t.matchAll(PHONE_RE)].map((m) => m[0].replace(/\D/g, "").slice(-10)))];
  const handles = [...new Set([...t.matchAll(HANDLE_RE)].map((m) => m[1].toLowerCase()))].filter((h) => !/^valid/.test(h));
  const regNos = extractRegNos(t);
  return { urls: urls.slice(0, 10), upis: upis.slice(0, 10), phones: phones.slice(0, 10), handles: handles.slice(0, 10), regNos: regNos.slice(0, 10) };
}

// Keys for a reported entity (stored on the report so lookups are cheap).
export function entityKeys(type, value, link) {
  const v = String(value || "").trim();
  const keys = new Set();
  const lower = v.toLowerCase();
  const fromLink = (s) => linkKeys(parseLink(s)).forEach((k) => keys.add(k));
  switch (type) {
    case "url":
    case "telegram":
    case "whatsapp":
      if (/[a-z0-9-]+\.[a-z]{2,}/i.test(v)) fromLink(v);
      else if (type === "whatsapp" && v.replace(/\D/g, "").length >= 10) keys.add(`p:${v.replace(/\D/g, "").slice(-10)}`);
      else if (type === "telegram" && v) keys.add(`t:${lower.replace(/^@/, "")}`).add(`h:${lower.replace(/^@/, "")}`);
      break;
    case "phone":
      if (v.replace(/\D/g, "").length >= 10) keys.add(`p:${v.replace(/\D/g, "").slice(-10)}`);
      break;
    case "upi":
      keys.add(`u:${lower}`);
      break;
    case "handle":
      keys.add(`h:${lower.replace(/^@/, "").replace(/^https?:\/\/[^/]+\//, "")}`);
      break;
    default:
      if (lower) keys.add(`n:${lower.replace(/[^a-z0-9ऀ-ॿ]+/g, " ").trim()}`);
  }
  if (link) fromLink(link);
  return [...keys];
}

export function displayEntity(type, value) {
  return type === "phone" ? maskPhone(value) : String(value || "");
}

function communityMatches(store, ents, links, text) {
  if (!store) return [];
  const keys = new Map();
  for (const l of links) for (const k of l.keys) keys.set(k, l.url.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 60));
  for (const p of ents.phones) keys.set(`p:${p}`, maskPhone(p));
  for (const v of ents.upis) keys.set(`u:${v}`, v);
  for (const h of ents.handles) {
    keys.set(`h:${h}`, `@${h}`);
    keys.set(`t:${h}`, `@${h}`);
  }
  const lower = text.toLowerCase();
  const out = [];
  for (const r of store.data.reports) {
    if (r.status === "rejected") continue;
    let display = null;
    const k = (r.matchKeys || []).find((x) => keys.has(x));
    if (k) display = keys.get(k);
    else if (["app", "other"].includes(r.entityType) && r.entityValue.length >= 5 && lower.includes(r.entityValue.toLowerCase())) display = r.entityValue;
    if (display) {
      out.push({ id: r.id, status: r.status, display, category: r.category, platform: r.platform, reports: 1 + (r.supporters?.length || 0) });
    }
    if (out.length >= 5) break;
  }
  return out;
}

// ---- Optional: Google Safe Browsing (v4 Lookup API) -----------------------
async function safeBrowsing(urls, key) {
  if (!key || !urls.length) return null;
  const body = {
    client: { clientId: "finsuraksha", clientVersion: "1.0" },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: urls.slice(0, 10).map((url) => ({ url })),
    },
  };
  try {
    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return new Set((json.matches || []).map((m) => m.threat?.url));
  } catch {
    return null;
  }
}

// ---- Main -----------------------------------------------------------------
const fill = (s, v) => s.replace(/\{x\}/g, v.x ?? v.evidence[0] ?? "").replace(/\{y\}/g, v.y ?? "");

export async function analyzeMessage(text, { store = null, cfg = null, lang = "en" } = {}) {
  const L = lang === "hi" ? "hi" : "en";
  const t = String(text || "").normalize("NFC").slice(0, 8000);
  const found = new Map();
  const add = (id, evidence, x, y) => {
    const cur = found.get(id) || { hits: 0, evidence: [], x, y };
    cur.hits += 1;
    if (evidence && !cur.evidence.includes(evidence) && cur.evidence.length < 4) cur.evidence.push(String(evidence).slice(0, 80));
    if (cur.x === undefined && x !== undefined) cur.x = x;
    if (cur.y === undefined && y !== undefined) cur.y = y;
    found.set(id, cur);
  };
  const positives = [];
  const positive = (id, x, y) => positives.push({ id, x, y, text: POSITIVE_TEXT[id][L].replace("{x}", x ?? "").replace("{y}", y ?? "") });

  for (const [id, list] of Object.entries(P)) {
    for (const re of list) {
      for (const m of t.matchAll(re)) {
        if (NEGATABLE.has(id) && negated(t, m.index, m[0].length, id)) continue;
        if (id === "dabba" && /^(?:dabba|डब्बा)$/i.test(m[0]) && QUESTION_RE.test(t)) continue;
        add(id, m[0].trim());
      }
    }
  }
  for (const hr of findHighReturns(t)) add("high_return", hr, hr);
  for (const m of t.matchAll(RBI_RE)) add("rbi_alert", m[0], m[0]);
  for (const m of t.matchAll(CELEB_RE)) add("celebrity", m[0]);
  for (const m of t.matchAll(SCAM_BRAND_RE)) add("celebrity", m[0]);
  for (const m of t.matchAll(CELEB_GENERIC_RE)) add("celebrity", m[0]);
  if (RISK_DISCLAIMER_RE.test(t)) positive("risk_disclaimer");

  const ents = extractEntities(t);
  const links = ents.urls.map(analyzeLink).filter(Boolean);

  // SEBI registration numbers
  const sebi = await Promise.all(ents.regNos.map((n) => verifyRegNo(n, cfg || {})));
  for (const s of sebi) {
    if (!s.valid) add("sebi_bad_format", s.normalized, s.normalized);
    else if (s.notRegistered) add("sebi_not_registered", s.normalized, s.normalized, s.asOf || "");
    else if (!s.found) add("sebi_not_found", s.normalized, s.normalized);
    else positive("sebi_found", s.normalized, s.name);
  }
  if (!sebi.length && SEBI_CLAIM_RE.test(t)) add("sebi_claim_no_number", t.match(SEBI_CLAIM_RE)[0]);
  if (found.has("unregistered_tips") && sebi.some((s) => s.valid && s.found)) found.delete("unregistered_tips");

  // UPI IDs
  const upi = ents.upis.map(analyzeUpi);
  const moneyContext = /invest|profit|return|trading|tips?\b|vip|fee|membership|deposit|payment|\bpay\b|send|transfer|ipo|stock|share|nivesh|निवेश|पैसे|फ़?ीस|भुगतान/i.test(t);
  for (const u of upi) {
    if (u.validHandle) positive("upi_valid", u.vpa);
    else if (moneyContext) add("upi_personal", u.vpa, u.vpa);
  }

  // Links
  for (const l of links) {
    if (l.official) positive("official_link", l.host);
    for (const f of l.flags) add(f.id, l.host, f.x, f.y);
  }
  if (cfg?.safeBrowsingKey && links.length) {
    const bad = await safeBrowsing(links.map((l) => l.url), cfg.safeBrowsingKey);
    for (const l of links) {
      l.safeBrowsing = bad ? (bad.has(l.url) ? "unsafe" : "clean") : "unavailable";
      if (l.safeBrowsing === "unsafe") add("safe_browsing", l.host);
    }
  }

  // Community reports (FinScam Hunter)
  const community = communityMatches(store, ents, links, t);
  for (const c of community) add(c.status === "verified" ? "community_verified" : "community_pending", c.display, c.display);

  const flags = [...found.entries()]
    .map(([id, v]) => ({
      id,
      sev: META[id][0],
      weight: META[id][1],
      hits: v.hits,
      evidence: v.evidence,
      title: fill(FLAG_TEXT[id][L][0], v),
      why: fill(FLAG_TEXT[id][L][1], v),
    }))
    .sort((a, b) => SEV_ORDER[b.sev] - SEV_ORDER[a.sev] || b.weight - a.weight);

  const ids = new Set(flags.map((f) => f.id));
  let raw = flags.reduce((s, f) => s + f.weight + Math.min(6, (f.hits - 1) * 2), 0);
  raw -= positives.reduce((s, p) => s + (POS_WEIGHT[p.id] || 0), 0);
  let floor = 0;
  if (ids.has("safe_browsing")) floor = 85;
  if (ids.has("community_verified")) floor = Math.max(floor, 70);
  if (ids.has("credentials") || ids.has("remote_apk") || ids.has("link_apk") || ids.has("withdrawal_fee") || ids.has("threat") || ids.has("utility_threat")) floor = Math.max(floor, 60);
  if ((ids.has("pay_personal") || ids.has("upi_personal")) && flags.length >= 2) floor = Math.max(floor, 60);
  // An unregistered "adviser" who also wants money or promises returns.
  if (ids.has("sebi_not_registered") && ["pay_personal", "upi_personal", "high_return", "guaranteed", "unregistered_tips", "group_invite"].some((x) => ids.has(x))) floor = Math.max(floor, 60);
  // Task jobs that also ask for a fee are the classic "prepaid task" scam.
  if (ids.has("task_job") && (ids.has("pay_personal") || ids.has("high_return") || ids.has("group_invite"))) floor = Math.max(floor, 60);
  // A promise plus pressure ("100% sure, only 5 seats left") is a textbook pitch.
  if ((ids.has("guaranteed") || ids.has("high_return")) && ids.has("urgency")) floor = Math.max(floor, 60);
  // Several dabba signs together ("no demat, 500x leverage, no tax") = an illegal trading pitch.
  if ((found.get("dabba")?.hits || 0) >= 2) floor = Math.max(floor, 60);
  // Return promises plus a fake official stamp or pressure to pay.
  if ((ids.has("high_return") || ids.has("guaranteed")) && (ids.has("authority") || ids.has("pay_personal") || ids.has("forex_crypto") || ids.has("institutional"))) floor = Math.max(floor, 60);
  // Celebrity / "AI trading" pitch combined with return promises = classic deepfake ad.
  if (ids.has("celebrity") && (ids.has("high_return") || ids.has("guaranteed"))) floor = Math.max(floor, 60);
  // Any single high-severity sign is at least "suspicious".
  if (flags.some((f) => f.sev === "high" || f.sev === "critical")) floor = Math.max(floor, 30);
  const score = Math.max(0, Math.min(100, Math.round(Math.max(raw, floor))));

  const entityCount = ents.urls.length + ents.upis.length + ents.phones.length + ents.regNos.length + ents.handles.length;
  let level = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  if (!flags.length && !entityCount && t.trim().length < 40) level = "unknown";

  return {
    lang: L,
    score,
    floor,
    level,
    flags,
    positives,
    entities: ents,
    checks: {
      sebi,
      upi,
      links: links.map(({ keys, ...rest }) => rest),
      community,
    },
  };
}
