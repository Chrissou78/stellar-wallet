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
    if (!allMet) {
      setError(t("password.requirements", "Please meet all password requirements"));
      return;
    }
    setError("");
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (password2 !== password1) {
      setError(t("password.mismatch", "Passwords do not match"));
      setPassword2("");
      return;
    }
    setPassword(password1);
  };

  return (
    <div className="fixed inset-0 bg-stellar-bg flex items-center justify-center z-[9999]">
      <div className="w-full max-w-sm px-6">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-stellar-blue/15 flex items-center justify-center">
            <ShieldCheck size={36} className="text-stellar-blue" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">
          {step === "create"
            ? t("password.createTitle", "Create App Password")
            : t("password.confirmTitle", "Confirm Password")}
        </h1>
        <p className="text-stellar-muted text-center text-sm mb-8">
          {step === "create"
            ? t("password.createDesc", "This password protects access to your wallet.")
            : t("password.confirmDesc", "Enter your password again to confirm.")}
        </p>

        <div className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={step === "create" ? password1 : password2}
              onChange={(e) => {
                if (step === "create") setPassword1(e.target.value);
                else setPassword2(e.target.value);
                setError("");
              }}
              placeholder={step === "create" ? t("password.create", "Create password") : t("password.confirm", "Confirm password")}
              autoFocus
              className="w-full px-4 py-4 rounded-xl bg-stellar-card border border-stellar-border text-white text-center text-lg tracking-widest placeholder:text-stellar-muted placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-stellar-blue/30 focus:border-stellar-blue/50"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (step === "create") handleNext();
                  else handleConfirm();
                }
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stellar-muted hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Requirements (only on create step) */}
          {step === "create" && password1.length > 0 && (
            <div className="space-y-2">
              {requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2">
                  {req.met ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <X size={14} className="text-stellar-muted" />
                  )}
                  <span className={`text-xs ${req.met ? "text-green-400" : "text-stellar-muted"}`}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={step === "create" ? handleNext : handleConfirm}
            className="w-full py-4 rounded-xl bg-stellar-blue hover:bg-stellar-blue/90 text-white text-base font-semibold transition-all"
          >
            {step === "create" ? t("common.next", "Next") : t("common.confirm", "Confirm")}
          </button>

          {step === "confirm" && (
            <button
              onClick={() => { setStep("create"); setPassword2(""); setError(""); }}
              className="w-full text-center text-stellar-muted text-sm hover:text-white transition-colors"
            >
              ← {t("common.back", "Back")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
