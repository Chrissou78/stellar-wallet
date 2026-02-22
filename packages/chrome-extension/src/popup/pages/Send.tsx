import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useWalletStore } from "../../shared/store/wallet";
import { useBalances } from "../../shared/hooks/useBalances";
import { buildPaymentTx } from "../../shared/lib/stellar";
import PinModal from "../../shared/components/PinModal";
import TokenIcon from "../../shared/components/TokenIcon";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

export default function SendPage() {
  const { t } = useTranslation();
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [assetCode, setAssetCode] = useState("XLM");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const { data: balances } = useBalances();
  const isUnlocked = useWalletStore((s) => s.isUnlocked);
  const getSecretKey = useWalletStore((s) => s.getSecretKey);
  const unlock = useWalletStore((s) => s.unlock);

  const selectedBalance = balances?.find((b) => b.assetCode === assetCode);
  const assetIssuer = selectedBalance?.assetIssuer;

  const handleSend = async () => {
    if (!destination || !amount) return toast.error(t("send.fillFields", "Fill in all fields"));
    if (parseFloat(amount) <= 0) return toast.error(t("send.invalidAmount", "Invalid amount"));
    if (!destination.startsWith("G") || destination.length !== 56)
      return toast.error(t("send.invalidAddress", "Invalid Stellar address"));

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
      toast.success(`${t("send.sent", "Sent")} ${amount} ${assetCode}!`);
      setDestination("");
      setAmount("");
    } catch (err: any) {
      toast.error(err.message || t("send.failed", "Transaction failed"));
    } finally {
      setLoading(false);
    }
  };

  const setMax = () => {
    if (!selectedBalance) return;
    const bal = parseFloat(selectedBalance.balance);
    // Reserve 1.5 XLM for fees if sending XLM
    const max = assetCode === "XLM" ? Math.max(0, bal - 1.5) : bal;
    setAmount(max.toFixed(7));
  };

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full">
      {/* Asset Picker */}
      <div className="relative">
        <label className="block text-xs text-stellar-muted mb-1">
          {t("send.asset", "Asset")}
        </label>
        <button
          onClick={() => setShowAssetPicker(!showAssetPicker)}
          className="w-full flex items-center justify-between bg-stellar-card border border-stellar-border rounded-lg px-3 py-2 hover:border-stellar-blue/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <TokenIcon
              code={assetCode}
              image={selectedBalance?.token?.tomlImage}
              size={24}
            />
            <div className="text-left">
              <span className="text-sm text-white font-medium">{assetCode}</span>
              {selectedBalance && (
                <span className="text-[10px] text-stellar-muted ml-2">
                  {parseFloat(selectedBalance.balance).toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <ChevronDown
            size={14}
            className={`text-stellar-muted transition-transform ${showAssetPicker ? "rotate-180" : ""}`}
          />
        </button>

        {showAssetPicker && (
          <div className="absolute z-50 mt-1 w-full bg-stellar-card border border-stellar-border rounded-lg shadow-2xl max-h-40 overflow-y-auto">
            {balances?.map((b) => (
              <button
                key={`${b.assetCode}-${b.assetIssuer}`}
                onClick={() => {
                  setAssetCode(b.assetCode);
                  setShowAssetPicker(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 ${
                  b.assetCode === assetCode ? "bg-stellar-blue/10" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <TokenIcon code={b.assetCode} image={b.token?.tomlImage} size={24} />
                  <span className="text-xs text-white">{b.assetCode}</span>
                </div>
                <span className="text-[10px] text-stellar-muted font-mono">
                  {parseFloat(b.balance).toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Destination */}
      <div>
        <label className="block text-xs text-stellar-muted mb-1">
          {t("send.destination", "Destination")}
        </label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="G..."
          className="w-full px-3 py-2 rounded-lg bg-stellar-card border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue/50 font-mono text-xs"
        />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-xs text-stellar-muted mb-1">
          {t("send.amount", "Amount")}
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="any"
            min="0"
            className="w-full px-3 py-2 pr-16 rounded-lg bg-stellar-card border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue/50 text-sm"
          />
          <button
            onClick={setMax}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stellar-blue hover:text-stellar-purple font-medium px-1.5 py-0.5 rounded bg-stellar-blue/10"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Summary */}
      {amount && parseFloat(amount) > 0 && (
        <div className="bg-stellar-card border border-stellar-border rounded-lg px-3 py-2 text-xs space-y-1">
          <div className="flex justify-between text-stellar-muted">
            <span>{t("send.sending", "Sending")}</span>
            <span className="text-white font-medium">{amount} {assetCode}</span>
          </div>
          <div className="flex justify-between text-stellar-muted">
            <span>{t("send.fee", "Network fee")}</span>
            <span>~0.00001 XLM</span>
          </div>
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={loading || !destination || !amount}
        className="w-full py-3 rounded-xl bg-stellar-blue text-white font-medium hover:bg-stellar-purple transition-colors disabled:opacity-50 text-sm"
      >
        {loading
          ? t("send.sending", "Sending...")
          : `${t("send.send", "Send")} ${assetCode}`}
      </button>

      {/* PIN Modal */}
      {showPin && (
        <PinModal
          title={t("send.unlockToSend", "Unlock Wallet to Send")}
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
