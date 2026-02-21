import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWalletStore } from "../store/wallet";
import { toast } from "sonner";

export default function OnboardingPage() {
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
    if (pin.length < 6) return toast.error("PIN must be at least 6 characters");
    if (pin !== confirmPin) return toast.error("PINs do not match");
    setLoading(true);
    try {
      const walletName = name.trim() || `Wallet ${accounts.length + 1}`;
      const pk = await createWallet(walletName, pin);
      toast.success(`Wallet "${walletName}" created: ${pk.slice(0, 8)}...`);
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
    if (pin.length < 6) return toast.error("PIN must be at least 6 characters");
    if (!secretInput.startsWith("S") || secretInput.length !== 56)
      return toast.error("Invalid Stellar secret key");
    setLoading(true);
    try {
      const walletName = name.trim() || `Imported ${accounts.length + 1}`;
      const pk = await importWallet(walletName, secretInput, pin);
      toast.success(`Wallet "${walletName}" imported: ${pk.slice(0, 8)}...`);
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
          <h1 className="text-3xl font-bold text-white">Stellar Wallet</h1>
          <p className="mt-2 text-stellar-muted">
            {isAddingToExisting
              ? "Add another wallet to your collection"
              : "Manage your Stellar assets securely"}
          </p>
          {isAddingToExisting && (
            <p className="mt-1 text-xs text-stellar-muted">
              You have {accounts.length} wallet{accounts.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {mode === "choice" && (
          <div className="space-y-4">
            <button
              onClick={() => setMode("create")}
              className="w-full py-4 rounded-xl bg-stellar-blue text-white font-semibold text-lg hover:bg-stellar-purple transition-colors"
            >
              Create New Wallet
            </button>
            <button
              onClick={() => setMode("import")}
              className="w-full py-4 rounded-xl border border-stellar-border text-white font-semibold text-lg hover:bg-white/5 transition-colors"
            >
              Import Existing Wallet
            </button>
            {isAddingToExisting && (
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full text-sm text-stellar-muted hover:text-white transition-colors"
              >
                Cancel — back to dashboard
              </button>
            )}
          </div>
        )}

        {mode === "create" && (
          <form
            onSubmit={handleCreate}
            className="space-y-4 bg-stellar-card border border-stellar-border rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white">
              {isAddingToExisting ? "Add New Wallet" : "Create Wallet"}
            </h2>
            <p className="text-sm text-stellar-muted">
              {isAddingToExisting
                ? "Each wallet has its own name, keys, and PIN."
                : "Set a name and PIN for this wallet. The PIN encrypts your secret key locally."}
            </p>
            <input
              type="text"
              placeholder="Wallet name (e.g. Main, Trading, Savings)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
            />
            <input
              type="password"
              placeholder="Choose a PIN (min 6 chars)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
            />
            <input
              type="password"
              placeholder="Confirm PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-stellar-blue text-white font-medium hover:bg-stellar-purple transition-colors disabled:opacity-50"
            >
              {loading ? "Creating & Funding..." : "Create Wallet"}
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="w-full text-sm text-stellar-muted hover:text-white"
            >
              {isAddingToExisting ? "Cancel" : "Back"}
            </button>
          </form>
        )}

        {mode === "import" && (
          <form
            onSubmit={handleImport}
            className="space-y-4 bg-stellar-card border border-stellar-border rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white">
              {isAddingToExisting ? "Add Existing Wallet" : "Import Wallet"}
            </h2>
            <input
              type="text"
              placeholder="Wallet name (e.g. Imported, Ledger)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
            />
            <input
              type="password"
              placeholder="Stellar secret key (S...)"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue font-mono text-sm"
            />
            <input
              type="password"
              placeholder="Choose a PIN (min 6 chars)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-stellar-blue text-white font-medium hover:bg-stellar-purple transition-colors disabled:opacity-50"
            >
              {loading ? "Importing..." : "Import Wallet"}
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="w-full text-sm text-stellar-muted hover:text-white"
            >
              {isAddingToExisting ? "Cancel" : "Back"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-stellar-muted">
          Testnet &middot; Keys are encrypted per-wallet and never leave your device
        </p>
      </div>
    </div>
  );
}
