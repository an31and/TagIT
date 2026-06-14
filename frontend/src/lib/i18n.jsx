// Tiny in-app i18n.  Falls back to English when a key is missing.
// All copy lives in JSON dictionaries below so dropping in a new language is
// just adding another object.
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const dict = {
    en: {
        common: {
            tagline: "Privacy-first smart tags. No app for finders. Free for India.",
            scan_if_found: "Scan if found",
            language: "Language",
            theme: "Theme",
            dark: "Dark",
            light: "Light",
            sign_in: "Sign in",
            sign_up: "Sign up",
            sign_out: "Sign out",
            dashboard: "Dashboard",
            settings: "Settings",
            inbox: "Inbox",
            back: "Back",
            save: "Save",
            cancel: "Cancel",
            delete: "Delete",
            edit: "Edit",
            new_tag: "Create tag",
            made_in_india: "Made in India",
            free_public_service: "A free public-service ecosystem",
            loading: "Loading…",
            verify_before_acting: "Please verify before acting on this information.",
            last_updated: "Last updated",
        },
        finder: {
            header: "Hi, a kind person scanned this tag.",
            owner_says: "The owner says",
            quick_actions: "Quick actions",
            wrong_parking: "Vehicle parked incorrectly",
            headlight_on: "Headlights / lights left on",
            found_share_location: "I found this — share my location",
            send_message: "Send a message",
            call_owner: "Notify owner",
            your_name: "Your name (optional)",
            your_contact: "Your phone or email (optional)",
            message_placeholder: "Type a short note for the owner…",
            include_my_location: "Attach my approximate location",
            send: "Send",
            sent_thanks: "Sent — thank you. The owner has been alerted.",
            cannot_send: "Couldn't send. Please try again.",
            reported_lost: "This tag has been reported lost. Please help the owner.",
            unclaimed_title: "This tag isn't claimed yet",
            unclaimed_body: "If this tag belongs to you, sign in to claim it.",
            tag_not_found: "We couldn't find this tag.",
            tag_not_found_help: "The QR may have been misprinted, or this code isn't a TagIT.",
            powered_by: "Powered by TagIT — privacy-first, no app needed.",
        },
        emergency: {
            heading: "MEDICAL EMERGENCY ID",
            blood_group: "Blood group",
            allergies: "Allergies",
            chronic_conditions: "Chronic conditions",
            notes: "Notes",
            call_contact: "Call emergency contact",
            nearest_ps: "Nearest police station",
            disclaimer:
                "Information shown with the owner's consent. Verify identity before treatment.",
        },
        landing: {
            hero_kicker: "A free public-service smart tag for every Indian household",
            hero_title: "Lose less. Help more.",
            hero_subtitle:
                "Stick a TagIT on your bike, your pet's collar, your luggage, your keys. If they ever get lost, a kind person can help — without installing an app.",
            cta_primary: "Get your free tags",
            cta_secondary: "See how it works",
            feature_no_app: "No app for finders",
            feature_no_app_desc:
                "Anyone with a phone camera can scan and reach you. Zero installs.",
            feature_privacy: "Privacy-first",
            feature_privacy_desc:
                "Your phone number is never shown. Finders reach you through anonymous, server-side relays.",
            feature_emergency: "Medical Emergency ID",
            feature_emergency_desc:
                "First responders see blood group, allergies and an emergency contact — in seconds.",
            feature_made_in_india: "Made in India",
            feature_made_in_india_desc:
                "Self-printable QR stickers for vehicles, pets, luggage, keys and Medical IDs.",
            how_step_1: "Create a tag",
            how_step_1_desc: "Pick a type — vehicle, pet, luggage, keys or medical.",
            how_step_2: "Print the QR sticker",
            how_step_2_desc: "Download A4 sheets, ID cards or keyring stickers — for free.",
            how_step_3: "Get notified",
            how_step_3_desc:
                "When someone scans, you get a message. Their location too — if they share it.",
        },
        auth: {
            sign_in_title: "Welcome back",
            sign_in_subtitle: "Sign in to manage your tags and emergency profile.",
            sign_up_title: "Create your TagIT account",
            sign_up_subtitle: "It's free. No card. No app. No spam.",
            email: "Email",
            password: "Password",
            display_name: "Your name",
            continue_with_google: "Continue with Google",
            or_use_email: "or use email",
            already_have_account: "Already have an account?",
            need_account: "Don't have an account?",
            password_min: "Password must be at least 8 characters.",
        },
        dashboard: {
            title: "Your tags",
            new_tag: "New tag",
            scans_today: "Total scans",
            messages_today: "Inbox",
            active_tags: "Active tags",
            empty_title: "No tags yet",
            empty_subtitle:
                "Create your first tag — it takes 20 seconds. Print and stick.",
            all: "All",
            vehicle: "Vehicle",
            pet: "Pet",
            luggage: "Luggage",
            keys: "Keys",
            medical: "Medical",
            general: "General",
            status_active: "Active",
            status_lost: "Reported lost",
            status_found: "Returned",
            view_finder_page: "Open finder page",
            download_pdf: "Download stickers",
            view_messages: "Messages",
        },
        tag_edit: {
            title: "Edit tag",
            new_title: "Create tag",
            section_basic: "Basic info",
            section_data: "Type-specific info",
            section_public: "What can the finder see?",
            section_status: "Status",
            label: "Private nickname (only you see this)",
            display_name: "Public display name",
            message: "Message shown to the finder",
            vehicle_make_model: "Make / model",
            vehicle_plate: "License plate",
            pet_name: "Pet name",
            pet_breed: "Breed",
            note: "Note",
            save: "Save changes",
            create: "Create tag",
            delete_tag: "Delete tag",
            delete_warning:
                "This permanently deletes the tag, its scans and finder messages.",
            confirm_delete: "Yes, delete this tag",
        },
        qr: {
            title: "QR & stickers",
            url_label: "Your finder URL",
            preview: "Preview",
            download_a4: "A4 sticker sheet (12 per page)",
            download_id: "ID card (credit-card size)",
            download_keyring: "Keyring stickers (24 per page)",
            tip:
                "Tip: Print at 100% scale. The QR uses high error correction so it can survive a few scratches.",
        },
        medical: {
            title: "Medical Emergency Profile",
            emergency_mode: "Show this on scan as an Emergency Profile",
            consent_label:
                "I confirm that the information below is accurate and I consent to it being shown to finders in an emergency.",
            blood_group: "Blood group",
            allergies: "Allergies",
            chronic_conditions: "Chronic conditions",
            emergency_contact_name: "Emergency contact name",
            emergency_contact_phone: "Emergency contact phone",
            nearest_police_station: "Nearest police station",
            additional_notes: "Other notes for first responders",
            disclaimer:
                "Wrong medical information is dangerous. Please double-check before saving.",
            saved: "Profile saved",
        },
        settings: {
            title: "Settings",
            account: "Account",
            notifications: "Notifications",
            language: "Language",
            export: "Export my data",
            delete_account: "Delete my account",
            delete_warning:
                "This wipes your account and every tag, scan and message. This cannot be undone.",
            confirm_delete: "Yes, delete everything",
            notify_on_message: "Email me when a finder sends a message",
            notify_on_scan: "Email me every time a tag is scanned",
            saved: "Saved",
        },
        claim: {
            title: "Claim this tag",
            subtitle:
                "This QR isn't linked to an owner yet. Sign in and we'll attach it to your account.",
            claim_button: "Claim this tag",
            claimed: "Tag claimed. Redirecting…",
        },
        legal: {
            privacy: "Privacy policy",
            terms: "Terms",
            medical_disclaimer: "Medical disclaimer",
        },
    },
    hi: {
        common: {
            tagline: "गोपनीयता-प्रथम स्मार्ट टैग। खोजने वाले के लिए कोई ऐप नहीं। भारत के लिए मुफ़्त।",
            scan_if_found: "मिलने पर स्कैन करें",
            language: "भाषा",
            theme: "थीम",
            dark: "डार्क",
            light: "लाइट",
            sign_in: "साइन इन",
            sign_up: "साइन अप",
            sign_out: "साइन आउट",
            dashboard: "डैशबोर्ड",
            settings: "सेटिंग्स",
            inbox: "इनबॉक्स",
            back: "वापस",
            save: "सेव करें",
            cancel: "रद्द करें",
            delete: "हटाएँ",
            edit: "एडिट",
            new_tag: "नया टैग",
            made_in_india: "मेड इन इंडिया",
            free_public_service: "एक मुफ़्त जन-सेवा इकोसिस्टम",
            loading: "लोड हो रहा है…",
            verify_before_acting: "कार्य करने से पहले कृपया इस जानकारी की पुष्टि करें।",
            last_updated: "आख़िरी बार अपडेट",
        },
        finder: {
            header: "नमस्ते, किसी ने यह टैग स्कैन किया है।",
            owner_says: "मालिक का संदेश",
            quick_actions: "त्वरित कार्य",
            wrong_parking: "वाहन ग़लत जगह पार्क है",
            headlight_on: "हेडलाइट / लाइटें चालू रह गई हैं",
            found_share_location: "यह मुझे मिला — मेरी लोकेशन भेजें",
            send_message: "संदेश भेजें",
            call_owner: "मालिक को सूचित करें",
            your_name: "आपका नाम (वैकल्पिक)",
            your_contact: "आपका फ़ोन/ईमेल (वैकल्पिक)",
            message_placeholder: "मालिक के लिए एक छोटा संदेश…",
            include_my_location: "मेरी अनुमानित लोकेशन जोड़ें",
            send: "भेजें",
            sent_thanks: "भेज दिया — धन्यवाद। मालिक को सूचना मिल गई है।",
            cannot_send: "भेज नहीं पाए। फिर से कोशिश करें।",
            reported_lost: "यह टैग खोया हुआ बताया गया है। कृपया मालिक की मदद करें।",
            unclaimed_title: "यह टैग अभी क्लेम नहीं किया गया है",
            unclaimed_body: "अगर यह आपका है, तो साइन इन करके इसे क्लेम करें।",
            tag_not_found: "यह टैग नहीं मिला।",
            tag_not_found_help: "QR ग़लत प्रिंट हुआ हो सकता है, या यह TagIT नहीं है।",
            powered_by: "TagIT — गोपनीयता-प्रथम, कोई ऐप नहीं।",
        },
        emergency: {
            heading: "मेडिकल इमरजेंसी आईडी",
            blood_group: "ब्लड ग्रुप",
            allergies: "एलर्जी",
            chronic_conditions: "पुरानी बीमारियाँ",
            notes: "नोट्स",
            call_contact: "इमरजेंसी संपर्क को कॉल करें",
            nearest_ps: "नज़दीकी पुलिस स्टेशन",
            disclaimer:
                "मालिक की सहमति से दिखाई गई जानकारी। उपचार से पहले पहचान जाँचें।",
        },
        landing: {
            hero_kicker: "हर भारतीय परिवार के लिए मुफ़्त जन-सेवा स्मार्ट टैग",
            hero_title: "कम खोएँ। अधिक मदद करें।",
            hero_subtitle:
                "अपनी बाइक, पालतू जानवर, सामान या चाबियों पर एक TagIT लगाएँ। यदि कभी खो जाएँ, तो कोई भी बिना ऐप के स्कैन कर मदद कर सकता है।",
            cta_primary: "मुफ़्त टैग पाएँ",
            cta_secondary: "कैसे काम करता है",
            feature_no_app: "खोजने वाले के लिए कोई ऐप नहीं",
            feature_no_app_desc: "कैमरे वाला कोई भी फ़ोन स्कैन कर आप तक पहुँच सकता है।",
            feature_privacy: "गोपनीयता-प्रथम",
            feature_privacy_desc:
                "आपका नंबर कभी नहीं दिखाया जाता। संदेश सर्वर के ज़रिए ही पहुँचते हैं।",
            feature_emergency: "मेडिकल इमरजेंसी आईडी",
            feature_emergency_desc:
                "ब्लड ग्रुप, एलर्जी और इमरजेंसी संपर्क — कुछ सेकेंड में।",
            feature_made_in_india: "मेड इन इंडिया",
            feature_made_in_india_desc:
                "वाहन, पालतू, सामान, चाबियों और मेडिकल आईडी के लिए स्वयं प्रिंट करने वाले स्टिकर।",
            how_step_1: "टैग बनाएँ",
            how_step_1_desc: "एक प्रकार चुनें — वाहन, पालतू, सामान, चाबी या मेडिकल।",
            how_step_2: "QR स्टिकर प्रिंट करें",
            how_step_2_desc: "A4, आईडी कार्ड या कीरिंग — मुफ़्त डाउनलोड करें।",
            how_step_3: "सूचना पाएँ",
            how_step_3_desc:
                "जब कोई स्कैन करता है, आपको संदेश मिलता है। चाहें तो लोकेशन भी।",
        },
        auth: {
            sign_in_title: "वापस स्वागत है",
            sign_in_subtitle: "अपने टैग और इमरजेंसी प्रोफ़ाइल देखने के लिए साइन इन करें।",
            sign_up_title: "TagIT खाता बनाएँ",
            sign_up_subtitle: "मुफ़्त। कोई कार्ड नहीं, कोई ऐप नहीं, कोई स्पैम नहीं।",
            email: "ईमेल",
            password: "पासवर्ड",
            display_name: "आपका नाम",
            continue_with_google: "Google से जारी रखें",
            or_use_email: "या ईमेल से",
            already_have_account: "खाता पहले से है?",
            need_account: "खाता नहीं है?",
            password_min: "पासवर्ड कम से कम 8 अक्षर का हो।",
        },
        dashboard: {
            title: "आपके टैग",
            new_tag: "नया टैग",
            scans_today: "कुल स्कैन",
            messages_today: "इनबॉक्स",
            active_tags: "सक्रिय टैग",
            empty_title: "अभी कोई टैग नहीं",
            empty_subtitle: "पहला टैग बनाएँ — सिर्फ़ 20 सेकेंड लगते हैं।",
            all: "सभी",
            vehicle: "वाहन",
            pet: "पालतू",
            luggage: "सामान",
            keys: "चाबियाँ",
            medical: "मेडिकल",
            general: "सामान्य",
            status_active: "सक्रिय",
            status_lost: "खोया हुआ",
            status_found: "वापस मिला",
            view_finder_page: "फ़ाइंडर पेज देखें",
            download_pdf: "स्टिकर डाउनलोड करें",
            view_messages: "संदेश",
        },
        tag_edit: {
            title: "टैग एडिट करें",
            new_title: "नया टैग",
            section_basic: "बेसिक जानकारी",
            section_data: "विशेष जानकारी",
            section_public: "खोजने वाले को क्या दिखे?",
            section_status: "स्थिति",
            label: "निजी नाम (केवल आप देखेंगे)",
            display_name: "सार्वजनिक नाम",
            message: "खोजने वाले को दिखने वाला संदेश",
            vehicle_make_model: "मेक / मॉडल",
            vehicle_plate: "लाइसेंस प्लेट",
            pet_name: "पालतू का नाम",
            pet_breed: "नस्ल",
            note: "नोट",
            save: "सेव करें",
            create: "टैग बनाएँ",
            delete_tag: "टैग हटाएँ",
            delete_warning: "यह टैग, उसके स्कैन और संदेश स्थायी रूप से हटा देगा।",
            confirm_delete: "हाँ, इस टैग को हटाएँ",
        },
        qr: {
            title: "QR और स्टिकर",
            url_label: "आपका फ़ाइंडर URL",
            preview: "प्रिव्यू",
            download_a4: "A4 स्टिकर शीट (12 प्रति पेज)",
            download_id: "आईडी कार्ड (क्रेडिट कार्ड आकार)",
            download_keyring: "कीरिंग स्टिकर (24 प्रति पेज)",
            tip:
                "टिप: 100% स्केल पर प्रिंट करें। QR हाई एरर-करेक्शन का उपयोग करता है।",
        },
        medical: {
            title: "मेडिकल इमरजेंसी प्रोफ़ाइल",
            emergency_mode: "स्कैन पर इसे इमरजेंसी प्रोफ़ाइल के रूप में दिखाएँ",
            consent_label:
                "मैं पुष्टि करता/करती हूँ कि नीचे की जानकारी सही है और मैं इमरजेंसी में इसे दिखाने के लिए सहमत हूँ।",
            blood_group: "ब्लड ग्रुप",
            allergies: "एलर्जी",
            chronic_conditions: "पुरानी बीमारियाँ",
            emergency_contact_name: "इमरजेंसी संपर्क नाम",
            emergency_contact_phone: "इमरजेंसी संपर्क फ़ोन",
            nearest_police_station: "नज़दीकी पुलिस स्टेशन",
            additional_notes: "रिस्पॉन्डर के लिए अन्य नोट्स",
            disclaimer: "ग़लत मेडिकल जानकारी ख़तरनाक है। सेव से पहले जाँच लें।",
            saved: "प्रोफ़ाइल सेव हो गई",
        },
        settings: {
            title: "सेटिंग्स",
            account: "खाता",
            notifications: "नोटिफ़िकेशन",
            language: "भाषा",
            export: "मेरा डेटा एक्सपोर्ट करें",
            delete_account: "खाता हटाएँ",
            delete_warning:
                "यह आपके खाते और सभी टैग, स्कैन और संदेश मिटा देगा। यह वापस नहीं किया जा सकता।",
            confirm_delete: "हाँ, सब कुछ हटाएँ",
            notify_on_message: "जब कोई संदेश भेजे तो ईमेल भेजें",
            notify_on_scan: "हर स्कैन पर ईमेल भेजें",
            saved: "सेव हो गया",
        },
        claim: {
            title: "यह टैग क्लेम करें",
            subtitle: "यह QR अभी किसी मालिक से नहीं जुड़ा। साइन इन कर क्लेम करें।",
            claim_button: "टैग क्लेम करें",
            claimed: "टैग क्लेम हो गया। रीडायरेक्ट हो रहा है…",
        },
        legal: {
            privacy: "गोपनीयता नीति",
            terms: "शर्तें",
            medical_disclaimer: "मेडिकल अस्वीकरण",
        },
    },
    // Lightweight Indian regional language stubs — keys not present fall back to English
    mr: {
        common: { tagline: "गोपनीयता-प्रथम स्मार्ट टॅग्ज. भारतासाठी विनामूल्य.", sign_in: "साइन इन", sign_up: "साइन अप", dashboard: "डॅशबोर्ड", scan_if_found: "सापडल्यास स्कॅन करा", made_in_india: "मेड इन इंडिया" },
        finder: { header: "नमस्कार, कोणीतरी हा टॅग स्कॅन केला आहे.", owner_says: "मालकाचा संदेश", wrong_parking: "वाहन चुकीच्या जागी आहे", headlight_on: "हेडलाइट चालू आहे", found_share_location: "हे मला सापडले — माझे लोकेशन शेअर करा", send_message: "संदेश पाठवा", send: "पाठवा" },
    },
    bn: {
        common: { tagline: "গোপনীয়তা-প্রথম স্মার্ট ট্যাগ। ভারতের জন্য বিনামূল্যে।", sign_in: "সাইন ইন", sign_up: "সাইন আপ", dashboard: "ড্যাশবোর্ড", scan_if_found: "খুঁজে পেলে স্ক্যান করুন", made_in_india: "মেড ইন ইন্ডিয়া" },
        finder: { header: "নমস্কার, কেউ এই ট্যাগ স্ক্যান করেছেন।", owner_says: "মালিকের বার্তা", wrong_parking: "গাড়ি ভুল জায়গায়", headlight_on: "হেডলাইট জ্বলছে", found_share_location: "এটা আমি পেয়েছি — লোকেশন শেয়ার", send_message: "বার্তা পাঠান", send: "পাঠান" },
    },
    ta: {
        common: { tagline: "தனியுரிமை-முதன்மை ஸ்மார்ட் டேக். இந்தியாவுக்கு இலவசம்.", sign_in: "உள் நுழை", sign_up: "பதிவு செய்", dashboard: "டாஷ்போர்டு", scan_if_found: "கிடைத்தால் ஸ்கேன் செய்க", made_in_india: "மேட் இன் இந்தியா" },
        finder: { header: "வணக்கம், இதை யாரோ ஸ்கேன் செய்துள்ளனர்.", owner_says: "உரிமையாளரின் செய்தி", wrong_parking: "வாகனம் தவறான இடத்தில்", headlight_on: "ஹெட்லைட் இயங்குகிறது", found_share_location: "என்னிடம் கிடைத்தது — இடம் பகிர்", send_message: "செய்தி அனுப்பு", send: "அனுப்பு" },
    },
};

const LANGS = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "mr", label: "मराठी" },
    { code: "bn", label: "বাংলা" },
    { code: "ta", label: "தமிழ்" },
];

function get(obj, dotted) {
    return dotted.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
    const stored = typeof window !== "undefined" ? localStorage.getItem("tagit_lang") : null;
    const [lang, setLang] = useState(stored || "en");

    useEffect(() => {
        try {
            localStorage.setItem("tagit_lang", lang);
            document.documentElement.lang = lang;
        } catch (err) {
            // localStorage may be unavailable (Safari private mode, SSR). Locale still
            // works in-memory — just won't survive a reload.
            console.warn("Locale persist skipped:", err?.message || err);
        }
    }, [lang]);

    const value = useMemo(() => {
        const t = (key) => {
            const v = get(dict[lang] || {}, key);
            if (v != null) return v;
            return get(dict.en, key) ?? key;
        };
        return { lang, setLang, t, langs: LANGS };
    }, [lang]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
    return ctx;
}
