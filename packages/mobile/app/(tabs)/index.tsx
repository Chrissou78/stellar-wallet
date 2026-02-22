import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useWalletStore } from "../../src/store/wallet";
import { useBalances } from "../../src/shared/hooks/useBalances";
import AccountSwitcher from "../../src/components/AccountSwitcher";
import { Settings, Clock, Copy } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

export default function Dashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const publicKey = useWalletStore(
    (s) => s.accounts.find((a) => a.id === s.activeAccountId)?.publicKey ?? ""
  );
  const { data: balances, isLoading } = useBalances();

  const xlmBalance = balances?.find(
    (b) => b.assetCode === "XLM" && (b.assetType === "native" || !b.assetIssuer)
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0e1a" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 52,
          paddingBottom: 10,
          backgroundColor: "#111827",
          borderBottomWidth: 1,
          borderBottomColor: "#1f2937",
        }}
      >
        <View style={{ flex: 1 }}>
          <AccountSwitcher />
        </View>
        <TouchableOpacity onPress={() => router.push("/history")} style={{ padding: 8 }}>
          <Clock size={20} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/settings")} style={{ padding: 8 }}>
          <Settings size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Balance Card */}
        <View
          style={{
            alignItems: "center",
            paddingVertical: 28,
            backgroundColor: "#111827",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#1f2937",
            marginBottom: 20,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 36, fontWeight: "700" }}>
            {xlmBalance ? parseFloat(xlmBalance.balance).toFixed(2) : "0.00"}
          </Text>
          <Text style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>XLM</Text>
        </View>

        {/* Quick Actions */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          {[
            { label: t("nav.send", "Send"), route: "/(tabs)/send", color: "#3b82f6" },
            { label: t("nav.receive", "Receive"), route: "/(tabs)/receive", color: "#8b5cf6" },
            { label: t("nav.swap", "Swap"), route: "/(tabs)/swap", color: "#10b981" },
          ].map((action) => (
            <TouchableOpacity
              key={action.route}
              onPress={() => router.push(action.route as any)}
              style={{
                flex: 1,
                backgroundColor: action.color,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Assets */}
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
          {t("dashboard.assets", "Assets")}
        </Text>

        {isLoading ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 32 }} />
        ) : !balances?.length ? (
          <Text style={{ color: "#6b7280", textAlign: "center", marginTop: 32, fontSize: 14 }}>
            {t("dashboard.noAssets", "No assets yet")}
          </Text>
        ) : (
          balances.map((b) => {
            const code = b.assetCode || "XLM";
            const issuer = b.assetIssuer || "native";
            const hasImage = b.token?.tomlImage;
            return (
              <View
                key={`${code}-${issuer}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  backgroundColor: "#111827",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#1f2937",
                  marginBottom: 8,
                }}
              >
                {hasImage ? (
                  <Image
                    source={{ uri: b.token!.tomlImage }}
                    style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#3b82f6",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
                      {code.charAt(0)}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>{code}</Text>
                  <Text style={{ color: "#6b7280", fontSize: 11 }}>
                    {b.token?.tomlName || (issuer === "native" ? "Stellar Lumens" : issuer.slice(0, 8) + "…")}
                  </Text>
                </View>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                  {parseFloat(b.balance).toFixed(parseFloat(b.balance) > 1000 ? 0 : 2)}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}