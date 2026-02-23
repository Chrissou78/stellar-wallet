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
  const [confirmPin, setConfirmPin] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (action === "create") setMode("create");
    else if (action === "import") setMode("import");
  }, [action]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError(t("common.fillAllFields"));
      return;
    }
    if (pin.length < 6) {
      setError(t("onboarding.pinMinLength"));
      return;
    }
    if (pin !== confirmPin) {
      setError(t("onboarding.pinMismatch"));
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
    if (!name.trim() || !secret.trim()) {
      setError(t("common.fillAllFields"));
      return;
    }
    if (pin.length < 6) {
      setError(t("onboarding.pinMinLength"));
      return;
    }
    if (pin !== confirmPin) {
      setError(t("onboarding.pinMismatch"));
      return;
    }
    if (!secret.startsWith("S") || secret.length !== 56) {
      setError(t("onboarding.secretKeyInvalid"));
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
      setPin("");
      setConfirmPin("");
      setName("");
      setSecret("");
    }
  };

  if (mode === "choose") {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] w-[380px] bg-stellar-bg p-6 gap-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-stellar-blue to-stellar-purple" />
        <h1 className="text-xl font-bold text-white">{t("onboarding.title")}</h1>
        <p className="text-sm text-stellar-muted text-center">
          {hasExistingAccounts
            ? t("onboarding.subtitleAdd")
            : t("onboarding.subtitle")}
        </p>
        {hasExistingAccounts && (
          <p className="text-xs text-stellar-blue">
            {t("onboarding.youHaveWallets", { count: accounts.length })}
          </p>
        )}
        <div className="w-full space-y-3 mt-4">
          <button
            onClick={() => setMode("create")}
            className="w-full py-3 rounded-xl bg-stellar-blue text-white font-medium hover:bg-stellar-purple transition-colors"
          >
            {t("onboarding.createWallet")}
          </button>
          <button
            onClick={() => setMode("import")}
            className="w-full py-3 rounded-xl border border-stellar-border text-white hover:bg-white/5 transition-colors"
          >
            {t("onboarding.importWallet")}
          </button>
        </div>
        {hasExistingAccounts && (
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs text-stellar-muted hover:text-white"
          >
            {t("onboarding.cancelBack")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] w-[380px] bg-stellar-bg p-6">
      <button
        onClick={goBack}
        className="text-stellar-muted text-sm mb-4 hover:text-white self-start"
      >
        ← {t("common.back")}
      </button>

      <h2 className="text-lg font-bold text-white mb-1">
        {mode === "create"
          ? t("onboarding.createWallet")
          : t("onboarding.importWallet")}
      </h2>

      <p className="text-xs text-stellar-muted mb-4">
        {hasExistingAccounts
          ? t("onboarding.createDescriptionAdd")
          : t("onboarding.createDescription")}
      </p>

      <div className="space-y-3 flex-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            mode === "create"
              ? t("onboarding.walletNamePlaceholder")
              : t("onboarding.walletNameImportPlaceholder")
          }
          className="w-full px-4 py-3 rounded-lg bg-stellar-card border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue text-sm"
        />

        {mode === "import" && (
          <textarea
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={t("onboarding.secretKey")}
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-stellar-card border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue resize-none text-sm font-mono"
          />
        )}

        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder={t("onboarding.enterPin")}
          className="w-full px-4 py-3 rounded-lg bg-stellar-card border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue text-sm"
        />
        <input
          type="password"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
          placeholder={t("onboarding.confirmPin")}
          className="w-full px-4 py-3 rounded-lg bg-stellar-card border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue text-sm"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <p className="text-[10px] text-stellar-muted leading-relaxed">
          {t("onboarding.keysDisclaimer")}
        </p>
      </div>

      <button
        onClick={mode === "create" ? handleCreate : handleImport}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-stellar-blue text-white font-medium hover:bg-stellar-purple transition-colors disabled:opacity-50 mt-4"
      >
        {loading
          ? mode === "create"
            ? t("onboarding.creating")
            : t("onboarding.importing")
          : mode === "create"
            ? t("onboarding.createWallet")
            : t("onboarding.importWallet")}
      </button>
    </div>
  );
}