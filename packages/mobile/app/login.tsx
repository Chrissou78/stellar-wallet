import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../src/shared/store/auth";

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError(t("auth.emailRequired"));
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // Auth store will set isAuthenticated; index.tsx will route appropriately
      router.replace("/");
    } catch (e: any) {
      setError(e.message || t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0f172a" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 8 }}>
          {t("auth.welcomeBack")}
        </Text>
        <Text style={{ fontSize: 14, color: "#94a3b8", textAlign: "center", marginBottom: 32 }}>
          {t("auth.loginSubtitle")}
        </Text>

        {error ? (
          <View style={{ backgroundColor: "#7f1d1d", borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: "#fca5a5", fontSize: 14 }}>{error}</Text>
          </View>
        ) : null}

        <Text style={{ color: "#94a3b8", fontSize: 14, marginBottom: 6 }}>{t("auth.email")}</Text>
        <TextInput
          style={{
            backgroundColor: "#1e293b",
            color: "#fff",
            borderRadius: 8,
            padding: 14,
            fontSize: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#334155",
          }}
          value={email}
          onChangeText={setEmail}
          placeholder={t("auth.emailPlaceholder")}
          placeholderTextColor="#475569"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={{ color: "#94a3b8", fontSize: 14, marginBottom: 6 }}>{t("auth.password")}</Text>
        <TextInput
          style={{
            backgroundColor: "#1e293b",
            color: "#fff",
            borderRadius: 8,
            padding: 14,
            fontSize: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "#334155",
          }}
          value={password}
          onChangeText={setPassword}
          placeholder={t("auth.passwordPlaceholder")}
          placeholderTextColor="#475569"
          secureTextEntry
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#4338ca" : "#6366f1",
            borderRadius: 8,
            padding: 16,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>{t("auth.login")}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/register")}>
          <Text style={{ color: "#818cf8", fontSize: 14, textAlign: "center" }}>
            {t("auth.noAccount")} <Text style={{ fontWeight: "600" }}>{t("auth.register")}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
