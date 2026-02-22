import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useWalletStore } from "../src/store/wallet";
import LanguageSwitcher from "../src/components/LanguageSwitcher";
import * as Clipboard from "expo-clipboard";
import { Copy, Eye, EyeOff, Shield, LogOut, ChevronLeft, Network, User, Globe } from "lucide-react-native";

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const active = useWalletStore((s) => s.accounts.find((a) => a.id === s.activeAccountId));
  const network = useWalletStore((s) => s.network);
  const setNetwork = useWalletStore((s) => s.setNetwork);
  const unlock = useWalletStore((s) => s.unlock);
  const getSecretKey = useWalletStore((s) => s.getSecretKey);
  const logout = useWalletStore((s) => s.logout);

  const publicKey = active?.publicKey || "";
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [copiedPk, setCopiedPk] = useState(false);
  const [copiedSk, setCopiedSk] = useState(false);

  const copyKey = async (key: string, type: "pk" | "sk") => {
    await Clipboard.setStringAsync(key);
    if (type === "pk") { setCopiedPk(true); setTimeout(() => setCopiedPk(false), 2000); }
    else { setCopiedSk(true); setTimeout(() => setCopiedSk(false), 2000); }
  };

  const handleReveal = async () => {
    if (pin.length < 6) { setPinError(t("onboarding.pinMin", "PIN must be at least 6 characters")); return; }
    try {
      await unlock(pin);
      const sk = getSecretKey();
      setRevealedKey(sk);
      setShowPinInput(false);
      setPin("");
      setPinError("");
    } catch {
      setPinError(t("pin.invalid", "Invalid PIN"));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t("settings.logout", "Logout"),
      t("settings.logoutConfirm", "This will delete all wallets from this device."),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        { text: t("settings.logout", "Logout"), style: "destructive", onPress: () => { logout(); router.replace("/onboarding"); } },
      ]
    );
  };

  const toggleNetwork = () => {
    const next = network === "testnet" ? "public" : "testnet";
    Alert.alert(
      t("settings.switchNetwork", "Switch Network"),
      `${t("settings.switchTo", "Switch to")} ${next}?`,
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        { text: t("common.confirm", "Confirm"), onPress: () => setNetwork(next) },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0e1a" }}>
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
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
          {t("nav.settings", "Settings")}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        {/* Account */}
        <View style={{ backgroundColor: "#111827", borderRadius: 14, borderWidth: 1, borderColor: "#1f2937", padding: 14, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <User size={14} color="#6b7280" />
            <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600", textTransform: "uppercase" }}>
              {t("settings.account", "Account")}
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280", fontSize: 13 }}>{t("onboarding.walletName", "Name")}</Text>
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "500" }}>{active?.name}</Text>
          </View>

          {/* Network */}
          <TouchableOpacity onPress={toggleNetwork} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: "#6b7280", fontSize: 13 }}>{t("settings.network", "Network")}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: network === "testnet" ? "#f59e0b" : "#10b981" }} />
              <Text style={{ color: "#fff", fontSize: 13, textTransform: "capitalize" }}>{network}</Text>
            </View>
          </TouchableOpacity>

          {/* Public Key */}
          <TouchableOpacity
            onPress={() => copyKey(publicKey, "pk")}
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
              {publicKey}
            </Text>
            {copiedPk ? <Check size={12} color="#10b981" /> : <Copy size={12} color="#6b7280" />}
          </TouchableOpacity>
        </View>

        {/* Security */}
        <View style={{ backgroundColor: "#111827", borderRadius: 14, borderWidth: 1, borderColor: "#1f2937", padding: 14, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Shield size={14} color="#6b7280" />
            <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600", textTransform: "uppercase" }}>
              {t("settings.security", "Security")}
            </Text>
          </View>

          {!revealedKey && !showPinInput && (
            <TouchableOpacity
              onPress={() => setShowPinInput(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderWidth: 1,
                borderColor: "#1f2937",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Eye size={16} color="#6b7280" />
              <Text style={{ color: "#6b7280", fontSize: 13 }}>{t("settings.revealSecret", "Reveal Secret Key")}</Text>
            </TouchableOpacity>
          )}

          {showPinInput && (
            <View style={{ gap: 8 }}>
              <TextInput
                value={pin}
                onChangeText={setPin}
                placeholder={t("onboarding.enterPin", "Enter PIN")}
                placeholderTextColor="#6b7280"
                secureTextEntry
                style={{
                  backgroundColor: "#0a0e1a",
                  borderWidth: 1,
                  borderColor: "#1f2937",
                  borderRadius: 10,
                  color: "#fff",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 14,
                }}
              />
              {pinError ? <Text style={{ color: "#ef4444", fontSize: 12 }}>{pinError}</Text> : null}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => { setShowPinInput(false); setPin(""); setPinError(""); }}
                  style={{ flex: 1, borderWidth: 1, borderColor: "#1f2937", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}
                >
                  <Text style={{ color: "#6b7280", fontSize: 13 }}>{t("common.cancel", "Cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleReveal}
                  style={{ flex: 1, backgroundColor: "#3b82f6", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}
                >
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>{t("settings.reveal", "Reveal")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {revealedKey && (
            <View style={{ gap: 8 }}>
              <View style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", borderRadius: 10, padding: 12, gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Shield size={12} color="#ef4444" />
                  <Text style={{ color: "#ef4444", fontSize: 11, fontWeight: "600" }}>
                    {t("settings.secretWarning", "Never share your secret key!")}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => copyKey(revealedKey, "sk")} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ flex: 1, color: "#fff", fontSize: 10, fontFamily: "monospace" }}>{revealedKey}</Text>
                  {copiedSk ? <Check size={12} color="#10b981" /> : <Copy size={12} color="#ef4444" />}
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => { setRevealedKey(null); setCopiedSk(false); }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  borderWidth: 1,
                  borderColor: "#1f2937",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <EyeOff size={16} color="#6b7280" />
                <Text style={{ color: "#6b7280", fontSize: 13 }}>{t("settings.hideSecret", "Hide Secret Key")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Language */}
        <View style={{ backgroundColor: "#111827", borderRadius: 14, borderWidth: 1, borderColor: "#1f2937", padding: 14, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Globe size={14} color="#6b7280" />
            <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600", textTransform: "uppercase" }}>
              {t("settings.language", "Language")}
            </Text>
          </View>
          <LanguageSwitcher />
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.3)",
            borderRadius: 14,
            paddingVertical: 14,
          }}
        >
          <LogOut size={16} color="#ef4444" />
          <Text style={{ color: "#ef4444", fontSize: 14, fontWeight: "500" }}>{t("settings.logout", "Logout")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}