import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { tokenApi } from "../../shared/lib/api";
import TokenIcon from "../../shared/components/TokenIcon";
import { Search, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Tokens() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const { data: featured, isLoading: loadingFeatured } = useQuery({
    queryKey: ["featured"],
    queryFn: () => tokenApi.featured(),
  });

  const { data: results, isLoading: searching } = useQuery({
    queryKey: ["search", query],
    queryFn: () => tokenApi.search(query),
    enabled: query.length >= 2,
  });

  const tokens = query.length >= 2 ? results : featured;
  const loading = query.length >= 2 ? searching : loadingFeatured;
  const list = Array.isArray(tokens)
    ? tokens
    : (tokens as any)?.data || [];

  return (
    <div className="p-4 space-y-3">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stellar-muted"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("tokens.searchPlaceholder")}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-stellar-card border border-stellar-border text-sm text-white placeholder:text-stellar-muted focus:outline-none focus:border-stellar-blue"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-stellar-blue" size={24} />
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-stellar-muted text-center py-8">
          {query.length >= 2
            ? t("tokens.noSearchResults", { query })
            : t("tokens.noFeatured")}
        </p>
      ) : (
        <div className="space-y-1">
          {list.map((token: any) => (
            <Link
              key={`${token.assetCode}-${token.assetIssuer || "native"}`}
              to={`/tokens/${encodeURIComponent(token.assetCode)}/${encodeURIComponent(token.assetIssuer || "native")}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <TokenIcon
                code={token.assetCode}
                image={token.tomlImage}
                size={32}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  {token.assetCode}
                </p>
                <p className="text-xs text-stellar-muted truncate">
                  {token.tomlName || token.homeDomain || ""}
                </p>
              </div>
              {token.isVerified && (
                <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                  {t("tokens.verified")}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {list.length > 0 && (
        <p className="text-[10px] text-stellar-muted text-center">
          {t("common.showing", {
            count: list.length,
            item:
              list.length === 1 ? t("common.token") : t("common.tokens"),
          })}
        </p>
      )}
    </div>
  );
}