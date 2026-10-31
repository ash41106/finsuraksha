# FinSuraksha — progress log and handover notes

This file is for whoever works on FinSuraksha next. It covers what has been built, how the pieces fit, what was changed and why, and what is still open. For setup and the feature tour, see [README.md](README.md).

_Last updated: 25 Oct 2026_

---

## 1. What the project is

FinSuraksha is a financial-security awareness website for students, first-time investors and senior citizens in India. It runs as a single Node.js (Express) process with a JSON file database (`data/db.json`). It needs no API keys.

| Area | Main files |
|---|---|
| Server entry, config, security headers, rate limits | `server.js`, `src/app.js`, `src/config.js`, `src/security.js` |
| **Suraksha-Dost** scam-check chatbot (rule engine + optional AI) | `src/analyzer.js`, `src/assistant.js`, `src/ai.js`, `src/knowledge.js`, `src/redact.js`, `src/routes/dost.js` |
| SEBI register lookup and @valid UPI check | `src/sebi.js`, `seed/sebi_register_snapshot.json`, `scripts/build-sebi-snapshot.mjs`, `scripts/import-register.mjs` |
| **Quick Check** (search box, QR scanner, "opportunity or trap?") | `src/routes/check.js`, `public/js/pages/check.js` |
| **FinScam Hunter** (community reports, votes, Alert Wall, points, certificate) | `src/routes/hunt.js`, `src/gamify.js`, `public/js/pages/hunt*.js`, `public/js/pages/cert.js` |
| Accounts, sessions, profile, privacy | `src/auth.js`, `src/routes/auth.js`, `src/routes/me.js`, `public/js/pages/login.js`, `public/js/pages/me.js` |
| Front end (vanilla JS SPA, no build step) | `public/index.html`, `public/js/main.js`, `public/js/i18n.js` (English + Hindi strings), `public/css/app.css` |
| Learn, quiz and Spot the Scam game | `public/js/pages/learn.js`, `public/js/content.js`, `public/js/quiz-data.js`, `public/js/quiz-game.js` |
| Tests (`npm test`) | `test/*.test.mjs` (28 tests) |

---

## 2. Work done, in order

### 2.1 Initial build — commit `33d4ebb` (23 Oct 2026)
- Full website: Suraksha-Dost chatbot, Quick Check, FinScam Hunter, Learn, Get Help, accounts, profile, English/Hindi UI, accessibility options (text size, dark mode, high contrast).
- Rule-based engine with 35+ red-flag patterns (English, Hindi, Hinglish), link analysis, SEBI number check, @valid UPI check, community-report matching, optional Google Safe Browsing.
- Optional AI mode through Groq (`GROQ_API_KEY`). The AI is grounded in the rule-based findings, receives PII-masked text, and cannot lower a critical rule-based score.
- Security: scrypt passwords, hashed session tokens, CSRF protection, strict CSP, rate limits, login lockout.

### 2.2 Windows one-click start — commit `d058125`
- `run.bat` installs dependencies on first run, starts the server and opens the browser.

### 2.3 Game and sign-in flow — commit `04afc5b`
- **Spot the Scam** phone-simulator game (Relaxed and Challenge modes).
- Sign-up first, then sign-in flow.
- "Server not reachable" banner that reconnects by itself.

### 2.4 Password management and fixes — not yet committed
- **Forgot password:** there is no email service, so a moderator resets it (`POST /api/auth/reset`, moderator only). This returns a temporary password and signs the member out everywhere. The login page has a "Forgot password?" note that explains this.
- **Change password:** `POST /api/me/password` checks the current password, signs out other devices and keeps this one signed in.
- Shared password rule `checkPassword()` in `src/validate.js`: 8–128 characters with at least one letter and one digit. It accepts any script, so Hindi letters count.
- Quick Check now also recognises phone numbers with a leading `0`.
- The display-options button shows an "AA" glyph.
- Analyzer, API and UI updates in the files listed by `git status`, with new tests.

### 2.5 System verifies SEBI registration itself — not yet committed (25 Oct 2026)
**Problem:** for a message like *"My broker asked me to pay margin to abc.brk@validhdfc"*, the chatbot told the user to "Verify the broker's registration on SEBI's intermediary search (sebi.gov.in)". The user had to do the check themselves.

**Change:** FinSuraksha now runs the check and reports the result as verified. It no longer sends the user to SEBI's site.

| File | What changed |
|---|---|
| `src/sebi.js` | `lookupRegNo()` returns `verified` and `verifiedBy`. `analyzeUpi()` returns `verified`, `verifiedBy` and `bank`. The bank comes from the handle, using a `VALID_BANKS` map such as `@validhdfc` → HDFC Bank. |
| `src/knowledge.js` | New `VERIFIED_TEXT`, e.g. "✓ Verified by FinSuraksha: abc.brk@validhdfc is a SEBI @valid UPI ID (Stock broker, HDFC Bank)". The `verify_sebi`, `valid_upi` and `stay_careful` steps now say "paste it here and FinSuraksha will verify it" instead of "go to SEBI's website". The `sebi_not_found` text now says FinSuraksha could not verify the number. |
| `src/assistant.js` | `withVerified()` puts the verified lines first in "What to do now". It removes any step, rule-based or **AI-written**, that tells the user to verify on SEBI's intermediary search, sebi.gov.in, SEBI Check or @valid (matched by `SELF_VERIFY_RE`). |
| `src/ai.js` | The AI gets `verified_by_finsuraksha` for each SEBI and UPI lookup, plus the bank. The system prompt now tells it to say "verified by FinSuraksha" and never to ask the user to check SEBI themselves. If nothing was given, it asks the user to paste the number or UPI ID. |
| `public/js/i18n.js`, `public/js/pages/dost.js`, `public/js/pages/check.js` | Removed the "Verify on SEBI" and "SEBI Check" links and prompts from chat results and Quick Check. Results now show "✓ Verified by FinSuraksha…" or "Could not verify in SEBI register". |
| `test/analyzer.test.mjs` | New test: "FinSuraksha verifies SEBI numbers and @valid UPI IDs itself". |

**Important limitation, read before changing this:**
- **There is no live lookup against SEBI.** SEBI's search endpoint (`/sebiweb/ajax/other/getintmfpiinfo.jsp`) answers automated requests with "Unauthorized Request Blocked" from its web firewall, and SEBI Check is protected by a captcha. Do **not** try to get around these blocks.
- "Verified" therefore means one of two things:
  1. **SEBI numbers:** the number is in `seed/sebi_register_snapshot.json`.
  2. **UPI IDs:** the ID uses an `@valid…` handle. These handles are issued only to SEBI-registered intermediaries.
- The bundled snapshot is **partial**: it holds only the first page of the Investment Adviser and Research Analyst lists. A real registered adviser can show as "could not verify". **Load the full register before any real deployment.** Either export SEBI's lists to CSV and run `npm run import-register -- file.csv`, or save the SEBI pages and run `node scripts/build-sebi-snapshot.mjs`. If SEBI ever offers an official API or data feed, plug it into `lookupRegNo()` in `src/sebi.js`. Everything else reads its `verified` field.
- Static learning content in `public/js/content.js` and the FAQ answers in `src/knowledge.js` still mention sebi.gov.in and SEBI Check as general education. That is deliberate. Only verdicts on specific content were changed.

### 2.6 Full-register support, "not registered" verdict, lookup-service slot — not yet committed (25 Oct 2026)
**Goal:** users get a final answer on FinSuraksha and never have to go to SEBI's site. With only 50 register entries, "not found" was meaningless, so this adds the pieces needed to make it trustworthy.

| What | Where | Behaviour |
|---|---|---|
| Complete vs partial register | `src/sebi.js` (`registerInfo().complete`) | The register file's `partial` field decides how a missing number is treated. |
| Firm "not registered" verdict | `src/analyzer.js` flag `sebi_not_registered` (high) | If the register is **complete** and a valid number isn't in it: "✗ Not registered with SEBI (register updated <date>). Don't pay." Combined with a payment ask, return promise, tips or group invite, the score floor is 60 (high risk). With a **partial** register it stays the softer `sebi_not_found`. |
| Import scripts | `scripts/build-sebi-snapshot.mjs`, `scripts/import-register.mjs` | Both take `--complete`, which marks the register complete. Use it only when you've loaded SEBI's whole list. |
| Optional lookup service | `verifyRegNo()` in `src/sebi.js`, `SEBI_LOOKUP_URL` / `SEBI_LOOKUP_KEY` in `.env` | Called **only** for numbers missing from the local register. Contract: `GET <url>?regNo=…` with `Authorization: Bearer <key>` → `{found, name, type}`. Answers are cached for 24 h. If the service is down, the local answer is used. SEBI itself has no such API; this slot is for a vendor or your own service. |
| Moderator "add to register" | `POST /api/sebi/register` (moderator only), form in *My profile* | For entities that registered after the last import. The moderator adds them after seeing the SEBI certificate. Saved in `data/db.json` (`registerAdditions`) and merged on top of the register file at startup. |
| Staleness warning | `server.js` startup lines | Prints register size, date, and complete/partial status. Warns if the register is more than 14 days old (`registerInfo().stale`). |
| Wording | `public/js/i18n.js`, `pages/check.js`, `pages/dost.js` | The old "Our snapshot is partial. Always confirm on SEBI's official search" note and the SEBI links in name search are gone. The register date is shown only when a number isn't found; the "not found" message changes depending on whether the register is complete. |
| Tests | `test/analyzer.test.mjs`, `test/api.test.mjs` | Partial vs complete behaviour, lookup service with caching and failure fallback, moderator add route. |

**How to load the full register (do this before real use):**
1. Open SEBI's recognised-intermediaries list for each category (Investment Advisers `intmId=13`, Research Analysts `intmId=14`, plus brokers etc. if wanted) in a normal browser and save **every page** with Ctrl+S.
2. Run `node scripts/build-sebi-snapshot.mjs --complete page1.html page2.html …`, or for a CSV export, `npm run import-register -- file.csv --complete`. Broker lists from the NSE/BSE websites can be merged with the CSV importer (columns `regNo,name[,type]`).
3. Restart the server. The startup line should say `complete`.
4. Refresh weekly. The server warns after 14 days.

### 2.7 Competitor-gap features and visual upgrade — not yet committed (26 Oct 2026)
**Why:** research into SEBI's 2026 measures and existing scam checkers showed gaps. SEBI and Google's Play Store "Verified" badge (Mar 2026) doesn't cover APKs shared by link, websites or iOS. CDSL cites 20,043 clone-app cases and ₹1,420 crore lost. Chatbot-style checkers give a verdict but don't explain the math or say what to do at this exact moment.

| Feature | Where | What it does |
|---|---|---|
| **Clone-app detector** | `src/apps.js` (new), `src/routes/check.js`, `public/js/pages/check.js` | Quick Check recognises trading-app names. A real name ("Zerodha Kite", "Kotak Neo") shows the official apps and websites. "VIP/Pro/Institutional/APK" add-ons or misspellings ("gr0ww", "upst0x") are flagged as clones (high risk). The list of genuine broker apps is `GENUINE_APPS`; keep it current. |
| **Clone-app flag in chat** | `src/analyzer.js` flag `fake_app_name` | Messages naming e.g. "Zerodha VIP app" get a high-severity flag, with a score floor of 60 when combined with APK links, groups, institutional accounts or return promises. |
| **Return Reality Calculator** | `returnCalc()` in `public/js/pages/check.js`; deep link `#/check?tool=calc` | Turns "3% a day" into its yearly equivalent (about 4.8 million %) and ₹ after a year, compared with FD (7%) and a rough long-run equity average (12%, labelled "never guaranteed"), plus the doubling time and a plain verdict. Frontend only. Education, not advice. |
| **Scam-stage meter** | `stageMeter()` in `public/js/pages/dost.js` | Maps the rule-based flags onto the 5-stage investment-scam journey (Hook → Trust → Install → Pay → Trap) and shows "what to do right now" for the current stage. It uses `ruleFlags`, so it works in AI mode too. |
| **Live demo in the home hero** | `public/js/pages/home.js` | A working checker (calls `/api/dost/analyze`) with 3 sample scams, replacing the static illustration. It shows the score, top flags, the verified line and the stage strip, and links to the full chat. |
| **"Built for the gaps" tools section** | `public/js/pages/home.js` | Four tool cards linking to the new features. |
| **Visual polish** | end of `public/css/app.css` ("v2" block) | Hero gradient mesh, gradient display text, animated border on the demo card, tool cards with hover motion, reveal-on-scroll (off for reduced motion), gradient primary buttons. High-contrast mode falls back to solid colours. |
| Tests | `test/analyzer.test.mjs`, `test/api.test.mjs` | Clone-app verdicts, analyzer flag, Quick Check app result. |

**Checked in a real browser (headless Edge):** home, Quick Check (clone-app result and calculator) and chat (stage meter) all render correctly at desktop width.

### 2.8 Pre-launch hardening, part A: server security and correctness — 1 Nov 2026
A senior-tester pass (API probe of about 160 checks, a crawl of every route in 4 display modes, and 20 browser journeys) found these server bugs. All are fixed and covered by tests.

| Bug found | Fix |
|---|---|
| Two sign-ups at the same moment created two accounts for one email | The email is reserved while the password is hashed (`src/routes/auth.js`) |
| 5 wrong guesses by a stranger locked the real owner out for 15 min | Lockout is per email+address (5); a looser per-account cap (25) slows distributed attacks |
| Behind nginx/Caddy every write returned 403 (Host ≠ Origin) | `apiGuard(cfg)` also accepts `X-Forwarded-Host` (with `TRUST_PROXY`), `PUBLIC_URL` and `ALLOWED_ORIGINS` |
| A moderator could reset another moderator's password and take over the account | Reset returns 403 for other moderators |
| Two identical reports at the same moment were both stored | Re-check for an existing report after the async analysis (`src/routes/hunt.js`) |
| Per-IP limits blocked whole colleges or mobile networks sharing one address | Limits key on account when signed in; login counts failures only and sign-up counts successes only; caps raised; `RATE_LIMIT_SCALE`; separate `dost-ai` bucket for paid AI calls |
| `?limit=-5` bypassed the 60-item cap | Clamped to 1–60 |
| Every endpoint accepted 4 MB bodies | 100 kB by default; 4 MB only for the two screenshot endpoints |
| A missing `.js`/`.png` returned the HTML page with status 200 | Real 404 for paths with a file extension |
| Appeals kept names and contact details forever | Anonymised after 12 months, like reports |
| No way to create the first moderator on a fresh server | `ADMIN_EMAIL` + `ADMIN_PASSWORD` create (or promote) one at start-up |
| Expired sessions piled up until restart | Pruned hourly |

Also: `TRUST_PROXY` accepts a hop count or address list, there is a one-time warning when proxy headers arrive without it, and `LOG_REQUESTS=true` logs requests. Tests: 33, all passing.

---

## 3. How to run and test

```bash
npm install
npm start        # http://localhost:3000  (Windows: double-click run.bat)
npm test         # 33 tests, all passing as of 1 Nov 2026
```

- The first run prints a moderator login and saves it to `data/FIRST_RUN_CREDENTIALS.txt`.
- Optional keys go in `.env` (copy `.env.example`): `GROQ_API_KEY` for AI mode and `GOOGLE_SAFE_BROWSING_API_KEY` for live link reputation.
- To start with an empty site, delete `data/` or set `SEED_DEMO=false`.

---

## 4. Open items and ideas

- [ ] Commit the uncommitted work in 2.4–2.6.
- [ ] **Finish the SEBI register, then rebuild with `--complete`** (steps in 2.6). Status on 25 Oct 2026: 884 entries (859 Investment Advisers from 34 of SEBI's 43 IA pages, plus 25 Research Analysts). Still missing: IA pages 1, 5, 13, 26, 33, 34, 36, 38 and 42 (25 records each, SEBI's total is 1,062), and all Research Analyst pages. Saved pages live in `register-pages/` (git-ignored). Until the register is complete, "not found" stays "could not verify". Stock brokers (INZ) have no entries yet.
- [ ] Optional: plug a SEBI lookup vendor into `SEBI_LOOKUP_URL` (check their data source and pricing first).
- [ ] Optional: let a member's right-of-reply submission (with certificate) feed straight into the moderator "add to register" form.
- [ ] Keep `VALID_BANKS` in `src/sebi.js` up to date as more banks issue @valid handles. An unknown bank still verifies; it just shows no bank name.
- [ ] Verified replies in AI mode are in English or Hindi only. If the reply language is another Indian language, the "Verified by FinSuraksha" line stays in English.
- [ ] Password reset depends on a moderator. An email or OTP reset would need a mail or SMS service.

---

## 5. Conventions

- Plain ES modules, no build step, no front-end framework. Match the existing style: short comments, `html` template helper, every user string in `i18n.js` in both `en` and `hi`.
- Every user-facing rule text has an English and a Hindi version (`knowledge.js`, `i18n.js`).
- Never give investment advice anywhere on the site. This is a hard rule of the problem statement.
- Add a test in `test/` for every behaviour change, and keep `npm test` green.
