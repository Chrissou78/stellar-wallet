import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "../shared/i18n/locales/en.json";
import fr from "../shared/i18n/locales/fr.json";
import es from "../shared/i18n/locales/es.json";
import pt from "../shared/i18n/locales/pt.json";
import ar from "../shared/i18n/locales/ar.json";
import zh from "../shared/i18n/locales/zh.json";
import sw from "../shared/i18n/locales/sw.json";
import af from "../shared/i18n/locales/af.json";
import zu from "../shared/i18n/locales/zu.json";
import xh from "../shared/i18n/locales/xh.json";
import st from "../shared/i18n/locales/st.json";
import tn from "../shared/i18n/locales/tn.json";

const supportedLngs = ["en", "fr", "es", "pt", "ar", "zh", "sw", "af", "zu", "xh", "st", "tn"];

// Get device language, strip region (e.g., "fr-FR" → "fr")
const deviceLang = Localization.getLocales()?.[0]?.languageCode || "en";
const defaultLng = supportedLngs.includes(deviceLang) ? deviceLang : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
    pt: { translation: pt },
    ar: { translation: ar },
    zh: { translation: zh },
    sw: { translation: sw },
    af: { translation: af },
    zu: { translation: zu },
    xh: { translation: xh },
    st: { translation: st },
    tn: { translation: tn },
  },
  lng: defaultLng,
  fallbackLng: "en",
  supportedLngs,
  interpolation: { escapeValue: false },
});

export default i18n;
