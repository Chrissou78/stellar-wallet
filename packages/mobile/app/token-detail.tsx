import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWalletStore } from "../src/shared/store/wallet";
import { tokenApi } from "../src/shared/lib/api";
import TokenIcon from "../src/components/TokenIcon";
import {
  ChevronLeft, Star, CheckCircle, Globe, Shield,
  ArrowUpRight, ArrowLeftRight, Copy, Check,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";

const API_BASE = "https://stellar-wallet.onrender.com";

function formatNumber(n: number | string | null): string {
  if (!n) return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "—";
  if (num >= 1e15) return (num / 1e15).toFixed(2) + "Q";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toFixed(2);
}

async function fetchFromProxy(code: string, issuer: string) {
  if (code === "XLM" || issuer === "native") return null;
  const res = await fetch(
    `${API_BASE}/api/v1/tokens/expert/${encodeURIComponent(code)}/${encodeURIComponent(issuer)}`
  );
  if (!res.ok) return null;
  const r = await res.json();

  return {
    assetCode: code,
    assetIssuer: issuer,
    assetType: code.length <= 4 ? "credit_alphanum4" : "credit_alphanum12",
    tomlName: r.toml_info?.code || r.toml_info?.name || "",
    tomlImage: r.toml_info?.image || "",
    description: r.toml_info?.desc || "",
    domain: r.home_domain || "",
    isVerified: (r.rating?.average ?? 0) >= 6,
    isFavorite: false,
    totalSupply: r.supply ? String(r.supply) : null,
    trustlineCount: r.trustlines?.total ?? null,
    trustlinesFunded: r.trustlines?.funded ?? null,
    tradesCount: r.trades ?? null,
    paymentsCount: r.payments ?? null,
    ratingAverage: r.rating?.average ?? null,
    price: r.price ?? null,
    orderbook: null,
    liquidityPools: null,
  };
}

async function fetchTokenDetail(code: string, issuer: string) {
  try {
    const result = await tokenApi.detail(code, issuer);
    if (result && !result.error && result.assetCode) return result;
  } catch {}
  const expert = await fetchFromProxy(code, issuer);
  if (expert) return expert;
  throw new Error("Token not found");
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
    queryFn: () => fetchTokenDetail(code!, issuer!),
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
    if (!publicKey || !token) return;
    try {
      // Backend expects numeric token ID, not code/issuer
      if (token.id) {
        await tokenApi.toggleFavorite(publicKey, token.id);
      }
      queryClient.invalidateQueries({ queryKey: ["token-detail", code, issuer] });
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

  if (!token) {
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
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#111827", borderBottomWidth: 1, borderBottomColor: "#1f2937" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <ChevronLeft size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", flex: 1 }}>{token.assetCode}</Text>
        {token.id ? (
          <TouchableOpacity onPress={toggleFavorite} style={{ padding: 8 }}>
            <Star size={20} color="#f59e0b" fill={token.isFavorite ? "#f59e0b" : "transparent"} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        {/* Token Header */}
        <View style={{ alignItems: "center", paddingVertical: 20, gap: 8 }}>
          <TokenIcon code={token.assetCode} image={token.tomlImage} size={64} />
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700" }}>{token.assetCode}</Text>
          {token.tomlName ? <Text style={{ color: "#6b7280", fontSize: 14 }}>{token.tomlName}</Text> : null}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {token.isVerified && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(16,185,129,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <CheckCircle size={12} color="#10b981" />
                <Text style={{ color: "#10b981", fontSize: 11, fontWeight: "500" }}>Verified</Text>
              </View>
            )}
            {token.domain ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(59,130,246,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Globe size={12} color="#3b82f6" />
                <Text style={{ color: "#3b82f6", fontSize: 11 }}>{token.domain}</Text>
              </View>
            ) : null}
          </View>
          {token.ratingAverage != null && Number(token.ratingAverage) > 0 && (
            <Text style={{ color: "#f59e0b", fontSize: 16, fontWeight: "600" }}>
              ★ {Number(token.ratingAverage).toFixed(1)}/10
            </Text>
          )}
          {token.price != null && (
            <Text style={{ color: "#9ca3af", fontSize: 14 }}>
              ${Number(token.price).toFixed(4)}
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

        {/* Stats Grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: t("tokens.holders", "Holders"), value: formatNumber(token.trustlinesFunded), color: "#3b82f6" },
            { label: t("tokens.trades", "Trades"), value: formatNumber(token.tradesCount), color: "#8b5cf6" },
            { label: t("tokens.payments", "Payments"), value: formatNumber(token.paymentsCount), color: "#10b981" },
            { label: t("tokens.totalSupply", "Supply"), value: formatNumber(token.totalSupply), color: "#f59e0b" },
          ].map((stat) => (
            <View key={stat.label} style={{ width: "47%", backgroundColor: "#111827", borderRadius: 12, borderWidth: 1, borderColor: "#1f2937", padding: 12 }}>
              <Text style={{ color: "#6b7280", fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</Text>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* Asset Details */}
        <View style={{ backgroundColor: "#111827", borderRadius: 14, borderWidth: 1, borderColor: "#1f2937", padding: 14, gap: 12 }}>
          <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600", textTransform: "uppercase" }}>
            {t("tokens.details", "Asset Details")}
          </Text>
          {[
            { label: "Code", value: token.assetCode },
            { label: "Type", value: token.assetType },
          ].map((row) => (
            <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#6b7280", fontSize: 13 }}>{row.label}</Text>
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "500" }}>{row.value || "—"}</Text>
            </View>
          ))}
          {token.assetIssuer && token.assetIssuer !== "native" && (
            <TouchableOpacity onPress={copyIssuer} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#0a0e1a", borderRadius: 10, borderWidth: 1, borderColor: "#1f2937", padding: 10, gap: 8 }}>
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
            <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600", textTransform: "uppercase" }}>Order Book</Text>
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

        {/* Description */}
        {token.description ? (
          <View style={{ backgroundColor: "#111827", borderRadius: 14, borderWidth: 1, borderColor: "#1f2937", padding: 14 }}>
            <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600", textTransform: "uppercase", marginBottom: 8 }}>Description</Text>
            <Text style={{ color: "#fff", fontSize: 13, lineHeight: 20 }}>{token.description}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
