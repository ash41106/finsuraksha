// Bilingual content: labels, learn modules, opportunity checklist and the
// official-channel directory. Facts were checked against SEBI/RBI/DoT sources
// (see README "Sources").

export const CATEGORY = {
  dabba: { icon: "🎲", en: "Dabba trading", hi: "डब्बा ट्रेडिंग" },
  fno_tips: { icon: "📈", en: "Illegal F&O / tips group", hi: "ग़ैरक़ानूनी F&O / टिप ग्रुप" },
  finfluencer: { icon: "🎙️", en: "Unregistered finfluencer", hi: "अनरजिस्टर्ड फ़िनफ़्लुएंसर" },
  pump_dump: { icon: "🚀", en: "Pump & dump", hi: "पंप एंड डंप" },
  fake_app: { icon: "📱", en: "Fake trading app", hi: "नकली ट्रेडिंग ऐप" },
  phishing: { icon: "🎣", en: "Phishing / OTP-KYC fraud", hi: "फ़िशिंग / OTP-KYC ठगी" },
  deepfake: { icon: "🎭", en: "Deepfake / celebrity ad", hi: "डीपफ़ेक / सेलिब्रिटी विज्ञापन" },
  ponzi: { icon: "🔺", en: "Ponzi / guaranteed returns", hi: "पोंज़ी / पक्का रिटर्न" },
  forex_crypto: { icon: "💱", en: "Forex / crypto platform", hi: "फ़ॉरेक्स / क्रिप्टो प्लेटफ़ॉर्म" },
  other: { icon: "❓", en: "Other", hi: "अन्य" },
};

export const PLATFORM = {
  telegram: { icon: "✈️", en: "Telegram", hi: "Telegram" },
  whatsapp: { icon: "💬", en: "WhatsApp", hi: "WhatsApp" },
  instagram: { icon: "📸", en: "Instagram", hi: "Instagram" },
  youtube: { icon: "▶️", en: "YouTube", hi: "YouTube" },
  x: { icon: "𝕏", en: "X / Twitter", hi: "X / Twitter" },
  facebook: { icon: "ⓕ", en: "Facebook", hi: "Facebook" },
  website: { icon: "🌐", en: "Website", hi: "वेबसाइट" },
  app: { icon: "📲", en: "App / APK", hi: "ऐप / APK" },
  call_sms: { icon: "📞", en: "Call / SMS", hi: "कॉल / SMS" },
  other: { icon: "•", en: "Other", hi: "अन्य" },
};

export const ENTITY = {
  telegram: { en: "Telegram channel / group", hi: "Telegram चैनल / ग्रुप", ph: "t.me/… or @channel" },
  whatsapp: { en: "WhatsApp group / number", hi: "WhatsApp ग्रुप / नंबर", ph: "Group name, invite link or number" },
  handle: { en: "Social media handle", hi: "सोशल मीडिया हैंडल", ph: "@handle" },
  url: { en: "Website / link", hi: "वेबसाइट / लिंक", ph: "example.com/…" },
  app: { en: "App name", hi: "ऐप का नाम", ph: "Name of the app" },
  upi: { en: "UPI ID", hi: "UPI ID", ph: "name@bank" },
  phone: { en: "Phone number", hi: "फ़ोन नंबर", ph: "+91 …" },
  other: { en: "Other", hi: "अन्य", ph: "Name or identifier" },
};

export const CHAT_LANGS = [
  { code: "en", name: "English", speech: "en-IN", ocr: "eng" },
  { code: "hi", name: "हिन्दी", speech: "hi-IN", ocr: "hin" },
  { code: "mr", name: "मराठी", speech: "mr-IN", ocr: "mar" },
  { code: "bn", name: "বাংলা", speech: "bn-IN", ocr: "ben" },
  { code: "ta", name: "தமிழ்", speech: "ta-IN", ocr: "tam" },
  { code: "te", name: "తెలుగు", speech: "te-IN", ocr: "tel" },
  { code: "gu", name: "ગુજરાતી", speech: "gu-IN", ocr: "guj" },
  { code: "kn", name: "ಕನ್ನಡ", speech: "kn-IN", ocr: "kan" },
  { code: "ml", name: "മലയാളം", speech: "ml-IN", ocr: "mal" },
  { code: "pa", name: "ਪੰਜਾਬੀ", speech: "pa-IN", ocr: "pan" },
];

export const EXAMPLES = {
  ex1: {
    en: "URGENT: Join our VIP Telegram group t.me/+NiftySureShotVIP for guaranteed 30% monthly returns. Pay ₹4,999 joining fee to investprofit.vip@ybl. Only 10 seats left!",
    hi: "ज़रूरी: हमारे VIP Telegram ग्रुप t.me/+NiftySureShotVIP से जुड़ें, हर महीने 30% पक्का मुनाफ़ा। ₹4,999 जॉइनिंग फ़ीस investprofit.vip@ybl पर भेजें। सिर्फ़ 10 सीटें बाक़ी!",
  },
  ex2: { en: "Is this link safe? https://zer0dha-kyc-update.top/login", hi: "क्या यह लिंक सुरक्षित है? https://zer0dha-kyc-update.top/login" },
  ex3: { en: "Is INH000011431 a SEBI-registered research analyst?", hi: "क्या INH000011431 SEBI-रजिस्टर्ड रिसर्च एनालिस्ट है?" },
  ex4: { en: "My broker asked me to pay margin to abc.brk@validhdfc. Is that okay?", hi: "मेरे ब्रोकर ने मार्जिन abc.brk@validhdfc पर भेजने को कहा है। क्या यह ठीक है?" },
  ex5: { en: "What is dabba trading?", hi: "डब्बा ट्रेडिंग क्या है?" },
  ex6: { en: "I lost money to a fake trading app. What should I do?", hi: "मेरे साथ नकली ट्रेडिंग ऐप से ठगी हो गई, पैसे चले गए। अब क्या करूँ?" },
};

// Quote band on the home page: real-style scam lines (paraphrased).
export const SCAM_LINES = [
  {
    en: "“Guaranteed 300 points daily in BankNifty. Join VIP for ₹4,999 — only 10 seats left!”",
    hi: "“BankNifty में रोज़ 300 पॉइंट पक्के। ₹4,999 में VIP जॉइन करें — सिर्फ़ 10 सीटें बाक़ी!”",
    src: { en: "Telegram 'VIP tips' channel", hi: "Telegram 'VIP टिप्स' चैनल" },
    flags: { en: ["Guaranteed returns", "Urgency", "Paid tips"], hi: ["पक्का रिटर्न", "जल्दबाज़ी", "पैसे वाली टिप"] },
    icon: "send",
  },
  {
    en: "“Your demat KYC expires today. Update now at the link below or your account will be blocked.”",
    hi: "“आपका डीमैट KYC आज ख़त्म हो रहा है। नीचे दिए लिंक पर अभी अपडेट करें वरना खाता ब्लॉक हो जाएगा।”",
    src: { en: "SMS from an unknown number", hi: "अनजान नंबर से SMS" },
    flags: { en: ["Fake KYC alert", "Phishing link", "Threat"], hi: ["नकली KYC अलर्ट", "फ़िशिंग लिंक", "धमकी"] },
    icon: "phone",
  },
  {
    en: "“Open an institutional account in our app to get guaranteed IPO allotment and block-deal prices.”",
    hi: "“हमारे ऐप में इंस्टीट्यूशनल अकाउंट खोलें और पक्का IPO अलॉटमेंट और ब्लॉक-डील भाव पाएँ।”",
    src: { en: "WhatsApp 'investment club'", hi: "WhatsApp 'इन्वेस्टमेंट क्लब'" },
    flags: { en: ["Institutional account pitch", "App via link", "Guarantee"], hi: ["इंस्टीट्यूशनल अकाउंट", "लिंक से ऐप", "गारंटी"] },
    icon: "chat",
  },
  {
    en: "“No demat, no KYC, 500x leverage and zero tax. Trade with us and settle profit in cash.”",
    hi: "“न डीमैट, न KYC, 500 गुना लीवरेज और ज़ीरो टैक्स। हमारे साथ ट्रेड करें और मुनाफ़ा नकद लें।”",
    src: { en: "Dabba trading operator", hi: "डब्बा ट्रेडिंग ऑपरेटर" },
    flags: { en: ["Dabba trading", "Illegal under SCRA", "No protection"], hi: ["डब्बा ट्रेडिंग", "SCRA के तहत ग़ैरक़ानूनी", "कोई सुरक्षा नहीं"] },
    icon: "alert",
  },
  {
    en: "“Your profit is ₹8.4 lakh! Pay 15% advance tax first to withdraw it to your bank.”",
    hi: "“आपका मुनाफ़ा ₹8.4 लाख है! बैंक में निकालने के लिए पहले 15% एडवांस टैक्स भरें।”",
    src: { en: "Fake trading app support", hi: "नकली ट्रेडिंग ऐप सपोर्ट" },
    flags: { en: ["Fee to withdraw", "Fake profits", "Pay more trap"], hi: ["निकासी के लिए फ़ीस", "नकली मुनाफ़ा", "और पैसे का जाल"] },
    icon: "rupee",
  },
];

export const STRIP = [
  { icon: "alert", key: "dabba" },
  { icon: "send", key: "fno_tips" },
  { icon: "mic", key: "finfluencer" },
  { icon: "bolt", key: "pump_dump" },
  { icon: "app", key: "fake_app" },
  { icon: "lock", key: "phishing" },
  { icon: "eye", key: "deepfake" },
  { icon: "globe", key: "forex_crypto" },
];

export const MODULES = [
  {
    id: "dabba",
    icon: "🎲",
    title: { en: "Dabba trading", hi: "डब्बा ट्रेडिंग" },
    blurb: { en: "Off-exchange 'trading' that promises no demat, huge leverage and no tax.", hi: "एक्सचेंज के बाहर 'ट्रेडिंग' जिसमें बिना डीमैट, भारी लीवरेज और बिना टैक्स का वादा होता है।" },
    how: {
      en: ["An operator runs a private 'book' outside NSE/BSE.", "You 'trade' on their app or by phone; profits and losses are settled in cash.", "If the operator disappears or refuses to pay, your money is gone."],
      hi: ["ऑपरेटर NSE/BSE के बाहर अपनी निजी 'बुक' चलाता है।", "आप उनके ऐप या फ़ोन पर 'ट्रेड' करते हैं; नफ़ा-नुक़सान नकद में चुकाया जाता है।", "ऑपरेटर भाग जाए या पैसे न दे, तो आपका पैसा डूब जाता है।"],
    },
    flags: { en: ["'No demat / no KYC needed'", "Leverage like 100x–500x", "'No tax, cash settlement'"], hi: ["'डीमैट / KYC की ज़रूरत नहीं'", "100–500 गुना लीवरेज", "'कोई टैक्स नहीं, नकद हिसाब'"] },
    todo: { en: ["Trade only through SEBI-registered brokers on recognised exchanges.", "Check a broker on the NSE/BSE websites or SEBI's intermediary search.", "Report operators on FinScam Hunter and to the police."], hi: ["सिर्फ़ SEBI-रजिस्टर्ड ब्रोकर से मान्य एक्सचेंज पर ट्रेड करें।", "ब्रोकर को NSE/BSE वेबसाइट या SEBI सूची में जाँचें।", "ऑपरेटर की शिकायत फ़िनस्कैम हंटर और पुलिस से करें।"] },
    fact: { en: "Illegal under the Securities Contracts (Regulation) Act, 1956 — up to 10 years' imprisonment and/or a fine of up to ₹25 crore. Victims get no exchange grievance protection.", hi: "सिक्योरिटीज़ कॉन्ट्रैक्ट्स (रेगुलेशन) एक्ट, 1956 के तहत ग़ैरक़ानूनी — 10 साल तक जेल और/या ₹25 करोड़ तक जुर्माना। पीड़ित को एक्सचेंज की शिकायत-सुरक्षा नहीं मिलती।" },
  },
  {
    id: "finfluencer",
    icon: "🎙️",
    title: { en: "Unregistered finfluencers", hi: "अनरजिस्टर्ड फ़िनफ़्लुएंसर" },
    blurb: { en: "Reels and channels selling 'sure-shot' calls without SEBI registration.", hi: "बिना SEBI रजिस्ट्रेशन के 'पक्की टिप' बेचने वाले रील और चैनल।" },
    how: {
      en: ["Viral reels show luxury lifestyles and 'profit screenshots'.", "Followers are pushed to paid Telegram groups or courses.", "Calls are often timed to dump stocks on followers."],
      hi: ["वायरल रील में शानदार ज़िंदगी और 'मुनाफ़े के स्क्रीनशॉट' दिखाए जाते हैं।", "फ़ॉलोअर्स को पैसे वाले Telegram ग्रुप या कोर्स में धकेला जाता है।", "टिप अक्सर ऐसे समय दी जाती है कि शेयर फ़ॉलोअर्स पर बेचे जा सकें।"],
    },
    flags: { en: ["No INA/INH number anywhere", "Claims like '20% a month'", "'DM for paid calls'"], hi: ["कहीं INA/INH नंबर नहीं", "'हर महीने 20%' जैसे दावे", "'पेड कॉल के लिए DM करें'"] },
    todo: { en: ["Ask for the SEBI registration number and verify it on sebi.gov.in.", "Prefer educators who teach concepts, not tips.", "Report misleading accounts on FinScam Hunter and on the platform."], hi: ["SEBI रजिस्ट्रेशन नंबर माँगें और sebi.gov.in पर जाँचें।", "टिप नहीं, समझ सिखाने वाले शिक्षकों को चुनें।", "भ्रामक अकाउंट की रिपोर्ट फ़िनस्कैम हंटर और प्लेटफ़ॉर्म पर करें।"] },
    fact: { en: "Since 29 Aug 2024, SEBI-registered entities may not associate with unregistered persons who give advice or claim returns. Education-only creators are exempt if they don't advise or make performance claims.", hi: "29 अगस्त 2024 से SEBI-रजिस्टर्ड संस्थाएँ ऐसे अनरजिस्टर्ड लोगों से नहीं जुड़ सकतीं जो सलाह देते हैं या रिटर्न का दावा करते हैं। सिर्फ़ शिक्षा देने वाले, जो सलाह या रिटर्न का दावा नहीं करते, छूट में हैं।" },
  },
  {
    id: "pump_dump",
    icon: "🚀",
    title: { en: "Pump & dump", hi: "पंप एंड डंप" },
    blurb: { en: "Hype around a cheap stock so insiders can sell to you at the top.", hi: "सस्ते शेयर की हवा बनाकर अंदर वाले ऊँचे भाव पर आपको बेच देते हैं।" },
    how: {
      en: ["Operators quietly buy a thinly traded penny stock.", "Groups and videos flood it with 'multibagger' and 'upper circuit' tips.", "When followers buy and the price jumps, operators sell and the price crashes."],
      hi: ["ऑपरेटर चुपचाप कम ट्रेड होने वाला पेनी स्टॉक ख़रीदते हैं।", "ग्रुप और वीडियो में 'मल्टीबैगर' और 'अपर सर्किट' की टिप फैलाई जाती है।", "लोग ख़रीदते हैं, भाव चढ़ता है, ऑपरेटर बेचते हैं और भाव गिर जाता है।"],
    },
    flags: { en: ["'Operator stock', 'insider news'", "Sudden spam about one unknown stock", "'Buy before 10 am'"], hi: ["'ऑपरेटर स्टॉक', 'अंदर की ख़बर'", "एक अनजान शेयर के बारे में अचानक शोर", "'सुबह 10 बजे से पहले ख़रीदो'"] },
    todo: { en: ["Never buy on an unsolicited tip.", "Check the company's filings on the exchange website.", "Report the group so others are warned."], hi: ["बिन माँगी टिप पर कभी न ख़रीदें।", "एक्सचेंज वेबसाइट पर कंपनी की जानकारी देखें।", "ग्रुप की रिपोर्ट करें ताकि दूसरे सावधान रहें।"] },
    fact: { en: "Market manipulation is prohibited under SEBI's PFUTP Regulations; SEBI has taken action against tip-spreading channels.", hi: "बाज़ार में हेराफेरी SEBI के PFUTP नियमों के तहत प्रतिबंधित है; SEBI टिप फैलाने वाले चैनलों पर कार्रवाई करता रहा है।" },
  },
  {
    id: "fake_app",
    icon: "📱",
    title: { en: "Fake trading apps & 'institutional accounts'", hi: "नकली ट्रेडिंग ऐप और 'इंस्टीट्यूशनल अकाउंट'" },
    blurb: { en: "The 2025-26 favourite: WhatsApp club → app from a link → fake profits → withdrawal fees.", hi: "2025-26 का पसंदीदा तरीक़ा: WhatsApp क्लब → लिंक से ऐप → नकली मुनाफ़ा → निकासी फ़ीस।" },
    how: {
      en: ["An ad or WhatsApp 'investment club' shares free tips for days.", "You're asked to install an app from a link and open an 'institutional account' for IPOs or block deals.", "The app shows big profits; withdrawing needs 'tax' or 'processing fees' — and then more."],
      hi: ["कोई विज्ञापन या WhatsApp 'इन्वेस्टमेंट क्लब' कई दिन मुफ़्त टिप देता है।", "फिर लिंक से ऐप इंस्टॉल कराकर IPO या ब्लॉक डील के लिए 'इंस्टीट्यूशनल अकाउंट' खुलवाया जाता है।", "ऐप में बड़ा मुनाफ़ा दिखता है; निकालने पर 'टैक्स' या 'प्रोसेसिंग फ़ीस' माँगी जाती है — और फिर और।"],
    },
    flags: { en: ["App not on official app stores", "'Institutional / VIP account'", "Pay to withdraw your own money"], hi: ["ऐप आधिकारिक स्टोर पर नहीं", "'इंस्टीट्यूशनल / VIP अकाउंट'", "अपना पैसा निकालने के लिए भुगतान"] },
    todo: { en: ["Use apps only from SEBI-registered brokers, from official app stores.", "Never pay fees to withdraw.", "Already paid? Call 1930 and file at cybercrime.gov.in."], hi: ["सिर्फ़ SEBI-रजिस्टर्ड ब्रोकर के ऐप, आधिकारिक स्टोर से ही लें।", "पैसे निकालने के लिए कभी फ़ीस न दें।", "भुगतान कर चुके हैं? 1930 पर कॉल करें और cybercrime.gov.in पर शिकायत करें।"] },
    fact: { en: "Since 1 Oct 2025, SEBI-registered brokers and mutual funds collect money via @valid UPI handles — verify any payment ID on SEBI Check.", hi: "1 अक्टूबर 2025 से SEBI-रजिस्टर्ड ब्रोकर और म्यूचुअल फ़ंड @valid UPI से पैसे लेते हैं — किसी भी पेमेंट ID को SEBI Check पर जाँचें।" },
  },
  {
    id: "otp_kyc",
    icon: "🎣",
    title: { en: "OTP, KYC & phishing", hi: "OTP, KYC और फ़िशिंग" },
    blurb: { en: "'Your demat will be blocked — share the OTP' is always a scam.", hi: "'आपका डीमैट बंद हो जाएगा — OTP बताइए' हमेशा ठगी होती है।" },
    how: {
      en: ["You get an SMS, call or WhatsApp about expired KYC or a blocked account.", "A link opens a copy of your broker's or bank's login page.", "Your password and OTP go straight to the fraudster."],
      hi: ["आपको KYC ख़त्म होने या खाता बंद होने का SMS, कॉल या WhatsApp आता है।", "लिंक से आपके ब्रोकर या बैंक के लॉगिन पेज की नकल खुलती है।", "आपका पासवर्ड और OTP सीधे ठग के पास पहुँच जाता है।"],
    },
    flags: { en: ["Threat of blocking 'today'", "Link that isn't the official domain", "Anyone asking for OTP or PIN"], hi: ["'आज ही' बंद करने की धमकी", "आधिकारिक डोमेन के अलावा लिंक", "OTP या PIN माँगने वाला कोई भी"] },
    todo: { en: ["Update KYC only inside your broker's official app.", "Report the number on Sanchar Saathi → Chakshu.", "Shared an OTP? Call your bank and 1930 immediately."], hi: ["KYC सिर्फ़ ब्रोकर के आधिकारिक ऐप में अपडेट करें।", "नंबर की शिकायत संचार साथी → चक्षु पर करें।", "OTP बता दिया? तुरंत बैंक और 1930 पर कॉल करें।"] },
    fact: { en: "Chakshu (sancharsaathi.gov.in/sfc) accepts reports of suspected fraud calls, SMS and WhatsApp received in the last 30 days.", hi: "चक्षु (sancharsaathi.gov.in/sfc) पिछले 30 दिनों में आए संदिग्ध कॉल, SMS और WhatsApp की शिकायत लेता है।" },
  },
  {
    id: "deepfake",
    icon: "🎭",
    title: { en: "Deepfake & celebrity ads", hi: "डीपफ़ेक और सेलिब्रिटी विज्ञापन" },
    blurb: { en: "AI videos of famous people 'recommending' a secret trading platform.", hi: "मशहूर लोगों के AI वीडियो जो किसी गुप्त ट्रेडिंग प्लेटफ़ॉर्म की 'सिफ़ारिश' करते हैं।" },
    how: {
      en: ["A video or fake news article shows a business leader or anchor praising an 'AI trading' app.", "It promises to turn a small deposit into lakhs.", "A 'manager' calls you and pushes bigger deposits."],
      hi: ["वीडियो या नकली ख़बर में कोई उद्योगपति या एंकर किसी 'AI ट्रेडिंग' ऐप की तारीफ़ करता दिखता है।", "छोटी रकम को लाखों में बदलने का वादा होता है।", "फिर कोई 'मैनेजर' कॉल करके और पैसे लगवाता है।"],
    },
    flags: { en: ["Celebrity + 'secret' platform", "Lip-sync or voice looks off", "Comments turned off"], hi: ["सेलिब्रिटी + 'गुप्त' प्लेटफ़ॉर्म", "होंठ या आवाज़ मेल नहीं खाते", "कमेंट बंद"] },
    todo: { en: ["Check the platform's SEBI registration and website address.", "Search for the celebrity's official denial.", "Report the ad on the platform and FinScam Hunter."], hi: ["प्लेटफ़ॉर्म का SEBI रजिस्ट्रेशन और वेबसाइट पता जाँचें।", "मशहूर व्यक्ति का आधिकारिक खंडन खोजें।", "विज्ञापन की रिपोर्ट प्लेटफ़ॉर्म और फ़िनस्कैम हंटर पर करें।"] },
    fact: { en: "Celebrities don't endorse platforms with guaranteed returns. Real investment products carry the market-risk disclaimer.", hi: "मशहूर लोग पक्के रिटर्न वाले प्लेटफ़ॉर्म का प्रचार नहीं करते। असली निवेश में बाज़ार-जोखिम की चेतावनी होती है।" },
  },
  {
    id: "digital_arrest",
    icon: "🚔",
    title: { en: "'Digital arrest'", hi: "'डिजिटल अरेस्ट'" },
    blurb: { en: "Fake CBI, police or SEBI officers threatening arrest on video calls.", hi: "वीडियो कॉल पर गिरफ़्तारी की धमकी देने वाले नकली CBI, पुलिस या SEBI अधिकारी।" },
    how: {
      en: ["A caller says a parcel, SIM or account in your name is linked to a crime.", "You're kept on a video call and told not to tell anyone.", "You're asked to transfer money to 'verify' or 'clear' your name."],
      hi: ["कॉल करने वाला कहता है कि आपके नाम का पार्सल, सिम या खाता किसी अपराध से जुड़ा है।", "आपको वीडियो कॉल पर रोककर किसी को न बताने को कहा जाता है।", "नाम 'साफ़' करने के लिए पैसे भेजने को कहा जाता है।"],
    },
    flags: { en: ["Threats of immediate arrest", "Demand for secrecy", "Money to 'settle' a case"], hi: ["तुरंत गिरफ़्तारी की धमकी", "किसी को न बताने का दबाव", "केस 'निपटाने' के लिए पैसे"] },
    todo: { en: ["Disconnect. No agency arrests people over video calls.", "Talk to family immediately.", "Call 1930 and report the number on Chakshu."], hi: ["कॉल काटें। कोई एजेंसी वीडियो कॉल पर गिरफ़्तार नहीं करती।", "तुरंत परिवार से बात करें।", "1930 पर कॉल करें और नंबर की शिकायत चक्षु पर करें।"] },
    fact: { en: "There is no such thing as a 'digital arrest' in Indian law.", hi: "भारतीय क़ानून में 'डिजिटल अरेस्ट' जैसी कोई चीज़ नहीं है।" },
  },
  {
    id: "ponzi",
    icon: "🔺",
    title: { en: "Ponzi & guaranteed-return schemes", hi: "पोंज़ी और पक्के रिटर्न वाली स्कीम" },
    blurb: { en: "'₹500 a day on ₹10,000' paid from new members' money — until it isn't.", hi: "'₹10,000 पर रोज़ ₹500' नए सदस्यों के पैसे से — जब तक चलता है।" },
    how: {
      en: ["Early members get paid to build trust.", "Bonuses for recruiting ('level income') drive growth.", "When new money slows, withdrawals stop and the operators vanish."],
      hi: ["भरोसा बनाने के लिए शुरुआती सदस्यों को पैसे दिए जाते हैं।", "नए लोग जोड़ने पर बोनस ('लेवल इनकम') से स्कीम बढ़ती है।", "नया पैसा रुकते ही निकासी बंद और ऑपरेटर ग़ायब।"],
    },
    flags: { en: ["Fixed daily/monthly returns", "Earn by adding members", "Pressure to reinvest"], hi: ["रोज़/महीने का तय रिटर्न", "सदस्य जोड़कर कमाई", "दोबारा लगाने का दबाव"] },
    todo: { en: ["Walk away from any guaranteed high return.", "Check deposit schemes on RBI's Sachet portal (sachet.rbi.org.in).", "Report to the police and FinScam Hunter."], hi: ["पक्के ऊँचे रिटर्न से दूर रहें।", "जमा योजनाओं की जाँच RBI के सचेत पोर्टल (sachet.rbi.org.in) पर करें।", "पुलिस और फ़िनस्कैम हंटर पर रिपोर्ट करें।"] },
    fact: { en: "Unregulated deposit schemes are banned under the Banning of Unregulated Deposit Schemes Act, 2019.", hi: "अनियमित जमा योजनाएँ 'बैनिंग ऑफ़ अनरेगुलेटेड डिपॉज़िट स्कीम्स एक्ट, 2019' के तहत प्रतिबंधित हैं।" },
  },
  {
    id: "forex",
    icon: "💱",
    title: { en: "Forex & crypto platforms", hi: "फ़ॉरेक्स और क्रिप्टो प्लेटफ़ॉर्म" },
    blurb: { en: "Overseas apps and 'signals' promising daily profits on currencies or coins.", hi: "विदेशी ऐप और 'सिग्नल' जो करेंसी या कॉइन पर रोज़ मुनाफ़े का वादा करते हैं।" },
    how: {
      en: ["Ads and DMs push a forex/binary app with huge leverage.", "Deposits are taken in USDT or via personal accounts.", "Accounts get 'liquidated' or withdrawals blocked."],
      hi: ["विज्ञापन और DM भारी लीवरेज वाले फ़ॉरेक्स/बाइनरी ऐप की ओर धकेलते हैं।", "पैसा USDT या निजी खातों में लिया जाता है।", "खाते 'लिक्विडेट' कर दिए जाते हैं या निकासी रोक दी जाती है।"],
    },
    flags: { en: ["'5% daily' signals", "Leverage like 1:1000+", "Platform not authorised by RBI"], hi: ["'रोज़ 5%' वाले सिग्नल", "1:1000+ जैसा लीवरेज", "RBI से अधिकृत नहीं"] },
    todo: { en: ["Check RBI's Alert List on rbi.org.in before using any platform.", "Never deposit to personal accounts or crypto wallets on instruction.", "Report the platform and the promoter."], hi: ["किसी भी प्लेटफ़ॉर्म से पहले rbi.org.in पर RBI की अलर्ट लिस्ट देखें।", "कहने पर निजी खाते या क्रिप्टो वॉलेट में पैसे न डालें।", "प्लेटफ़ॉर्म और प्रचारक की रिपोर्ट करें।"] },
    fact: { en: "RBI's Alert List named 95 unauthorised forex platforms as of Nov 2025. Dealing with them can attract action under FEMA.", hi: "नवंबर 2025 तक RBI की अलर्ट लिस्ट में 95 अनधिकृत फ़ॉरेक्स प्लेटफ़ॉर्म थे। इनसे लेन-देन पर FEMA के तहत कार्रवाई हो सकती है।" },
  },
  {
    id: "fno",
    icon: "⚖️",
    title: { en: "F&O reality check", hi: "F&O की सच्चाई" },
    blurb: { en: "Why 'option calls' sold on Telegram cost retail traders so much.", hi: "Telegram पर बिकने वाली 'ऑप्शन टिप' आम ट्रेडर्स को इतनी महँगी क्यों पड़ती है।" },
    how: {
      en: ["Futures & options use leverage — small moves cause big gains or losses.", "Options lose value as expiry nears.", "Paid 'sure-shot' calls encourage frequent, oversized trades."],
      hi: ["फ़्यूचर्स और ऑप्शन में लीवरेज होता है — छोटी हलचल से बड़ा नफ़ा या नुक़सान।", "एक्सपायरी पास आते ही ऑप्शन की क़ीमत घटती है।", "पैसे वाली 'पक्की' टिप बार-बार और बड़े ट्रेड करवाती है।"],
    },
    flags: { en: ["'Jackpot' expiry-day calls", "'100% accuracy' claims", "Trading with borrowed money"], hi: ["एक्सपायरी के दिन 'जैकपॉट' टिप", "'100% सटीक' दावे", "उधार के पैसे से ट्रेडिंग"] },
    todo: { en: ["Learn how margin and expiry work before trading.", "Never trade with money you can't afford to lose.", "Ignore paid tip groups."], hi: ["ट्रेड से पहले मार्जिन और एक्सपायरी समझें।", "जो पैसा खो नहीं सकते, उससे कभी ट्रेड न करें।", "पैसे वाले टिप ग्रुप से दूर रहें।"] },
    fact: { en: "SEBI's study found 91% of individual F&O traders lost money in FY25, with net losses of over ₹1 lakh crore.", hi: "SEBI के अध्ययन में FY25 में 91% व्यक्तिगत F&O ट्रेडर्स को नुक़सान हुआ, कुल नुक़सान ₹1 लाख करोड़ से ज़्यादा।" },
  },
];

// ScamSmart-style "opportunity or trap" questions. weight = risk if "yes".
export const OPPORTUNITY = [
  { w: 2, q: { en: "Did they contact you first (call, DM, group add, ad)?", hi: "क्या उन्होंने पहले ख़ुद संपर्क किया (कॉल, DM, ग्रुप में जोड़ा, विज्ञापन)?" }, tip: { en: "Unsolicited offers are the most common start of investment fraud.", hi: "बिन माँगे ऑफ़र से ही ज़्यादातर निवेश ठगी शुरू होती है।" } },
  { w: 3, q: { en: "Do they promise fixed, guaranteed or very high returns?", hi: "क्या वे तय, पक्का या बहुत ज़्यादा रिटर्न का वादा करते हैं?" }, tip: { en: "No genuine market investment can guarantee returns.", hi: "बाज़ार का कोई असली निवेश रिटर्न की गारंटी नहीं दे सकता।" } },
  { w: 2, q: { en: "Are they pushing you to decide quickly ('today only', 'few seats')?", hi: "क्या वे जल्दी फ़ैसला करने का दबाव डाल रहे हैं ('सिर्फ़ आज', 'कुछ सीटें')?" }, tip: { en: "Urgency is used so you don't stop to verify.", hi: "जल्दबाज़ी इसलिए कराई जाती है ताकि आप जाँच न करें।" } },
  { w: 3, q: { en: "Do they want payment to a personal UPI ID or bank account?", hi: "क्या वे निजी UPI ID या बैंक खाते में पैसे माँग रहे हैं?" }, tip: { en: "Registered intermediaries use @valid UPI handles — verify on SEBI Check.", hi: "रजिस्टर्ड संस्थाएँ @valid UPI इस्तेमाल करती हैं — SEBI Check पर जाँचें।" } },
  { w: 3, q: { en: "Did they ask you to install an app from a link, or share your screen?", hi: "क्या उन्होंने लिंक से ऐप इंस्टॉल करने या स्क्रीन शेयर करने को कहा?" }, tip: { en: "Genuine apps come from official stores; nobody genuine needs your screen.", hi: "असली ऐप आधिकारिक स्टोर से आते हैं; किसी असली कंपनी को आपकी स्क्रीन नहीं चाहिए।" } },
  { w: 2, q: { en: "Is there NO SEBI registration number you could verify?", hi: "क्या कोई SEBI रजिस्ट्रेशन नंबर नहीं है जिसे आप जाँच सकें?" }, tip: { en: "Advisers (INA) and research analysts (INH) must show a number.", hi: "सलाहकार (INA) और रिसर्च एनालिस्ट (INH) को नंबर दिखाना होता है।" } },
  { w: 2, q: { en: "Is the group sharing profit screenshots or 'success stories'?", hi: "क्या ग्रुप मुनाफ़े के स्क्रीनशॉट या 'सफलता की कहानियाँ' दिखा रहा है?" }, tip: { en: "Screenshots are easy to fake and are used to build trust.", hi: "स्क्रीनशॉट आसानी से नकली बनते हैं और भरोसा बनाने के लिए इस्तेमाल होते हैं।" } },
  { w: 3, q: { en: "Are they asking for a fee or tax before you can withdraw?", hi: "क्या पैसे निकालने से पहले फ़ीस या टैक्स माँगा जा रहा है?" }, tip: { en: "Paying to withdraw is a sure sign of a fake platform.", hi: "निकासी के लिए भुगतान नकली प्लेटफ़ॉर्म का पक्का संकेत है।" } },
];

export const CHECKLIST = [
  { en: "Call 1930 or file a complaint at cybercrime.gov.in (note the acknowledgement number).", hi: "1930 पर कॉल करें या cybercrime.gov.in पर शिकायत करें (पावती नंबर लिख लें)।" },
  { en: "Call your bank on its official number: block cards/UPI and ask them to freeze or reverse the transaction.", hi: "बैंक के आधिकारिक नंबर पर कॉल करें: कार्ड/UPI बंद कराएँ और लेन-देन रोकने या वापस करने को कहें।" },
  { en: "Save evidence: screenshots, chat exports, UTR/transaction IDs, phone numbers, links and app names.", hi: "सबूत सँभालें: स्क्रीनशॉट, चैट, UTR/ट्रांज़ैक्शन ID, फ़ोन नंबर, लिंक और ऐप के नाम।" },
  { en: "Change passwords and PINs from a safe device; uninstall unknown apps and remote-access apps.", hi: "सुरक्षित डिवाइस से पासवर्ड और PIN बदलें; अनजान और रिमोट-एक्सेस ऐप हटाएँ।" },
  { en: "Report the calls/SMS/WhatsApp on Sanchar Saathi → Chakshu.", hi: "कॉल/SMS/WhatsApp की शिकायत संचार साथी → चक्षु पर करें।" },
  { en: "If a SEBI-registered broker or adviser is involved, file on SEBI SCORES (scores.sebi.gov.in).", hi: "अगर कोई SEBI-रजिस्टर्ड ब्रोकर या सलाहकार शामिल है, तो SEBI SCORES (scores.sebi.gov.in) पर शिकायत करें।" },
  { en: "Report the group, account or app on the platform and on FinScam Hunter to warn others.", hi: "ग्रुप, अकाउंट या ऐप की रिपोर्ट प्लेटफ़ॉर्म और फ़िनस्कैम हंटर पर करें ताकि दूसरे सावधान रहें।" },
  { en: "Tell your family — and ignore anyone offering paid 'recovery'.", hi: "परिवार को बताएँ — और पैसे लेकर 'रिकवरी' का वादा करने वालों से दूर रहें।" },
];

export const DIRECTORY = [
  { name: "1930 · National Cyber Crime Helpline", url: "tel:1930", desc: { en: "Call first if money has been lost to online fraud.", hi: "ऑनलाइन ठगी में पैसे जाने पर सबसे पहले कॉल करें।" } },
  { name: "cybercrime.gov.in", url: "https://cybercrime.gov.in", desc: { en: "National Cyber Crime Reporting Portal — file a complaint online.", hi: "राष्ट्रीय साइबर क्राइम रिपोर्टिंग पोर्टल — ऑनलाइन शिकायत करें।" } },
  { name: "Sanchar Saathi · Chakshu", url: "https://sancharsaathi.gov.in/sfc/", desc: { en: "Report suspected fraud calls, SMS and WhatsApp (last 30 days).", hi: "संदिग्ध ठगी कॉल, SMS और WhatsApp की शिकायत (पिछले 30 दिन)।" } },
  { name: "SEBI SCORES", url: "https://scores.sebi.gov.in", desc: { en: "Complaints against SEBI-registered brokers, advisers and companies.", hi: "SEBI-रजिस्टर्ड ब्रोकर, सलाहकार और कंपनियों के ख़िलाफ़ शिकायत।" } },
  { name: "SEBI Check", url: "https://siportal.sebi.gov.in/intermediary/sebi-check", desc: { en: "Verify UPI IDs and bank accounts of registered intermediaries.", hi: "रजिस्टर्ड संस्थाओं की UPI ID और बैंक खाते जाँचें।" } },
  { name: "SEBI · Investment Advisers", url: "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13", desc: { en: "Official list to verify INA registration numbers.", hi: "INA रजिस्ट्रेशन नंबर जाँचने की आधिकारिक सूची।" } },
  { name: "SEBI · Research Analysts", url: "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=14", desc: { en: "Official list to verify INH registration numbers.", hi: "INH रजिस्ट्रेशन नंबर जाँचने की आधिकारिक सूची।" } },
  { name: "SEBI toll-free: 1800 266 7575 / 1800 22 7575", url: "tel:18002667575", desc: { en: "Investor helpline for market queries (no investment advice).", hi: "बाज़ार से जुड़े सवालों के लिए निवेशक हेल्पलाइन (निवेश सलाह नहीं)।" } },
  { name: "RBI Sachet", url: "https://sachet.rbi.org.in", desc: { en: "Report and check illegal deposit-taking schemes.", hi: "ग़ैरक़ानूनी जमा योजनाओं की शिकायत और जाँच।" } },
  { name: "SMART ODR", url: "https://smartodr.in", desc: { en: "Online dispute resolution with SEBI-registered market entities.", hi: "SEBI-रजिस्टर्ड संस्थाओं से विवाद का ऑनलाइन समाधान।" } },
];

export const SEBI_GUIDE = [
  { p: "INA", who: { en: "Investment Adviser", hi: "निवेश सलाहकार" }, url: "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13" },
  { p: "INH", who: { en: "Research Analyst", hi: "रिसर्च एनालिस्ट" }, url: "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=14" },
  { p: "INZ", who: { en: "Stock Broker", hi: "स्टॉक ब्रोकर" }, url: "https://www.sebi.gov.in" },
  { p: "INP", who: { en: "Portfolio Manager", hi: "पोर्टफोलियो मैनेजर" }, url: "https://www.sebi.gov.in" },
  { p: "INM", who: { en: "Merchant Banker", hi: "मर्चेंट बैंकर" }, url: "https://www.sebi.gov.in" },
];
