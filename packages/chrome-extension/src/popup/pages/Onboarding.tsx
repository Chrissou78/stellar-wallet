import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useWalletStore } from "../../shared/store/wallet";

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createWallet, importWallet, accounts } = useWalletStore();

  const action = searchParams.get("action");
  const hasExistingAccounts = accounts.length > 0;

  const [mode, setMode] = useState<"choose" | "create" | "import">("choose");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-select mode from URL param
  useEffect(() => {
    if (action === "create") setMode("create");
    else if (action === "import") setMode("import");
  }, [action]);

  const handleCreate = async () => {
    if (!name || pin.length < 6) {
      setError(t("onboarding.pinMin", "PIN must be at least 6 characters"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createWallet(name, pin);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!name || pin.length < 6 || !secret.trim()) {
      setError(t("onboarding.fillAll", "Please fill all fields"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await importWallet(name, secret.trim(), pin);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (hasExistingAccounts) {
      navigate("/dashboard");
    } else {
      setMode("choose");
      setError("");
    }
  };

  if (mode === "choose") {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] w-[380px] bg-stellar-bg p-6 gap-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-stellar-blue to-stellar-purple" />
        <h1 className="text-xl font-bold text-white">Stellar Wallet</h1>
        <p className="text-sm text-stellar-muted text-center">
          {t("onboarding.subtitle", "Your gateway to the Stellar network")}
        </p>
        <div className="w-full space-y-3 mt-4">
          <button
            onClick={() => setMode("create")}
            className="w-full py-3 rounded-xl bg-stellar-blue text-white font-medium hover:bg-stellar-purple transition-colors"
          >
            {t("onboarding.createWallet", "Create New Wallet")}
          </button>
          <button
            onClick={() => setMode("import")}
            className="w-full py-3 rounded-xl border border-stellar-border text-white hover:bg-white/5 transition-colors"
          >
            {t("onboarding.importWallet", "Import Wallet")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] w-[380px] bg-stellar-bg p-6">
      <button
        onClick={goBack}
        className="text-stellar-muted text-sm mb-4 hover:text-white self-start"
      >
        ← {hasExistingAccounts ? t("common.backToDashboard", "Back to Dashboard") : t("common.back", "Back")}
      </button>

      <h2 className="text-lg font-bold text-white mb-2">
        {mode === "create"
          ? t("onboarding.createWallet", "Create New Wallet")
          : t("onboarding.importWallet", "Import Wallet")}
      </h2>

      {hasExistingAccounts && (
        <p className="text-xs text-stellar-muted mb-4">
          {t("accounts.addingNew", "Adding a new wallet to your account")} ({accounts.length} {t("accounts.existing", "existing")})
        </p>
      )}

      <div className="space-y-3 flex-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("onboarding.walletName", "Wallet name")}
          className="w-full px-4 py-3 rounded-lg bg-stellar-card border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue text-sm"
        />
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder={t("onboarding.enterPin", "PIN (min 6 characters)")}
          className="w-full px-4 py-3 rounded-lg bg-stellar-card border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue text-sm"
        />
        {mode === "import" && (
          <textarea
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={t("onboarding.secretKey", "Secret key (S...)")}
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-stellar-card border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue resize-none text-sm"
          />
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <button
        onClick={mode === "create" ? handleCreate : handleImport}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-stellar-blue text-white font-medium hover:bg-stellar-purple transition-colors disabled:opacity-50 mt-4"
      >
        {loading
          ? "..."
          : mode === "create"
            ? t("onboarding.create", "Create")
            : t("onboarding.import", "Import")}
      </button>
    </div>
  );
}
