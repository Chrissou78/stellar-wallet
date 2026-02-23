import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { tokenApi } from "../lib/api";
import TokenIcon from "../components/TokenIcon";
import { Search, Star, Loader2 } from "lucide-react";

function formatRating(val: any): string {
  if (val == null) return "—";
  const n = Number(val);
  return isNaN(n) ? "—" : n.toFixed(1);
}

function normalizeToken(t: any) {
  return {
    assetCode: t.assetCode ?? t.asset_code ?? "",
    assetIssuer: t.assetIssuer ?? t.asset_issuer ?? "native",
    assetType: t.assetType ?? t.asset_type ?? "",
    tomlName: t.tomlName ?? t.toml_name ?? "",
    tomlImage: t.tomlImage ?? t.toml_image ?? "",
    domain: t.domain ?? "",
    isVerified: t.isVerified ?? t.is_verified ?? false,
    ratingAverage: t.ratingAverage ?? t.rating_average ?? null,
    trustlinesFunded: t.trustlinesFunded ?? t.trustlines_funded ?? null,
  };
}

function unwrap(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.tokens)) return raw.tokens;
  return [];
}

export default function TokensPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating");

  const { data: featuredRaw, isLoading: loadingFeatured, error: featuredError } = useQuery({ queryKey: ["tokens-featured"], queryFn: tokenApi.featured });
  const { data: searchRaw, isLoading: loadingSearch, error: searchError } = useQuery({ queryKey: ["tokens-search", query, sortBy], queryFn: () => tokenApi.search(query, sortBy), enabled: query.length > 0 });

  const tokens = (query.length > 0 ? unwrap(searchRaw) : unwrap(featuredRaw)).map(normalizeToken);
  const isLoading = query.length > 0 ? loadingSearch : loadingFeatured;
  const error = query.length > 0 ? searchError : featuredError;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t("tokens.title")}</h1>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stellar-muted" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("tokens.searchPlaceholder")} className="w-full pl-10 pr-4 py-3 rounded-lg bg-stellar-card border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue" />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-3 rounded-lg bg-stellar-card border border-stellar-border text-white focus:outline-none focus:border-stellar-blue">
          <option value="rating">{t("tokens.sortRating")}</option>
          <option value="volume">{t("tokens.sortVolume")}</option>
          <option value="trustlines">{t("tokens.sortTrustlines")}</option>
          <option value="name">{t("tokens.sortName")}</option>
        </select>
      </div>

      {error && (
        <div className="bg-stellar-danger/10 border border-stellar-danger/30 rounded-lg p-4">
          <p className="text-sm text-stellar-danger">{t("tokens.failedToLoad", { error: (error as Error).message })}</p>
          <p className="text-xs text-stellar-muted mt-1">{t("common.backendError")}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-stellar-muted" size={32} /></div>
      ) : tokens.length === 0 && !error ? (
        <p className="text-stellar-muted text-center py-12">
          {query ? t("tokens.noSearchResults", { query }) : t("tokens.noFeatured")}
        </p>
      ) : (
        <div className="space-y-2">
          {tokens.map((tk) => (
            <Link key={`${tk.assetCode}-${tk.assetIssuer}`} to={`/tokens/${encodeURIComponent(tk.assetCode)}/${encodeURIComponent(tk.assetIssuer || "native")}`} className="flex items-center justify-between bg-stellar-card border border-stellar-border rounded-xl px-5 py-4 hover:border-stellar-blue/50 transition-colors">
              <div className="flex items-center gap-4">
                <TokenIcon code={tk.assetCode} image={tk.tomlImage} size={36} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{tk.assetCode}</p>
                    {tk.isVerified && (<span className="text-[10px] px-1.5 py-0.5 rounded bg-stellar-success/20 text-stellar-success font-medium">{t("tokens.verified").toUpperCase()}</span>)}
                  </div>
                  <p className="text-xs text-stellar-muted">{tk.tomlName || tk.domain || t("common.unknown")}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400" />
                  <span className="text-sm text-white">{formatRating(tk.ratingAverage)}</span>
                </div>
                <p className="text-xs text-stellar-muted">{tk.trustlinesFunded ? `${Number(tk.trustlinesFunded).toLocaleString()} ${t("tokens.holders").toLowerCase()}` : ""}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && !error && (
        <p className="text-xs text-stellar-muted text-center">
          {t("common.showing", { count: tokens.length, item: tokens.length !== 1 ? t("common.tokens") : t("common.token") })}
        </p>
      )}
    </div>
  );
}
