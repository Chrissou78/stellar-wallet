import { useState, useMemo } from "react";
import { ArrowDownUp, Loader2, Search, X, ChevronDown, AlertCircle } from "lucide-react";
import { useWalletStore } from "../store/wallet";
import { useBalances } from "../hooks/useBalances";
import { useQuery } from "@tanstack/react-query";
import { tokenApi, swapApi } from "../lib/api";
import TokenIcon from "../components/TokenIcon";
import PinModal from "../components/PinModal";
import toast from "react-hot-toast";
import * as StellarSdk from "@stellar/stellar-sdk";

interface TokenOption {
  code: string;
  issuer: string | null;
  name: string;
  image: string | null;
  isNative: boolean;
  balance?: string;
}

export default function SwapPage() {
  const publicKey = useWalletStore(
    (s) => s.accounts.find((a) => a.id === s.activeAccountId)?.publicKey ?? null
  );
  const getSecretKey = useWalletStore((s) => s.getSecretKey);
  const network = useWalletStore((s) => s.network);

  const { data: balances } = useBalances();
  const { data: featuredRaw } = useQuery({
    queryKey: ["featured"],
    queryFn: () => tokenApi.featured(),
  });

  const [fromToken, setFromToken] = useState<TokenOption | null>(null);
  const [toToken, setToToken] = useState<TokenOption | null>(null);
  const [amount, setAmount] = useState("");
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Build token options
  const tokenOptions = useMemo<TokenOption[]>(() => {
    const options: TokenOption[] = [];
    const seen = new Set<string>();

    if (balances) {
      for (const b of balances) {
        const key = `${b.assetCode}-${b.assetIssuer || "native"}`;
        if (seen.has(key)) continue;
        seen.add(key);
        options.push({
          code: b.assetCode,
          issuer: b.assetIssuer || null,
          name: b.token?.tomlName || (b.assetType === "native" ? "Stellar Lumens" : b.assetCode),
          image: b.token?.tomlImage || null,
          isNative: b.assetType === "native",
          balance: b.balance,
        });
      }
    }

    const featured = Array.isArray(featuredRaw)
      ? featuredRaw
      : Array.isArray((featuredRaw as any)?.data)
        ? (featuredRaw as any).data
        : [];

    for (const t of featured) {
      const code = t.assetCode || t.asset_code || "";
      const issuer = t.assetIssuer || t.asset_issuer || null;
      const key = `${code}-${issuer || "native"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({
        code,
        issuer,
        name: t.tomlName || t.toml_name || code,
        image: t.tomlImage || t.toml_image || null,
        isNative: (t.assetType || t.asset_type) === "native",
        balance: undefined,
      });
    }

    return options;
  }, [balances, featuredRaw]);

  // Tokens with balance (for "From" — you can only swap what you hold)
  const fromOptions = useMemo(
    () => tokenOptions.filter((t) => t.balance != null && parseFloat(t.balance) > 0),
    [tokenOptions]
  );

  // All tokens for "To"
  const toOptions = useMemo(
    () => tokenOptions.filter((t) => !(t.code === fromToken?.code && t.issuer === fromToken?.issuer)),
    [tokenOptions, fromToken]
  );

  // Set defaults
  useMemo(() => {
    if (!fromToken && fromOptions.length > 0) {
      const xlm = fromOptions.find((t) => t.isNative);
      setFromToken(xlm || fromOptions[0]);
    }
  }, [fromOptions, fromToken]);

  // Quote
  const {
    data: quote,
    isLoading: quoteLoading,
    error: quoteError,
  } = useQuery({
    queryKey: ["swap-quote", fromToken?.code, fromToken?.issuer, toToken?.code, toToken?.issuer, amount],
    queryFn: () =>
      swapApi.quote({
        fromCode: fromToken!.code,
        fromIssuer: fromToken!.issuer || "",
        toCode: toToken!.code,
        toIssuer: toToken!.issuer || "",
        amount,
      }),
    enabled: !!fromToken && !!toToken && !!amount && parseFloat(amount) > 0,
    refetchInterval: 15_000,
  });

  const flipTokens = () => {
    const prev = fromToken;
    setFromToken(toToken);
    setToToken(prev);
    setAmount("");
  };

  const handleSwap = () => {
    if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0) {
      toast.error("Select tokens and enter an amount");
      return;
    }
    setShowPin(true);
  };

  const executeSwap = async (pin: string) => {
    setShowPin(false);
    setSubmitting(true);

    try {
      const secret = await getSecretKey(pin);
      if (!secret) {
        toast.error("Invalid PIN");
        setSubmitting(false);
        return;
      }

      const keypair = StellarSdk.Keypair.fromSecret(secret);
      const horizonUrl =
        network === "testnet"
          ? "https://horizon-testnet.stellar.org"
          : "https://horizon.stellar.org";
      const server = new StellarSdk.Horizon.Server(horizonUrl);
      const account = await server.loadAccount(publicKey!);
      const networkPassphrase =
        network === "testnet"
          ? StellarSdk.Networks.TESTNET
          : StellarSdk.Networks.PUBLIC;

      const fromAsset = fromToken!.isNative
        ? StellarSdk.Asset.native()
        : new StellarSdk.Asset(fromToken!.code, fromToken!.issuer!);
      const toAsset = toToken!.isNative
        ? StellarSdk.Asset.native()
        : new StellarSdk.Asset(toToken!.code, toToken!.issuer!);

      const destMin = quote?.estimatedReceive
        ? (parseFloat(quote.estimatedReceive) * 0.99).toFixed(7)
        : "0.0000001";

      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.pathPaymentStrictSend({
            sendAsset: fromAsset,
            sendAmount: parseFloat(amount).toFixed(7),
            destination: publicKey!,
            destAsset: toAsset,
            destMin,
          })
        )
        .setTimeout(60)
        .build();

      tx.sign(keypair);
      await server.submitTransaction(tx);

      toast.success(
        `Swapped ${amount} ${fromToken!.code} → ${toToken!.code}`
      );
      setAmount("");
    } catch (err: any) {
      console.error("Swap error:", err);
      toast.error(err?.message || "Swap failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filterTokens = (list: TokenOption[], query: string) =>
    list.filter(
      (t) =>
        t.code.toLowerCase().includes(query.toLowerCase()) ||
        t.name.toLowerCase().includes(query.toLowerCase())
    );

  const fromBalance = fromToken?.balance
    ? parseFloat(fromToken.balance)
    : 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Swap</h1>
        <p className="mt-1 text-sm text-stellar-muted">
          Exchange tokens using Stellar's path payments
        </p>
      </div>

      {/* From */}
      <div className="bg-stellar-card border border-stellar-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-stellar-muted">You send</span>
          {fromToken?.balance != null && (
            <button
              onClick={() => setAmount(fromToken.balance!)}
              className="text-xs text-stellar-blue hover:text-stellar-blue/80 transition-colors"
            >
              Max: {parseFloat(fromToken.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent text-2xl text-white font-medium placeholder:text-stellar-muted/40 focus:outline-none"
          />
          <TokenPickerButton
            selected={fromToken}
            onClick={() => {
              setShowFromPicker(!showFromPicker);
              setShowToPicker(false);
            }}
          />
        </div>

        {/* From picker dropdown */}
        {showFromPicker && (
          <TokenPickerDropdown
            tokens={filterTokens(fromOptions, searchFrom)}
            selected={fromToken}
            search={searchFrom}
            onSearch={setSearchFrom}
            onSelect={(t) => {
              setFromToken(t);
              setShowFromPicker(false);
              setSearchFrom("");
              if (toToken?.code === t.code && toToken?.issuer === t.issuer) {
                setToToken(null);
              }
            }}
            onClose={() => {
              setShowFromPicker(false);
              setSearchFrom("");
            }}
            showBalances
          />
        )}

        {parseFloat(amount) > fromBalance && fromBalance > 0 && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle size={12} /> Exceeds available balance
          </p>
        )}
      </div>

      {/* Flip button */}
      <div className="flex justify-center -my-3 relative z-10">
        <button
          onClick={flipTokens}
          className="bg-stellar-card border border-stellar-border rounded-xl p-3 hover:bg-white/5 transition-colors"
        >
          <ArrowDownUp size={20} className="text-stellar-blue" />
        </button>
      </div>

      {/* To */}
      <div className="bg-stellar-card border border-stellar-border rounded-2xl p-5 space-y-3">
        <span className="text-sm text-stellar-muted">You receive</span>

        <div className="flex items-center gap-3">
          <div className="flex-1 text-2xl font-medium">
            {quoteLoading ? (
              <Loader2 size={24} className="animate-spin text-stellar-muted" />
            ) : quote?.estimatedReceive ? (
              <span className="text-white">
                {parseFloat(quote.estimatedReceive).toLocaleString(undefined, {
                  maximumFractionDigits: 7,
                })}
              </span>
            ) : (
              <span className="text-stellar-muted/40">0.00</span>
            )}
          </div>
          <TokenPickerButton
            selected={toToken}
            placeholder="Select token"
            onClick={() => {
              setShowToPicker(!showToPicker);
              setShowFromPicker(false);
            }}
          />
        </div>

        {/* To picker dropdown */}
        {showToPicker && (
          <TokenPickerDropdown
            tokens={filterTokens(toOptions, searchTo)}
            selected={toToken}
            search={searchTo}
            onSearch={setSearchTo}
            onSelect={(t) => {
              setToToken(t);
              setShowToPicker(false);
              setSearchTo("");
            }}
            onClose={() => {
              setShowToPicker(false);
              setSearchTo("");
            }}
            showBalances={false}
          />
        )}
      </div>

      {/* Quote details */}
      {quote && !quoteLoading && fromToken && toToken && (
        <div className="bg-stellar-card border border-stellar-border rounded-xl p-4 space-y-2 text-sm">
          {quote.rate && (
            <div className="flex justify-between text-stellar-muted">
              <span>Rate</span>
              <span className="text-white">
                1 {fromToken.code} ≈ {parseFloat(quote.rate).toLocaleString(undefined, { maximumFractionDigits: 7 })}{" "}
                {toToken.code}
              </span>
            </div>
          )}
          {quote.path && quote.path.length > 0 && (
            <div className="flex justify-between text-stellar-muted">
              <span>Route</span>
              <span className="text-white">
                {fromToken.code} → {quote.path.map((p: any) => p.asset_code || "XLM").join(" → ")} → {toToken.code}
              </span>
            </div>
          )}
          <div className="flex justify-between text-stellar-muted">
            <span>Slippage tolerance</span>
            <span className="text-white">1%</span>
          </div>
        </div>
      )}

      {quoteError && toToken && amount && parseFloat(amount) > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
          No swap path found between {fromToken?.code} and {toToken.code}. Try a different pair or amount.
        </div>
      )}

      {/* Swap button */}
      <button
        onClick={handleSwap}
        disabled={
          !fromToken ||
          !toToken ||
          !amount ||
          parseFloat(amount) <= 0 ||
          parseFloat(amount) > fromBalance ||
          !quote?.estimatedReceive ||
          submitting
        }
        className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-stellar-blue to-stellar-purple hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin" />
            Swapping...
          </span>
        ) : !fromToken || !toToken ? (
          "Select tokens"
        ) : !amount || parseFloat(amount) <= 0 ? (
          "Enter amount"
        ) : parseFloat(amount) > fromBalance ? (
          "Insufficient balance"
        ) : !quote?.estimatedReceive ? (
          "Fetching quote..."
        ) : (
          `Swap ${fromToken.code} → ${toToken.code}`
        )}
      </button>

      {/* PIN Modal */}
      {showPin && (
        <PinModal
          title="Confirm Swap"
          subtitle={`Swap ${amount} ${fromToken?.code} for ~${quote?.estimatedReceive} ${toToken?.code}`}
          onSubmit={executeSwap}
          onClose={() => setShowPin(false)}
        />
      )}
    </div>
  );
}

/* ─── Shared sub-components ─── */

function TokenPickerButton({
  selected,
  placeholder = "Select",
  onClick,
}: {
  selected: TokenOption | null;
  placeholder?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-stellar-bg border border-stellar-border rounded-xl px-3 py-2 hover:border-stellar-blue/50 transition-colors shrink-0"
    >
      {selected ? (
        <>
          <TokenIcon code={selected.code} image={selected.image} size={24} />
          <span className="text-white font-medium text-sm">{selected.code}</span>
        </>
      ) : (
        <span className="text-stellar-muted text-sm">{placeholder}</span>
      )}
      <ChevronDown size={14} className="text-stellar-muted" />
    </button>
  );
}

function TokenPickerDropdown({
  tokens,
  selected,
  search,
  onSearch,
  onSelect,
  onClose,
  showBalances,
}: {
  tokens: TokenOption[];
  selected: TokenOption | null;
  search: string;
  onSearch: (q: string) => void;
  onSelect: (t: TokenOption) => void;
  onClose: () => void;
  showBalances: boolean;
}) {
  return (
    <div className="bg-stellar-bg border border-stellar-border rounded-xl shadow-2xl overflow-hidden">
      <div className="p-3 border-b border-stellar-border">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stellar-muted" />
          <input
            type="text"
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-stellar-card border border-stellar-border rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue/50"
            autoFocus
          />
          {search && (
            <button
              onClick={() => onSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stellar-muted hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto">
        {tokens.map((t) => {
          const isSelected =
            selected?.code === t.code && selected?.issuer === t.issuer;

          return (
            <button
              key={`${t.code}-${t.issuer || "native"}`}
              onClick={() => onSelect(t)}
              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors ${
                isSelected ? "bg-stellar-blue/10" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <TokenIcon code={t.code} image={t.image} size={28} />
                <div className="text-left">
                  <p className="text-white text-sm font-medium">{t.code}</p>
                  <p className="text-xs text-stellar-muted">{t.name}</p>
                </div>
              </div>
              {showBalances && t.balance != null && (
                <span className="text-xs text-stellar-muted font-mono">
                  {parseFloat(t.balance).toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}
                </span>
              )}
            </button>
          );
        })}

        {tokens.length === 0 && (
          <p className="text-center text-stellar-muted text-sm py-6">
            No tokens found
          </p>
        )}
      </div>
    </div>
  );
}
