import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import ar from "./locales/ar.json";
import zh from "./locales/zh.json";
import af from "./locales/af.json";
import zu from "./locales/zu.json";
import xh from "./locales/xh.json";
import st from "./locales/st.json";
import tn from "./locales/tn.json";
import nso from "./locales/nso.json";
import ts from "./locales/ts.json";
import ss from "./locales/ss.json";
import ve from "./locales/ve.json";
import nr from "./locales/nr.json";
import pt from "./locales/pt.json";
import sn from "./locales/sn.json";
import sw from "./locales/sw.json";

export const supportedLanguages = [
  // International
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Português", flag: "🇲🇿" },
  { code: "ar", name: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "sw", name: "Kiswahili", flag: "🇹🇿" },
  // South Africa official languages
  { code: "af", name: "Afrikaans", flag: "🇿🇦" },
  { code: "zu", name: "isiZulu", flag: "🇿🇦" },
  { code: "xh", name: "isiXhosa", flag: "🇿🇦" },
  { code: "st", name: "Sesotho", flag: "🇱🇸" },
  { code: "tn", name: "Setswana", flag: "🇧🇼" },
  { code: "nso", name: "Sepedi", flag: "🇿🇦" },
  { code: "ts", name: "Xitsonga", flag: "🇿🇦" },
  { code: "ss", name: "siSwati", flag: "🇸🇿" },
  { code: "ve", name: "Tshivenda", flag: "🇿🇦" },
  { code: "nr", name: "isiNdebele", flag: "🇿🇦" },
  // Regional
  { code: "sn", name: "chiShona", flag: "🇿🇼" },
] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
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
      nso: { translation: nso },
      ts: { translation: ts },
      ss: { translation: ss },
      ve: { translation: ve },
      nr: { translation: nr },
      sn: { translation: sn },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "stellar-wallet-lang",
    },
  });

export default i18n;