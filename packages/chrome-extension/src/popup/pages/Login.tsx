import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../shared/store/auth";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error(t("auth.fillAllFields"));
    setLoading(true);
    try {
      await login(email, password);
      toast.success(t("auth.welcomeMessage"));
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[600px] w-[380px] bg-stellar-bg p-6">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-stellar-blue to-stellar-purple mb-4" />
      <h1 className="text-lg font-bold text-white mb-1">{t("auth.welcomeBack")}</h1>
      <p className="text-xs text-stellar-muted mb-6">{t("auth.signInSubtitle")}</p>

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.emailPlaceholder")}
          className="w-full px-3 py-2.5 rounded-lg bg-stellar-card border border-stellar-border text-white text-sm placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
        />
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.passwordPlaceholder")}
            className="w-full px-3 py-2.5 pr-10 rounded-lg bg-stellar-card border border-stellar-border text-white text-sm placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stellar-muted"
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-stellar-blue text-white text-sm font-medium hover:bg-stellar-purple transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> {t("auth.signingIn")}
            </span>
          ) : (
            t("auth.signIn")
          )}
        </button>
      </form>

      <p className="text-xs text-stellar-muted mt-4">
        {t("auth.noAccount")}{" "}
        <button
          onClick={() => navigate("/register")}
          className="text-stellar-blue hover:underline"
        >
          {t("auth.createOne")}
        </button>
      </p>
    </div>
  );
}
