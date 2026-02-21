import { useState } from "react";
import { useWalletStore } from "../store/wallet";
import { useNavigate } from "react-router-dom";
import PinModal from "../components/PinModal";
import { toast } from "sonner";
import { Copy, Check, LogOut, Eye, EyeOff, Shield } from "lucide-react";

export default function SettingsPage() {
  const accounts = useWalletStore((s) => s.accounts);
  const activeAccountId = useWalletStore((s) => s.activeAccountId);
  const network = useWalletStore((s) => s.network);
  const isUnlocked = useWalletStore((s) => s.isUnlocked);
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
    toast.success("Secret key copied to clipboard");
    setTimeout(() => setCopiedSk(false), 2000);
  };

  const handleReveal = () => {
    // Always require PIN, even if previously unlocked
    setShowPin(true);
  };

  const handleHide = () => {
    setRevealedKey(null);
    setCopiedSk(false);
  };

  const handleLogout = () => {
    if (confirm("Are you sure? This will remove ALL wallets and local data.")) {
      logout();
      navigate("/");
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Account Info */}
      <div className="bg-stellar-card border border-stellar-border rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-stellar-muted uppercase tracking-wider">
          Account
        </h2>

        {active && (
          <div>
            <label className="block text-sm text-stellar-muted mb-1">Wallet Name</label>
            <p className="text-sm text-white">{active.name}</p>
          </div>
        )}

        <div>
          <label className="block text-sm text-stellar-muted mb-1">Public Key</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-stellar-dark border border-stellar-border text-xs text-white break-all">
              {publicKey}
            </code>
            <button
              onClick={handleCopyPublicKey}
              className="p-2 rounded-lg border border-stellar-border hover:bg-white/5 shrink-0"
              title="Copy public key"
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
          <label className="block text-sm text-stellar-muted mb-1">Network</label>
          <p className="text-sm text-white capitalize">{network}</p>
        </div>
      </div>

      {/* Security */}
      <div className="bg-stellar-card border border-stellar-border rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-stellar-muted uppercase tracking-wider">
          Security
        </h2>

        {/* Reveal / Hide secret key */}
        {!revealedKey ? (
          <button
            onClick={handleReveal}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-lg border border-stellar-border text-stellar-muted hover:text-white hover:bg-white/5 transition-colors text-sm"
          >
            <Eye size={16} />
            Reveal Secret Key
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-stellar-danger/10 border border-stellar-danger/30 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-stellar-danger" />
                <p className="text-xs text-stellar-danger font-semibold">
                  Never share your secret key with anyone!
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-white break-all select-all">
                  {revealedKey}
                </code>
                <button
                  onClick={handleCopySecretKey}
                  className="p-2 rounded-lg border border-stellar-danger/30 hover:bg-stellar-danger/20 transition-colors shrink-0"
                  title="Copy secret key"
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
              Hide Secret Key
            </button>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-3 rounded-lg border border-stellar-danger/30 text-stellar-danger hover:bg-stellar-danger/10 transition-colors text-sm"
        >
          <LogOut size={16} />
          Logout &amp; Clear All Wallets
        </button>
      </div>

      {/* PIN Modal — always required for reveal */}
      {showPin && (
        <PinModal
          title="Enter PIN to Reveal Secret Key"
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
