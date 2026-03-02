import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Star,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react-native";
import { useWalletStore } from "../../src/shared/store/wallet";

const HORIZON_URL = "https://horizon-testnet.stellar.org";

interface StellarBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
  is_authorized?: boolean;
}

interface TokenItem {
  id: string;
  code: string;
  issuer: string;
  balance: string;
  isFavorite: boolean;
  isNative: boolean;
}

// Fetch all balances (trustlines) for the active account
async function fetchAccountTokens(publicKey: string): Promise<TokenItem[]> {
  const res = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
  if (!res.ok) {
    if (res.status === 404) return []; // Account not funded yet
    throw new Error("Failed to fetch account");
  }
  const data = await res.json();
  const balances: StellarBalance[] = data.balances || [];

  return balances.map((b, i) => ({
    id: b.asset_type === "native" ? "XLM" : `${b.asset_code}-${b.asset_issuer}`,
    code: b.asset_type === "native" ? "XLM" : b.asset_code || "Unknown",
    issuer:
      b.asset_type === "native"
        ? "Stellar Native"
        : b.asset_issuer || "Unknown",
    balance: parseFloat(b.balance).toFixed(4),
    isFavorite: i < 7, // First 7 are "favorites" — or use a persisted set
    isNative: b.asset_type === "native",
  }));
}

// Fetch the full directory of known assets from StellarExpert
async function fetchAssetDirectory(
  network: "testnet" | "public"
): Promise<TokenItem[]> {
  const base =
    network === "public"
      ? "https://api.stellar.expert/explorer/public"
      : "https://api.stellar.expert/explorer/testnet";

  const res = await fetch(`${base}/asset?order=desc&limit=200`);
  if (!res.ok) return [];
  const data = await res.json();

  return (data._embedded?.records || []).map((r: any) => {
    const parts = (r.asset || "").split("-");
    return {
      id: r.asset,
      code: parts[0] || "Unknown",
      issuer: parts[1]
        ? `${parts[1].slice(0, 8)}...${parts[1].slice(-4)}`
        : "",
      balance: "—",
      isFavorite: false,
      isNative: false,
    };
  });
}

type TabFilter = "all" | "favorites" | "directory";

export default function TokensScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { accounts, activeAccountId, network } = useWalletStore();
  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");

  // Fetch user's own tokens (trustlines + balances)
  const {
    data: myTokens = [],
    isLoading: loadingMy,
    refetch: refetchMy,
  } = useQuery({
    queryKey: ["tokens", activeAccount?.publicKey],
    queryFn: () => fetchAccountTokens(activeAccount!.publicKey),
    enabled: !!activeAccount,
    staleTime: 30_000,
  });

  // Fetch directory of all known assets
  const {
    data: directoryTokens = [],
    isLoading: loadingDir,
    refetch: refetchDir,
  } = useQuery({
    queryKey: ["asset-directory", network],
    queryFn: () => fetchAssetDirectory(network),
    staleTime: 5 * 60_000, // cache 5 min
  });

  const isLoading = loadingMy || loadingDir;

  const onRefresh = useCallback(() => {
    refetchMy();
    refetchDir();
  }, [refetchMy, refetchDir]);

  // Merge & filter
  const displayTokens = useMemo(() => {
    let tokens: TokenItem[];

    switch (tab) {
      case "favorites":
        tokens = myTokens.filter((t) => t.isFavorite);
        break;
      case "directory":
        // Show directory assets the user does NOT already hold
        const myIds = new Set(myTokens.map((t) => t.id));
        tokens = directoryTokens.filter((t) => !myIds.has(t.id));
        break;
      case "all":
      default:
        tokens = myTokens;
        break;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      tokens = tokens.filter(
        (t) =>
          t.code.toLowerCase().includes(q) ||
          t.issuer.toLowerCase().includes(q)
      );
    }

    return tokens;
  }, [tab, myTokens, directoryTokens, search]);

  const renderToken = ({ item }: { item: TokenItem }) => (
    <TouchableOpacity
      style={styles.tokenRow}
      onPress={() =>
        router.push({
          pathname: "/token-detail",
          params: { code: item.code, issuer: item.issuer, id: item.id },
        })
      }
    >
      {/* Token icon placeholder */}
      <View style={styles.tokenIcon}>
        <Text style={styles.tokenIconText}>
          {item.code.slice(0, 2).toUpperCase()}
        </Text>
      </View>

      <View style={styles.tokenInfo}>
        <View style={styles.tokenNameRow}>
          <Text style={styles.tokenCode}>{item.code}</Text>
          {item.isFavorite && <Star size={14} color="#f59e0b" fill="#f59e0b" />}
        </View>
        <Text style={styles.tokenIssuer} numberOfLines={1}>
          {item.isNative ? "Stellar Native" : item.issuer}
        </Text>
      </View>

      <View style={styles.tokenBalance}>
        <Text style={styles.balanceText}>{item.balance}</Text>
      </View>

      <ChevronRight size={16} color="#6b7280" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("tokens.title")}</Text>
        <Text style={styles.headerSubtitle}>
          {myTokens.length} {t("tokens.held")}
          {directoryTokens.length > 0 &&
            ` · ${directoryTokens.length} ${t("tokens.available")}`}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Search size={18} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder={t("tokens.searchPlaceholder")}
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["all", "favorites", "directory"] as TabFilter[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text
              style={[styles.tabText, tab === key && styles.tabTextActive]}
            >
              {key === "all"
                ? `${t("tokens.myTokens")} (${myTokens.length})`
                : key === "favorites"
                ? `${t("tokens.favorites")} (${myTokens.filter((t) => t.isFavorite).length})`
                : `${t("tokens.explore")} (${directoryTokens.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {isLoading && displayTokens.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>{t("common.loading")}</Text>
        </View>
      ) : displayTokens.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            {search
              ? t("tokens.noSearchResults")
              : tab === "favorites"
              ? t("tokens.noFavorites")
              : t("tokens.noTokens")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayTokens}
          keyExtractor={(item) => item.id}
          renderItem={renderToken}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={onRefresh}
              tintColor="#8b5cf6"
            />
          }
          initialNumToRender={20}
          maxToRenderPerBatch={30}
          windowSize={10}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  headerSubtitle: { color: "#9ca3af", fontSize: 13, marginTop: 4 },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15, marginLeft: 8 },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#1e293b",
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#2e1065", borderWidth: 1, borderColor: "#8b5cf6" },
  tabText: { color: "#9ca3af", fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: "#8b5cf6" },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  tokenIconText: { color: "#8b5cf6", fontSize: 14, fontWeight: "700" },
  tokenInfo: { flex: 1, marginLeft: 12 },
  tokenNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tokenCode: { color: "#fff", fontSize: 16, fontWeight: "600" },
  tokenIssuer: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  tokenBalance: { marginRight: 8, alignItems: "flex-end" },
  balanceText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#9ca3af", marginTop: 12 },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyText: { color: "#6b7280", fontSize: 15, textAlign: "center" },
});
