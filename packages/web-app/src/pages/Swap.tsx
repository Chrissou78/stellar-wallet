import { useState } from "react";
import { useBalances } from "../hooks/useBalances";
import { useWalletStore } from "../store/wallet";
import { swapApi, txApi } from "../lib/api";
import { signXdr } from "../lib/stellar";
import { NETWORK_PASSPHRASE } from "../lib/constants";
import PinModal from "../components/PinModal";
import TokenIcon from "../components/TokenIcon";
import { ArrowDownUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SwapPage() {
  const { data: balances } = useBalances();
  const isUnlocked = useWalletStore((s) => s.isUnlocked);
  const getSecretKey = useWalletStore((s) => s.getSecretKey);
  const unlock = useWalletStore((s) => s.unlock);
  const [fromAsset, setFromAsset] = useState("XLM");
  const [toAsset, setToAsset] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingSwap, setLoadingSwap] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pendingQuote, setPendingQuote] = useState<any>(null);

  const fromBalance = balances?.find((b) => b.assetCode === fromAsset);
  const toBalance = balances?.find((b) => b.assetCode === toAsset);

  const fetchQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) return toast.error("Enter an amount");
    setLoadingQuote(true);
    try {
      const result = await swapApi.quote({
        fromCode: fromAsset,
        fromIssuer: fromBalance?.assetIssuer || "native",
        toCode: toAsset,
        toIssuer: toBalance?.assetIssuer || "",
        amount,
      });
      setQuotes(result);
      if (result.length === 0) toast.info("No swap routes found");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingQuote(false);
    }
  };

  const executeSwap = async (quote: any) => {
    if (!isUnlocked) {
      setPendingQuote(quote);
      setShowPin(true);
      return;
    }
    setLoadingSwap(true);
    try {
      const { xdr, networkPassphrase } = await swapApi.build({
        ...quote,
        sourcePublicKey: useWalletStore.getState().getPublicKey(),
      });
      const signed = signXdr(xdr, getSecretKey());
      const result = await txApi.submit(signed, networkPassphrase);
      toast.success(`Swap complete! Hash: ${result.hash?.slice(0, 12)}...`);
      setQuotes([]);
      setAmount("");
    } catch (err: any) {
      toast.error(err.message || "Swap failed");
    } finally {
      setLoadingSwap(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Swap</h1>

      <div className="bg-stellar-card border border-stellar-border rounded-2xl p-6 max-w-lg space-y-4">
        {/* From */}
        <div>
          <label className="block text-sm text-stellar-muted mb-1">From</label>
          <div className="flex gap-3">
            <select
              value={fromAsset}
              onChange={(e) => setFromAsset(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white focus:outline-none focus:border-stellar-blue"
            >
              {balances?.map((b) => (
                <option key={`from-${b.assetCode}-${b.assetIssuer}`} value={b.assetCode}>
                  {b.assetCode}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="any"
              min="0"
              className="flex-1 px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => {
              setFromAsset(toAsset);
              setToAsset(fromAsset);
            }}
            className="p-2 rounded-full border border-stellar-border hover:bg-white/5 transition-colors"
          >
            <ArrowDownUp size={18} className="text-stellar-muted" />
          </button>
        </div>

        {/* To */}
        <div>
          <label className="block text-sm text-stellar-muted mb-1">To</label>
          <select
            value={toAsset}
            onChange={(e) => setToAsset(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-white focus:outline-none focus:border-stellar-blue"
          >
            {balances?.map((b) => (
              <option key={`to-${b.assetCode}-${b.assetIssuer}`} value={b.assetCode}>
                {b.assetCode}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchQuote}
          disabled={loadingQuote}
          className="w-full py-3 rounded-lg bg-stellar-blue text-white font-medium hover:bg-stellar-purple transition-colors disabled:opacity-50"
        >
          {loadingQuote ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Get Quote"}
        </button>

        {/* Quotes */}
        {quotes.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-sm text-stellar-muted">Available routes:</p>
            {quotes.map((q: any, i: number) => (
              <button
                key={i}
                onClick={() => executeSwap(q)}
                disabled={loadingSwap}
                className="w-full flex items-center justify-between bg-stellar-dark border border-stellar-border rounded-xl px-4 py-3 hover:border-stellar-blue/50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <TokenIcon code={toAsset} size={28} />
                  <div className="text-left">
                    <p className="text-sm text-white font-medium">
                      ≈ {parseFloat(q.destinationAmount).toFixed(4)} {toAsset}
                    </p>
                    <p className="text-xs text-stellar-muted">{q.type || "path"}</p>
                  </div>
                </div>
                <span className="text-xs text-stellar-muted">
                  {q.path?.length || 0} hop{(q.path?.length || 0) !== 1 ? "s" : ""}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showPin && (
        <PinModal
          title="Unlock Wallet to Swap"
          onSubmit={async (pin) => {
            await unlock(pin);
            setShowPin(false);
            if (pendingQuote) await executeSwap(pendingQuote);
          }}
          onCancel={() => setShowPin(false)}
        />
      )}
    </div>
  );
}
