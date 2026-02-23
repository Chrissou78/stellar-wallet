import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Clipboard from "expo-clipboard";
import { useAuthStore } from "../src/shared/store/auth";
import { useWalletStore } from "../src/shared/store/wallet";
import { PinModal } from "../src/shared/components/PinModal";
import { LanguageSwitcher } from "../src/shared/components/LanguageSwitcher";
import { NetworkSwitcher } from "../src/shared/components/NetworkSwitcher";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const lock = useAuthStore((s) => s.lock);
  const logout = useAuthStore((s) => s.logout);
  const verifyPin = useAuthStore((s) => s.verifyPin);

  const activeAccount = useWalletStore((s) => {
    const id = s.activeAccountId;
    return s.accounts.find((a) => a.id === id);
  });
  const getSecretKey = useWalletStore((s) => s.getSecretKey);
  const clearWallets = useWalletStore((s) => s.clearAccounts);

  const [showPin, setShowPin] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRevealSecret = () => {
    setShowPin(true);
  };

  const onPinVerified = (pin: string) => {
    if (verifyPin(pin) && activeAccount) {
      const secret = getSecretKey(activeAccount.id, pin);
      if (secret) setRevealedSecret(secret);
    }
    setShowPin(false);
  };

  const handleLock = () => {
    lock();
    router.replace("/lock-screen");
  };

  const handleLogout = () => {
    Alert.alert(t("settings.logoutTitle"), t("settings.logoutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.logout"),
        style: "destructive",
        onPress: async () => {
          await logout();
          clearWallets?.();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }} contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#818cf8", fontSize: 16 }}>{t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginLeft: 16 }}>
          {t("nav.settings")}
        </Text>
      </View>

      {/* Profile */}
      <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>{t("settings.account")}</Text>
        <Text style={{ color: "#fff", fontSize: 16 }}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={{ color: "#64748b", fontSize: 14 }}>{user?.email}</Text>
      </View>

      {/* Active Wallet */}
      {activeAccount && (
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>{t("settings.activeWallet")}</Text>
          <Text style={{ color: "#fff", fontSize: 16, marginBottom: 8 }}>{activeAccount.name}</Text>

          <TouchableOpacity
            onPress={() => copyToClipboard(activeAccount.publicKey, "pubkey")}
            style={{ marginBottom: 8 }}
          >
            <Text style={{ color: "#64748b", fontSize: 12 }}>{t("settings.publicKey")}</Text>
            <Text style={{ color: "#818cf8", fontSize: 13 }} numberOfLines={1}>
              {activeAccount.publicKey}
            </Text>
            {copied === "pubkey" && <Text style={{ color: "#4ade80", fontSize: 12 }}>{t("common.copied")}</Text>}
          </TouchableOpacity>

          {revealedSecret ? (
            <View>
              <Text style={{ color: "#f87171", fontSize: 12 }}>{t("settings.secretKey")}</Text>
              <TouchableOpacity onPress={() => copyToClipboard(revealedSecret, "secret")}>
                <Text style={{ color: "#fbbf24", fontSize: 13 }} numberOfLines={1}>
                  {revealedSecret}
                </Text>
                {copied === "secret" && <Text style={{ color: "#4ade80", fontSize: 12 }}>{t("common.copied")}</Text>}
              </TouchableOpacity>
              <Text style={{ color: "#f87171", fontSize: 11, marginTop: 4 }}>{t("settings.secretWarning")}</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={handleRevealSecret}>
              <Text style={{ color: "#f59e0b", fontSize: 14 }}>{t("settings.revealSecret")}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Language */}
      <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>{t("settings.language")}</Text>
        <LanguageSwitcher />
      </View>

      {/* Network */}
      <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>{t("settings.network")}</Text>
        <NetworkSwitcher />
      </View>

      {/* Lock */}
      <TouchableOpacity
        onPress={handleLock}
        style={{
          backgroundColor: "#1e293b",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#818cf8", fontSize: 16, fontWeight: "600" }}>{t("settings.lockApp")}</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          backgroundColor: "#7f1d1d",
          borderRadius: 12,
          padding: 16,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fca5a5", fontSize: 16, fontWeight: "600" }}>{t("settings.logout")}</Text>
      </TouchableOpacity>

      <PinModal
        visible={showPin}
        onClose={() => setShowPin(false)}
        onSubmit={onPinVerified}
      />
    </ScrollView>
  );
}
