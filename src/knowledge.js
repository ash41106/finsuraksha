// Human-readable knowledge: red-flag explanations, recommended actions, FAQ
// answers and official channels - in English and Hindi. Used directly by the
// rule-based mode and as grounding context for AI mode.

export const OFFICIAL = {
  helpline: "1930",
  cybercrime: "https://cybercrime.gov.in",
  chakshu: "https://sancharsaathi.gov.in/sfc/",
  scores: "https://scores.sebi.gov.in",
  sebiCheck: "https://siportal.sebi.gov.in/intermediary/sebi-check",
  sebiIA: "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13",
  sebiRA: "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=14",
  sebiTollFree: "1800 266 7575 / 1800 22 7575",
  sachet: "https://sachet.rbi.org.in",
  rbi: "https://www.rbi.org.in",
  smartOdr: "https://smartodr.in",
  sebiInvestor: "https://investor.sebi.gov.in",
};

export const LANGS = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  mr: "Marathi (मराठी)",
  bn: "Bengali (বাংলা)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
  gu: "Gujarati (ગુજરાતી)",
  kn: "Kannada (ಕನ್ನಡ)",
  ml: "Malayalam (മലയാളം)",
  pa: "Punjabi (ਪੰਜਾਬੀ)",
};

// [title, why] per language. {x} / {y} are filled with evidence.
export const FLAG_TEXT = {
  guaranteed: {
    en: ['Promises guaranteed or "sure" profit', 'No real investment can guarantee returns. "100% sure profit" is the most common scam line.'],
    hi: ["पक्के या गारंटीड मुनाफ़े का वादा", 'कोई भी असली निवेश मुनाफ़े की गारंटी नहीं दे सकता। "100% पक्का मुनाफ़ा" ठगी की सबसे आम लाइन है।'],
  },
  high_return: {
    en: ["Unrealistic return claim ({x})", "Returns like {x} are far above what genuine investments deliver. Big promises are bait."],
    hi: ["अवास्तविक रिटर्न का दावा ({x})", "{x} जैसा रिटर्न असली निवेश में नहीं मिलता। बड़े वादे ही चारा होते हैं।"],
  },
  urgency: {
    en: ["Pressure to act fast", '"Only today" or "last few seats" is used so you don\'t stop to verify.'],
    hi: ["जल्दी करने का दबाव", '"सिर्फ़ आज" या "आख़िरी सीटें" इसलिए कहा जाता है ताकि आप जाँच न कर सकें।'],
  },
  insider: {
    en: ['"Insider" or "sure-shot" tips', "Talk of operators, insider news, upper circuits or guaranteed IPO allotment is typical of pump-and-dump and tip-selling scams."],
    hi: ['"अंदर की ख़बर" या "पक्की टिप"', "ऑपरेटर, अंदर की ख़बर, अपर सर्किट या पक्के IPO अलॉटमेंट की बातें पंप-एंड-डंप ठगी की पहचान हैं।"],
  },
  institutional: {
    en: ['"Institutional account" or special-quota pitch', 'Fake trading apps promise ordinary users "institutional accounts", block deals or IPO quotas. Real brokers don\'t sell such access in chat groups.'],
    hi: ['"इंस्टीट्यूशनल अकाउंट" या ख़ास कोटा का लालच', 'नकली ट्रेडिंग ऐप आम लोगों को "इंस्टीट्यूशनल अकाउंट", ब्लॉक डील या IPO कोटा का लालच देते हैं। असली ब्रोकर चैट ग्रुप में ऐसा नहीं बेचते।'],
  },
  pay_personal: {
    en: ["Asks for a fee or payment to a personal account", "Joining fees, VIP plans or transfers to personal UPI/bank accounts are a major red flag."],
    hi: ["फ़ीस या निजी खाते में पैसे माँगना", "जॉइनिंग फ़ीस, VIP प्लान या निजी UPI/बैंक खाते में पैसे भेजने को कहना बड़ा ख़तरे का संकेत है।"],
  },
  withdrawal_fee: {
    en: ["Charges you to withdraw your own money", '"Pay tax or a processing fee to withdraw" is how fake apps take more money after showing fake profits.'],
    hi: ["अपना ही पैसा निकालने के लिए शुल्क", '"पैसा निकालने के लिए टैक्स/प्रोसेसिंग फ़ीस भरो" — नकली ऐप नकली मुनाफ़ा दिखाकर ऐसे ही और पैसे ऐंठते हैं।'],
  },
  credentials: {
    en: ["Asks for OTP/PIN or a KYC update via link or call", 'Banks, brokers and SEBI never ask for OTP or PIN on call, SMS or WhatsApp. "KYC expired / account blocked" messages are phishing.'],
    hi: ["OTP/PIN या लिंक से KYC अपडेट माँगना", 'बैंक, ब्रोकर या SEBI कभी कॉल, SMS या WhatsApp पर OTP/PIN नहीं माँगते। "KYC बंद / खाता ब्लॉक" वाले संदेश फ़िशिंग होते हैं।'],
  },
  remote_apk: {
    en: ["App via link/APK or a screen-sharing request", "Install trading apps only from official app stores. APK links and screen-sharing apps (AnyDesk, TeamViewer) let fraudsters control your phone."],
    hi: ["लिंक/APK से ऐप या स्क्रीन शेयर करने को कहना", "ट्रेडिंग ऐप सिर्फ़ आधिकारिक ऐप स्टोर से लें। APK लिंक और स्क्रीन-शेयरिंग ऐप (AnyDesk, TeamViewer) से ठग आपका फ़ोन चला सकते हैं।"],
  },
  authority: {
    en: ["Misuses the name of SEBI, RBI or another authority", "SEBI does not approve tips, groups or schemes, and real officials don't cold-call people about investments."],
    hi: ["SEBI, RBI या किसी संस्था के नाम का ग़लत इस्तेमाल", "SEBI किसी टिप, ग्रुप या स्कीम को मंज़ूरी नहीं देता, और असली अधिकारी निवेश के लिए अनजान लोगों को कॉल नहीं करते।"],
  },
  threat: {
    en: ['"Digital arrest" or legal threat', "Fraudsters pose as CBI, police, customs or SEBI on video calls and threaten arrest to scare you into paying. No agency arrests anyone over a call."],
    hi: ['"डिजिटल अरेस्ट" या क़ानूनी धमकी', "ठग वीडियो कॉल पर CBI, पुलिस, कस्टम या SEBI बनकर गिरफ़्तारी की धमकी देते हैं ताकि आप डरकर पैसे दे दें। कोई एजेंसी कॉल पर गिरफ़्तार नहीं करती।"],
  },
  utility_threat: {
    en: ["Threat to cut your electricity, gas or SIM", "Fake 'bill pending, connection will be cut tonight' messages push you to call a number and pay or install an app. Power companies never ask for payment through a personal number."],
    hi: ["बिजली, गैस या सिम काटने की धमकी", "'बिल बाक़ी है, आज रात कनेक्शन कट जाएगा' जैसे नक़ली संदेश आपसे किसी नंबर पर कॉल करवाकर पैसे या ऐप माँगते हैं। बिजली कंपनी कभी निजी नंबर से भुगतान नहीं माँगती।"],
  },
  task_job: {
    en: ["'Earn by liking videos' task job", "Scammers pay small amounts for likes or reviews at first, then ask you to 'invest' in prepaid tasks and never pay back. Genuine jobs don't pay for likes."],
    hi: ["'वीडियो लाइक करके कमाओ' वाला टास्क जॉब", "ठग पहले लाइक या रिव्यू के छोटे पैसे देते हैं, फिर 'प्रीपेड टास्क' में पैसे लगवाकर ग़ायब हो जाते हैं। असली नौकरी लाइक के पैसे नहीं देती।"],
  },
  dabba: {
    en: ['Signs of illegal "dabba" (off-exchange) trading', 'Trading without demat/KYC, huge leverage or "no tax" outside exchanges is illegal under the SCRA, 1956 - up to 10 years\' jail and/or ₹25 crore fine, and you get no exchange protection.'],
    hi: ['ग़ैरक़ानूनी "डब्बा" ट्रेडिंग के संकेत', 'बिना डीमैट/KYC, भारी लीवरेज या "बिना टैक्स" एक्सचेंज के बाहर ट्रेडिंग SCRA, 1956 के तहत ग़ैरक़ानूनी है — 10 साल तक जेल और/या ₹25 करोड़ तक जुर्माना, और एक्सचेंज की कोई सुरक्षा नहीं।'],
  },
  unregistered_tips: {
    en: ["Buy/sell calls without a SEBI registration number", "Only SEBI-registered Research Analysts (INH…) or Investment Advisers (INA…) may give stock recommendations."],
    hi: ["बिना SEBI रजिस्ट्रेशन नंबर के खरीद/बिक्री की टिप", "सिर्फ़ SEBI-रजिस्टर्ड रिसर्च एनालिस्ट (INH…) या निवेश सलाहकार (INA…) ही शेयर की सलाह दे सकते हैं।"],
  },
  group_invite: {
    en: ["Pushes you into a Telegram/WhatsApp group", "Most tip scams start in such groups, where fake profit screenshots build trust."],
    hi: ["Telegram/WhatsApp ग्रुप में जुड़ने को कहना", "ज़्यादातर टिप-ठगी ऐसे ग्रुप से शुरू होती है, जहाँ नकली मुनाफ़े के स्क्रीनशॉट से भरोसा बनाया जाता है।"],
  },
  fake_proof: {
    en: ['Profit screenshots or testimonials as "proof"', "Screenshots are easy to fake and say nothing about risk. Treat them as advertising."],
    hi: ['मुनाफ़े के स्क्रीनशॉट या तारीफ़ें "सबूत" के रूप में', "स्क्रीनशॉट आसानी से नकली बनते हैं और जोखिम के बारे में कुछ नहीं बताते।"],
  },
  forex_crypto: {
    en: ['Forex / binary / crypto "signals" pitch', "Online forex trading on unauthorised platforms is illegal for residents under FEMA. RBI publishes an Alert List of such platforms."],
    hi: ['फ़ॉरेक्स / बाइनरी / क्रिप्टो "सिग्नल" का लालच', "अनधिकृत प्लेटफ़ॉर्म पर ऑनलाइन फ़ॉरेक्स ट्रेडिंग FEMA के तहत ग़ैरक़ानूनी है। RBI ऐसे प्लेटफ़ॉर्म की अलर्ट लिस्ट जारी करता है।"],
  },
  rbi_alert: {
    en: ["Name appears on RBI's Alert List ({x})", '"{x}" appears on RBI\'s Alert List of unauthorised forex trading platforms (as reported up to Nov 2025). Check the current list on rbi.org.in.'],
    hi: ["नाम RBI की अलर्ट लिस्ट में है ({x})", '"{x}" RBI की अनधिकृत फ़ॉरेक्स प्लेटफ़ॉर्म वाली अलर्ट लिस्ट में है (नवंबर 2025 तक की रिपोर्ट)। ताज़ा सूची rbi.org.in पर देखें।'],
  },
  celebrity: {
    en: ['Uses a celebrity or "AI trading" brand to sell', "Deepfake videos and fake news ads use famous faces to push scam platforms. Celebrities don't endorse secret trading apps."],
    hi: ['किसी मशहूर व्यक्ति या "AI ट्रेडिंग" नाम से लालच', "डीपफ़ेक वीडियो और नकली ख़बरों में मशहूर चेहरों का इस्तेमाल करके ठगी वाले प्लेटफ़ॉर्म बेचे जाते हैं।"],
  },
  ponzi: {
    en: ["Chain / level-income returns", 'Returns that depend on recruiting others ("level income", "team bonus") are classic Ponzi signs.'],
    hi: ["चेन / लेवल-इनकम वाली कमाई", 'दूसरों को जोड़ने पर टिकी कमाई ("लेवल इनकम", "टीम बोनस") पोंज़ी स्कीम की पहचान है।'],
  },
  link_apk: {
    en: ["Link downloads an APK file", "APK files from links can hide malware that reads your OTPs and SMS. Never install them."],
    hi: ["लिंक से APK फ़ाइल डाउनलोड होती है", "लिंक से आई APK फ़ाइल में ऐसा मैलवेयर हो सकता है जो आपके OTP और SMS पढ़ ले। इसे कभी इंस्टॉल न करें।"],
  },
  link_shortener: {
    en: ["Short link hides the real website ({x})", "Short links hide where you will land. Scammers use them to disguise fake sites."],
    hi: ["छोटा लिंक असली वेबसाइट छिपाता है ({x})", "छोटे लिंक से पता नहीं चलता कि आप कहाँ पहुँचेंगे। ठग इनसे नकली साइट छिपाते हैं।"],
  },
  link_lookalike: {
    en: ["Website imitates {y}", '"{x}" is not {y}\'s official domain. Lookalike sites steal logins and money.'],
    hi: ["वेबसाइट {y} की नकल करती है", '"{x}" {y} की आधिकारिक वेबसाइट नहीं है। ऐसी नकली साइटें लॉगिन और पैसे चुराती हैं।'],
  },
  link_ip: {
    en: ["Link uses a raw IP address", "Genuine financial websites use proper domain names, not numbers."],
    hi: ["लिंक में सिर्फ़ IP नंबर है", "असली वित्तीय वेबसाइटें नंबर नहीं, सही डोमेन नाम इस्तेमाल करती हैं।"],
  },
  link_punycode: {
    en: ["Link uses look-alike characters", "Special (punycode) characters can imitate real brand names."],
    hi: ["लिंक में मिलते-जुलते अक्षर", "ख़ास (punycode) अक्षरों से असली ब्रांड जैसा नाम बनाया जा सकता है।"],
  },
  link_tld: {
    en: ["Unusual domain ending (.{x})", "Cheap domain endings like .{x} are often used for short-lived scam sites."],
    hi: ["अजीब डोमेन एंडिंग (.{x})", ".{x} जैसे सस्ते डोमेन अक्सर कुछ दिन चलने वाली ठगी साइटों के लिए इस्तेमाल होते हैं।"],
  },
  link_http: {
    en: ["Not a secure (https) link", "Never enter passwords or payment details on a page without https."],
    hi: ["सुरक्षित (https) लिंक नहीं", "बिना https वाले पेज पर पासवर्ड या पेमेंट जानकारी कभी न डालें।"],
  },
  link_telegram_private: {
    en: ["Private Telegram invite link", 'Private invite links are common for paid "VIP tips" groups that vanish after collecting money.'],
    hi: ["Telegram का प्राइवेट इनवाइट लिंक", 'प्राइवेट इनवाइट लिंक अक्सर पैसे वसूलकर गायब होने वाले "VIP टिप्स" ग्रुप के होते हैं।'],
  },
  link_whatsapp_group: {
    en: ["WhatsApp group invite link", 'Investment "clubs" on WhatsApp are a leading route for fake trading-app frauds.'],
    hi: ["WhatsApp ग्रुप इनवाइट लिंक", 'WhatsApp के निवेश "क्लब" नकली ट्रेडिंग-ऐप ठगी का सबसे आम रास्ता हैं।'],
  },
  link_userinfo: {
    en: ["Link disguises its destination", 'This link uses an "@" trick so the address looks like a different site.'],
    hi: ["लिंक अपनी असली मंज़िल छिपाता है", 'यह लिंक "@" की चाल से किसी और साइट जैसा दिखता है।'],
  },
  safe_browsing: {
    en: ["Flagged by Google Safe Browsing", "Google lists this link as dangerous (phishing or malware)."],
    hi: ["Google Safe Browsing ने ख़तरनाक बताया", "Google ने इस लिंक को ख़तरनाक (फ़िशिंग या मैलवेयर) माना है।"],
  },
  sebi_bad_format: {
    en: ["SEBI registration number looks invalid ({x})", "SEBI numbers look like INA/INH followed by 9 digits. Fake numbers are common."],
    hi: ["SEBI रजिस्ट्रेशन नंबर ग़लत लगता है ({x})", "SEBI नंबर INA/INH के बाद 9 अंकों के होते हैं। नकली नंबर आम हैं।"],
  },
  sebi_not_found: {
    en: ["Not found in the SEBI register ({x})", "FinSuraksha checked {x} against its copy of SEBI's register and could not verify it. Treat it as unverified and don't pay until it checks out."],
    hi: ["SEBI रजिस्टर में नहीं मिला ({x})", "FinSuraksha ने {x} को SEBI रजिस्टर की अपनी कॉपी में जाँचा, पर इसकी पुष्टि नहीं हुई। इसे असत्यापित मानें और पुष्टि होने तक भुगतान न करें।"],
  },
  sebi_not_registered: {
    en: ["Not registered with SEBI ({x})", "{x} is not in SEBI's register (updated {y}). Don't pay. If they say they registered very recently, ask for their SEBI registration certificate."],
    hi: ["SEBI में रजिस्टर्ड नहीं ({x})", "{x} SEBI रजिस्टर ({y} तक अपडेट) में नहीं है। भुगतान न करें। अगर वे कहें कि हाल ही में रजिस्टर हुए हैं, तो उनका SEBI रजिस्ट्रेशन सर्टिफ़िकेट माँगें।"],
  },
  sebi_claim_no_number: {
    en: ['Claims "SEBI registered" but shows no number', 'Anyone can say "SEBI registered". A genuine adviser or analyst shows a number you can verify.'],
    hi: ['"SEBI रजिस्टर्ड" कहता है पर नंबर नहीं देता', 'कोई भी "SEBI रजिस्टर्ड" कह सकता है। असली सलाहकार ऐसा नंबर देता है जिसे आप जाँच सकें।'],
  },
  upi_personal: {
    en: ["Payment to a personal UPI ID ({x})", "Since 1 Oct 2025, SEBI-registered brokers and mutual funds collect money through @valid UPI IDs with a green thumbs-up icon. This is not one."],
    hi: ["निजी UPI ID पर भुगतान ({x})", "1 अक्टूबर 2025 से SEBI-रजिस्टर्ड ब्रोकर और म्यूचुअल फ़ंड @valid UPI ID (हरे थम्स-अप निशान के साथ) से ही पैसे लेते हैं। यह वैसी ID नहीं है।"],
  },
  community_verified: {
    en: ["Already reported by the community ({x})", '"{x}" matches a community-verified report on FinScam Hunter.'],
    hi: ["समुदाय पहले ही रिपोर्ट कर चुका है ({x})", '"{x}" FinScam Hunter पर समुदाय द्वारा सत्यापित रिपोर्ट से मेल खाता है।'],
  },
  community_pending: {
    en: ["Reported by other users ({x})", '"{x}" matches a report the community is still verifying.'],
    hi: ["दूसरे लोगों ने रिपोर्ट किया है ({x})", '"{x}" ऐसी रिपोर्ट से मेल खाता है जिसकी जाँच समुदाय अभी कर रहा है।'],
  },
};

export const POSITIVE_TEXT = {
  risk_disclaimer: { en: "Includes the standard market-risk disclaimer", hi: "मानक बाज़ार-जोखिम चेतावनी मौजूद है" },
  sebi_found: { en: "{x} is in SEBI's register snapshot as {y}", hi: "{x} SEBI सूची में {y} के नाम से दर्ज है" },
  upi_valid: { en: "{x} is an @valid UPI handle (issued only to SEBI-registered intermediaries)", hi: "{x} एक @valid UPI ID है (सिर्फ़ SEBI-रजिस्टर्ड संस्थाओं को मिलती है)" },
  official_link: { en: "Links to an official website ({x})", hi: "आधिकारिक वेबसाइट का लिंक ({x})" },
};

export const ACTIONS = {
  verify_first: { en: "Don't pay, install anything or share personal details until you verify.", hi: "जाँच पूरी होने तक न पैसे भेजें, न कुछ इंस्टॉल करें, न निजी जानकारी दें।" },
  never_otp: { en: "Never share OTP/PIN. Call your bank or broker only on the number from their official website or card.", hi: "OTP/PIN कभी न बताएँ। बैंक/ब्रोकर को सिर्फ़ उनकी आधिकारिक वेबसाइट या कार्ड पर दिए नंबर पर कॉल करें।" },
  no_apk: { en: "Don't install the app. If you already did: uninstall it, turn on flight mode and change banking passwords from another device.", hi: "ऐप इंस्टॉल न करें। अगर कर लिया है: उसे हटाएँ, फ़्लाइट मोड चालू करें और किसी दूसरे फ़ोन से बैंकिंग पासवर्ड बदलें।" },
  valid_upi: { en: "Pay only to an @valid UPI ID of a SEBI-registered entity. Paste the UPI ID here and FinSuraksha will verify it for you.", hi: "सिर्फ़ SEBI-रजिस्टर्ड संस्था की @valid UPI ID पर भुगतान करें। UPI ID यहाँ भेजें, FinSuraksha आपके लिए जाँच देगा।" },
  verify_sebi: { en: "Ask for their SEBI registration number (INA = adviser, INH = research analyst) and paste it here. FinSuraksha will verify it against SEBI's register for you.", hi: "उनका SEBI रजिस्ट्रेशन नंबर माँगें (INA = सलाहकार, INH = रिसर्च एनालिस्ट) और यहाँ भेजें। FinSuraksha इसे SEBI रजिस्टर में आपके लिए जाँच देगा।" },
  not_registered: { en: "Don't pay or take tips from anyone who isn't SEBI-registered. If they can't show a SEBI registration certificate, report them on FinScam Hunter.", hi: "जो SEBI में रजिस्टर्ड नहीं है, उसे न पैसे दें, न उसकी टिप लें। अगर वे SEBI रजिस्ट्रेशन सर्टिफ़िकेट न दिखा पाएँ, तो FinScam Hunter पर रिपोर्ट करें।" },
  avoid_dabba: { en: "Trade only through SEBI-registered brokers on recognised exchanges. Dabba operators can be reported to the exchange or the police.", hi: "सिर्फ़ SEBI-रजिस्टर्ड ब्रोकर से मान्य एक्सचेंज पर ट्रेड करें। डब्बा ऑपरेटर की शिकायत एक्सचेंज या पुलिस से करें।" },
  exit_report: { en: "Exit the group and report it on FinScam Hunter so others are warned.", hi: "ग्रुप छोड़ें और FinScam Hunter पर रिपोर्ट करें ताकि दूसरे भी सावधान रहें।" },
  no_fee_withdraw: { en: "Don't pay any 'tax' or 'fee' to withdraw. Stop payments and report at cybercrime.gov.in or call 1930.", hi: "पैसे निकालने के लिए कोई 'टैक्स' या 'फ़ीस' न दें। भुगतान रोकें और cybercrime.gov.in या 1930 पर शिकायत करें।" },
  disconnect_1930: { en: "No agency arrests anyone over a video call. Disconnect and call 1930.", hi: "कोई भी एजेंसी वीडियो कॉल पर गिरफ़्तार नहीं करती। कॉल काटें और 1930 पर फ़ोन करें।" },
  rbi_list: { en: "Check RBI's Alert List on rbi.org.in before using any forex or crypto platform.", hi: "किसी भी फ़ॉरेक्स/क्रिप्टो प्लेटफ़ॉर्म से पहले rbi.org.in पर RBI की अलर्ट लिस्ट देखें।" },
  chakshu: { en: "Report the suspicious call, SMS or WhatsApp on Sanchar Saathi → Chakshu (sancharsaathi.gov.in/sfc).", hi: "संदिग्ध कॉल, SMS या WhatsApp की शिकायत संचार साथी → चक्षु (sancharsaathi.gov.in/sfc) पर करें।" },
  official_bill: { en: "Check your bill only in the official app or website of your electricity/gas company. Don't call numbers from SMS or install apps they send.", hi: "बिल सिर्फ़ बिजली/गैस कंपनी के आधिकारिक ऐप या वेबसाइट पर देखें। SMS में दिए नंबर पर कॉल न करें, न उनका भेजा ऐप इंस्टॉल करें।" },
  no_task_job: { en: "Don't pay any 'registration' or 'task' money. Real employers never ask you to pay to work.", hi: "कोई 'रजिस्ट्रेशन' या 'टास्क' के पैसे न दें। असली नौकरी देने वाला काम के लिए पैसे नहीं माँगता।" },
  lost_money: { en: "If money is already gone, call 1930 right away and file at cybercrime.gov.in; ask your bank to freeze the transaction.", hi: "अगर पैसे जा चुके हैं, तुरंत 1930 पर कॉल करें, cybercrime.gov.in पर शिकायत करें और बैंक से लेन-देन रोकने को कहें।" },
  already_reported: { en: "Others have already reported this. Don't engage or pay.", hi: "दूसरे लोग इसे पहले ही रिपोर्ट कर चुके हैं। बात न करें, पैसे न दें।" },
  stay_careful: { en: "No major red flags found. Never share OTPs, and pay only the exact amount asked.", hi: "कोई बड़ा ख़तरा नहीं दिखा। OTP कभी न बताएँ और सिर्फ़ उतनी ही रक़म भेजें जितनी माँगी गई है।" },
  share_more: { en: "Paste the full message, the link, or the adviser's SEBI number so I can check properly.", hi: "पूरा संदेश, लिंक या सलाहकार का SEBI नंबर भेजें ताकि मैं ठीक से जाँच सकूँ।" },
};

// Shown as the first next step when FinSuraksha has verified something itself.
export const VERIFIED_TEXT = {
  sebi: { en: "✓ **Verified by FinSuraksha:** {x} is registered with SEBI as **{y}** ({z}). Just make sure that's who actually contacted you.", hi: "✓ **FinSuraksha द्वारा सत्यापित:** {x} SEBI में **{y}** ({z}) के नाम से रजिस्टर्ड है। बस देख लें कि आपसे संपर्क करने वाला यही है।" },
  upi: { en: "✓ **Verified by FinSuraksha:** {x} is a SEBI @valid UPI ID ({y}). These are issued only to SEBI-registered intermediaries.", hi: "✓ **FinSuraksha द्वारा सत्यापित:** {x} एक SEBI @valid UPI ID है ({y})। ये सिर्फ़ SEBI-रजिस्टर्ड संस्थाओं को मिलती हैं।" },
};

export const FLAG_ACTIONS = {
  credentials: ["never_otp", "chakshu"],
  remote_apk: ["no_apk"],
  link_apk: ["no_apk"],
  pay_personal: ["valid_upi"],
  upi_personal: ["valid_upi"],
  unregistered_tips: ["verify_sebi"],
  sebi_bad_format: ["verify_sebi"],
  sebi_not_found: ["verify_sebi"],
  sebi_not_registered: ["not_registered"],
  sebi_claim_no_number: ["verify_sebi"],
  dabba: ["avoid_dabba"],
  group_invite: ["exit_report"],
  insider: ["exit_report"],
  guaranteed: ["exit_report"],
  high_return: ["exit_report"],
  link_telegram_private: ["exit_report"],
  link_whatsapp_group: ["exit_report"],
  withdrawal_fee: ["no_fee_withdraw"],
  authority: ["chakshu"],
  threat: ["disconnect_1930", "chakshu"],
  utility_threat: ["official_bill", "chakshu"],
  task_job: ["no_task_job", "exit_report"],
  forex_crypto: ["rbi_list"],
  rbi_alert: ["rbi_list"],
  community_verified: ["already_reported"],
  urgency: ["chakshu"],
};

export const VERDICT_TEXT = {
  high: {
    en: { label: "High risk", headline: "This looks like a scam - don't pay or share anything." },
    hi: { label: "ज़्यादा ख़तरा", headline: "यह ठगी लगती है — न पैसे दें, न कोई जानकारी।" },
  },
  medium: {
    en: { label: "Suspicious", headline: "Several warning signs - verify before you trust this." },
    hi: { label: "संदिग्ध", headline: "कई ख़तरे के संकेत — भरोसा करने से पहले जाँचें।" },
  },
  low: {
    en: { label: "No major red flags", headline: "I didn't find major red flags, but stay careful." },
    hi: { label: "कोई बड़ा ख़तरा नहीं", headline: "मुझे बड़े ख़तरे के संकेत नहीं मिले, फिर भी सावधान रहें।" },
  },
  unknown: {
    en: { label: "Need more info", headline: "Share the full message, link or number so I can check." },
    hi: { label: "और जानकारी चाहिए", headline: "पूरा संदेश, लिंक या नंबर भेजें ताकि मैं जाँच सकूँ।" },
  },
};

export const AUDIO_TEXT = {
  high: {
    en: "This looks like a scam. I found {n} warning signs, such as {top}. Do not pay, install anything or share your OTP. If you have lost money, call 1930 right away.",
    hi: "यह ठगी लगती है। मुझे {n} ख़तरे के संकेत मिले, जैसे {top}। पैसे न भेजें, कुछ इंस्टॉल न करें और OTP किसी को न बताएँ। अगर पैसे चले गए हैं तो तुरंत 1930 पर कॉल करें।",
  },
  medium: {
    en: "Be careful. I found {n} warning signs, such as {top}. Verify the person on the SEBI website before you pay anything.",
    hi: "सावधान रहें। मुझे {n} ख़तरे के संकेत मिले, जैसे {top}। कुछ भी भुगतान करने से पहले SEBI वेबसाइट पर जाँच करें।",
  },
  low: {
    en: "I did not find major warning signs. Still, check the registration before paying, and never share your OTP.",
    hi: "मुझे बड़े ख़तरे के संकेत नहीं मिले। फिर भी भुगतान से पहले रजिस्ट्रेशन जाँचें और OTP कभी न बताएँ।",
  },
  unknown: {
    en: "Please share the full message, link, or SEBI number, and I will check it for you.",
    hi: "कृपया पूरा संदेश, लिंक या SEBI नंबर भेजें, मैं आपके लिए जाँच करूँगा।",
  },
};

// Rule-based answers for general questions (used when AI mode is off).
export const FAQ = [
  {
    id: "advice",
    re: /(should|shall|can) i (buy|sell|invest|hold)|which (stock|share|fund|ipo|coin)|best (stock|share|fund|ipo)|kaun(sa)? (share|stock)|kya kharid|buy or sell|target price|price prediction|कौन सा शेयर|क्या खरीद/i,
    en: "I can't recommend or predict any stock, fund, IPO or coin - that would be investment advice, which only SEBI-registered advisers may give. What I can do:\n- Check whether the person advising you is SEBI-registered (INA = Investment Adviser, INH = Research Analyst).\n- Explain the risks of a product in simple words.\n- Check a tip, link or app for scam signs.\nPaste the tip or the adviser's registration number and I'll check it.",
    hi: "मैं किसी शेयर, फ़ंड, IPO या कॉइन की सलाह या भविष्यवाणी नहीं कर सकता — यह निवेश सलाह होगी, जो सिर्फ़ SEBI-रजिस्टर्ड सलाहकार दे सकते हैं। मैं यह कर सकता हूँ:\n- जाँचना कि आपको सलाह देने वाला SEBI-रजिस्टर्ड है या नहीं (INA = निवेश सलाहकार, INH = रिसर्च एनालिस्ट)।\n- किसी प्रोडक्ट के जोखिम आसान भाषा में समझाना।\n- किसी टिप, लिंक या ऐप में ठगी के संकेत खोजना।\nटिप या सलाहकार का रजिस्ट्रेशन नंबर भेजिए, मैं जाँच करूँगा।",
  },
  {
    id: "scammed",
    re: /scammed|lost (my )?money|cheated|fraud (ho|hua|happened|with me)|been (duped|defrauded)|money (gone|stuck)|complaint|1930|ठगी हो|धोखा|पैसे (गए|चले|डूब)/i,
    en: "I'm sorry this happened. Act fast - the first hours matter most:\n- **Call 1930** (National Cyber Crime Helpline) or file at **cybercrime.gov.in**.\n- Call your bank's official number and ask them to block your card/UPI and freeze the transaction.\n- Save evidence: screenshots, UPI/transaction IDs, phone numbers, group links.\n- Don't pay any \"recovery\" agent - that's a second scam.\n- If a SEBI-registered broker or adviser is involved, also complain on **SEBI SCORES** (scores.sebi.gov.in).\nThe Get Help page can draft your complaint for you.",
    hi: "मुझे दुख है कि ऐसा हुआ। जल्दी करें — शुरुआती घंटे सबसे ज़रूरी हैं:\n- **1930** (राष्ट्रीय साइबर क्राइम हेल्पलाइन) पर कॉल करें या **cybercrime.gov.in** पर शिकायत करें।\n- बैंक के आधिकारिक नंबर पर कॉल करके कार्ड/UPI बंद कराएँ और लेन-देन रोकने को कहें।\n- सबूत सँभालें: स्क्रीनशॉट, UPI/ट्रांज़ैक्शन ID, फ़ोन नंबर, ग्रुप लिंक।\n- किसी \"रिकवरी एजेंट\" को पैसे न दें — वह दूसरी ठगी होती है।\n- अगर कोई SEBI-रजिस्टर्ड ब्रोकर/सलाहकार शामिल है, तो **SEBI SCORES** (scores.sebi.gov.in) पर भी शिकायत करें।\n\"मदद लें\" पेज आपकी शिकायत का ड्राफ़्ट बना सकता है।",
  },
  {
    id: "dabba",
    re: /dabba|डब्बा|off.?market trad|bucket shop|without demat/i,
    en: "**Dabba trading** is trading outside recognised stock exchanges - the operator runs a private \"book\" and settles profit/loss in cash. It often promises no demat, no KYC, huge leverage and no tax.\n- It is illegal under the Securities Contracts (Regulation) Act, 1956: up to **10 years' jail and/or ₹25 crore fine**.\n- Your money has no exchange protection or grievance mechanism - if the operator vanishes, it's gone.\nTrade only through SEBI-registered brokers. You can check a broker on the NSE/BSE websites or SEBI's intermediary search.",
    hi: "**डब्बा ट्रेडिंग** मान्य स्टॉक एक्सचेंज के बाहर होने वाली ट्रेडिंग है — ऑपरेटर अपनी निजी \"बुक\" चलाता है और नफ़ा-नुक़सान नकद में चुकाता है। इसमें अक्सर बिना डीमैट, बिना KYC, भारी लीवरेज और बिना टैक्स का लालच दिया जाता है।\n- यह सिक्योरिटीज़ कॉन्ट्रैक्ट्स (रेगुलेशन) एक्ट, 1956 के तहत ग़ैरक़ानूनी है: **10 साल तक जेल और/या ₹25 करोड़ तक जुर्माना**।\n- आपके पैसे पर एक्सचेंज की कोई सुरक्षा नहीं होती — ऑपरेटर भागा तो पैसा गया।\nसिर्फ़ SEBI-रजिस्टर्ड ब्रोकर से ट्रेड करें।",
  },
  {
    id: "registration",
    re: /registered|registration|sebi (no|number)|verify (an? )?(advis|analyst|broker)|is .* (genuine|real|legit)|\bINA\b|\bINH\b|asli|रजिस्टर्ड|रजिस्ट्रेशन/i,
    en: "To check if someone may legally give stock advice:\n- Ask for their **SEBI registration number**. Investment Advisers start with **INA**, Research Analysts with **INH**, brokers with **INZ** - followed by 9 digits.\n- Search the number on SEBI's official list (sebi.gov.in → Intermediaries) and make sure the **name matches** - scammers often copy real numbers.\n- Pay only to the entity's **@valid UPI ID** and confirm it on **SEBI Check**.\nPaste a number here and I'll check its format and our register snapshot.",
    hi: "कोई क़ानूनी तौर पर शेयर सलाह दे सकता है या नहीं, यह ऐसे जाँचें:\n- उनका **SEBI रजिस्ट्रेशन नंबर** माँगें। निवेश सलाहकार का नंबर **INA**, रिसर्च एनालिस्ट का **INH**, ब्रोकर का **INZ** से शुरू होता है — फिर 9 अंक।\n- नंबर को SEBI की आधिकारिक सूची (sebi.gov.in → Intermediaries) में खोजें और **नाम मिलाएँ** — ठग अक्सर असली नंबर चुरा लेते हैं।\n- भुगतान सिर्फ़ उस संस्था की **@valid UPI ID** पर करें और **SEBI Check** पर पुष्टि करें।",
  },
  {
    id: "valid_upi",
    re: /@valid|valid upi|upi (id|handle)|sebi check|green (thumb|tick)/i,
    en: "Since **1 October 2025**, SEBI-registered brokers and mutual funds collect money through special **@valid UPI IDs**, like `abc.brk@validhdfc` (broker) or `xyz.mf@validicici` (mutual fund). You'll see a **green thumbs-up** icon on the payment screen.\n- No @valid handle and no green icon? Don't pay.\n- Verify any UPI ID or bank account on **SEBI Check** (siportal.sebi.gov.in/intermediary/sebi-check) or the Saa₹thi app.\n- Paying an \"investment\" to a personal UPI ID like a phone number is a classic scam sign.",
    hi: "**1 अक्टूबर 2025** से SEBI-रजिस्टर्ड ब्रोकर और म्यूचुअल फ़ंड ख़ास **@valid UPI ID** से पैसे लेते हैं, जैसे `abc.brk@validhdfc` (ब्रोकर) या `xyz.mf@validicici` (म्यूचुअल फ़ंड)। पेमेंट स्क्रीन पर **हरा थम्स-अप** निशान दिखता है।\n- @valid ID और हरा निशान नहीं? भुगतान न करें।\n- किसी भी UPI ID या बैंक खाते को **SEBI Check** या Saa₹thi ऐप पर जाँचें।\n- \"निवेश\" के लिए किसी निजी UPI ID (जैसे फ़ोन नंबर) पर पैसे भेजना ठगी का आम संकेत है।",
  },
  {
    id: "finfluencer",
    re: /finfluencer|influencer|youtube(r)?|instagram|tips (group|channel)|telegram (group|channel)|paid calls/i,
    en: "Many \"finfluencers\" give buy/sell calls without registration. Since **August 2024**, SEBI bars registered entities (brokers, AMCs, advisers) from associating with unregistered people who give advice or claim returns, and in 2025 it barred such influencers from using live prices or return claims.\n- Genuine educators teach concepts; they don't sell \"sure-shot\" calls or VIP groups.\n- Before paying for tips, ask for an **INA/INH** number and verify it on sebi.gov.in.\n- Spot an unregistered tipster? Report them on **FinScam Hunter**.",
    hi: "कई \"फ़िनफ़्लुएंसर\" बिना रजिस्ट्रेशन के खरीद/बिक्री की टिप देते हैं। **अगस्त 2024** से SEBI ने रजिस्टर्ड संस्थाओं (ब्रोकर, AMC, सलाहकार) को ऐसे अनरजिस्टर्ड लोगों से जुड़ने से रोका है जो सलाह देते हैं या रिटर्न का दावा करते हैं।\n- असली शिक्षक कॉन्सेप्ट सिखाते हैं; \"पक्की टिप\" या VIP ग्रुप नहीं बेचते।\n- टिप के लिए पैसे देने से पहले **INA/INH** नंबर माँगें और sebi.gov.in पर जाँचें।\n- अनरजिस्टर्ड टिपस्टर दिखे तो **FinScam Hunter** पर रिपोर्ट करें।",
  },
  {
    id: "fake_app",
    re: /fake (trading )?app|institutional|ipo allotment|can'?t withdraw|withdraw(al)? (fee|tax|blocked)|trading app|app .*profit/i,
    en: "A common pattern in 2025-26: an ad or WhatsApp \"investment club\" shares daily tips, then asks you to install an app from a link and open an **\"institutional account\"** for IPOs, block deals or upper-circuit stocks. The app shows big fake profits; when you try to withdraw, it demands \"tax\" or \"processing fees\".\n- Install trading apps only from official app stores, from SEBI-registered brokers.\n- Never pay to withdraw your own money.\n- Already paid? Call **1930** and report at cybercrime.gov.in.",
    hi: "2025-26 का आम तरीक़ा: कोई विज्ञापन या WhatsApp \"इन्वेस्टमेंट क्लब\" रोज़ टिप देता है, फिर लिंक से ऐप इंस्टॉल कराकर IPO, ब्लॉक डील या अपर-सर्किट शेयरों के लिए **\"इंस्टीट्यूशनल अकाउंट\"** खुलवाता है। ऐप में बड़ा नकली मुनाफ़ा दिखता है; पैसे निकालने पर \"टैक्स\" या \"प्रोसेसिंग फ़ीस\" माँगी जाती है।\n- ट्रेडिंग ऐप सिर्फ़ आधिकारिक ऐप स्टोर से, SEBI-रजिस्टर्ड ब्रोकर का ही लें।\n- अपना पैसा निकालने के लिए कभी पैसे न दें।\n- पैसे दे चुके हैं? **1930** पर कॉल करें।",
  },
  {
    id: "otp_kyc",
    re: /\botp\b|kyc|phishing|account (blocked|suspended)|demat (blocked|band|suspend)|ओटीपी|केवाईसी/i,
    en: "\"Your demat/KYC will be blocked today - share the OTP\" is phishing.\n- No bank, broker, depository or SEBI asks for OTP, PIN or passwords on call, SMS or WhatsApp.\n- Update KYC only inside your broker's official app/website, never via links in messages.\n- Report the number on **Sanchar Saathi → Chakshu** (sancharsaathi.gov.in/sfc).\n- Shared an OTP already? Call your bank/broker on their official number and **1930** immediately.",
    hi: "\"आपका डीमैट/KYC आज बंद हो जाएगा — OTP बताइए\" — यह फ़िशिंग है।\n- कोई बैंक, ब्रोकर, डिपॉज़िटरी या SEBI कॉल, SMS या WhatsApp पर OTP, PIN या पासवर्ड नहीं माँगता।\n- KYC सिर्फ़ ब्रोकर की आधिकारिक ऐप/वेबसाइट में अपडेट करें, मैसेज के लिंक से नहीं।\n- नंबर की शिकायत **संचार साथी → चक्षु** पर करें।\n- OTP बता चुके हैं? तुरंत बैंक/ब्रोकर के आधिकारिक नंबर और **1930** पर कॉल करें।",
  },
  {
    id: "digital_arrest",
    re: /digital arrest|cbi|customs|narcotics|money laundering|police (call|video)|डिजिटल अरेस्ट/i,
    en: "\"Digital arrest\" is a scam. Fraudsters pose as CBI, ED, customs, police or even SEBI officials on video calls, claim you're involved in a crime, and demand money to \"clear\" your name.\n- No Indian agency arrests anyone over a video call or asks for money to settle a case.\n- Disconnect, don't share screens, and don't transfer money.\n- Call **1930** or report at cybercrime.gov.in, and report the number on Chakshu.",
    hi: "\"डिजिटल अरेस्ट\" एक ठगी है। ठग वीडियो कॉल पर CBI, ED, कस्टम, पुलिस या SEBI अधिकारी बनकर कहते हैं कि आप किसी अपराध में फँसे हैं, और नाम \"साफ़\" करने के लिए पैसे माँगते हैं।\n- भारत की कोई एजेंसी वीडियो कॉल पर गिरफ़्तार नहीं करती, न केस निपटाने के लिए पैसे माँगती है।\n- कॉल काटें, स्क्रीन शेयर न करें, पैसे न भेजें।\n- **1930** पर कॉल करें या cybercrime.gov.in पर शिकायत करें।",
  },
  {
    id: "fno",
    re: /f\s?&\s?o|\bfno\b|futures|options trading|derivative|intraday/i,
    en: "Futures & options (F&O) are complex, leveraged products. SEBI's studies found that about **9 in 10 individual F&O traders lost money** (91% in FY25, with net losses of over ₹1 lakh crore).\n- Paid \"sure-shot\" option calls on Telegram are a major route to these losses.\n- Learn how leverage, expiry and margin work before risking money - and never trade with borrowed money.",
    hi: "फ़्यूचर्स और ऑप्शन (F&O) जटिल और लीवरेज वाले प्रोडक्ट हैं। SEBI के अध्ययनों में पाया गया कि **लगभग 10 में से 9 व्यक्तिगत F&O ट्रेडर्स को नुक़सान** हुआ (FY25 में 91%, कुल नुक़सान ₹1 लाख करोड़ से ज़्यादा)।\n- Telegram पर बिकने वाली \"पक्की\" ऑप्शन टिप्स इन नुक़सानों का बड़ा कारण हैं।\n- पैसे लगाने से पहले लीवरेज, एक्सपायरी और मार्जिन समझें — और उधार के पैसे से कभी ट्रेड न करें।",
  },
  {
    id: "deepfake",
    re: /deepfake|celebrity|famous|video of|ai trading|quantum ai|immediate (edge|connect)/i,
    en: "Scam ads increasingly use **deepfake videos** of business leaders, ministers or anchors \"recommending\" a trading platform.\n- Celebrities don't endorse secret apps with guaranteed returns.\n- Check the platform's SEBI registration and the website address carefully.\n- Report the ad on the platform and on FinScam Hunter.",
    hi: "ठगी वाले विज्ञापन अब उद्योगपतियों, मंत्रियों या एंकरों के **डीपफ़ेक वीडियो** इस्तेमाल करते हैं जिनमें वे किसी ट्रेडिंग प्लेटफ़ॉर्म की \"सिफ़ारिश\" करते दिखते हैं।\n- मशहूर लोग गारंटीड रिटर्न वाले गुप्त ऐप का प्रचार नहीं करते।\n- प्लेटफ़ॉर्म का SEBI रजिस्ट्रेशन और वेबसाइट पता ध्यान से जाँचें।",
  },
  {
    id: "forex",
    re: /forex|binary option|crypto (trading|signal)|rbi alert|usdt/i,
    en: "Residents can trade forex only through authorised entities on recognised exchanges, within FEMA rules. Online forex/binary platforms that promise high returns are often unauthorised - **RBI keeps an Alert List** (95 names as of Nov 2025, including well-known apps).\n- Dealing with them can attract action under FEMA, and your money isn't protected.\n- Check the current Alert List on rbi.org.in before using any platform.",
    hi: "भारतीय निवासी सिर्फ़ अधिकृत संस्थाओं के ज़रिए, मान्य एक्सचेंज पर और FEMA नियमों के भीतर फ़ॉरेक्स ट्रेड कर सकते हैं। ऊँचे रिटर्न का वादा करने वाले ऑनलाइन फ़ॉरेक्स/बाइनरी प्लेटफ़ॉर्म अक्सर अनधिकृत होते हैं — **RBI इनकी अलर्ट लिस्ट रखता है**।\n- इनसे लेन-देन पर FEMA के तहत कार्रवाई हो सकती है।\n- किसी भी प्लेटफ़ॉर्म से पहले rbi.org.in पर ताज़ा सूची देखें।",
  },
  {
    id: "pump_dump",
    re: /pump|dump|operator|upper circuit|penny stock|multibagger/i,
    en: "**Pump & dump**: operators quietly buy a cheap, thinly traded stock, then flood Telegram/WhatsApp/YouTube with \"multibagger\" or \"upper circuit\" tips. When followers buy and the price jumps, the operators sell - the price crashes and followers are stuck.\n- Be wary of hype around unknown penny stocks.\n- Unsolicited tips + urgency + \"insider news\" = walk away and report.",
    hi: "**पंप एंड डंप**: ऑपरेटर चुपचाप कोई सस्ता, कम ट्रेड होने वाला शेयर ख़रीदते हैं, फिर Telegram/WhatsApp/YouTube पर \"मल्टीबैगर\" या \"अपर सर्किट\" की टिप फैलाते हैं। लोग ख़रीदते हैं, भाव चढ़ता है, ऑपरेटर बेचकर निकल जाते हैं — भाव गिरता है और लोग फँस जाते हैं।\n- अनजान पेनी स्टॉक के शोर से सावधान रहें।\n- बिन माँगी टिप + जल्दबाज़ी + \"अंदर की ख़बर\" = दूर रहें और रिपोर्ट करें।",
  },
];

export const GENERAL_TIPS = {
  en: "Here's how to stay safe:\n- Deal only with **SEBI-registered** entities and verify their number on sebi.gov.in.\n- Nobody can guarantee market returns.\n- Never share OTP/PIN or install apps from links.\n- Pay only to **@valid** UPI IDs.\n- Lost money? Call **1930**.\nYou can paste any suspicious message, link, UPI ID or SEBI number and I'll check it.",
  hi: "सुरक्षित रहने के तरीक़े:\n- सिर्फ़ **SEBI-रजिस्टर्ड** संस्थाओं से लेन-देन करें और sebi.gov.in पर नंबर जाँचें।\n- बाज़ार में मुनाफ़े की गारंटी कोई नहीं दे सकता।\n- OTP/PIN कभी न बताएँ, लिंक से ऐप इंस्टॉल न करें।\n- सिर्फ़ **@valid** UPI ID पर भुगतान करें।\n- पैसे गए? **1930** पर कॉल करें।\nकोई भी संदिग्ध संदेश, लिंक, UPI ID या SEBI नंबर भेजें, मैं जाँच करूँगा।",
};
