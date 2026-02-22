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
    } else if (blocked) {
      setBlocked(false);
    }
  }, [countdown, blocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked) return;
    if (!password) { setError(t("lock.enterPassword", "Enter your password")); return; }

    if (verifyPassword(password)) {
      unlock();
      setPassword("");
      setAttempts(0);
    } else {
      const n = attempts + 1;
      setAttempts(n);
      setError(t("lock.wrongPassword", "Wrong password"));
      setPassword("");
      if (n >= 5) {
        setBlocked(true);
        setCountdown(30);
        setError(t("lock.tooManyAttempts", "Too many attempts. Wait 30 seconds."));
      }
    }
  };

  return (
    <div className="w-[380px] h-[600px] bg-stellar-bg flex items-center justify-center">
      <div className="w-full px-5">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-stellar-blue/15 flex items-center justify-center">
            <Lock size={28} className="text-stellar-blue" />
          </div>
        </div>

        <h1 className="text-lg font-bold text-white text-center mb-1">
          {t("lock.title", "Wallet Locked")}
        </h1>
        <p className="text-stellar-muted text-center text-xs mb-6">
          {t("lock.subtitle", "Enter your password to unlock")}
        </p>

        <form onSubmit={handleUnlock} className="space-y-3">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder={t("lock.password", "Password")}
              disabled={blocked}
              autoFocus
              className={`w-full px-3 py-3 rounded-xl bg-stellar-card border text-white text-center text-sm tracking-widest placeholder:text-stellar-muted placeholder:tracking-normal placeholder:text-xs focus:outline-none focus:ring-2 transition-all ${
                error ? "border-red-500/50 focus:ring-red-500/30" : "border-stellar-border focus:ring-stellar-blue/30"
              } ${blocked ? "opacity-50" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stellar-muted hover:text-white"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5">
              <ShieldAlert size={12} className="text-red-400" />
              <p className="text-red-400 text-xs">{error}</p>
              {blocked && countdown > 0 && <span className="text-red-400 text-xs font-mono">({countdown}s)</span>}
            </div>
          )}

          <button
            type="submit"
            disabled={blocked}
            className={`w-full py-3 rounded-xl text-white text-sm font-semibold transition-all ${
              blocked ? "bg-stellar-muted/30 cursor-not-allowed" : "bg-stellar-blue hover:bg-stellar-blue/90"
            }`}
          >
            {t("lock.unlock", "Unlock")}
          </button>
        </form>

        {attempts > 0 && attempts < 5 && (
          <p className="text-stellar-muted text-[10px] text-center mt-3">
            {5 - attempts} {t("lock.attemptsLeft", "attempts remaining")}
          </p>
        )}
      </div>
    </div>
  );
}
