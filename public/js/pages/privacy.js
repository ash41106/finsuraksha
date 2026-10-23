import { state } from "../state.js";
import { html, mount, icon } from "../ui.js";

export async function render(root) {
  const hi = state.lang === "hi";
  mount(
    root,
    html`<section class="page-hero"><div class="container">
      <span class="crumbs">${icon("lock")}<b>${hi ? "निजता और सुरक्षा" : "Privacy & safety"}</b></span>
      <h1 class="page-title">${hi ? "कम से कम डेटा।" : "Minimum data."} <span class="soft">${hi ? "पूरी पारदर्शिता।" : "Full transparency."}</span></h1>
      <p class="lead">${hi ? "फ़िनसुरक्षा भारत के डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम, 2023 के सिद्धांतों — सहमति, उद्देश्य-सीमा, डेटा कम से कम, और मिटाने का अधिकार — को ध्यान में रखकर बनाया गया है।" : "FinSuraksha is designed around the principles of India's Digital Personal Data Protection (DPDP) Act, 2023 — consent, purpose limitation, data minimisation and the right to erasure."}</p>
    </div></section>
    <section class="container"><div class="grid grid-2" style="align-items:start">
      <div class="card pad-lg prose">
        <h3>${icon("chat")} Suraksha-Dost</h3>
        <ul>
          <li>Chats are processed in memory and <b>never stored</b> on our server. Only anonymous counts (e.g. "a high-risk check happened today") are kept.</li>
          <li>Phone numbers, emails, account/card numbers, Aadhaar, PAN, OTPs and the personal part of UPI IDs are <b>masked</b> before any text is sent to the AI provider.</li>
          <li>Screenshots are read <b>on your device</b> (OCR + QR). A screenshot is sent to the AI only if AI mode is on and you tick the consent box.</li>
          <li>Voice input uses your browser's speech service; replies are read aloud by your device.</li>
        </ul>
        <h3>${icon("flag")} FinScam Hunter</h3>
        <ul>
          <li>Accounts are for people aged <b>18+</b>. Younger users can use Suraksha-Dost, Quick Check and Learn without an account (no parental-consent data is collected).</li>
          <li>We store your display name, email, a scrypt-hashed password, role, optional college, your reports and votes.</li>
          <li>Screenshot evidence is re-encoded in your browser (removing location/EXIF data) and shown only to signed-in members.</li>
          <li>Public alerts show only community-verified reports. Links are "defanged" so nobody clicks a scam site by accident.</li>
          <li><b>Right of reply:</b> anyone can request a review of a report; it is then marked "Under review" for a moderator.</li>
        </ul>
      </div>
      <div class="card pad-lg prose">
        <h3>${icon("shieldCheck")} ${hi ? "आपके अधिकार" : "Your rights"}</h3>
        <ul>
          <li><b>Access & portability:</b> download all your data from your profile.</li>
          <li><b>Erasure:</b> delete your account any time; your reports are anonymised and their screenshots deleted.</li>
          <li><b>Withdraw consent:</b> hide yourself from the leaderboard or delete your account.</li>
        </ul>
        <h3>${icon("lock")} ${hi ? "सुरक्षा" : "Security"}</h3>
        <ul>
          <li>HttpOnly, SameSite session cookies; only a hash of the session token is stored.</li>
          <li>Strict Content-Security-Policy, cross-origin request blocking, rate limits and login lockout.</li>
          <li>All user content is escaped before display to prevent script injection.</li>
        </ul>
        <h3>${icon("info")} ${hi ? "ज़रूरी सूचना" : "Important"}</h3>
        <p>FinSuraksha is an educational awareness tool. It is <b>not affiliated with SEBI, CDSL, NSDL, NSE, BSE or RBI</b>, does not give investment advice, does not enable trading, and does not promote any security. Automated checks can be wrong — always verify on the official websites linked here.</p>
      </div>
    </div></section>`,
  );
}
