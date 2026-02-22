import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/auth";
import { Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";

export default function LockScreen() {
  const { t } = useTranslation();
  const { verifyPassword, unlock } = useAuthStore();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (blocked && countdown === 0) {
      setBlocked(false);
    }
  }, [countdown, blocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked) return;
    if (!password) {
      setError(t("lock.enterPassword", "Enter your password"));
      return;
    }

    if (verifyPassword(password)) {
      unlock();
      setPassword("");
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(t("lock.wrongPassword", "Wrong password"));
      setPassword("");

      if (newAttempts >= 5) {
        setBlocked(true);
        setCountdown(30);
        setError(t("lock.tooManyAttempts", "Too many attempts. Wait 30 seconds."));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-stellar-bg flex items-center justify-center z-[9999]">
      <div className="w-full max-w-sm px-6">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-stellar-blue/15 flex items-center justify-center">
            <Lock size={36} className="text-stellar-blue" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">
          {t("lock.title", "Wallet Locked")}
        </h1>
        <p className="text-stellar-muted text-center text-sm mb-8">
          {t("lock.subtitle", "Enter your password to unlock")}
        </p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder={t("lock.password", "Password")}
              disabled={blocked}
              autoFocus
              className={`w-full px-4 py-4 rounded-xl bg-stellar-card border text-white text-center text-lg tracking-widest placeholder:text-stellar-muted focus:outline-none focus:ring-2 transition-all ${
                error
                  ? "border-red-500/50 focus:ring-red-500/30"
                  : "border-stellar-border focus:ring-stellar-blue/30 focus:border-stellar-blue/50"
              } ${blocked ? "opacity-50 cursor-not-allowed" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stellar-muted hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2">
              <ShieldAlert size={14} className="text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
              {blocked && countdown > 0 && (
                <span className="text-red-400 text-sm font-mono">({countdown}s)</span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={blocked}
            className={`w-full py-4 rounded-xl text-white text-base font-semibold transition-all ${
              blocked
                ? "bg-stellar-muted/30 cursor-not-allowed"
                : "bg-stellar-blue hover:bg-stellar-blue/90"
            }`}
          >
            {t("lock.unlock", "Unlock")}
          </button>
        </form>

        {attempts > 0 && attempts < 5 && (
          <p className="text-stellar-muted text-xs text-center mt-4">
            {5 - attempts} {t("lock.attemptsLeft", "attempts remaining")}
          </p>
        )}
      </div>
    </div>
  );
}
