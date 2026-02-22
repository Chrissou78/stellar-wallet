import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

export default function SwapPage() {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: "#0a0e1a", justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>{t("nav.swap", "Swap")}</Text>
      <Text style={{ color: "#6b7280", fontSize: 14, marginTop: 8 }}>Coming soon</Text>
    </View>
  );
}
