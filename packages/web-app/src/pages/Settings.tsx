import LanguageSwitcher from "../components/LanguageSwitcher";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useWalletStore } from "../store/wallet";
import { useNavigate } from "react-router-dom";
import PinModal from "../components/PinModal";
import { toast } from "sonner";
import { Copy, Check, LogOut, Eye, EyeOff, Shield } from "lucide-react";
import NetworkSwitcher from "../components/NetworkSwitcher";

export default function SettingsPage() {
  const { t } = useTranslation();
  const accounts = useWalletStore((s) => s.accounts);
  const activeAccountId = useWalletStore((s) => s.activeAccountId);
  const network = useWalletStore((s) => s.network);
  const getSecretKey = useWalletStore((s) => s.getSecretKey);
  const unlock = useWalletStore((s) => s.unlock);
  const logout = useWalletStore((s) => s.logout);
  const navigate = useNavigate();

  const active = accounts.find((a) => a.id === activeAccountId);
  const publicKey = active?.publicKey || "";

  const [copiedPk, setCopiedPk] = useState(false);
  const [copiedSk, setCopiedSk] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const handleCopyPublicKey = () => {
    navigator.clipboard.writeText(publicKey);
    setCopiedPk(true);
    setTimeout(() => setCopiedPk(false), 2000);
  };

  const handleCopySecretKey = () => {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey);
    setCopiedSk(true);
    toast.success(t("common.copied"));
    setTimeout(() => setCopiedSk(false), 2000);
  };

  const handleReveal = () => {
    setShowPin(true);
  };

  const handleHide = () => {
    setRevealedKey(null);
    setCopiedSk(false);
  };

  const handleLogout = () => {
    if (confirm(t("settings.logoutConfirm"))) {
      logout();
      navigate("/");
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-white">{t("settings.title")}</h1>

      {/* Account Info */}
      <div className="bg-stellar-card border border-stellar-border rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-stellar-muted uppercase tracking-wider">
          {t("settings.account", "Account")}
        </h2>

        {active && (
          <div>
            <label className="block text-sm text-stellar-muted mb-3">
              {t("settings.network", "Network")}
            </label>
            <NetworkSwitcher />
          </div>
        )}

        <div>
          <label className="block text-sm text-stellar-muted mb-1">
            {t("settings.publicKey", "Public Key")}
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-stellar-dark border border-stellar-border text-xs text-white break-all">
              {publicKey}
            </code>
            <button
              onClick={handleCopyPublicKey}
              className="p-2 rounded-lg border border-stellar-border hover:bg-white/5 shrink-0"
              title={t("common.copy")}
            >
              {copiedPk ? (
                <Check size={16} className="text-stellar-success" />
              ) : (
                <Copy size={16} className="text-stellar-muted" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-stellar-muted mb-1">
            {t("settings.network")}
          </label>
          <p className="text-sm text-white capitalize">{t(`settings.${network}`)}</p>
        </div>
      </div>

      {/* Language */}
      <div className="bg-stellar-card border border-stellar-border rounded-2xl p-6">
        <LanguageSwitcher />
      </div>

      {/* Security */}
      <div className="bg-stellar-card border border-stellar-border rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-stellar-muted uppercase tracking-wider">
          {t("settings.security", "Security")}
        </h2>

        {!revealedKey ? (
          <button
            onClick={handleReveal}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-lg border border-stellar-border text-stellar-muted hover:text-white hover:bg-white/5 transition-colors text-sm"
          >
            <Eye size={16} />
            {t("settings.revealSecret")}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-stellar-danger/10 border border-stellar-danger/30 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-stellar-danger" />
                <p className="text-xs text-stellar-danger font-semibold">
                  {t("settings.secretWarning")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-white break-all select-all">
                  {revealedKey}
                </code>
                <button
                  onClick={handleCopySecretKey}
                  className="p-2 rounded-lg border border-stellar-danger/30 hover:bg-stellar-danger/20 transition-colors shrink-0"
                  title={t("common.copy")}
                >
                  {copiedSk ? (
                    <Check size={14} className="text-stellar-success" />
                  ) : (
                    <Copy size={14} className="text-stellar-danger" />
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={handleHide}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-lg border border-stellar-border text-stellar-muted hover:text-white hover:bg-white/5 transition-colors text-sm"
            >
              <EyeOff size={16} />
              {t("settings.hideSecret", "Hide Secret Key")}
            </button>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-3 rounded-lg border border-stellar-danger/30 text-stellar-danger hover:bg-stellar-danger/10 transition-colors text-sm"
        >
          <LogOut size={16} />
          {t("settings.logout")}
        </button>
      </div>

      {/* PIN Modal */}
      {showPin && (
        <PinModal
          title={t("settings.enterPinToReveal")}
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
