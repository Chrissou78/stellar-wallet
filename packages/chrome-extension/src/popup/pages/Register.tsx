import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../shared/store/auth";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const rules = [
    { key: "rule8chars", ok: password.length >= 8 },
    { key: "ruleUppercase", ok: /[A-Z]/.test(password) },
    { key: "ruleNumber", ok: /\d/.test(password) },
    { key: "ruleMatch", ok: password.length > 0 && password === confirmPw },
  ];
  const allValid = rules.every((r) => r.ok);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error(t("auth.fillAllFields"));
    if (!allValid) return toast.error(t("auth.fixPasswordReqs"));
    setLoading(true);
    try {
      await register({ email, password, firstName: firstName || undefined, lastName: lastName || undefined });
      toast.success(t("auth.accountCreated"));
      navigate("/onboarding");
    } catch (err: any) {
      toast.error(err.message || t("auth.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-[380px] bg-stellar-bg p-5 overflow-y-auto">
      <h1 className="text-lg font-bold text-white mb-1">{t("auth.createAccount")}</h1>
      <p className="text-xs text-stellar-muted mb-4">{t("auth.createSubtitle")}</p>

      <form onSubmit={handleSubmit} className="space-y-2.5 flex-1">
        <div className="grid grid-cols-2 gap-2">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t("auth.firstNamePlaceholder")}
            className="px-3 py-2 rounded-lg bg-stellar-card border border-stellar-border text-white text-sm placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t("auth.lastNamePlaceholder")}
            className="px-3 py-2 rounded-lg bg-stellar-card border border-stellar-border text-white text-sm placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
          />
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.emailPlaceholder")}
          className="w-full px-3 py-2 rounded-lg bg-stellar-card border border-stellar-border text-white text-sm placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
        />
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.createPassword")}
            className="w-full px-3 py-2 pr-10 rounded-lg bg-stellar-card border border-stellar-border text-white text-sm placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stellar-muted">
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <input
          type="password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder={t("auth.confirmPassword")}
          className="w-full px-3 py-2 rounded-lg bg-stellar-card border border-stellar-border text-white text-sm placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
        />

        {/* Password rules */}
        <div className="space-y-1">
          {rules.map((r) => (
            <div key={r.key} className="flex items-center gap-1.5 text-[10px]">
              {r.ok ? <Check size={10} className="text-green-400" /> : <X size={10} className="text-stellar-muted" />}
              <span className={r.ok ? "text-green-400" : "text-stellar-muted"}>{t(`auth.${r.key}`)}</span>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || !allValid}
          className="w-full py-2.5 rounded-xl bg-stellar-blue text-white text-sm font-medium hover:bg-stellar-purple transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> {t("auth.creatingAccount")}
            </span>
          ) : (
            t("auth.createAccount")
          )}
        </button>
      </form>

      <p className="text-xs text-stellar-muted mt-3 text-center">
        {t("auth.hasAccount")}{" "}
        <button onClick={() => navigate("/login")} className="text-stellar-blue hover:underline">
          {t("auth.signInLink")}
        </button>
      </p>
    </div>
  );
}
