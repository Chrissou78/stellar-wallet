import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react-native";

export default function HistoryPage() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0e1a" }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: "#111827", borderBottomWidth: 1, borderBottomColor: "#1f2937" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <ChevronLeft size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>{t("nav.history", "History")}</Text>
      </View>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#6b7280", fontSize: 14 }}>Transaction history coming soon</Text>
      </View>
    </View>
  );
}
