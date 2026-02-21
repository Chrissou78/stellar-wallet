import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tokenApi } from "../lib/api";
import { useWalletStore } from "../store/wallet";
import { buildTrustlineTx } from "../lib/stellar";
import TokenIcon from "../components/TokenIcon";
import OrderbookDepth from "../components/OrderbookDepth";
import LiquidityPools from "../components/LiquidityPools";
import PinModal from "../components/PinModal";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Star,
  ExternalLink,
  Shield,
  ShieldAlert,
  TrendingUp,
  Users,
  BarChart3,
  DollarSign,
  ArrowLeftRight,
  Send,
  Plus,
  Loader2,
  Globe,
  Copy,
  Check,
} from "lucide-react";

export default function TokenDetailPage() {
  const { code, issuer } = useParams<{ code: string; issuer: string }>();
  const publicKey = useWalletStore(
    (s) => s.accounts.find((a) => a.id === s.activeAccountId)?.publicKey ?? null
  )!;
  const isUnlocked = useWalletStore((s) => s.isUnlocked);
  const getSecretKey = useWalletStore((s) => s.getSecretKey);
  const unlock = useWalletStore((s) => s.unlock);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showPin, setShowPin] = useState(false);
  const [pinAction, setPinAction] = useState<"trustline" | "favorite">("trustline");
  const [copiedIssuer, setCopiedIssuer] = useState(false);

  // ─── Fetch token detail from backend ────────────────────
  const {
    data: token,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["token-detail", code, issuer],
    queryFn: () => tokenApi.detail(code!, issuer!),
    enabled: !!code && !!issuer,
  });

  // ─── Toggle favorite ───────────────────────────────────
  const favMutation = useMutation({
    mutationFn: () => tokenApi.toggleFavorite(publicKey, code!, issuer!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["token-detail", code, issuer] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      toast.success("Updated favorites");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // ─── Add trustline ─────────────────────────────────────
  const handleAddTrustline = async () => {
    if (code === "XLM") return toast.info("XLM is native — no trustline needed");
    if (!isUnlocked) {
      setPinAction("trustline");
      setShowPin(true);
      return;
    }
    await executeTrustline();
  };

  const executeTrustline = async () => {
    try {
      const secret = getSecretKey();
      await buildTrustlineTx(secret, code!, issuer!);
      toast.success(`Trustline added for ${code}`);
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to add trustline");
    }
  };

  const handleCopyIssuer = () => {
    navigator.clipboard.writeText(issuer!);
    setCopiedIssuer(true);
    setTimeout(() => setCopiedIssuer(false), 2000);
  };

  // ─── Loading / error states ─────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-stellar-muted" size={40} />
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="space-y-4">
        <Link to="/tokens" className="flex items-center gap-2 text-sm text-stellar-muted hover:text-white">
          <ArrowLeft size={16} /> Back to Tokens
        </Link>
        <p className="text-stellar-danger">Token not found or failed to load.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link to="/tokens" className="inline-flex items-center gap-2 text-sm text-stellar-muted hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Tokens
      </Link>

      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        <TokenIcon code={token.assetCode} image={token.tomlImage} size={64} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-white">{token.assetCode}</h1>
            {token.isVerified ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stellar-success/20 text-stellar-success text-xs font-medium">
                <Shield size={12} /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                <ShieldAlert size={12} /> Unverified
              </span>
            )}
            {token.isSpam && (
              <span className="px-2 py-0.5 rounded-full bg-stellar-danger/20 text-stellar-danger text-xs font-medium">
                Flagged
              </span>
            )}
          </div>

          {token.tomlName && (
            <p className="mt-1 text-lg text-stellar-muted">{token.tomlName}</p>
          )}

          {token.tomlDescription && (
            <p className="mt-2 text-sm text-stellar-muted leading-relaxed max-w-2xl">
              {token.tomlDescription}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => favMutation.mutate()}
            disabled={favMutation.isPending}
            className="p-2.5 rounded-lg border border-stellar-border hover:bg-white/5 transition-colors"
            title="Toggle favorite"
          >
            <Star
              size={18}
              className={token.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-stellar-muted"}
            />
          </button>
          <button
            onClick={handleAddTrustline}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-stellar-border text-sm text-stellar-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <Plus size={16} /> Trustline
          </button>
          <button
            onClick={() => navigate(`/send?asset=${code}`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-stellar-blue text-white text-sm font-medium hover:bg-stellar-purple transition-colors"
          >
            <Send size={16} /> Send
          </button>
          <button
            onClick={() => navigate(`/swap?to=${code}`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-stellar-purple/80 text-white text-sm font-medium hover:bg-stellar-purple transition-colors"
          >
            <ArrowLeftRight size={16} /> Swap
          </button>
        </div>
      </div>

      {/* ─── Stats Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Star size={18} className="text-yellow-400" />}
          label="Rating"
          value={token.ratingAverage != null ? Number(token.ratingAverage).toFixed(1) + " / 10" : "—"}
        />
        <StatCard
          icon={<Users size={18} className="text-stellar-blue" />}
          label="Holders"
          value={token.trustlinesFunded ? Number(token.trustlinesFunded).toLocaleString() : "—"}
          sub={token.trustlinesTotal ? `${Number(token.trustlinesTotal).toLocaleString()} total trustlines` : undefined}
        />
        <StatCard
          icon={<BarChart3 size={18} className="text-stellar-purple" />}
          label="Trades"
          value={token.tradesCount ? Number(token.tradesCount).toLocaleString() : "—"}
        />
        <StatCard
          icon={<DollarSign size={18} className="text-stellar-success" />}
          label="Payments"
          value={token.paymentsCount ? Number(token.paymentsCount).toLocaleString() : "—"}
        />
      </div>

      {/* ─── Metadata ────────────────────────────────────── */}
      <div className="bg-stellar-card border border-stellar-border rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Asset Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <DetailRow label="Asset Code" value={token.assetCode} />
          <DetailRow label="Asset Type" value={token.assetType} />
          <DetailRow
            label="Issuer"
            value={
              token.assetType === "native" ? (
                "Native (XLM)"
              ) : (
                <span className="flex items-center gap-2">
                  <span className="font-mono truncate max-w-[220px]">{issuer}</span>
                  <button onClick={handleCopyIssuer} className="shrink-0">
                    {copiedIssuer ? (
                      <Check size={14} className="text-stellar-success" />
                    ) : (
                      <Copy size={14} className="text-stellar-muted hover:text-white" />
                    )}
                  </button>
                </span>
              )
            }
          />
          {token.domain && (
            <DetailRow
              label="Domain"
              value={
                <a
                  href={`https://${token.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-stellar-blue hover:underline"
                >
                  <Globe size={14} />
                  {token.domain}
                  <ExternalLink size={12} />
                </a>
              }
            />
          )}
          {token.totalSupply && (
            <DetailRow
              label="Total Supply"
              value={formatLargeNumber(token.totalSupply)}
            />
          )}
          {token.createdAt && (
            <DetailRow
              label="Created"
              value={new Date(token.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          )}
        </div>

        {/* Rating Breakdown */}
        {token.ratingAge != null && (
          <div className="pt-4 border-t border-stellar-border">
            <h3 className="text-sm font-semibold text-stellar-muted mb-3">Rating Breakdown</h3>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
              <RatingBadge label="Age" value={token.ratingAge} />
              <RatingBadge label="Trades" value={token.ratingTrades} />
              <RatingBadge label="Payments" value={token.ratingPayments} />
              <RatingBadge label="Trustlines" value={token.ratingTrustlines} />
              <RatingBadge label="Volume 7d" value={token.ratingVolume7d} />
              <RatingBadge label="Interop" value={token.ratingInterop} />
              <RatingBadge label="Liquidity" value={token.ratingLiquidity} />
            </div>
          </div>
        )}

        {/* Soroban Contract */}
        {token.contractToken && (
          <div className="pt-4 border-t border-stellar-border">
            <h3 className="text-sm font-semibold text-stellar-muted mb-3">
              <TrendingUp size={14} className="inline mr-1" />
              Soroban Contract
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <DetailRow label="Contract ID" value={
                <span className="font-mono text-xs truncate max-w-[260px] inline-block">{token.contractToken.contractId}</span>
              } />
              <DetailRow label="Type" value={token.contractToken.contractType} />
              {token.contractToken.name && <DetailRow label="Name" value={token.contractToken.name} />}
              {token.contractToken.symbol && <DetailRow label="Symbol" value={token.contractToken.symbol} />}
              {token.contractToken.decimals != null && <DetailRow label="Decimals" value={token.contractToken.decimals} />}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="pt-4 border-t border-stellar-border flex flex-wrap gap-3">
          {token.assetType !== "native" && issuer && (
            <ExternalButton
              href={`https://stellar.expert/explorer/testnet/asset/${code}-${issuer}`}
              label="StellarExpert"
            />
          )}
          {token.assetType === "native" && (
            <ExternalButton
              href="https://stellar.expert/explorer/testnet/asset/XLM"
              label="StellarExpert"
            />
          )}
          {token.domain && (
            <ExternalButton href={`https://${token.domain}/.well-known/stellar.toml`} label="stellar.toml" />
          )}
          {token.tomlOrgUrl && <ExternalButton href={token.tomlOrgUrl} label="Website" />}
        </div>
      </div>

      {/* ─── Orderbook Depth ─────────────────────────────── */}
      {token.assetType !== "native" && token.orderbook && (
        <OrderbookDepth orderbook={token.orderbook} assetCode={token.assetCode} />
      )}

      {/* ─── Liquidity Pools ─────────────────────────────── */}
      {token.liquidityPools && token.liquidityPools.length > 0 && (
        <LiquidityPools pools={token.liquidityPools} />
      )}

      {/* PIN Modal */}
      {showPin && (
        <PinModal
          title={pinAction === "trustline" ? "Unlock to Add Trustline" : "Unlock Wallet"}
          onSubmit={async (pin) => {
            await unlock(pin);
            setShowPin(false);
            if (pinAction === "trustline") await executeTrustline();
          }}
          onCancel={() => setShowPin(false)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-stellar-card border border-stellar-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-stellar-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-stellar-muted mt-1">{sub}</p>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-stellar-muted shrink-0">{label}</span>
      <span className="text-white text-right">{value}</span>
    </div>
  );
}

function RatingBadge({ label, value }: { label: string; value?: number | string }) {
  const v = Number(value ?? 0);
  const color =
    v >= 8 ? "text-stellar-success bg-stellar-success/15" :
    v >= 5 ? "text-yellow-400 bg-yellow-400/15" :
    "text-stellar-muted bg-white/5";
  return (
    <div className={`rounded-lg px-3 py-2 text-center ${color}`}>
      <p className="text-lg font-bold">{v.toFixed(1)}</p>
      <p className="text-[10px] uppercase tracking-wider opacity-75">{label}</p>
    </div>
  );
}

function ExternalButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stellar-border text-xs text-stellar-muted hover:text-white hover:bg-white/5 transition-colors"
    >
      {label}
      <ExternalLink size={12} />
    </a>
  );
}

function formatLargeNumber(n: string | number): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "—";
  if (num >= 1e15) return (num / 1e15).toFixed(2) + " Q";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + " T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + " B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + " M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + " K";
  return num.toLocaleString();
}
