import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tokenApi } from "../../shared/lib/api";
import { useTranslation } from "react-i18next";
import TokenIcon from "../../shared/components/TokenIcon";
import {
  ArrowLeft,
  Shield,
  ShieldAlert,
  Star,
  Users,
  BarChart3,
  Copy,
  Check,
  Send,
  ArrowLeftRight,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TokenDetailPage() {
  const { t } = useTranslation();
  const { code, issuer } = useParams<{ code: string; issuer: string }>();
  const navigate = useNavigate();
  const [copiedIssuer, setCopiedIssuer] = useState(false);

  const {
    data: token,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["token-detail", code, issuer],
    queryFn: () => tokenApi.detail(code!, issuer!),
    enabled: !!code && !!issuer,
  });

  const copyIssuer = () => {
    navigator.clipboard.writeText(issuer || "");
    setCopiedIssuer(true);
    toast.success(t("common.copied"));
    setTimeout(() => setCopiedIssuer(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-stellar-blue" size={24} />
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="p-3 space-y-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs text-stellar-muted hover:text-white"
        >
          <ArrowLeft size={14} /> {t("common.back")}
        </button>
        <p className="text-sm text-red-400">{t("tokens.noTokens")}</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-xs text-stellar-muted hover:text-white"
      >
        <ArrowLeft size={14} /> {t("common.back")}
      </button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <TokenIcon
          code={token.assetCode}
          image={token.tomlImage}
          size={40}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">
              {token.assetCode}
            </h2>
            {token.isVerified ? (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 text-[9px]">
                <Shield size={8} /> {t("tokens.verified")}
              </span>
            ) : (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[9px]">
                <ShieldAlert size={8} /> {t("tokens.unverified")}
              </span>
            )}
          </div>
          {token.tomlName && (
            <p className="text-xs text-stellar-muted">{token.tomlName}</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/send?asset=${code}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-stellar-blue text-white text-xs font-medium"
        >
          <Send size={12} /> {t("nav.send")}
        </button>
        <button
          onClick={() => navigate(`/swap?to=${code}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-stellar-purple text-white text-xs font-medium"
        >
          <ArrowLeftRight size={12} /> {t("nav.swap")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-stellar-card border border-stellar-border rounded-lg p-2.5">
          <div className="flex items-center gap-1 mb-1">
            <Star size={10} className="text-yellow-400" />
            <span className="text-[9px] text-stellar-muted uppercase">
              {t("tokens.rating")}
            </span>
          </div>
          <p className="text-sm font-bold text-white">
            {token.ratingAverage != null
              ? Number(token.ratingAverage).toFixed(1) + "/10"
              : "—"}
          </p>
        </div>
        <div className="bg-stellar-card border border-stellar-border rounded-lg p-2.5">
          <div className="flex items-center gap-1 mb-1">
            <Users size={10} className="text-stellar-blue" />
            <span className="text-[9px] text-stellar-muted uppercase">
              {t("tokens.holders")}
            </span>
          </div>
          <p className="text-sm font-bold text-white">
            {token.trustlinesFunded
              ? Number(token.trustlinesFunded).toLocaleString()
              : "—"}
          </p>
        </div>
        <div className="bg-stellar-card border border-stellar-border rounded-lg p-2.5">
          <div className="flex items-center gap-1 mb-1">
            <BarChart3 size={10} className="text-stellar-purple" />
            <span className="text-[9px] text-stellar-muted uppercase">
              {t("tokens.trades")}
            </span>
          </div>
          <p className="text-sm font-bold text-white">
            {token.tradesCount
              ? Number(token.tradesCount).toLocaleString()
              : "—"}
          </p>
        </div>
        <div className="bg-stellar-card border border-stellar-border rounded-lg p-2.5">
          <div className="flex items-center gap-1 mb-1">
            <BarChart3 size={10} className="text-green-400" />
            <span className="text-[9px] text-stellar-muted uppercase">
              {t("tokens.payments")}
            </span>
          </div>
          <p className="text-sm font-bold text-white">
            {token.paymentsCount
              ? Number(token.paymentsCount).toLocaleString()
              : "—"}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-stellar-card border border-stellar-border rounded-lg p-3 space-y-2 text-[11px]">
        <div className="flex justify-between">
          <span className="text-stellar-muted">
            {t("tokens.assetType")}
          </span>
          <span className="text-white">{token.assetType}</span>
        </div>
        {token.domain && (
          <div className="flex justify-between">
            <span className="text-stellar-muted">
              {t("tokens.domain")}
            </span>
            <span className="text-stellar-blue">{token.domain}</span>
          </div>
        )}
        {issuer && issuer !== "native" && (
          <div className="flex justify-between items-center">
            <span className="text-stellar-muted">
              {t("tokens.assetIssuer")}
            </span>
            <button
              onClick={copyIssuer}
              className="flex items-center gap-1 text-stellar-muted hover:text-white"
            >
              <span className="font-mono text-[9px]">
                {issuer.slice(0, 8)}…{issuer.slice(-6)}
              </span>
              {copiedIssuer ? (
                <Check size={10} className="text-green-400" />
              ) : (
                <Copy size={10} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {token.tomlDescription && (
        <div className="bg-stellar-card border border-stellar-border rounded-lg p-3">
          <p className="text-[11px] text-stellar-muted leading-relaxed">
            {token.tomlDescription}
          </p>
        </div>
      )}
    </div>
  );
}