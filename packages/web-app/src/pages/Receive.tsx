import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useWalletStore } from "../store/wallet";
import { Copy, Check, Download } from "lucide-react";

export default function ReceivePage() {
  const publicKey = useWalletStore(
  (s) => s.accounts.find((a) => a.id === s.activeAccountId)?.publicKey ?? null
)!;
  const [copied, setCopied] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [amount, setAmount] = useState("");

  // Build SEP-7 URI when asset/amount provided, otherwise plain address
  const qrValue = buildStellarUri(publicKey, selectedAsset, amount);

  const handleCopy = () => {
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUri = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("stellar-qr-code");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement("a");
      a.download = `stellar-${publicKey.slice(0, 8)}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Receive</h1>

      <div className="bg-stellar-card border border-stellar-border rounded-2xl p-8 max-w-lg space-y-6">
        {/* QR Code */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-2xl">
            <QRCodeSVG
              id="stellar-qr-code"
              value={qrValue}
              size={200}
              level="M"
              bgColor="#ffffff"
              fgColor="#0f0b1a"
              imageSettings={{
                src: "https://assets.stellar.org/icons/xlm.png",
                height: 30,
                width: 30,
                excavate: true,
              }}
            />
          </div>
          <button
            onClick={handleDownloadQR}
            className="flex items-center gap-2 text-sm text-stellar-muted hover:text-white transition-colors"
          >
            <Download size={14} />
            Download QR
          </button>
        </div>

        {/* Optional: Request specific amount */}
        <div className="space-y-3 pt-2 border-t border-stellar-border">
          <p className="text-sm text-stellar-muted">
            Optionally specify an asset and amount to generate a payment request QR.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value.toUpperCase())}
              placeholder="Asset (e.g. XLM)"
              className="flex-1 px-4 py-2.5 rounded-lg bg-stellar-dark border border-stellar-border text-white text-sm placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
            />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              step="any"
              min="0"
              className="flex-1 px-4 py-2.5 rounded-lg bg-stellar-dark border border-stellar-border text-white text-sm placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm text-stellar-muted mb-2">Your Stellar Address</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-sm text-white break-all select-all">
              {publicKey}
            </code>
            <button
              onClick={handleCopy}
              className="p-3 rounded-lg border border-stellar-border hover:bg-white/5 transition-colors shrink-0"
              title="Copy address"
            >
              {copied ? (
                <Check size={18} className="text-stellar-success" />
              ) : (
                <Copy size={18} className="text-stellar-muted" />
              )}
            </button>
          </div>
        </div>

        {/* Payment URI (if asset/amount filled in) */}
        {(selectedAsset || amount) && (
          <div>
            <label className="block text-sm text-stellar-muted mb-2">Payment Request URI</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 rounded-lg bg-stellar-dark border border-stellar-border text-xs text-stellar-muted break-all">
                {qrValue}
              </code>
              <button
                onClick={handleCopyUri}
                className="p-3 rounded-lg border border-stellar-border hover:bg-white/5 transition-colors shrink-0"
                title="Copy URI"
              >
                <Copy size={16} className="text-stellar-muted" />
              </button>
            </div>
          </div>
        )}

        <p className="text-sm text-stellar-muted text-center">
          Share this address or QR code to receive Stellar assets. Only send Stellar-compatible tokens to this address.
        </p>
      </div>
    </div>
  );
}

// ─── Helper: build a SEP-7 compatible URI ─────────────────
function buildStellarUri(destination: string, assetCode?: string, amount?: string): string {
  // If no amount/asset just encode the raw address (universally scannable)
  if (!amount && !assetCode) return destination;

  // SEP-7 pay operation URI
  const params = new URLSearchParams();
  params.set("destination", destination);
  if (amount) params.set("amount", amount);
  if (assetCode && assetCode !== "XLM") {
    params.set("asset_code", assetCode);
  }
  return `web+stellar:pay?${params.toString()}`;
}