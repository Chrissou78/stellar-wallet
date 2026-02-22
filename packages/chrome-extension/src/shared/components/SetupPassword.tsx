import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/auth";
import { ShieldCheck, Eye, EyeOff, Check, X } from "lucide-react";

export default function SetupPassword() {
  const { t } = useTranslation();
  const { setPassword } = useAuthStore();
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const requirements = [
    { met: password1.length >= 8, label: t("password.min8", "At least 8 characters") },
    { met: /[A-Z]/.test(password1), label: t("password.uppercase", "One uppercase letter") },
    { met: /[0-9]/.test(password1), label: t("password.number", "One number") },
  ];
  const allMet = requirements.every((r) => r.met);

  const handleNext = () => {
    if (!allMet) { setError(t("password.requirements", "Meet all requirements")); return; }
    setError("");
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (password2 !== password1) { setError(t("password.mismatch", "Passwords do not match")); setPassword2(""); return; }
    setPassword(password1);
  };

  return (
    <div className="w-[380px] h-[600px] bg-stellar-bg flex items-center justify-center">
      <div className="w-full px-5">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-stellar-blue/15 flex items-center justify-center">
            <ShieldCheck size={28} className="text-stellar-blue" />
          </div>
        </div>

        <h1 className="text-lg font-bold text-white text-center mb-1">
          {step === "create" ? t("password.createTitle", "Create Password") : t("password.confirmTitle", "Confirm Password")}
        </h1>
        <p className="text-stellar-muted text-center text-xs mb-6">
          {step === "create"
            ? t("password.createDesc", "This password protects your wallet.")
            : t("password.confirmDesc", "Enter again to confirm.")}
        </p>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={step === "create" ? password1 : password2}
              onChange={(e) => { step === "create" ? setPassword1(e.target.value) : setPassword2(e.target.value); setError(""); }}
              placeholder={step === "create" ? "Create password" : "Confirm password"}
              autoFocus
              className="w-full px-3 py-3 rounded-xl bg-stellar-card border border-stellar-border text-white text-center text-sm tracking-widest placeholder:text-stellar-muted placeholder:tracking-normal placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-stellar-blue/30"
              onKeyDown={(e) => { if (e.key === "Enter") step === "create" ? handleNext() : handleConfirm(); }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stellar-muted hover:text-white"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {step === "create" && password1.length > 0 && (
            <div className="space-y-1.5">
              {requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {req.met ? <Check size={12} className="text-green-400" /> : <X size={12} className="text-stellar-muted" />}
                  <span className={`text-[10px] ${req.met ? "text-green-400" : "text-stellar-muted"}`}>{req.label}</span>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            onClick={step === "create" ? handleNext : handleConfirm}
            className="w-full py-3 rounded-xl bg-stellar-blue hover:bg-stellar-blue/90 text-white text-sm font-semibold transition-all"
          >
            {step === "create" ? t("common.next", "Next") : t("common.confirm", "Confirm")}
          </button>

          {step === "confirm" && (
            <button
              onClick={() => { setStep("create"); setPassword2(""); setError(""); }}
              className="w-full text-center text-stellar-muted text-xs hover:text-white"
            >
              ← {t("common.back", "Back")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
