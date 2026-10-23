// Spot the Scam question bank. Each round draws 6 scams + 4 genuine messages.
//
// app:   which phone screen the message is shown on (see SKINS in quiz-game.js)
// marks: phrases that appear word-for-word in text (both languages). For a scam
//        they are the red flags the player hunts for; for a genuine message they
//        are the signs that show it is safe. test/quiz-data.test.mjs checks them.
// All names, numbers and links are made up for teaching.

export const QUIZ = [
  {
    id: "tg_vip",
    scam: true,
    app: "telegram",
    module: "fno",
    sender: { en: "Nifty Kings VIP 👑", hi: "Nifty Kings VIP 👑" },
    meta: { en: "48,210 subscribers", hi: "48,210 सब्सक्राइबर" },
    time: "08:12",
    text: {
      en: "🔥 100% accurate BankNifty calls! Yesterday's profit ₹1,85,000. Only 5 seats left — pay ₹2,999 now to join: 98XXXXXX10@ybl",
      hi: "🔥 100% सटीक BankNifty कॉल! कल का मुनाफ़ा ₹1,85,000। सिर्फ़ 5 सीटें बचीं — जुड़ने के लिए अभी ₹2,999 भेजें: 98XXXXXX10@ybl",
    },
    marks: [
      { en: "100% accurate", hi: "100% सटीक", why: { en: "Nobody can predict the market with certainty. 'Accuracy' claims are the hook.", hi: "बाज़ार का पक्का अंदाज़ा कोई नहीं लगा सकता। 'सटीकता' का दावा चारा है।" } },
      { en: "Yesterday's profit ₹1,85,000.", hi: "कल का मुनाफ़ा ₹1,85,000।", why: { en: "Profit claims and screenshots are easy to fake and build false trust.", hi: "मुनाफ़े के दावे और स्क्रीनशॉट आसानी से नकली बनते हैं।" } },
      { en: "Only 5 seats left", hi: "सिर्फ़ 5 सीटें बचीं", why: { en: "Fake scarcity rushes you so you don't stop to check.", hi: "नक़ली कमी दिखाकर जल्दबाज़ी कराई जाती है ताकि आप जाँच न करें।" } },
      { en: "98XXXXXX10@ybl", hi: "98XXXXXX10@ybl", why: { en: "Payment to a personal UPI ID. SEBI-registered entities collect money through @valid UPI handles.", hi: "निजी UPI ID पर भुगतान। SEBI-रजिस्टर्ड संस्थाएँ @valid UPI से ही पैसे लेती हैं।" } },
    ],
    why: { en: "Guaranteed accuracy, fake urgency and a personal UPI ID: a paid tips trap.", hi: "पक्की सटीकता, नक़ली जल्दबाज़ी और निजी UPI ID: पैसे वाला टिप-जाल।" },
    tip: { en: "Ignore paid 'sure-shot' tip groups. Report the channel on Telegram and on FinScam Hunter.", hi: "पैसे वाले 'पक्की टिप' ग्रुप से दूर रहें। चैनल की रिपोर्ट Telegram और फ़िनस्कैम हंटर पर करें।" },
  },
  {
    id: "kyc_app",
    scam: false,
    app: "app",
    module: "otp_kyc",
    sender: { en: "Your broker's app", hi: "आपके ब्रोकर का ऐप" },
    meta: { en: "Notifications", hi: "सूचनाएँ" },
    time: "11:30",
    text: {
      en: "Reminder: your KYC is due for its periodic update. Update it from Profile → KYC inside this app. We will never ask for your OTP or password.",
      hi: "याद दिलाना: आपका KYC समय-समय वाला अपडेट बाक़ी है। इसी ऐप में Profile → KYC से अपडेट करें। हम कभी आपका OTP या पासवर्ड नहीं माँगेंगे।",
    },
    marks: [
      { en: "inside this app.", hi: "इसी ऐप में", why: { en: "It sends you into the official app you already use. There's no link to click.", hi: "यह आपको उसी आधिकारिक ऐप में भेजता है जो आप पहले से इस्तेमाल करते हैं। कोई लिंक नहीं।" } },
      { en: "We will never ask for your OTP or password.", hi: "हम कभी आपका OTP या पासवर्ड नहीं माँगेंगे।", why: { en: "Genuine firms remind you never to share OTPs or passwords.", hi: "असली कंपनियाँ याद दिलाती हैं कि OTP या पासवर्ड कभी न बताएँ।" } },
    ],
    why: { en: "No link, no pressure, and it keeps you inside the official app.", hi: "न लिंक, न दबाव - और आपको आधिकारिक ऐप के अंदर ही रखता है।" },
    tip: { en: "Even for genuine reminders, open the app yourself instead of tapping links.", hi: "असली रिमाइंडर पर भी लिंक दबाने के बजाय ऐप ख़ुद खोलें।" },
  },
  {
    id: "sms_block",
    scam: true,
    app: "sms",
    module: "otp_kyc",
    sender: { en: "VM-DEMATX", hi: "VM-DEMATX" },
    meta: { en: "Text message", hi: "टेक्स्ट संदेश" },
    time: "09:41",
    text: {
      en: "Dear user, your demat a/c will be BLOCKED today. Update KYC immediately: bit.ly/kyc-dmt-upd",
      hi: "प्रिय ग्राहक, आपका डीमैट खाता आज ब्लॉक हो जाएगा। तुरंत KYC अपडेट करें: bit.ly/kyc-dmt-upd",
    },
    marks: [
      { en: "will be BLOCKED today.", hi: "आज ब्लॉक हो जाएगा।", why: { en: "Threats with a same-day deadline are meant to make you panic.", hi: "उसी दिन की समय-सीमा वाली धमकी आपको घबराने के लिए होती है।" } },
      { en: "immediately:", hi: "तुरंत", why: { en: "Urgency leaves you no time to check with your broker.", hi: "जल्दबाज़ी से ब्रोकर से जाँचने का समय नहीं मिलता।" } },
      { en: "bit.ly/kyc-dmt-upd", hi: "bit.ly/kyc-dmt-upd", why: { en: "Short links hide where they really go. Brokers don't send KYC links by SMS.", hi: "छोटे लिंक असली पता छिपाते हैं। ब्रोकर SMS से KYC लिंक नहीं भेजते।" } },
    ],
    why: { en: "A threat, a deadline and a short link: textbook phishing.", hi: "धमकी, समय-सीमा और छोटा लिंक: फ़िशिंग का पक्का नमूना।" },
    tip: { en: "Never update KYC from an SMS link. Report the SMS on Sanchar Saathi → Chakshu.", hi: "SMS के लिंक से कभी KYC अपडेट न करें। SMS की शिकायत संचार साथी → चक्षु पर करें।" },
  },
  {
    id: "mf_sip",
    scam: false,
    app: "email",
    sender: { en: "ABC Mutual Fund", hi: "ABC म्यूचुअल फ़ंड" },
    subject: { en: "SIP processed", hi: "SIP प्रोसेस हुआ" },
    time: "07:05",
    text: {
      en: "Your monthly SIP of ₹2,000 was processed on 5 Oct. No action is needed. Mutual fund investments are subject to market risks; read all scheme-related documents carefully.",
      hi: "आपका ₹2,000 का मासिक SIP 5 अक्टूबर को प्रोसेस हो गया। कुछ करने की ज़रूरत नहीं है। म्यूचुअल फ़ंड निवेश बाज़ार जोखिमों के अधीन हैं; योजना से जुड़े सभी दस्तावेज़ ध्यान से पढ़ें।",
    },
    marks: [
      { en: "No action is needed.", hi: "कुछ करने की ज़रूरत नहीं है।", why: { en: "It doesn't ask you to click, pay or share anything.", hi: "यह न क्लिक करने को कहता है, न भुगतान, न कोई जानकारी।" } },
      { en: "subject to market risks;", hi: "बाज़ार जोखिमों के अधीन हैं;", why: { en: "Genuine fund houses always carry this risk warning. Nobody honest promises fixed returns.", hi: "असली फ़ंड हाउस हमेशा यह जोखिम चेतावनी देते हैं। कोई ईमानदार पक्के रिटर्न का वादा नहीं करता।" } },
    ],
    why: { en: "A routine confirmation with the standard risk warning and no request for money or details.", hi: "मानक जोखिम चेतावनी वाली सामान्य पुष्टि - न पैसे की माँग, न जानकारी की।" },
    tip: { en: "Unsure? Check the SIP in the fund's official app or website, not through email links.", hi: "शक हो तो SIP को फ़ंड के आधिकारिक ऐप या वेबसाइट पर जाँचें, ईमेल के लिंक से नहीं।" },
  },
  {
    id: "ipo_club",
    scam: true,
    app: "whatsapp",
    module: "fake_app",
    sender: { en: "Institutional IPO Club 📈", hi: "इंस्टीट्यूशनल IPO क्लब 📈" },
    meta: { en: "group · 1,024 members", hi: "ग्रुप · 1,024 सदस्य" },
    time: "10:02",
    text: {
      en: "Good morning members! Open your institutional account with our app — download it here: apk-ipo-pro.top. Guaranteed IPO allotment for all members!",
      hi: "सुप्रभात सदस्यों! हमारे ऐप से अपना इंस्टीट्यूशनल अकाउंट खोलें — यहाँ से डाउनलोड करें: apk-ipo-pro.top। सभी सदस्यों को पक्का IPO अलॉटमेंट!",
    },
    marks: [
      { en: "institutional account", hi: "इंस्टीट्यूशनल अकाउंट", why: { en: "'Institutional accounts' for ordinary people are a fake-app trick.", hi: "आम लोगों के लिए 'इंस्टीट्यूशनल अकाउंट' नकली-ऐप की चाल है।" } },
      { en: "download it here: apk-ipo-pro.top.", hi: "यहाँ से डाउनलोड करें: apk-ipo-pro.top।", why: { en: "Genuine trading apps come only from the official app stores, never from a chat link.", hi: "असली ट्रेडिंग ऐप सिर्फ़ आधिकारिक ऐप स्टोर से आते हैं, चैट के लिंक से कभी नहीं।" } },
      { en: "Guaranteed IPO allotment", hi: "पक्का IPO अलॉटमेंट!", why: { en: "When an IPO is oversubscribed, allotment is by lottery. Nobody can guarantee it.", hi: "ज़्यादा आवेदन होने पर अलॉटमेंट लॉटरी से होता है। कोई इसकी गारंटी नहीं दे सकता।" } },
    ],
    why: { en: "App from a link + 'institutional account' + guaranteed allotment = the fake-app playbook.", hi: "लिंक से ऐप + 'इंस्टीट्यूशनल अकाउंट' + पक्का अलॉटमेंट = नकली-ऐप ठगी का तरीक़ा।" },
    tip: { en: "Leave the group. IPO applications go only through your bank (ASBA) or your registered broker's app.", hi: "ग्रुप छोड़ें। IPO का आवेदन सिर्फ़ अपने बैंक (ASBA) या रजिस्टर्ड ब्रोकर के ऐप से होता है।" },
  },
  {
    id: "digital_arrest",
    scam: true,
    app: "call",
    module: "digital_arrest",
    sender: { en: "'CBI Officer'", hi: "'CBI अधिकारी'" },
    meta: { en: "Video call · 04:12", hi: "वीडियो कॉल · 04:12" },
    time: "14:20",
    text: {
      en: "A parcel in your name had drugs. You are under digital arrest. Stay on video and tell no one. Transfer ₹2 lakh to the RBI verification account now.",
      hi: "आपके नाम के पार्सल में ड्रग्स मिले हैं। आप डिजिटल अरेस्ट में हैं। वीडियो पर बने रहें और किसी को न बताएँ। अभी ₹2 लाख RBI वेरिफ़िकेशन अकाउंट में भेजें।",
    },
    marks: [
      { en: "A parcel in your name had drugs.", hi: "आपके नाम के पार्सल में ड्रग्स मिले हैं।", why: { en: "A frightening story is the opening line of this scam.", hi: "डराने वाली कहानी इस ठगी की पहली लाइन होती है।" } },
      { en: "You are under digital arrest.", hi: "आप डिजिटल अरेस्ट में हैं।", why: { en: "'Digital arrest' does not exist. Police never arrest anyone over a call.", hi: "'डिजिटल अरेस्ट' जैसी कोई चीज़ नहीं होती। पुलिस कॉल पर किसी को गिरफ़्तार नहीं करती।" } },
      { en: "tell no one.", hi: "किसी को न बताएँ।", why: { en: "Forced secrecy stops you from asking family for help.", hi: "चुप रहने का दबाव आपको परिवार से मदद लेने से रोकता है।" } },
      { en: "Transfer ₹2 lakh to the RBI verification account", hi: "₹2 लाख RBI वेरिफ़िकेशन अकाउंट में भेजें।", why: { en: "No agency, and no RBI 'verification account', ever takes your money.", hi: "कोई एजेंसी या RBI का 'वेरिफ़िकेशन अकाउंट' आपसे पैसे नहीं लेता।" } },
    ],
    why: { en: "'Digital arrest' is a scam script: fear, secrecy and an urgent transfer.", hi: "'डिजिटल अरेस्ट' ठगी की स्क्रिप्ट है: डर, चुप्पी और तुरंत पैसे भेजना।" },
    tip: { en: "Hang up. Call 1930 and report the number on Sanchar Saathi → Chakshu.", hi: "कॉल काटें। 1930 पर कॉल करें और नंबर की शिकायत संचार साथी → चक्षु पर करें।" },
  },
  {
    id: "upi_valid",
    scam: false,
    app: "upi",
    sender: { en: "XYZ Securities Ltd", hi: "XYZ Securities Ltd" },
    meta: { en: "xyz.brk@validhdfc", hi: "xyz.brk@validhdfc" },
    amount: "₹5,000",
    valid: true,
    time: "12:48",
    text: {
      en: "Margin top-up of ₹5,000 to xyz.brk@validhdfc, shown with the green thumbs-up. You started this payment yourself from your broker's app.",
      hi: "xyz.brk@validhdfc को ₹5,000 का मार्जिन टॉप-अप, हरे थम्स-अप के साथ। यह भुगतान आपने अपने ब्रोकर के ऐप से ख़ुद शुरू किया।",
    },
    marks: [
      { en: "xyz.brk@validhdfc,", hi: "xyz.brk@validhdfc", why: { en: "An @valid UPI handle. SEBI-registered brokers collect money only through these.", hi: "@valid UPI हैंडल। SEBI-रजिस्टर्ड ब्रोकर सिर्फ़ इन्हीं से पैसे लेते हैं।" } },
      { en: "green thumbs-up.", hi: "हरे थम्स-अप", why: { en: "The green thumbs-up icon confirms a verified @valid handle.", hi: "हरा थम्स-अप निशान पक्का करता है कि @valid हैंडल जाँचा हुआ है।" } },
      { en: "You started this payment yourself", hi: "आपने अपने ब्रोकर के ऐप से ख़ुद शुरू किया।", why: { en: "You began the payment in the official app. Nobody pushed you into it.", hi: "भुगतान आपने आधिकारिक ऐप से ख़ुद शुरू किया - किसी ने दबाव नहीं डाला।" } },
    ],
    why: { en: "An @valid handle with the green thumbs-up, started by you from your broker's app: the SEBI-mandated safe route.", hi: "हरे थम्स-अप वाली @valid ID, जो आपने ब्रोकर ऐप से ख़ुद शुरू की: यही SEBI का सुरक्षित तरीक़ा है।" },
    tip: { en: "Unsure? Verify any UPI ID on SEBI Check (siportal.sebi.gov.in) before paying.", hi: "शक हो तो भुगतान से पहले SEBI Check (siportal.sebi.gov.in) पर UPI ID जाँचें।" },
  },
  {
    id: "dabba_dm",
    scam: true,
    app: "instagram",
    module: "dabba",
    sender: { en: "trade.king.official", hi: "trade.king.official" },
    meta: { en: "92K followers", hi: "92K फ़ॉलोअर्स" },
    time: "21:15",
    text: {
      en: "Bro, trade without demat! 500x leverage, no tax, instant cash profit every evening. DM 'JOIN' today for our private terminal.",
      hi: "भाई, बिना डीमैट ट्रेड करो! 500 गुना लीवरेज, कोई टैक्स नहीं, हर शाम तुरंत नकद मुनाफ़ा। हमारे प्राइवेट टर्मिनल के लिए आज ही 'JOIN' लिखकर DM करो।",
    },
    marks: [
      { en: "trade without demat!", hi: "बिना डीमैट ट्रेड करो!", why: { en: "Trading outside the exchange (dabba trading) is illegal and has zero investor protection.", hi: "एक्सचेंज के बाहर ट्रेडिंग (डब्बा ट्रेडिंग) ग़ैरक़ानूनी है और इसमें निवेशक की कोई सुरक्षा नहीं।" } },
      { en: "500x leverage,", hi: "500 गुना लीवरेज,", why: { en: "Extreme leverage wipes you out on a tiny price move. Regulated brokers can't offer it.", hi: "इतना लीवरेज छोटी-सी हलचल में सब डुबो देता है। रजिस्टर्ड ब्रोकर यह नहीं दे सकते।" } },
      { en: "no tax,", hi: "कोई टैक्स नहीं,", why: { en: "'No tax' means unrecorded, off-market deals, a sign of dabba trading.", hi: "'कोई टैक्स नहीं' का मतलब बिना रिकॉर्ड का सौदा - डब्बा ट्रेडिंग का संकेत।" } },
      { en: "instant cash profit", hi: "तुरंत नकद मुनाफ़ा।", why: { en: "Promises of quick, sure profit are bait.", hi: "जल्दी और पक्के मुनाफ़े का वादा चारा है।" } },
      { en: "private terminal.", hi: "प्राइवेट टर्मिनल", why: { en: "Private 'terminals' run outside NSE/BSE, so your money isn't protected.", hi: "प्राइवेट 'टर्मिनल' NSE/BSE के बाहर चलते हैं, आपका पैसा सुरक्षित नहीं।" } },
    ],
    why: { en: "That's dabba trading: illegal under the Securities Contracts (Regulation) Act, with no exchange protection.", hi: "यह डब्बा ट्रेडिंग है: प्रतिभूति अनुबंध (विनियमन) अधिनियम के तहत ग़ैरक़ानूनी, एक्सचेंज की कोई सुरक्षा नहीं।" },
    tip: { en: "Genuine trades happen only through a SEBI-registered broker on NSE/BSE. Report this account.", hi: "असली ट्रेड सिर्फ़ SEBI-रजिस्टर्ड ब्रोकर के ज़रिए NSE/BSE पर होते हैं। इस अकाउंट की रिपोर्ट करें।" },
  },
  {
    id: "ra_site",
    scam: false,
    app: "web",
    module: "finfluencer",
    sender: { en: "Research analyst website", hi: "रिसर्च एनालिस्ट की वेबसाइट" },
    meta: { en: "About us · Disclosures", hi: "हमारे बारे में · खुलासे" },
    time: "16:30",
    text: {
      en: "Registered Research Analyst. SEBI Reg. No. INH000011431. Registration granted by SEBI in no way guarantees performance. Investments in securities are subject to market risks.",
      hi: "रजिस्टर्ड रिसर्च एनालिस्ट। SEBI रजि. नं. INH000011431। SEBI द्वारा दिया गया रजिस्ट्रेशन किसी भी तरह प्रदर्शन की गारंटी नहीं है। प्रतिभूतियों में निवेश बाज़ार जोखिमों के अधीन है।",
    },
    marks: [
      { en: "SEBI Reg. No. INH000011431.", hi: "SEBI रजि. नं. INH000011431।", why: { en: "Research analysts must show an INH number, which you can verify on SEBI's list or in Quick Check.", hi: "रिसर्च एनालिस्ट को INH नंबर दिखाना होता है - इसे SEBI की सूची या तुरंत जाँच में परख सकते हैं।" } },
      { en: "in no way guarantees performance.", hi: "किसी भी तरह प्रदर्शन की गारंटी नहीं है।", why: { en: "Honest firms say upfront that nothing is guaranteed.", hi: "ईमानदार संस्थाएँ पहले ही साफ़ बताती हैं कि कुछ भी पक्का नहीं।" } },
    ],
    why: { en: "It shows a verifiable INH number and honest risk warnings. Still check that the name matches on SEBI's site.", hi: "जाँच-योग्य INH नंबर और ईमानदार जोखिम चेतावनी है। फिर भी SEBI की साइट पर नाम मिलाएँ।" },
    tip: { en: "Paste the INH number into Quick Check to see whether it's on the register.", hi: "INH नंबर तुरंत जाँच में डालकर देखें कि यह रजिस्टर में है या नहीं।" },
  },
  {
    id: "withdraw_tax",
    scam: true,
    app: "app",
    module: "fake_app",
    sender: { en: "WinTrade Pro · Support", hi: "WinTrade Pro · सपोर्ट" },
    meta: { en: "Live chat", hi: "लाइव चैट" },
    time: "18:44",
    text: {
      en: "Congratulations! Your profit is ₹8,40,000 🎉 To withdraw, first pay 15% advance tax (₹1,26,000) to our agent's account. Offer valid for 24 hours only.",
      hi: "बधाई! आपका मुनाफ़ा ₹8,40,000 है 🎉 पैसे निकालने के लिए पहले 15% एडवांस टैक्स (₹1,26,000) हमारे एजेंट के खाते में भरें। ऑफ़र सिर्फ़ 24 घंटे के लिए।",
    },
    marks: [
      { en: "Your profit is ₹8,40,000", hi: "आपका मुनाफ़ा ₹8,40,000 है", why: { en: "Huge on-screen 'profits' are made-up numbers to make you pay more.", hi: "स्क्रीन पर दिखा भारी 'मुनाफ़ा' नक़ली आँकड़ा है ताकि आप और पैसे भरें।" } },
      { en: "first pay 15% advance tax", hi: "पहले 15% एडवांस टैक्स", why: { en: "No genuine platform makes you pay before you can withdraw your own money.", hi: "कोई असली प्लेटफ़ॉर्म आपका ही पैसा निकालने से पहले भुगतान नहीं माँगता।" } },
      { en: "to our agent's account.", hi: "हमारे एजेंट के खाते में भरें।", why: { en: "Money to an individual's account, not the company's, is a giveaway.", hi: "कंपनी के बजाय किसी व्यक्ति के खाते में पैसे माँगना साफ़ संकेत है।" } },
      { en: "Offer valid for 24 hours only.", hi: "ऑफ़र सिर्फ़ 24 घंटे के लिए।", why: { en: "A deadline stops you from thinking it through.", hi: "समय-सीमा आपको सोचने का मौक़ा नहीं देती।" } },
    ],
    why: { en: "Paying to withdraw is the last stage of a fake-app scam. The 'profit' never existed.", hi: "निकासी के लिए भुगतान नकली-ऐप ठगी का आख़िरी चरण है - 'मुनाफ़ा' कभी था ही नहीं।" },
    tip: { en: "Don't pay anything more. Call 1930 and file at cybercrime.gov.in with screenshots.", hi: "अब और पैसे न भेजें। 1930 पर कॉल करें और स्क्रीनशॉट के साथ cybercrime.gov.in पर शिकायत करें।" },
  },
  {
    id: "deepfake_ad",
    scam: true,
    app: "ad",
    module: "deepfake",
    sender: { en: "Sponsored video", hi: "प्रायोजित वीडियो" },
    meta: { en: "Sponsored", hi: "प्रायोजित" },
    time: "20:05",
    text: {
      en: "BREAKING: Famous business tycoon reveals his secret app! Invest ₹21,000 and earn ₹4 lakh a month. Government approved. Click before this video is deleted!",
      hi: "ब्रेकिंग: मशहूर उद्योगपति ने बताया अपना सीक्रेट ऐप! ₹21,000 लगाएँ और हर महीने ₹4 लाख कमाएँ। सरकार से मंज़ूर। वीडियो हटने से पहले क्लिक करें!",
    },
    marks: [
      { en: "Famous business tycoon reveals his secret app!", hi: "मशहूर उद्योगपति ने बताया अपना सीक्रेट ऐप!", why: { en: "Celebrity faces and voices are deepfaked to sell scams.", hi: "ठगी बेचने के लिए मशहूर लोगों का चेहरा और आवाज़ डीपफ़ेक की जाती है।" } },
      { en: "Invest ₹21,000 and earn ₹4 lakh a month.", hi: "₹21,000 लगाएँ और हर महीने ₹4 लाख कमाएँ।", why: { en: "Fixed, huge monthly returns are an impossible promise.", hi: "हर महीने तय और भारी रिटर्न असंभव वादा है।" } },
      { en: "Government approved.", hi: "सरकार से मंज़ूर।", why: { en: "Fake 'approvals' borrow official trust. The government doesn't endorse trading apps.", hi: "नक़ली 'मंज़ूरी' सरकारी भरोसा उधार लेती है। सरकार ट्रेडिंग ऐप का प्रचार नहीं करती।" } },
      { en: "before this video is deleted!", hi: "वीडियो हटने से पहले", why: { en: "Urgency plus a 'secret' is a classic pressure tactic.", hi: "जल्दबाज़ी और 'राज़' - दबाव डालने की पुरानी चाल।" } },
    ],
    why: { en: "Deepfake celebrity + impossible returns + fake approval = a deepfake investment ad.", hi: "डीपफ़ेक सेलिब्रिटी + असंभव रिटर्न + नक़ली मंज़ूरी = डीपफ़ेक निवेश विज्ञापन।" },
    tip: { en: "Celebrities don't sell trading apps in ads. Report the ad on the platform.", hi: "सेलिब्रिटी विज्ञापनों में ट्रेडिंग ऐप नहीं बेचते। प्लेटफ़ॉर्म पर विज्ञापन की रिपोर्ट करें।" },
  },
  {
    id: "pump_dump",
    scam: true,
    app: "whatsapp",
    module: "pump_dump",
    sender: { en: "Stock Rockets 🚀", hi: "Stock Rockets 🚀" },
    meta: { en: "group · 2,560 members", hi: "ग्रुप · 2,560 सदस्य" },
    time: "09:08",
    text: {
      en: "🚀 Operator news: XYZ Infra will hit upper circuit for 10 days! Buy before 10:15 AM, target 3x. Share with friends, limited window!",
      hi: "🚀 ऑपरेटर न्यूज़: XYZ Infra में 10 दिन तक अपर सर्किट लगेगा! सुबह 10:15 से पहले ख़रीदें, टारगेट 3 गुना। दोस्तों को भी भेजें, मौक़ा सीमित है!",
    },
    marks: [
      { en: "Operator news:", hi: "ऑपरेटर न्यूज़:", why: { en: "'Operator' tips mean someone plans to push the price up and sell to you.", hi: "'ऑपरेटर' टिप का मतलब कोई दाम चढ़ाकर आपको बेचने वाला है।" } },
      { en: "will hit upper circuit for 10 days!", hi: "10 दिन तक अपर सर्किट लगेगा!", why: { en: "Nobody knows tomorrow's price. Certainty is a lie.", hi: "कल का दाम कोई नहीं जानता। पक्का दावा झूठ है।" } },
      { en: "target 3x.", hi: "टारगेट 3 गुना।", why: { en: "Big fixed targets are bait.", hi: "बड़ा तय टारगेट चारा है।" } },
      { en: "Share with friends,", hi: "दोस्तों को भी भेजें,", why: { en: "They need more buyers so they can sell at the top.", hi: "उन्हें और ख़रीदार चाहिए ताकि वे ऊँचे दाम पर बेच सकें।" } },
    ],
    why: { en: "A pump-and-dump: they hype a small stock, you buy, they sell at the top.", hi: "पंप एंड डंप: वे छोटे शेयर का शोर मचाते हैं, आप ख़रीदते हैं, वे ऊपर बेचकर निकल जाते हैं।" },
    tip: { en: "Don't act on forwarded stock tips. Report the group on FinScam Hunter.", hi: "फ़ॉरवर्ड की गई शेयर टिप पर कुछ न करें। ग्रुप की रिपोर्ट फ़िनस्कैम हंटर पर करें।" },
  },
  {
    id: "bank_otp",
    scam: false,
    app: "sms",
    module: "otp_kyc",
    sender: { en: "JD-MYBANK", hi: "JD-MYBANK" },
    meta: { en: "Text message", hi: "टेक्स्ट संदेश" },
    time: "13:02",
    text: {
      en: "OTP 482913 for your login is valid for 3 minutes. Do not share it with anyone; bank staff will never ask for it. Didn't request this? Call the number on the back of your card.",
      hi: "आपके लॉगिन का OTP 482913 है, जो 3 मिनट तक मान्य है। इसे किसी से साझा न करें; बैंक कर्मचारी कभी नहीं पूछेंगे। आपने यह नहीं माँगा? अपने कार्ड के पीछे लिखे नंबर पर कॉल करें।",
    },
    marks: [
      { en: "Do not share it with anyone;", hi: "इसे किसी से साझा न करें;", why: { en: "Genuine OTP messages always warn you not to share the code.", hi: "असली OTP संदेश हमेशा कोड साझा न करने की चेतावनी देते हैं।" } },
      { en: "bank staff will never ask for it.", hi: "बैंक कर्मचारी कभी नहीं पूछेंगे।", why: { en: "Real banks tell you they will never ask for your OTP.", hi: "असली बैंक बताते हैं कि वे कभी आपका OTP नहीं माँगेंगे।" } },
      { en: "Call the number on the back of your card.", hi: "अपने कार्ड के पीछे लिखे नंबर पर कॉल करें।", why: { en: "It points you to the official number you already have, not to a number inside the SMS.", hi: "यह आपको उसी आधिकारिक नंबर पर भेजता है जो आपके पास है, SMS के किसी नंबर पर नहीं।" } },
    ],
    why: { en: "A normal OTP message: no link, a clear 'don't share' warning, and it sends you to the official number.", hi: "सामान्य OTP संदेश: कोई लिंक नहीं, साफ़ 'साझा न करें' चेतावनी, और आधिकारिक नंबर की ओर भेजता है।" },
    tip: { en: "The SMS is genuine, but the OTP is still only for you. Never read it out on a call.", hi: "SMS असली है, पर OTP सिर्फ़ आपके लिए है। कॉल पर कभी न बताएँ।" },
  },
  {
    id: "forex_fx",
    scam: true,
    app: "telegram",
    module: "forex",
    sender: { en: "FX Gold Signals 💱", hi: "FX Gold Signals 💱" },
    meta: { en: "12,880 subscribers", hi: "12,880 सब्सक्राइबर" },
    time: "19:30",
    text: {
      en: "Earn in dollars from home! Trade forex & crypto on our platform with just ₹10,000 and get fixed 5% daily returns. Deposit via UPI to our manager.",
      hi: "घर बैठे डॉलर में कमाएँ! सिर्फ़ ₹10,000 से हमारे प्लेटफ़ॉर्म पर फ़ॉरेक्स और क्रिप्टो ट्रेड करें और रोज़ पक्का 5% रिटर्न पाएँ। पैसे UPI से हमारे मैनेजर को भेजें।",
    },
    marks: [
      { en: "Trade forex & crypto on our platform", hi: "हमारे प्लेटफ़ॉर्म पर फ़ॉरेक्स और क्रिप्टो ट्रेड करें", why: { en: "Online forex trading on unauthorised platforms is illegal for residents in India (see RBI's Alert List).", hi: "अनधिकृत प्लेटफ़ॉर्म पर ऑनलाइन फ़ॉरेक्स ट्रेडिंग भारत के निवासियों के लिए ग़ैरक़ानूनी है (RBI अलर्ट लिस्ट देखें)।" } },
      { en: "fixed 5% daily returns.", hi: "रोज़ पक्का 5% रिटर्न", why: { en: "Fixed daily returns are impossible, classic Ponzi bait.", hi: "रोज़ का पक्का रिटर्न असंभव है - पोंज़ी का पुराना चारा।" } },
      { en: "Deposit via UPI to our manager.", hi: "पैसे UPI से हमारे मैनेजर को भेजें।", why: { en: "Paying a 'manager' personally means no protection at all.", hi: "किसी 'मैनेजर' को निजी तौर पर भुगतान का मतलब कोई सुरक्षा नहीं।" } },
    ],
    why: { en: "Unauthorised forex platform + fixed daily returns + paying a person = scam.", hi: "अनधिकृत फ़ॉरेक्स प्लेटफ़ॉर्म + रोज़ का पक्का रिटर्न + किसी व्यक्ति को भुगतान = ठगी।" },
    tip: { en: "Check RBI's Alert List of unauthorised forex platforms before trusting any.", hi: "किसी पर भरोसा करने से पहले RBI की अनधिकृत फ़ॉरेक्स प्लेटफ़ॉर्म वाली अलर्ट लिस्ट देखें।" },
  },
  {
    id: "contract_note",
    scam: false,
    app: "email",
    sender: { en: "Your broker", hi: "आपका ब्रोकर" },
    subject: { en: "Contract note for 14 Oct", hi: "14 अक्टूबर का कॉन्ट्रैक्ट नोट" },
    time: "22:10",
    text: {
      en: "Your contract note for trades on 14 Oct is attached as a password-protected PDF. We will never ask you to send us your password or OTP. Didn't make these trades? Raise it in the help section of our app.",
      hi: "14 अक्टूबर के ट्रेड का कॉन्ट्रैक्ट नोट पासवर्ड-सुरक्षित PDF में संलग्न है। हम कभी आपसे पासवर्ड या OTP भेजने को नहीं कहेंगे। ये ट्रेड आपने नहीं किए? हमारे ऐप के हेल्प सेक्शन में शिकायत करें।",
    },
    marks: [
      { en: "password-protected PDF.", hi: "पासवर्ड-सुरक्षित PDF", why: { en: "Brokers send a contract note for every day you trade, so you can track your account.", hi: "ब्रोकर हर ट्रेड वाले दिन का कॉन्ट्रैक्ट नोट भेजते हैं ताकि आप खाते पर नज़र रख सकें।" } },
      { en: "We will never ask you to send us your password or OTP.", hi: "हम कभी आपसे पासवर्ड या OTP भेजने को नहीं कहेंगे।", why: { en: "It asks for nothing and reminds you to keep your details private.", hi: "यह कुछ नहीं माँगता और जानकारी निजी रखने की याद दिलाता है।" } },
      { en: "help section of our app.", hi: "हमारे ऐप के हेल्प सेक्शन में", why: { en: "Problems go through the official app, not a number or link in the email.", hi: "शिकायत आधिकारिक ऐप से होती है, ईमेल के किसी नंबर या लिंक से नहीं।" } },
    ],
    why: { en: "Contract notes are routine and help you spot trades you didn't make. Nothing to pay or share.", hi: "कॉन्ट्रैक्ट नोट सामान्य है और बिना आपकी मर्ज़ी के हुए ट्रेड पकड़ने में मदद करता है। न कुछ भरना, न कुछ बताना।" },
    tip: { en: "Read every contract note. A trade you don't recognise is your early warning.", hi: "हर कॉन्ट्रैक्ट नोट पढ़ें। अनजान ट्रेड पहली चेतावनी है।" },
  },
  {
    id: "screen_share",
    scam: true,
    app: "call",
    module: "otp_kyc",
    sender: { en: "'Broker Support'", hi: "'ब्रोकर सपोर्ट'" },
    meta: { en: "WhatsApp call · 02:37", hi: "WhatsApp कॉल · 02:37" },
    time: "15:51",
    text: {
      en: "Ma'am, your account shows an error. Please install this screen-sharing app and share your screen so I can fix it. Then read me the OTP you just got.",
      hi: "मैडम, आपके अकाउंट में एरर दिख रहा है। यह स्क्रीन-शेयरिंग ऐप इंस्टॉल करके अपनी स्क्रीन शेयर कीजिए, मैं ठीक कर दूँगा। फिर अभी आया OTP मुझे पढ़कर सुनाइए।",
    },
    marks: [
      { en: "your account shows an error.", hi: "आपके अकाउंट में एरर दिख रहा है।", why: { en: "A made-up problem creates panic so you follow orders.", hi: "गढ़ी हुई समस्या घबराहट पैदा करती है ताकि आप बात मान लें।" } },
      { en: "install this screen-sharing app and share your screen", hi: "यह स्क्रीन-शेयरिंग ऐप इंस्टॉल करके अपनी स्क्रीन शेयर कीजिए,", why: { en: "No genuine company needs to see or control your screen.", hi: "किसी असली कंपनी को आपकी स्क्रीन देखने या चलाने की ज़रूरत नहीं।" } },
      { en: "read me the OTP you just got.", hi: "अभी आया OTP मुझे पढ़कर सुनाइए।", why: { en: "An OTP is like your signature. Never tell it to anyone.", hi: "OTP आपके हस्ताक्षर जैसा है। किसी को न बताएँ।" } },
    ],
    why: { en: "Screen sharing + asking for an OTP = account takeover.", hi: "स्क्रीन शेयर + OTP माँगना = अकाउंट पर क़ब्ज़ा।" },
    tip: { en: "Hang up, then call your broker's official number from its app or website.", hi: "कॉल काटें, फिर ब्रोकर के ऐप या वेबसाइट पर दिए आधिकारिक नंबर पर ख़ुद कॉल करें।" },
  },
  {
    id: "nse_alert",
    scam: false,
    app: "sms",
    sender: { en: "NSE-ALERT", hi: "NSE-ALERT" },
    meta: { en: "Text message", hi: "टेक्स्ट संदेश" },
    time: "17:20",
    text: {
      en: "Dear investor, trades worth ₹12,450 were executed in your account on 14-Oct. Check the contract note sent to your registered email. Not you? Contact your broker.",
      hi: "प्रिय निवेशक, 14-अक्टूबर को आपके खाते में ₹12,450 के ट्रेड हुए। अपने रजिस्टर्ड ईमेल पर भेजा गया कॉन्ट्रैक्ट नोट देखें। आपने नहीं किए? अपने ब्रोकर से संपर्क करें।",
    },
    marks: [
      { en: "Check the contract note sent to your registered email.", hi: "अपने रजिस्टर्ड ईमेल पर भेजा गया कॉन्ट्रैक्ट नोट देखें।", why: { en: "It points you to records you already receive. There's no link to click.", hi: "यह आपको उन्हीं रिकॉर्ड की ओर भेजता है जो आपको पहले से मिलते हैं। कोई लिंक नहीं।" } },
      { en: "Contact your broker.", hi: "अपने ब्रोकर से संपर्क करें।", why: { en: "It sends you to your own broker, not to a number inside the message.", hi: "यह आपको अपने ब्रोकर के पास भेजता है, संदेश के किसी नंबर पर नहीं।" } },
    ],
    why: { en: "Exchanges send alerts like this so you can catch trades you didn't make. No link, no request.", hi: "एक्सचेंज ऐसे अलर्ट भेजते हैं ताकि आप बिना मर्ज़ी के हुए ट्रेड पकड़ सकें। न लिंक, न कोई माँग।" },
    tip: { en: "Match each alert with your contract note and report anything you don't recognise.", hi: "हर अलर्ट को कॉन्ट्रैक्ट नोट से मिलाएँ और जो न पहचानें उसकी शिकायत करें।" },
  },
  {
    id: "upi_collect",
    scam: true,
    app: "upi",
    module: "otp_kyc",
    sender: { en: "Cashback Rewards", hi: "Cashback Rewards" },
    meta: { en: "rewards.cashback@ybl", hi: "rewards.cashback@ybl" },
    amount: "₹4,999",
    valid: false,
    time: "11:11",
    text: {
      en: "You have received a cashback of ₹4,999! Enter your UPI PIN to receive the money in your account. Request expires in 5 minutes.",
      hi: "आपको ₹4,999 का कैशबैक मिला है! पैसे अपने खाते में पाने के लिए अपना UPI PIN डालें। अनुरोध 5 मिनट में समाप्त हो जाएगा।",
    },
    marks: [
      { en: "You have received a cashback of ₹4,999!", hi: "आपको ₹4,999 का कैशबैक मिला है!", why: { en: "Surprise money out of nowhere is bait.", hi: "अचानक मिला पैसा चारा होता है।" } },
      { en: "Enter your UPI PIN to receive the money", hi: "पाने के लिए अपना UPI PIN डालें।", why: { en: "You never need a PIN to receive money. Entering it SENDS money.", hi: "पैसे पाने के लिए PIN की ज़रूरत कभी नहीं होती। PIN डालने से पैसे जाते हैं।" } },
      { en: "Request expires in 5 minutes.", hi: "अनुरोध 5 मिनट में समाप्त हो जाएगा।", why: { en: "A countdown pushes you to act without thinking.", hi: "उल्टी गिनती बिना सोचे क़दम उठाने का दबाव डालती है।" } },
    ],
    why: { en: "A UPI 'collect request' dressed up as cashback. Your PIN would send money, not receive it.", hi: "कैशबैक के नाम पर UPI 'कलेक्ट रिक्वेस्ट'। PIN डालने से पैसा जाता है, आता नहीं।" },
    tip: { en: "Decline unknown collect requests. Remember: PIN = paying.", hi: "अनजान कलेक्ट रिक्वेस्ट ठुकराएँ। याद रखें: PIN = भुगतान।" },
  },
];

// One round: `scams` scam messages + `safe` genuine ones, shuffled.
export function drawRound({ scams = 6, safe = 4, rand = Math.random } = {}) {
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const pick = shuffle(QUIZ.filter((q) => q.scam)).slice(0, scams).concat(shuffle(QUIZ.filter((q) => !q.scam)).slice(0, safe));
  return shuffle(pick);
}
