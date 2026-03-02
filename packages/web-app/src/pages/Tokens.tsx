import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { tokenApi } from "../lib/api";
import TokenIcon from "../components/TokenIcon";
import { Search, Star, Loader2, Globe, List } from "lucide-react";

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
    isFeatured: t.isFeatured ?? t.is_featured ?? false,
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

// Fetch directory from StellarExpert (top 200 by rating)
async function fetchStellarExpertDirectory(): Promise<any[]> {
  const API_BASE =
    import.meta.env.VITE_API_URL || "http://localhost:3001";
  const res = await fetch(`${API_BASE}/api/v1/tokens/directory?order=desc&limit=200`);
  if (!res.ok) return [];
  const data = await res.json();
  const records = data._embedded?.records || [];

  return records.map((r: any) => {
    const raw = r.asset || "";
    const firstDash = raw.indexOf("-");
    const lastDash = raw.lastIndexOf("-");

    const code = firstDash > 0 ? raw.substring(0, firstDash) : raw;
    const issuer =
      firstDash > 0 && lastDash > firstDash
        ? raw.substring(firstDash + 1, lastDash)
        : firstDash > 0
        ? raw.substring(firstDash + 1)
        : "native";

    return {
      assetCode: code,
      assetIssuer: issuer,
      assetType: issuer === "native" ? "native" : "credit_alphanum4",
      tomlName: r.tomlInfo?.name || r.tomlInfo?.orgName || "",
      tomlImage: r.tomlInfo?.image || "",
      domain: r.domain || "",
      isVerified: (r.rating?.average ?? 0) >= 6,
      isFeatured: false,
      ratingAverage: r.rating?.average ?? null,
      trustlinesFunded: r.trustlines?.funded ?? null,
    };
  });
}

type TabFilter = "all" | "featured" | "explore";

export default function TokensPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [tab, setTab] = useState<TabFilter>("all");

  // Backend featured tokens (your 7 curated tokens)
  const {
    data: featuredRaw,
    isLoading: loadingFeatured,
    error: featuredError,
  } = useQuery({
    queryKey: ["tokens-featured"],
    queryFn: tokenApi.featured,
  });

  // Backend search
  const {
    data: searchRaw,
    isLoading: loadingSearch,
    error: searchError,
  } = useQuery({
    queryKey: ["tokens-search", query, sortBy],
    queryFn: () => tokenApi.search(query, sortBy),
    enabled: query.length > 0,
  });

  // StellarExpert directory (200+ tokens)
  const {
    data: directoryTokens = [],
    isLoading: loadingDirectory,
  } = useQuery({
    queryKey: ["stellar-expert-directory"],
    queryFn: fetchStellarExpertDirectory,
    staleTime: 5 * 60_000,
  });

  const featuredTokens = unwrap(featuredRaw).map(normalizeToken);
  const searchTokens = unwrap(searchRaw).map(normalizeToken);

  // Merge: backend featured + directory, deduplicated
  const allTokens = useMemo(() => {
    const map = new Map<string, any>();

    // Backend tokens first (higher priority — have images, verified status)
    featuredTokens.forEach((tk) => {
      const key = `${tk.assetCode}-${tk.assetIssuer}`;
      map.set(key, tk);
    });

    // Directory tokens fill in the rest
    directoryTokens.forEach((tk: any) => {
      const key = `${tk.assetCode}-${tk.assetIssuer}`;
      if (!map.has(key)) {
        map.set(key, tk);
      }
    });

    const merged = Array.from(map.values());

    // Sort
    merged.sort((a, b) => {
      const ra = Number(a.ratingAverage) || 0;
      const rb = Number(b.ratingAverage) || 0;
      return rb - ra;
    });

    return merged;
  }, [featuredTokens, directoryTokens]);

  // Determine which tokens to display
  const displayTokens = useMemo(() => {
    // If searching, use backend search results
    if (query.length > 0) {
      // Also search directory tokens client-side
      const q = query.toLowerCase();
      const dirMatches = directoryTokens.filter(
        (tk: any) =>
          tk.assetCode.toLowerCase().includes(q) ||
          tk.tomlName.toLowerCase().includes(q) ||
          tk.domain.toLowerCase().includes(q)
      );

      // Merge search results with directory matches
      const map = new Map<string, any>();
      searchTokens.forEach((tk) => map.set(`${tk.assetCode}-${tk.assetIssuer}`, tk));
      dirMatches.forEach((tk: any) => {
        const key = `${tk.assetCode}-${tk.assetIssuer}`;
        if (!map.has(key)) map.set(key, tk);
      });
      return Array.from(map.values());
    }

    switch (tab) {
      case "featured":
        return featuredTokens;
      case "explore":
        // Directory tokens not in featured
        const featuredKeys = new Set(
          featuredTokens.map((tk) => `${tk.assetCode}-${tk.assetIssuer}`)
        );
        return directoryTokens.filter(
          (tk: any) => !featuredKeys.has(`${tk.assetCode}-${tk.assetIssuer}`)
        );
      case "all":
      default:
        return allTokens;
    }
  }, [query, tab, searchTokens, featuredTokens, directoryTokens, allTokens]);

  const isLoading =
    query.length > 0
      ? loadingSearch
      : loadingFeatured || loadingDirectory;
  const error = query.length > 0 ? searchError : featuredError;

  const tabs: { key: TabFilter; icon: any; label: string; count: number }[] = [
    { key: "all", icon: List, label: t("tokens.allTokens", "All Tokens"), count: allTokens.length },
    { key: "featured", icon: Star, label: t("tokens.featured", "Featured"), count: featuredTokens.length },
    { key: "explore", icon: Globe, label: t("tokens.explore", "Explore"), count: directoryTokens.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("tokens.title")}</h1>
          <p className="text-sm text-stellar-muted mt-1">
            {allTokens.length} {t("tokens.tokensAvailable", "tokens available")}
          </p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stellar-muted"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("tokens.searchPlaceholder")}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-stellar-card border border-stellar-border text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-3 rounded-lg bg-stellar-card border border-stellar-border text-white focus:outline-none focus:border-stellar-blue"
        >
          <option value="rating">{t("tokens.sortRating")}</option>
          <option value="volume">{t("tokens.sortVolume")}</option>
          <option value="trustlines">{t("tokens.sortTrustlines")}</option>
          <option value="name">{t("tokens.sortName")}</option>
        </select>
      </div>

      {/* Tabs */}
      {query.length === 0 && (
        <div className="flex gap-2">
          {tabs.map(({ key, icon: Icon, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-stellar-blue/20 text-stellar-blue border border-stellar-blue/40"
                  : "bg-stellar-card border border-stellar-border text-stellar-muted hover:text-white hover:border-stellar-blue/30"
              }`}
            >
              <Icon size={16} />
              {label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === key
                    ? "bg-stellar-blue/30 text-stellar-blue"
                    : "bg-stellar-border text-stellar-muted"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-stellar-danger/10 border border-stellar-danger/30 rounded-lg p-4">
          <p className="text-sm text-stellar-danger">
            {t("tokens.failedToLoad", { error: (error as Error).message })}
          </p>
          <p className="text-xs text-stellar-muted mt-1">
            {t("common.backendError")}
          </p>
        </div>
      )}

      {/* Token List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-stellar-muted" size={32} />
        </div>
      ) : displayTokens.length === 0 && !error ? (
        <p className="text-stellar-muted text-center py-12">
          {query
            ? t("tokens.noSearchResults", { query })
            : t("tokens.noFeatured")}
        </p>
      ) : (
        <div className="space-y-2">
          {displayTokens.map((tk) => (
            <Link
              key={`${tk.assetCode}-${tk.assetIssuer}`}
              to={`/tokens/${encodeURIComponent(tk.assetCode)}/${encodeURIComponent(tk.assetIssuer || "native")}`}
              className="flex items-center justify-between bg-stellar-card border border-stellar-border rounded-xl px-5 py-4 hover:border-stellar-blue/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <TokenIcon
                  code={tk.assetCode}
                  image={tk.tomlImage}
                  size={36}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{tk.assetCode}</p>
                    {tk.isVerified && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stellar-success/20 text-stellar-success font-medium">
                        {t("tokens.verified").toUpperCase()}
                      </span>
                    )}
                    {tk.isFeatured && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 font-medium">
                        FEATURED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stellar-muted">
                    {tk.tomlName || tk.domain || t("common.unknown")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400" />
                  <span className="text-sm text-white">
                    {formatRating(tk.ratingAverage)}
                  </span>
                </div>
                <p className="text-xs text-stellar-muted">
                  {tk.trustlinesFunded
                    ? `${Number(tk.trustlinesFunded).toLocaleString()} ${t("tokens.holders", "holders").toLowerCase()}`
                    : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer count */}
      {!isLoading && !error && (
        <p className="text-xs text-stellar-muted text-center">
          {t("common.showing", {
            count: displayTokens.length,
            item:
              displayTokens.length !== 1
                ? t("common.tokens")
                : t("common.token"),
          })}
        </p>
      )}
    </div>
  );
}
