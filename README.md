# FinSuraksha — check before you trust

FinSuraksha is a financial-security awareness website for **students, first-time investors and senior citizens**. It joins two ideas into one product:

| Module | What it does |
|---|---|
| **Suraksha-Dost** (AI scam-check chatbot, on the website, no WhatsApp needed) | Paste a tip, link, UPI ID or SEBI number, drop a screenshot or QR code, or speak. You get a risk score, each red flag explained in plain words, SEBI-register / @valid-UPI / link / community checks, the next steps to take, and a ~15-second spoken summary. With AI mode on it replies in 10 Indian languages. |
| **FinScam Hunter** (crowd-sourced takedown portal) | Members report dabba-trading apps, illegal F&O tip groups, unregistered finfluencers and fake trading apps. An automated check looks for a disclosed SEBI registration number and for fixed or guaranteed return promises. Three matching community votes verify a report and put it on the public Alert Wall. Members earn points, badges, a college leaderboard rank and a verifiable volunteer certificate. |

Also included: **Quick Check** (one search box, a payment-QR scanner and a ScamSmart-style "opportunity or trap?" questionnaire), **Learn** (10 scam guides and **Spot the Scam**, a phone-simulator game: swipe each real-style WhatsApp, SMS, UPI, call or ad message as scam or safe, then tap the hidden red flags for bonus points; Relaxed mode has no timer, Challenge mode has a timer, lives and combos), **Get Help** (a 1930 emergency card, a recovery checklist, a complaint-draft builder and official channels), **sign-up and login**, a profile page with privacy controls, and an English/Hindi interface with text-size, dark-mode and high-contrast options.

---

## Quick start

Requires **Node.js 18.18 or newer** (tested on Node 22).

**Windows:** double-click **`run.bat`**. It installs dependencies on the first run, starts the server and opens the browser. If FinSuraksha is already running, it just opens the browser.

**Any OS:**

```bash
cd finsuraksha
npm install
npm start
```

Open **http://localhost:3000**. The console also prints a "same Wi-Fi" address that other devices on your network can open.

**Keep the server window open** while you use the site. Closing it stops FinSuraksha. If that happens, the page shows a "Server not reachable" banner and reconnects by itself once you start it again.

**Accounts:** anyone can create an account on the **Sign up** tab (18+, with consent), then **sign in** with that email and password. Accounts are stored on the computer running the server (`data/db.json`). **Forgot password?** There is no reset email, so a moderator opens *My profile → Reset a member's password* and hands the member a temporary password; the member signs in and sets a new one under *Change password*.

On the first run the console prints a **moderator login**, which is also saved to `data/FIRST_RUN_CREDENTIALS.txt`. Sample hunters and reports are loaded so the Alert Wall, leaderboard and charts aren't empty. The UI labels all of them **"Sample"**. To start with an empty site, set `SEED_DEMO=false` before the first run, or delete the `data/` folder.

```bash
npm test     # 30 automated tests: API, security, analyzer accuracy, SEBI register and lookup service, clone-app detection, AI opt-in, report retention, AI request format, game content
```

### Do I need any API keys?

**No.** Everything works without keys. The scam checks run on the built-in rule-based engine, which answers in English and Hindi.

| Optional key | What it adds | Where to get it |
|---|---|---|
| `GROQ_API_KEY` | **AI mode** for Suraksha-Dost: replies in 10 Indian languages and more natural explanations. These are grounded in the rule-based findings. Screenshots are still read on the device (OCR), and only the masked text is sent. | Groq Console → API Keys: https://console.groq.com/keys (free tier with rate limits) |
| `GOOGLE_SAFE_BROWSING_API_KEY` | Live phishing/malware reputation for links | Google Cloud Console → enable "Safe Browsing API" → create an API key. The Lookup API v4 is for non-commercial use; use Google Web Risk for commercial use. |

To use them, copy `.env.example` to `.env`, fill in the keys and restart. The console shows which modes are on.

AI mode uses Groq's `openai/gpt-oss-120b` at reasoning effort `low` for fast chat. You can change this with `FS_AI_MODEL` / `FS_AI_EFFORT` (`low` | `medium` | `high`). Requests use strict JSON-schema output (JSON mode for other models). If the AI is unavailable, hits the free-tier limit, or the key is wrong, the chatbot quietly falls back to rule-based analysis.

---

## How a check works

```
 text / screenshot (OCR on device) / QR (decoded on device) / voice (browser speech)
                                   │
                    ┌──────────────▼───────────────┐
                    │  Rule-based engine (always)  │  35+ red-flag patterns in English,
                    │  src/analyzer.js             │  Hindi & Hinglish, link analysis
                    └──────────────┬───────────────┘  (lookalikes, APKs, shorteners,
   SEBI register snapshot ─────────┤                   private Telegram invites...),
   @valid UPI check ───────────────┤                   RBI Alert List names
   FinScam Hunter reports ─────────┤
   Google Safe Browsing (optional)─┘
                                   │  risk score + floors for critical signs
                    ┌──────────────▼───────────────┐
                    │  PII masking (src/redact.js) │  phone, email, Aadhaar, PAN, OTP,
                    └──────────────┬───────────────┘  account numbers, UPI local part
                                   │
                    ┌──────────────▼───────────────┐
                    │  AI mode (optional, Groq)    │  explains in the user's language;
                    │  src/ai.js                   │  cannot lower a critical rule-based
                    └──────────────┬───────────────┘  finding (prompt-injection safe)
                                   ▼
        verdict · score · red flags · checks · next steps · 15-sec audio note
```

Nothing from a chat is stored. Only anonymous counters are kept, for example "one high-risk check today".

---

## What we learned from similar products (and built in)

| Existing idea | What we took | What we do differently |
|---|---|---|
| **Bitdefender Scamio**: a chatbot that takes links, screenshots and QR codes and returns a verdict | Multi-input chat verdicts | Reviewers note Scamio doesn't explain *why*. Suraksha-Dost explains every red flag in simple local language, with audio, and is India-specific (SEBI, @valid UPI, 1930, Chakshu). |
| **UK FCA ScamSmart**: Warning List plus "check the opportunity" questions | Public **Alert Wall** and the **"Opportunity or trap?"** questionnaire | Community-verified alerts with a right of reply |
| **SEBI @valid UPI handles + SEBI Check** (live since 1 Oct 2025) | UPI IDs and payment QR codes are checked for the `@valid` handle, with links to SEBI Check | Works inside the chat and the QR scanner |
| **Sanchar Saathi "Chakshu"** (DoT) | One-tap escalation, with ready-to-paste complaint text | Pre-filled from the verified report |
| **RBI Alert List** of unauthorised forex platforms | Names on the list are flagged in messages | Plus forex/crypto "signals" patterns |
| **SEBI's finfluencer rules** (Aug 2024) and the 2025 SEBI–Google Play "verified" trading-app labels | Unregistered-tip and APK-link detection | The community can report finfluencers and apps directly |

---

## Problem statement and judging criteria

| Criterion | Where it shows |
|---|---|
| **Innovation** | Stage-aware red-flag engine plus AI explanations, a community verification loop that feeds back into the chatbot, an on-device QR/@valid-UPI check, and a verifiable volunteer certificate for students |
| **Functionality (UX/UI)** | One consistent design system, three-step flows, quick-example chips, drag-and-drop or paste screenshots, a keyboard-friendly UI |
| **Behavioural insight** | A pause-and-verify verdict, concrete next steps, the "opportunity or trap" self-check, a prebunking quiz, warnings about recovery scams, family sharing |
| **Feasibility** | Runs on one Node process with no database server or paid service. Optional keys add AI and live link reputation. |
| **Accessibility & inclusion** | English/Hindi UI and 10 reply languages (AI mode), voice input, spoken replies, text-size / high-contrast / dark modes, under-18s can use the checks without an account |
| **Data protection & privacy** | Chats aren't stored, PII is masked before AI, OCR/QR run on the device, EXIF is stripped from screenshots, accounts are 18+ (DPDP Act 2023: no child data), data export and account deletion, scrypt passwords, hashed session tokens |
| **Both aspects (education + cyber safety)** | The Learn and Quiz modules plus the scam checker, reporting and recovery help |
| **Stays within the PS limits** | No investment advice (asking "which stock should I buy?" gets a refusal), no trading, no promotion of securities, defanged scam links, sample data clearly labelled |

---

## Security

- Passwords are hashed with **scrypt**. Sessions use random 256-bit tokens; only their **SHA-256 hash** is stored. Cookies are `HttpOnly` and `SameSite=Lax` (`Secure` when `COOKIE_SECURE=true`).
- **CSRF**: state-changing API calls must be same-origin JSON, so cross-origin requests and form posts are rejected.
- A strict **Content-Security-Policy** applies, plus `X-Frame-Options: DENY`, `nosniff`, a referrer policy and a permissions policy.
- **Rate limits** apply on every API group. Login **locks for 15 minutes after 5 failures**.
- All user content is HTML-escaped by the `html` template helper. Uploads are type-checked by magic bytes and capped at 2.5 MB. Evidence screenshots are shown only to signed-in members.

## Project structure

```
server.js              start-up
src/app.js             Express app (routes, static files, error handling)
src/analyzer.js        rule-based scam engine        src/knowledge.js  red flags, actions, FAQ (EN/HI)
src/assistant.js       Suraksha-Dost orchestration    src/ai.js         Groq integration (optional)
src/sebi.js            SEBI numbers + @valid UPI      src/redact.js     PII masking
src/routes/*.js        auth, dost, check, hunt, me, public
src/db.js              JSON-file store (swap for SQLite/Postgres in production)
public/                single-page app (vanilla JS modules, no build step)
public/js/quiz-*.js    Spot the Scam game + its 18-message bilingual question bank
seed/sebi_register_snapshot.json   50 real SEBI entries (IA + RA, first page of each list, 22 Oct 2026)
scripts/               build-sebi-snapshot.mjs, import-register.mjs
test/                  node:test suites
```

## Known limits and next steps

- **SEBI register**: SEBI's website blocks automated queries, so we don't scrape it. The bundled snapshot is partial, and the UI says so and links to SEBI's official search. `npm run import-register -- file.csv` merges a CSV you are allowed to use. A production version needs an official data feed (SEBI/CDSL).
- **Storage**: a JSON file is fine for a prototype on one server. Each computer that runs FinSuraksha has its own accounts and reports. To share one set of accounts across devices, deploy one server (or move to Postgres, e.g. Supabase) and have everyone open that address.
- **Not built yet**: email verification on sign-up, moderator tooling beyond verify/reject/appeals, and platform takedown APIs. The site gives copy-ready escalation text instead.
- **Device dependencies**: OCR needs an internet connection the first time, to download tesseract.js and language data from jsDelivr. Spoken replies need a voice for the language on the device.
- **Accuracy**: rule-based checks can miss scams or flag genuine messages. The UI always says "shows signs of" and links to official verification.

## Sources (checked Oct 2026)

- SEBI @valid UPI handles and SEBI Check: [Moneylife](https://www.moneylife.in/article/sebi-launches-at-valid-upi-handles-and-checking-tool-to-curb-payment-frauds/78469.html), [SCC Online](https://www.scconline.com/blog/post/2025/10/04/sebi-introduces-verified-upi-handles-and-sebi-check-to-safeguard-investors/), [SEBI Check](https://siportal.sebi.gov.in/intermediary/sebi-check)
- SEBI intermediary lists: [Investment Advisers](https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13), [Research Analysts](https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=14)
- Dabba trading penalties (SCRA s.23(1)): [Moneylife – NSE cautions](https://www.moneylife.in/article/nse-cautions-investors-against-2-operators-and-stock-dost-group-over-market-tips-dabba-trading/81694.html)
- F&O losses (91% in FY25): [Business Standard](https://www.business-standard.com/markets/news/net-losses-of-traders-in-fo-widens-in-fy25-sebi-study-125070701221_1.html)
- Finfluencer rules: [Angel One news](https://www.angelone.in/news/market-updates/sebi-bans-regulated-entities-from-associating-with-unregistered-finfluencers), [Moneylife](https://moneylife.in/article/finfluencers-barred-from-using-live-stock-prices-make-claim-on-returns/76242.html)
- Chakshu: [Outlook Money](https://www.outlookmoney.com/retirement/financial-planning/how-to-report-suspected-fraud-communication-via-dots-chakshu-facility)
- RBI Alert List: [Gulf News (Nov 2025 update)](https://gulfnews.com/business/banking/starnetfx-fusion-markets-among-7-new-unauthorised-forex-platforms-in-india-flagged-by-rbi-1.500352489)
- Fake trading-app pattern: [Siasat](https://www.siasat.com/hyderabad-techie-duped-of-rs-51-lakh-in-cyber-fraud-3491361/), [Business Standard – SEBI warning](https://www.business-standard.com/amp/markets/news/sebi-warns-investors-about-stock-market-scams-via-social-media-platforms-125052101619_1.html)
- Similar products: [Bitdefender Scamio](https://bitdefender.in/introducing-scamio-complimentary-scam-detector-and-prevention-service-from-bitdefender), [Tom's Guide review](https://www.tomsguide.com/computing/online-security/i-tried-3-ai-powered-scam-detectors-to-help-keep-me-safe-online-and-theres-a-clear-winner), [FCA ScamSmart](https://www.fca.org.uk/news/press-releases/investors-miss-screen-sharing-scam-signs/printable/print)
- SEBI toll-free helpline: [SEBI](https://www.sebi.gov.in/toll-free-helpline.html)

---

*FinSuraksha is an educational prototype. It is not affiliated with SEBI, CDSL, NSDL, NSE, BSE or RBI, and it does not give investment advice.*
