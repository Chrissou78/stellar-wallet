import { View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { useWalletStore } from "../../src/store/wallet";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { Copy } from "lucide-react-native";

export default function ReceivePage() {
  const { t } = useTranslation();
  const publicKey = useWalletStore(
    (s) => s.accounts.find((a) => a.id === s.activeAccountId)?.publicKey ?? ""
  );

  const copyAddress = async () => {
    await Clipboard.setStringAsync(publicKey);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0e1a", alignItems: "center", paddingTop: 80 }}>
      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 24 }}>
        {t("nav.receive", "Receive")}
      </Text>

      <View style={{ backgroundColor: "#fff", padding: 16, borderRadius: 16 }}>
        <QRCode value={publicKey || "stellar"} size={200} />
      </View>

      <TouchableOpacity
        onPress={copyAddress}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: 24,
          backgroundColor: "#111827",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#1f2937",
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginHorizontal: 20,
          alignSelf: "stretch",
        }}
      >
        <Text
          style={{ flex: 1, color: "#6b7280", fontSize: 11, fontFamily: "monospace" }}
          numberOfLines={1}
        >
          {publicKey}
        </Text>
        <Copy size={14} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );
}
