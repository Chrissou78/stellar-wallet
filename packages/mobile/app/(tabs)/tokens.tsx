import { useState } from "react";
import { View, Text, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { tokenApi } from "../../src/shared/lib/api";
import { Search } from "lucide-react-native";

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
  const list = Array.isArray(tokens) ? tokens : (tokens as any)?.data || [];

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0e1a", paddingTop: 56 }}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 12 }}>
          {t("nav.tokens", "Tokens")}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#111827",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#1f2937",
            paddingHorizontal: 12,
          }}
        >
          <Search size={16} color="#6b7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("tokens.search", "Search tokens…")}
            placeholderTextColor="#6b7280"
            style={{ flex: 1, color: "#fff", paddingVertical: 12, paddingLeft: 8, fontSize: 14 }}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#3b82f6" style={{ marginTop: 32 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          {list.map((token: any) => (
            <View
              key={`${token.assetCode}-${token.assetIssuer || "native"}`}
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
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#8b5cf6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
                  {(token.assetCode || "?").charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                  {token.assetCode}
                </Text>
                <Text style={{ color: "#6b7280", fontSize: 11 }}>
                  {token.tomlName || token.homeDomain || ""}
                </Text>
              </View>
              {token.isVerified && (
                <View style={{ backgroundColor: "rgba(16,185,129,0.2)", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: "#10b981", fontSize: 10 }}>✓</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
