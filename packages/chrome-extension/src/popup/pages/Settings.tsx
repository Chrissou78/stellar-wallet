import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useWalletStore } from "../../shared/store/wallet";
import LanguageSwitcher from "../../shared/components/LanguageSwitcher";
import NetworkSwitcher from "../../shared/components/NetworkSwitcher";
import PinModal from "../../shared/components/PinModal";
import { toast } from "sonner";
import {
  Copy, Check, LogOut, Eye, EyeOff, Shield, Globe, User,
} from "lucide-react";

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const accounts = useWalletStore((s) => s.accounts);
  const activeAccountId = useWalletStore((s) => s.activeAccountId);
  const getSecretKey = useWalletStore((s) => s.getSecretKey);
  const unlock = useWalletStore((s) => s.unlock);
  const logout = useWalletStore((s) => s.logout);

  const active = accounts.find((a) => a.id === activeAccountId);
  const publicKey = active?.publicKey || "";

  const [copiedPk, setCopiedPk] = useState(false);
  const [copiedSk, setCopiedSk] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showLang, setShowLang] = useState(false);

  const copyPublicKey = () => {
    navigator.clipboard.writeText(publicKey);
    setCopiedPk(true);
    toast.success(t("common.copied", "Copied!"));
    setTimeout(() => setCopiedPk(false), 2000);
  };

  const copySecretKey = () => {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey);
    setCopiedSk(true);
    toast.success(t("common.copied", "Copied!"));
    setTimeout(() => setCopiedSk(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate("/onboarding");
  };

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full">
      {/* Account Info */}
      <div className="bg-stellar-card border border-stellar-border rounded-xl p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <User size={14} className="text-stellar-muted" />
          <h3 className="text-xs font-semibold text-stellar-muted uppercase tracking-wider">
            {t("settings.account", "Account")}
          </h3>
        </div>

        {active && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-stellar-muted">{t("onboarding.walletName", "Name")}</span>
            <span className="text-xs text-white font-medium">{active.name}</span>
          </div>
        )}

        {/* Network Switcher */}
        <div>
          <label className="block text-[10px] text-stellar-muted mb-2">
            {t("settings.network", "Network")}
          </label>
          <NetworkSwitcher />
        </div>

        {/* Public Key */}
        <div>
          <label className="block text-[10px] text-stellar-muted mb-1">
            {t("settings.publicKey", "Public Key")}
          </label>
          <div
            onClick={copyPublicKey}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-stellar-bg border border-stellar-border cursor-pointer hover:border-stellar-blue/50 transition-colors"
          >
            <code className="flex-1 text-[10px] text-white font-mono truncate">
              {publicKey}
            </code>
            {copiedPk ? (
              <Check size={12} className="text-green-400 shrink-0" />
            ) : (
              <Copy size={12} className="text-stellar-muted shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-stellar-card border border-stellar-border rounded-xl p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-stellar-muted" />
          <h3 className="text-xs font-semibold text-stellar-muted uppercase tracking-wider">
            {t("settings.security", "Security")}
          </h3>
        </div>

        {!revealedKey ? (
          <button
            onClick={() => setShowPin(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-stellar-border text-stellar-muted hover:text-white hover:bg-white/5 transition-colors text-xs"
          >
            <Eye size={14} />
            {t("settings.revealSecret", "Reveal Secret Key")}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg space-y-2">
              <p className="text-[10px] text-red-400 font-semibold flex items-center gap-1">
                <Shield size={10} />
                {t("settings.secretWarning", "Never share your secret key!")}
              </p>
              <div className="flex items-center gap-1.5">
                <code className="flex-1 text-[10px] text-white break-all select-all font-mono leading-relaxed">
                  {revealedKey}
                </code>
                <button
                  onClick={copySecretKey}
                  className="p-1.5 rounded border border-red-500/30 hover:bg-red-500/20 transition-colors shrink-0"
                >
                  {copiedSk ? (
                    <Check size={12} className="text-green-400" />
                  ) : (
                    <Copy size={12} className="text-red-400" />
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={() => { setRevealedKey(null); setCopiedSk(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-stellar-border text-stellar-muted hover:text-white hover:bg-white/5 transition-colors text-xs"
            >
              <EyeOff size={14} />
              {t("settings.hideSecret", "Hide Secret Key")}
            </button>
          </div>
        )}
      </div>

      {/* Language */}
      <div className="bg-stellar-card border border-stellar-border rounded-xl p-3 space-y-2.5">
        <button
          onClick={() => setShowLang(!showLang)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-stellar-muted" />
            <h3 className="text-xs font-semibold text-stellar-muted uppercase tracking-wider">
              {t("settings.language", "Language")}
            </h3>
          </div>
          <span className="text-[10px] text-stellar-blue">
            {showLang ? t("common.hide", "Hide") : t("common.change", "Change")}
          </span>
        </button>
        {showLang && <LanguageSwitcher />}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-medium"
      >
        <LogOut size={14} />
        {t("settings.logout", "Logout")}
      </button>

      {/* PIN Modal */}
      {showPin && (
        <PinModal
          title={t("settings.enterPinToReveal", "Enter PIN to reveal secret key")}
          onSubmit={async (pin) => {
            await unlock(pin);
            const sk = getSecretKey();
            setRevealedKey(sk);
            setShowPin(false);
          }}
          onCancel={() => setShowPin(false)}
        />
      )}
    </div>
  );
}
