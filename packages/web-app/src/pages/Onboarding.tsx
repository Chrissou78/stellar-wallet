import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useWalletStore } from "../store/wallet";
import { toast } from "sonner";

export default function OnboardingPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const actionParam = searchParams.get("action");

  const [mode, setMode] = useState<"choice" | "create" | "import">("choice");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [loading, setLoading] = useState(false);

  const accounts = useWalletStore((s) => s.accounts);
  const createWallet = useWalletStore((s) => s.createWallet);
  const importWallet = useWalletStore((s) => s.importWallet);
  const navigate = useNavigate();

  const isAddingToExisting = accounts.length > 0;

  useEffect(() => {
    if (actionParam === "create") setMode("create");
    if (actionParam === "import") setMode("import");
  }, [actionParam]);

  const resetForm = () => {
    setPin("");
    setConfirmPin("");
    setSecretInput("");
    setName("");
  };

  const handleBack = () => {
    if (isAddingToExisting) {
      navigate("/dashboard");
    } else {
      setMode("choice");
    }
    resetForm();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 6) return toast.error(t("onboarding.pinMinLength"));
    if (pin !== confirmPin) return toast.error(t("onboarding.pinMismatch"));
    setLoading(true);
    try {
      const walletName = name.trim() || `Wallet ${accounts.length + 1}`;
      const pk = await createWallet(walletName, pin);
      toast.success(`${walletName}: ${pk.slice(0, 8)}...`);
      resetForm();
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 6) return toast.error(t("onboarding.pinMinLength"));
    if (!secretInput.startsWith("S") || secretInput.length !== 56)
      return toast.error(t("onboarding.secretKeyInvalid"));
    setLoading(true);
    try {
      const walletName = name.trim() || `Imported ${accounts.length + 1}`;
      const pk = await importWallet(walletName, secretInput, pin);
      toast.success(`${walletName}: ${pk.slice(0, 8)}...`);
      resetForm();
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">{t("onboarding.title")}</h1>
          <p className="mt-2 text-stellar-muted">
            {isAddingToExisting ? t("onboarding.subtitleAdd") : t("onboarding.subtitle")}
          </p>
          {isAddingToExisting && (
            <p className="mt-1 text-xs text-stellar-muted">
              {t("onboarding.youHaveWallets", { count: accounts.length })}
            </p>
          )}
        </div>

        {mode === "choice" && (
          <div className="space-y-4">
            <button
              onClick={() => setMode("create")}
              className="w-full py-4 rounded-xl bg-stellar-blue text-white font-semibold text-lg hover:bg-stellar-purple transition-colors"
            >
              {t("onboarding.createWallet")}
            </button>
            <button
              onClick={() => setMode("import")}
              className="w-full py-4 rounded-xl border border-stellar-border text-white font-semibold text-lg hover:bg-white/5 transition-colors"
            >
              {t("onboarding.importExisting")}
            </button>
            {isAddingToExisting && (
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full text-sm text-stellar-muted hover:text-white transition-colors"
              >
                {t("onboarding.cancelBack")}
              </button>
            )}
          </div>
        )}

        {mode === "create" && (
          <form onSubmit={handleCreate} className="space-y-4 bg-stellar-card border border-stellar-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white">
              {isAddingToExisting ? t("onboarding.addNewWallet") : t("onboarding.createWallet")}
            </h2>
            <p className="text-sm text-stellar-muted">
              {isAddingToExisting ? t("onboarding.createDescriptionAdd") : t("onboarding.createDescription")}
            </p>
            <input type="text" placeholder={t("onboarding.walletNamePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} autoFocus className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue" />
            <input type="password" placeholder={t("onboarding.enterPin")} value={pin} onChange={(e) => setPin(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue" />
            <input type="password" placeholder={t("onboarding.confirmPin")} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue" />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-stellar-blue text-white font-medium hover:bg-stellar-purple transition-colors disabled:opacity-50">
              {loading ? t("onboarding.creating") : t("onboarding.createWallet")}
            </button>
            <button type="button" onClick={handleBack} className="w-full text-sm text-stellar-muted hover:text-white">
              {isAddingToExisting ? t("common.cancel") : t("common.back")}
            </button>
          </form>
        )}

        {mode === "import" && (
          <form onSubmit={handleImport} className="space-y-4 bg-stellar-card border border-stellar-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white">
              {isAddingToExisting ? t("onboarding.addExistingWallet") : t("onboarding.importWallet")}
            </h2>
            <input type="text" placeholder={t("onboarding.walletNameImportPlaceholder")} value={name} onChange={(e) => setName(e.target.value)} autoFocus className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue" />
            <input type="password" placeholder={t("onboarding.secretKey")} value={secretInput} onChange={(e) => setSecretInput(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue font-mono text-sm" />
            <input type="password" placeholder={t("onboarding.enterPin")} value={pin} onChange={(e) => setPin(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue" />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-stellar-blue text-white font-medium hover:bg-stellar-purple transition-colors disabled:opacity-50">
              {loading ? t("onboarding.importing") : t("onboarding.importWallet")}
            </button>
            <button type="button" onClick={handleBack} className="w-full text-sm text-stellar-muted hover:text-white">
              {isAddingToExisting ? t("common.cancel") : t("common.back")}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-stellar-muted">
          {t("onboarding.keysDisclaimer")}
        </p>
      </div>
    </div>
  );
}