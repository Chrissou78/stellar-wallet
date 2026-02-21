import { useState } from "react";
import { useWalletStore } from "../store/wallet";
import { useBalances } from "../hooks/useBalances";
import { buildPaymentTx } from "../lib/stellar";
import PinModal from "../components/PinModal";
import { toast } from "sonner";

export default function SendPage() {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [assetCode, setAssetCode] = useState("XLM");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: balances } = useBalances();
  const isUnlocked = useWalletStore((s) => s.isUnlocked);
  const getSecretKey = useWalletStore((s) => s.getSecretKey);
  const unlock = useWalletStore((s) => s.unlock);

  const selectedBalance = balances?.find((b) => b.assetCode === assetCode);
  const assetIssuer = selectedBalance?.assetIssuer;

  const handleSend = async () => {
    if (!destination || !amount) return toast.error("Fill in all fields");
    if (parseFloat(amount) <= 0) return toast.error("Invalid amount");
    if (!destination.startsWith("G") || destination.length !== 56)
      return toast.error("Invalid Stellar address");

    if (!isUnlocked) {
      setShowPin(true);
      return;
    }

    await executeSend();
  };

  const executeSend = async () => {
    setLoading(true);
    try {
      const secretKey = getSecretKey();
      const result = await buildPaymentTx(
        secretKey,
        destination,
        amount,
        assetCode,
        assetIssuer === "native" ? undefined : assetIssuer
      );
      toast.success(`Sent ${amount} ${assetCode}! Hash: ${(result as any).hash?.slice(0, 12)}...`);
      setDestination("");
      setAmount("");
    } catch (err: any) {
      toast.error(err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Send Payment</h1>

      <div className="bg-stellar-card border border-stellar-border rounded-2xl p-6 space-y-4 max-w-lg">
        <div>
          <label className="block text-sm text-stellar-muted mb-1">Asset</label>
          <select
            value={assetCode}
            onChange={(e) => setAssetCode(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white focus:outline-none focus:border-stellar-blue"
          >
            {balances?.map((b) => (
              <option key={`${b.assetCode}-${b.assetIssuer}`} value={b.assetCode}>
                {b.assetCode} — {parseFloat(b.balance).toFixed(4)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-stellar-muted mb-1">Destination Address</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="G..."
            className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-stellar-muted mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="any"
            min="0"
            className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-stellar-blue text-white font-medium hover:bg-stellar-purple transition-colors disabled:opacity-50"
        >
          {loading ? "Sending..." : `Send ${assetCode}`}
        </button>
      </div>

      {showPin && (
        <PinModal
          title="Unlock Wallet to Send"
          onSubmit={async (pin) => {
            await unlock(pin);
            setShowPin(false);
            await executeSend();
          }}
          onCancel={() => setShowPin(false)}
        />
      )}
    </div>
  );
}
