import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWalletStore } from "../src/shared/store/wallet";
import { tokenApi } from "../src/shared/lib/api";
import TokenIcon from "../src/components/TokenIcon";
import {
  ChevronLeft, Star, CheckCircle, ExternalLink, Globe, Shield,
  ArrowUpRight, ArrowLeftRight, Copy, Check,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";

function formatNumber(n: number | string | null): string {
  if (!n) return "–";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toFixed(2);
}

export default function TokenDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { code, issuer } = useLocalSearchParams<{ code: string; issuer: string }>();
  const publicKey = useWalletStore(
    (s) => s.accounts.find((a) => a.id === s.activeAccountId)?.publicKey ?? ""
  );
  const [copiedIssuer, setCopiedIssuer] = useState(false);

  const { data: token, isLoading } = useQuery({
    queryKey: ["token-detail", code, issuer],
    queryFn: () => tokenApi.detail(code!, issuer!),
    enabled: !!code && !!issuer,
  });

  const copyIssuer = async () => {
    if (token?.assetIssuer) {
      await Clipboard.setStringAsync(token.assetIssuer);
      setCopiedIssuer(true);
      setTimeout(() => setCopiedIssuer(false), 2000);
    }
  };

  const toggleFavorite = async () => {
    if (!publicKey || !code) return;
    try {
      await tokenApi.toggleFavorite(publicKey, code, issuer || "native");
      queryClient.invalidateQueries({ queryKey: ["token-detail", code, issuer] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    } catch (e: any) {
      Alert.alert(t("common.error", "Error"), e.message);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0e1a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  if (!token || token.error) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0e1a" }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#111827" }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <ChevronLeft size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>{code}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#6b7280", fontSize: 14 }}>{t("tokens.notFound", "Token not found")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0e1a" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: 52,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: "#111827",
          borderBottomWidth: 1,
          borderBottomColor: "#1f2937",
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <ChevronLeft size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", flex: 1 }}>
          {token.assetCode}
        </Text>
        <TouchableOpacity onPress={toggleFavorite} style={{ padding: 8 }}>
          <Star
            size={20}
            color="#f59e0b"
            fill={token.isFavorite ? "#f59e0b" : "transparent"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        {/* Token Header */}
        <View style={{ alignItems: "center", paddingVertical: 20, gap: 8 }}>
          <TokenIcon code={token.assetCode} image={token.tomlImage} size={64} />
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700" }}>{token.assetCode}</Text>
          {token.tomlName && (
            <Text style={{ color: "#6b7280", fontSize: 14 }}>{token.tomlName}</Text>
          )}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {token.isVerified && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(16,185,129,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <CheckCircle size={12} color="#10b981" />
                <Text style={{ color: "#10b981", fontSize: 11, fontWeight: "500" }}>Verified</Text>
              </View>
            )}
            {token.domain && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(59,130,246,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Globe size={12} color="#3b82f6" />
                <Text style={{ color: "#3b82f6", fontSize: 11 }}>{token.domain}</Text>
              </View>
            )}
          </View>
          {token.ratingAverage != null && Number(token.ratingAverage) > 0 && (
            <Text style={{ color: "#f59e0b", fontSize: 16, fontWeight: "600" }}>
              ★ {Number(token.ratingAverage).toFixed(1)}
            </Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/send")}
            style={{ flex: 1, backgroundColor: "#3b82f6", borderRadius: 12, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
          >
            <ArrowUpRight size={14} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>{t("nav.send", "Send")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/swap")}
            style={{ flex: 1, backgroundColor: "#8b5cf6", borderRadius: 12, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
          >
            <ArrowLeftRight size={14} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>{t("nav.swap", "Swap")}</Text>
          </TouchableOpacity>
        </View>

        {/* Asset Details */}
        <View style={{ backgroundColor: "#111827", borderRadius: 14, borderWidth: 1, borderColor: "#1f2937", padding: 14, gap: 12 }}>
          <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600", textTransform: "uppercase" }}>
            {t("tokens.details", "Asset Details")}
          </Text>

          {[
            { label: "Code", value: token.assetCode },
            { label: "Type", value: token.assetType },
            { label: "Supply", value: formatNumber(token.totalSupply) },
            { label: "Trustlines", value: formatNumber(token.trustlineCount) },
          ].map((row) => (
            <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#6b7280", fontSize: 13 }}>{row.label}</Text>
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "500" }}>{row.value || "–"}</Text>
            </View>
          ))}

          {/* Issuer */}
          {token.assetIssuer && (
            <TouchableOpacity
              onPress={copyIssuer}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#0a0e1a",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#1f2937",
                padding: 10,
                gap: 8,
              }}
            >
              <Text style={{ flex: 1, color: "#6b7280", fontSize: 10, fontFamily: "monospace" }} numberOfLines={1}>
                {token.assetIssuer}
              </Text>
              {copiedIssuer ? <Check size={12} color="#10b981" /> : <Copy size={12} color="#6b7280" />}
            </TouchableOpacity>
          )}
        </View>

        {/* Orderbook */}
        {token.orderbook && (
          <View style={{ backgroundColor: "#111827", borderRadius: 14, borderWidth: 1, borderColor: "#1f2937", padding: 14, gap: 10 }}>
            <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600", textTransform: "uppercase" }}>
              Order Book
            </Text>
            {token.orderbook.spread != null && (
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#6b7280", fontSize: 13 }}>Spread</Text>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "500" }}>
                  {parseFloat(token.orderbook.spread).toFixed(2)}%
                </Text>
              </View>
            )}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#10b981", fontSize: 11, fontWeight: "600", marginBottom: 6 }}>Bids</Text>
                {(token.orderbook.bids || []).slice(0, 5).map((b: any, i: number) => (
                  <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                    <Text style={{ color: "#10b981", fontSize: 10 }}>{parseFloat(b.price).toFixed(4)}</Text>
                    <Text style={{ color: "#6b7280", fontSize: 10 }}>{parseFloat(b.amount).toFixed(0)}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#ef4444", fontSize: 11, fontWeight: "600", marginBottom: 6 }}>Asks</Text>
                {(token.orderbook.asks || []).slice(0, 5).map((a: any, i: number) => (
                  <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                    <Text style={{ color: "#ef4444", fontSize: 10 }}>{parseFloat(a.price).toFixed(4)}</Text>
                    <Text style={{ color: "#6b7280", fontSize: 10 }}>{parseFloat(a.amount).toFixed(0)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Liquidity Pools */}
        {token.liquidityPools && token.liquidityPools.length > 0 && (
          <View style={{ backgroundColor: "#111827", borderRadius: 14, borderWidth: 1, borderColor: "#1f2937", padding: 14, gap: 10 }}>
            <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600", textTransform: "uppercase" }}>
              Liquidity Pools ({token.liquidityPools.length})
            </Text>
            {token.liquidityPools.slice(0, 5).map((pool: any, i: number) => (
              <View key={i} style={{ backgroundColor: "#0a0e1a", borderRadius: 10, padding: 10 }}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "500" }}>
                  {pool.reserves?.map((r: any) => r.asset === "native" ? "XLM" : r.asset?.split(":")[0]).join(" / ")}
                </Text>
                <Text style={{ color: "#6b7280", fontSize: 10, marginTop: 2 }}>
                  Shares: {formatNumber(pool.total_shares)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Description */}
        {token.description && (
          <View style={{ backgroundColor: "#111827", borderRadius: 14, borderWidth: 1, borderColor: "#1f2937", padding: 14 }}>
            <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600", textTransform: "uppercase", marginBottom: 8 }}>
              Description
            </Text>
            <Text style={{ color: "#fff", fontSize: 13, lineHeight: 20 }}>{token.description}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
