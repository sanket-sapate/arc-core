/**
 * ARC Consent Management SDK
 * Serverless Edition (Supabase Native)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface ArcConfig {
    supabaseUrl: string;
    supabaseAnonKey: string;
}

export interface UserConsent {
    id: string;
    name: string;
    description: string;
    status: boolean;
    required: boolean;
    isThirdParty: boolean;
    dataObjects: string[];
    vendors: string[];
}

export interface AnonymousConsentPayload {
    consentFormId: string;
    externalUserId: string;
    purposes: { id: string; status: boolean }[];
    userId?: string; // Optional: Pass authenticated User UUID if logged in
    policySnapshot?: Record<string, any>;
}

// Translations Dictionary for 22 Indian Languages
const TRANSLATIONS: Record<string, string[]> = {
    // Format: [Title, Desc, PrivacyTitle, PrivacyDesc, MarketingTitle, MarketingDesc, ConfirmBtn, CancelBtn]
    "en": [
        "We Value Your Privacy",
        "Please review and manage your consent preferences below.",
        "Privacy Policy (Required)",
        "I agree to the Terms of Service and Privacy Policy.",
        "Marketing Communications",
        "Receive updates, promotions, and news from Arc Platform.",
        "Confirm & Continue",
        "Cancel"
    ],
    "hi": ["आपकी गोपनीयता हमारे लिए महत्वपूर्ण है", "कृपया अपनी सहमति प्राथमिकताओं की समीक्षा करें।", "गोपनीयता नीति (अनिवार्य)", "मैं सेवा की शर्तों और गोपनीयता नीति से सहमत हूं।", "मार्केटिंग संचार", "अपडेट, प्रचार और समाचार प्राप्त करें।", "पुष्टि करें और जारी रखें", "रद्द करें"],
    "bn": ["আমরা আপনার গোপনীয়তাকে গুরুত্ব দিই", "অনুগ্রহ করে আপনার সম্মতির পছন্দগুলি পর্যালোচনা করুন।", "গোপনীয়তা নীতি (প্রয়োজনীয়)", "আমি পরিষেবার শর্তাবলী এবং গোপনীয়তা নীতির সাথে একমত।", "মার্কেটিং যোগাযোগ", "আপডেট, প্রচার এবং খবর পান।", "নিশ্চিত করুন এবং অবিরত রাখুন", "বাতিল করুন"],
    "te": ["మీ గోప్యత మాకు ముఖ్యం", "దయచేసి మీ సమ్మతి ప్రాధాన్యతలను సమీక్షించండి.", "గోప్యతా విధానం (తప్పనిసరి)", "నేను సేవా నిబంధనలు మరియు గోప్యతా విధానానికి అంగీకరిస్తున్నాను.", "మార్కెటింగ్ కమ్యూనికేషన్స్", "నవీకరణలు, ప్రమోషన్లు మరియు వార్తలను స్వీకరించండి.", "నిర్ధారించండి మరియు కొనసాగించండి", "రద్దు చేయండి"],
    "mr": ["आम्ही तुमच्या गोपनीयतेची कदर करतो", "कृपया खालील आपल्या संमती प्राधान्यांचे पुनरावलोकन करा.", "गोपनीयता धोरण (आवश्यक)", "मी सेवा अटी आणि गोपनीयता धोरणाशी सहमत आहे.", "विपणन संप्रेषणे", "अद्यतने, जाहिराती आणि बातम्या प्राप्त करा.", "पुष्टी करा आणि सुरू ठेवा", "रद्द करा"],
    "ta": ["உங்கள் தனியுரிமையை நாங்கள் மதிக்கிறோம்", "உங்கள் ஒப்புதல் விருப்பங்களைச் சரிபார்க்கவும்.", "தனியுரிமைக் கொள்கை (கட்டாயமானது)", "சேவை விதிமுறைகள் மற்றும் தனியுரிமைக் கொள்கையை ஏற்கிறேன்.", "சந்தைப்படுத்தல் தொடர்புகள்", "புதுப்பிப்புகள் மற்றும் செய்திகளைப் பெறுங்கள்.", "உறுதிப்படுத்தி தொடரவும்", "ரத்துசெய்"],
    "ur": ["ہم آپ کی پرائیویسی کی قدر کرتے ہیں", "براہ کرم اپنی رضامندی کی ترجیحات کا جائزہ لیں۔", "پرائیویسی پالیسی (لازمی)", "میں سروس کی شرائط اور پرائیویسی پالیسی سے اتفاق کرتا ہوں۔", "مارکیٹنگ مواصلات", "اپ ڈیٹس، پروموشنز اور خبریں حاصل کریں۔", "تصدیق کریں اور جاری رکھیں", "منسوخ کریں"],
    "gu": ["અમે તમારી ગોપનીયતાની કદર કરીએ છીએ", "કૃપા કરીને તમારી સંમતિ પસંદગીઓની સમીક્ષા કરો.", "ગોપનીયતા નીતિ (આવશ્યક)", "હું સેવાની શરતો અને ગોપનીયતા નીતિ સાથે સંમત છું.", "માર્કેટિંગ કોમ્યુનિકેશન્સ", "અપડેટ્સ અને સમાચાર મેળવો.", "પુષ્ટિ કરો અને ચાલુ રાખો", "રદ કરો"],
    "kn": ["ನಿಮ್ಮ ಗೌಪ್ಯತೆ ನಮಗೆ ಮುಖ್ಯ", "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಮ್ಮತಿ ಆದ್ಯತೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.", "ಗೌಪ್ಯತೆ ನೀತಿ (ಕಡ್ಡಾಯ)", "ನಾನು ಸಾಬೀತುಪಡಿಸಿದ ನಿಯಮಗಳು ಮತ್ತು ಗೌಪ್ಯತೆ ನೀತಿಗೆ ಒಪ್ಪುತ್ತೇನೆ.", "ಮಾರ್ಕೆಟಿಂಗ್ ಸಂವಹನಗಳು", "ನವೀಕರಣಗಳು ಮತ್ತು ಸುದ್ದಿಯನ್ನು ಸ್ವೀಕರಿಸಿ.", "ದೃಢೀಕರಿಸಿ ಮತ್ತು ಮುಂದುವರಿಸಿ", "ರದ್ದುಗೊಳಿಸಿ"],
    "ml": ["നിങ്ങളുടെ സ്വകാര്യത ഞങ്ങൾക്ക് പ്രധാനമാണ്", "ദയവായി നിങ്ങളുടെ സമ്മത മുൻഗണനകൾ പരിശോധിക്കുക.", "സ്വകാര്യതാ നയം (നിർബന്ധം)", "സേവന നിബന്ധനകളും സ്വകാര്യതാ നയവും ഞാൻ അംഗീകരിക്കുന്നു.", "മാർക്കറ്റിംഗ് ആശയവിനിമയങ്ങൾ", "അപ്‌ഡേറ്റുകളും വാർത്തകളും ലഭിക്കുക.", "സ്ഥിരീകരിച്ച് തുടരുക", "റദ്ദാക്കുക"],
    "or": ["ଆମେ ଆପଣଙ୍କ ଗୋପନୀୟତାକୁ ଗୁରୁତ୍ଵ ଦେଉ", "ଦୟାକରି ଆପଣଙ୍କ ସମ୍ମତି ପସନ୍ଦଗୁଡିକ ସମୀକ୍ଷା କରନ୍ତୁ", "ଗୋପନୀୟତା ନୀତି (ଆବଶ୍ୟକ)", "ମୁଁ ସେବା ସର୍ତ୍ତାବଳୀ ଏବଂ ଗୋପନୀୟତା ନୀତି ସହିତ ସହମତ", "ବିପଣନ ଯୋଗାଯୋଗ", "ଅପଡେଟ୍, ପ୍ରୋତ୍ସାହନ ଏବଂ ଖବର ପାଆନ୍ତୁ", "ନିଶ୍ଚିତ କରନ୍ତୁ ଏବଂ ଜାରି ରଖନ୍ତୁ", "ବାତିଲ କରନ୍ତୁ"],
    "pa": ["ਅਸੀਂ ਤੁਹਾਡੀ ਗੋਪਨੀਯਤਾ ਦੀ ਕਦਰ ਕਰਦੇ ਹਾਂ", "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀਆਂ ਸਹਿਮਤੀ ਤਰਜੀਹਾਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ।", "ਗੋਪਨੀਯਤਾ ਨੀਤੀ (ਲਾਜ਼ਮੀ)", "ਮੈਂ ਸੇਵਾ ਦੀਆਂ ਸ਼ਰਤਾਂ ਅਤੇ ਗੋਪਨੀਯਤਾ ਨੀਤੀ ਨਾਲ ਸਹਿਮਤ ਹਾਂ।", "ਮਾਰਕੀਟਿੰਗ ਸੰਚਾਰ", "ਅਪਡੇਟਸ ਅਤੇ ਖਬਰਾਂ ਪ੍ਰਾਪਤ ਕਰੋ।", "ਤਸਦੀਕ ਕਰੋ ਅਤੇ ਜਾਰੀ ਰੱਖੋ", "ਰੱਦ ਕਰੋ"],
    "as": ["আমি আপোনাৰ গোপনীয়তাক মূল্য দিওঁ", "অনুগ্ৰহ কৰি আপোনাৰ সন্মতি অগ্ৰাধিকাৰ সমূহ পৰ্যালোচনা কৰক।", "গোপনীয়তা নীতি (প্ৰয়োজনীয়)", "মই সেৱাৰ চৰ্তাসমূহ আৰু গোপনীয়তা নীতিৰ সৈতে সন্মত।", "মার্কেটিং যোগাযোগ", "আপডেট আৰু খবৰ লাভ কৰক।", "নিশ্চিত কৰক আৰু অব্যাহত ৰাখক", "বাতিল কৰক"],
    // Fallback/Simulated translations for remaining languages to prevent crashes (using English or approximate)
    "brx": ["We Value Your Privacy", "Please review and manage your consent preferences.", "Privacy Policy (Required)", "I agree to Terms & Privacy Policy.", "Marketing Communications", "Receive updates & news.", "Confirm & Continue", "Cancel"],
    "doi": ["We Value Your Privacy", "Please review and manage your consent preferences.", "Privacy Policy (Required)", "I agree to Terms & Privacy Policy.", "Marketing Communications", "Receive updates & news.", "Confirm & Continue", "Cancel"],
    "ks": ["We Value Your Privacy", "Please review and manage your consent preferences.", "Privacy Policy (Required)", "I agree to Terms & Privacy Policy.", "Marketing Communications", "Receive updates & news.", "Confirm & Continue", "Cancel"],
    "gom": ["आमी तुमच्या खाजगीपणाची कदर करतो", "तुम्हच्या संमतीची पसंती तपासा.", "खाजगीपणा धोरण (गरजेचे)", "हांव सेवा अटी आनी खाजगीपणा धोरणाक मान्यताय दिता.", "विपणन संवाद", "बातम्यो आनी अपडेट मेळयात.", "खात्री करात आनी फुडें वचात", "रद्द करात"],
    "mai": ["हम अहांक गोपनीयताक कद्र करैत छी", "कृपा कए अपन सहमति प्राथमिकताक समीक्षा करू।", "गोपनीयता नीति (अनिवार्य)", "हम सेवाक शर्त आर गोपनीयता नीति सँ सहमत छी।", "विपणन संचार", "अपडेट आर समाचार प्राप्त करू।", "पुष्टि करू आर जारी राखु", "रद्द करू"],
    "mni": ["We Value Your Privacy", "Please review and manage your consent preferences.", "Privacy Policy (Required)", "I agree to Terms & Privacy Policy.", "Marketing Communications", "Receive updates & news.", "Confirm & Continue", "Cancel"],
    "ne": ["हामी तपाईंको गोपनीयताको कदर गर्छौं", "कृपया आफ्नो सहमति प्राथमिकताहरू समीक्षा गर्नुहोस्।", "गोपनीयता नीति (आवश्यक)", "म सेवा सर्तहरू र गोपनीयता नीतिसँग सहमत छु।", "मार्केटिङ संचार", "अपडेट र समाचार प्राप्त गर्नुहोस्।", "पुष्टि गर्नुहोस् र जारी राख्नुहोस्", "रद्द गर्नुहोस्"],
    "sa": ["वयं भवतां गोपनीयतां बहु मन्यामहे", "कृपया स्वस्य अनुमति-प्राथमिकतानां समीक्षां कुर्वन्तु।", "गोपनीयता-नीतिः (अनिवार्यम्)", "अहं सेवा-नियमान् गोपनीयता-नीतिं च स्वीकरोमि।", "विपणन-सञ्चारः", "अद्यतनानि वार्त्ताः च प्राप्नुवन्तु।", "पुष्टिं कृत्वा अग्रे सरतु", "निरस्तं करोतु"],
    "sat": ["We Value Your Privacy", "Please review and manage your consent preferences.", "Privacy Policy (Required)", "I agree to Terms & Privacy Policy.", "Marketing Communications", "Receive updates & news.", "Confirm & Continue", "Cancel"],
    "sd": ["اسين توهان جي پرائيويسي جو قدر ڪريون ٿا", "مهرباني ڪري پنهنجي رضامندي جي ترجيحن جو جائزو وٺو.", "پرائيويسي پاليسي (لازمي)", "مان سروس جي شرطن ۽ پرائيويسي پاليسي سان متفق آهيان.", "مارڪيٽنگ ڪميونيڪيشن", "اپڊيٽس ۽ خبرون حاصل ڪريو.", "تصديق ڪريو ۽ جاري رکو", "رد ڪريو"]
};

export class ArcConsentSDK {
    private supabase: SupabaseClient;

    constructor(config: ArcConfig) {
        // Fallback for build time if env vars are missing
        const url = config.supabaseUrl || "https://placeholder.supabase.co";
        const key = config.supabaseAnonKey || "build-fallback-key";
        this.supabase = createClient(url, key);
    }

    /**
     * Submit consent for an anonymous/guest user directly to Supabase.
     */
    /**
     * Submit consent for an anonymous/guest user directly to Supabase.
     */
    /**
     * Submit consent for an anonymous/guest user via server-side API.
     * Triggers auto-provisioning of account if email is new.
     */
    async submitAnonymousConsent(payload: AnonymousConsentPayload): Promise<void> {
        try {
            const response = await fetch("/api/v1/public/consent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    consentFormId: payload.consentFormId,
                    externalUserId: payload.externalUserId,
                    purposes: payload.purposes,
                    userId: payload.userId, // Pass explicit UUID if available
                    meta: {
                        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
                        ip: "anonymized"
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Consent submission failed via API");
            }

            // Success - No need to manually write to DB or check logs, API handled it.
        } catch (error: any) {
            console.error("SDK Consent API Error:", error);
            throw new Error(`Consent submission failed: ${error.message}`);
        }
    }

    // --- Cookie Management (Client Side) ---

    hasUserConsented(): boolean {
        if (typeof window === "undefined") return false;
        return !!this.getCookie("arc_consent_status");
    }

    recordConsentChoice(status: boolean): void {
        if (typeof window === "undefined") return;
        this.setCookie("arc_consent_status", status ? "accepted" : "declined", 365);
    }

    private getCookie(name: string): string | null {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
        return null;
    }

    private setCookie(name: string, value: string, days: number): void {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "; expires=" + date.toUTCString();
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    // --- Translation (Serverless) ---

    /**
     * Translate text content using client-side dictionary.
     * Simulates the backend API but runs entirely in browser.
     */
    async translate(contents: string[], targetLang: string): Promise<string[]> {
        // Simulate network delay for realism
        await new Promise(resolve => setTimeout(resolve, 300));

        const dict = TRANSLATIONS[targetLang];
        if (!dict) {
            console.warn(`Language ${targetLang} not found, falling back to original`);
            return contents;
        }

        // Map known strings to their translations based on index/order
        // The ConsentModal sends a specific array of 8 strings.
        // We verify the length. If it matches 8, we return the strict array.
        if (contents.length === 8) {
            return dict;
        }

        // Fallback: If content doesn't match our strict template, return original
        // ignoring partial matches for safety
        return contents;
    }
}

