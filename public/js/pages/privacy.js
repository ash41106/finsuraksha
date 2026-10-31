import { state } from "../state.js";
import { html, mount, icon } from "../ui.js";

// Privacy notice (#/privacy) and terms of use (#/terms), in English and Hindi.
const L = (en, hi) => (state.lang === "hi" ? hi : en);

function contact() {
  const email = state.config?.contactEmail;
  return html`<h3>${icon("help")} ${L("Grievance contact", "शिकायत संपर्क")}</h3>
    <p>${L(
      "For questions about your data, a correction, or a complaint about a report, write to us. We reply within 7 days and resolve within 30 days.",
      "अपने डेटा, किसी सुधार या किसी रिपोर्ट के बारे में शिकायत के लिए हमें लिखें। हम 7 दिन में जवाब देते हैं और 30 दिन में समाधान करते हैं।",
    )}</p>
    <p>${email ? html`<a href="mailto:${email}">${email}</a>` : L("Use “Request a review” on the report, or ask a moderator.", "रिपोर्ट पर “समीक्षा का अनुरोध” का उपयोग करें, या किसी मॉडरेटर से पूछें।")}</p>`;
}

function privacy() {
  return html`<section class="page-hero"><div class="container">
      <span class="crumbs">${icon("lock")}<b>${L("Privacy & safety", "निजता और सुरक्षा")}</b></span>
      <h1 class="page-title">${L("Minimum data.", "कम से कम डेटा।")} <span class="soft">${L("Full transparency.", "पूरी पारदर्शिता।")}</span></h1>
      <p class="lead">${L(
        "FinSuraksha is designed around India's Digital Personal Data Protection (DPDP) Act, 2023: consent, purpose limitation, data minimisation and the right to erasure.",
        "फ़िनसुरक्षा भारत के डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम, 2023 के सिद्धांतों — सहमति, उद्देश्य-सीमा, कम से कम डेटा और मिटाने का अधिकार — पर बना है।",
      )}</p>
    </div></section>
    <section class="container"><div class="grid grid-2" style="align-items:start">
      <div class="card pad-lg prose">
        <h2 class="h3">${icon("chat")} Suraksha-Dost</h2>
        <ul>
          <li>${L("Chats are processed in memory and never stored on our server. Only anonymous counts (for example “a high-risk check happened today”) are kept.", "चैट मेमोरी में जाँची जाती है और हमारे सर्वर पर कभी सहेजी नहीं जाती। केवल गुमनाम गिनती (जैसे “आज एक हाई-रिस्क जाँच हुई”) रखी जाती है।")}</li>
          <li>${L("AI mode is off for each chat until you switch it on. When it is on, phone numbers, emails, account and card numbers, Aadhaar, PAN, OTPs and the personal part of UPI IDs are masked before the text is sent to the AI provider (Groq).", "हर चैट में AI मोड तब तक बंद रहता है जब तक आप उसे चालू न करें। चालू होने पर फ़ोन नंबर, ईमेल, खाता व कार्ड नंबर, आधार, PAN, OTP और UPI ID का निजी हिस्सा AI प्रदाता (Groq) को भेजने से पहले छिपा दिया जाता है।")}</li>
          <li>${L("Screenshots are read on your device (OCR and QR). A screenshot goes to the AI only if AI mode is on and you tick the consent box.", "स्क्रीनशॉट आपके डिवाइस पर ही पढ़े जाते हैं (OCR और QR)। स्क्रीनशॉट AI को तभी जाता है जब AI मोड चालू हो और आप सहमति का बॉक्स चुनें।")}</li>
          <li>${L("Voice input uses your browser's speech service; replies are read aloud by your device.", "बोलकर लिखने के लिए आपके ब्राउज़र की स्पीच सेवा का उपयोग होता है; जवाब आपका डिवाइस पढ़कर सुनाता है।")}</li>
        </ul>
        <h2 class="h3">${icon("flag")} FinScam Hunter</h2>
        <ul>
          <li>${L("Accounts are for people aged 18 or above. Younger people can use Suraksha-Dost, Quick Check and Learn without an account.", "खाते 18 वर्ष या उससे अधिक आयु वालों के लिए हैं। कम उम्र के लोग बिना खाते के सुरक्षा-दोस्त, क्विक चेक और सीखें का उपयोग कर सकते हैं।")}</li>
          <li>${L("We store your display name, email, a hashed password (scrypt), role, optional college, and your reports and votes.", "हम आपका नाम, ईमेल, हैश किया हुआ पासवर्ड (scrypt), भूमिका, वैकल्पिक कॉलेज, और आपकी रिपोर्ट व वोट सहेजते हैं।")}</li>
          <li>${L("Screenshot evidence is re-encoded in your browser (removing location data) and shown only to signed-in members.", "सबूत के स्क्रीनशॉट आपके ब्राउज़र में दोबारा बनाए जाते हैं (लोकेशन डेटा हटाकर) और केवल साइन-इन सदस्यों को दिखते हैं।")}</li>
          <li>${L("Public alerts show only community-verified reports. Links are “defanged” so nobody opens a scam site by accident.", "सार्वजनिक अलर्ट में केवल समुदाय-सत्यापित रिपोर्ट दिखती हैं। लिंक “निष्क्रिय” करके दिखाए जाते हैं ताकि कोई गलती से ठगी की साइट न खोले।")}</li>
          <li>${L("Retention: after 12 months a report keeps only what the alert needs (entity, category, status). The reporter link, screenshot and extracted text are deleted. Review requests lose their name and contact details after 12 months.", "रखने की अवधि: 12 महीने बाद रिपोर्ट में केवल अलर्ट के लिए ज़रूरी जानकारी (इकाई, श्रेणी, स्थिति) रहती है। रिपोर्ट करने वाले से जुड़ाव, स्क्रीनशॉट और निकाला गया टेक्स्ट मिटा दिया जाता है। समीक्षा अनुरोधों से 12 महीने बाद नाम और संपर्क हटा दिए जाते हैं।")}</li>
          <li>${L("Right of reply: anyone can request a review of a report; it is then marked “Under review” for a moderator.", "जवाब का अधिकार: कोई भी किसी रिपोर्ट की समीक्षा माँग सकता है; तब वह मॉडरेटर के लिए “समीक्षा में” चिह्नित हो जाती है।")}</li>
        </ul>
      </div>
      <div class="card pad-lg prose">
        <h2 class="h3">${icon("shieldCheck")} ${L("Your rights", "आपके अधिकार")}</h2>
        <ul>
          <li>${L("Access and portability: download all your data from your profile.", "पहुँच और पोर्टेबिलिटी: अपनी प्रोफ़ाइल से अपना सारा डेटा डाउनलोड करें।")}</li>
          <li>${L("Erasure: delete your account at any time; your reports are anonymised and their screenshots deleted.", "मिटाना: कभी भी अपना खाता हटाएँ; आपकी रिपोर्ट गुमनाम हो जाती हैं और उनके स्क्रीनशॉट मिटा दिए जाते हैं।")}</li>
          <li>${L("Withdraw consent: hide yourself from the leaderboard, or delete your account.", "सहमति वापस लें: लीडरबोर्ड से खुद को छिपाएँ, या खाता हटाएँ।")}</li>
        </ul>
        <h2 class="h3">${icon("lock")} ${L("Security", "सुरक्षा")}</h2>
        <ul>
          <li>${L("HttpOnly, SameSite session cookies; only a hash of the session token is stored.", "HttpOnly, SameSite सत्र कुकी; सत्र टोकन का केवल हैश सहेजा जाता है।")}</li>
          <li>${L("Strict Content-Security-Policy, cross-origin request blocking, rate limits and sign-in lockout.", "सख़्त Content-Security-Policy, बाहरी साइटों के अनुरोधों पर रोक, दर सीमा और गलत लॉगिन पर रोक।")}</li>
          <li>${L("All user content is escaped before display to prevent script injection.", "स्क्रिप्ट इंजेक्शन रोकने के लिए उपयोगकर्ता की हर सामग्री दिखाने से पहले सुरक्षित की जाती है।")}</li>
        </ul>
        ${contact()}
        <p class="small"><a href="#/terms">${L("Terms of use", "उपयोग की शर्तें")}</a></p>
      </div>
    </div></section>`;
}

function terms() {
  const items = [
    [L("Education, not advice", "शिक्षा, सलाह नहीं"), L("FinSuraksha is a free awareness tool. It does not give investment advice, recommend any security, or enable trading. Automated checks can be wrong. Before you pay anyone, verify on the official websites we link to.", "फ़िनसुरक्षा एक मुफ़्त जागरूकता साधन है। यह निवेश सलाह नहीं देता, किसी सिक्योरिटी की सिफ़ारिश नहीं करता और ट्रेडिंग नहीं कराता। स्वचालित जाँच गलत हो सकती है। किसी को भुगतान करने से पहले हमारे दिए आधिकारिक वेबसाइट लिंक पर जाँच करें।")],
    [L("Not affiliated", "किसी संस्था से संबद्ध नहीं"), L("We are not affiliated with SEBI, CDSL, NSDL, NSE, BSE, RBI or any broker. Names of these bodies are used only to point you to them.", "हम SEBI, CDSL, NSDL, NSE, BSE, RBI या किसी ब्रोकर से संबद्ध नहीं हैं। इन संस्थाओं के नाम केवल आपको वहाँ तक पहुँचाने के लिए हैं।")],
    [L("Reporting honestly", "ईमानदारी से रिपोर्ट करें"), L("Report only what you have actually received or seen. Do not report someone to settle a personal dispute, and do not upload other people's private information beyond what the scam message itself shows. False or abusive reports are removed and the account may be closed.", "केवल वही रिपोर्ट करें जो आपको सच में मिला या दिखा। निजी झगड़े के लिए किसी की रिपोर्ट न करें, और ठगी के संदेश में जो दिखता है उससे ज़्यादा किसी की निजी जानकारी अपलोड न करें। झूठी या अपमानजनक रिपोर्ट हटा दी जाती है और खाता बंद किया जा सकता है।")],
    [L("Community verification", "समुदाय द्वारा सत्यापन"), L("A report becomes a public alert only after several members confirm it. An alert is the community's opinion, not a legal finding. Anyone named can request a review.", "रिपोर्ट तभी सार्वजनिक अलर्ट बनती है जब कई सदस्य उसकी पुष्टि करें। अलर्ट समुदाय की राय है, कानूनी निर्णय नहीं। जिसका नाम है वह समीक्षा माँग सकता है।")],
    [L("Your account", "आपका खाता"), L("Keep your password private. You can download or delete your data at any time from your profile.", "अपना पासवर्ड गुप्त रखें। आप अपनी प्रोफ़ाइल से कभी भी अपना डेटा डाउनलोड या हटा सकते हैं।")],
    [L("If you have been cheated", "अगर आपके साथ ठगी हुई है"), L("Call 1930 or file at cybercrime.gov.in straight away. FinSuraksha cannot recover money or act on your behalf.", "तुरंत 1930 पर कॉल करें या cybercrime.gov.in पर शिकायत करें। फ़िनसुरक्षा पैसा वापस नहीं दिला सकता और आपकी ओर से कार्रवाई नहीं कर सकता।")],
  ];
  return html`<section class="page-hero"><div class="container">
      <span class="crumbs">${icon("info")}<b>${L("Terms of use", "उपयोग की शर्तें")}</b></span>
      <h1 class="page-title">${L("Terms of use", "उपयोग की शर्तें")}</h1>
      <p class="lead">${L("By using FinSuraksha you agree to these terms.", "फ़िनसुरक्षा का उपयोग करके आप इन शर्तों से सहमत होते हैं।")}</p>
    </div></section>
    <section class="container"><div class="card pad-lg prose" style="max-width:820px">
      ${items.map(([h, p]) => html`<h2 class="h3">${h}</h2><p>${p}</p>`)}
      ${contact()}
      <p class="small"><a href="#/privacy">${L("Privacy notice", "निजता सूचना")}</a></p>
    </div></section>`;
}

export async function render(root, { parts }) {
  mount(root, parts[0] === "terms" ? terms() : privacy());
}
