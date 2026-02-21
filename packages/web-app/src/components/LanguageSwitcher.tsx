import { useTranslation } from "react-i18next";
import { supportedLanguages } from "../i18n";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = supportedLanguages.find((l) => l.code === i18n.language) ||
    supportedLanguages[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    // Set RTL direction for Arabic
    const lang = supportedLanguages.find((l) => l.code === code);
    document.documentElement.dir = "dir" in (lang || {}) ? "rtl" : "ltr";
    document.documentElement.lang = code;
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-stellar-muted mb-2">
        {t("settings.language")}
      </label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-stellar-card border border-stellar-border rounded-xl px-4 py-3 hover:border-stellar-blue/50 transition-colors"
      >
        <span className="flex items-center gap-3">
          <span className="text-xl">{current.flag}</span>
          <span className="text-white">{current.name}</span>
        </span>
        <ChevronDown
          size={18}
          className={`text-stellar-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-stellar-card border border-stellar-border rounded-xl shadow-2xl overflow-hidden">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                lang.code === i18n.language ? "bg-stellar-blue/10" : ""
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-white text-sm">{lang.name}</span>
              {lang.code === i18n.language && (
                <span className="ml-auto text-xs text-stellar-blue">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
