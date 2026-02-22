import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Vibration,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../src/shared/store/auth";
import { Fingerprint, Lock, ShieldCheck } from "lucide-react-native";

export default function LockScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    verifyPin, unlock, biometricsEnabled, biometricsAvailable,
    authenticateWithBiometrics,
  } = useAuthStore();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Try biometrics on mount
  useEffect(() => {
    if (biometricsEnabled && biometricsAvailable) {
      tryBiometrics();
    }
  }, []);

  const tryBiometrics = async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      router.replace("/(tabs)");
    }
  };

  const handleUnlock = async () => {
    if (pin.length < 6) {
      setError(t("pin.tooShort", "PIN must be at least 6 characters"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const valid = await verifyPin(pin);
      if (valid) {
        unlock();
        setPin("");
        setAttempts(0);
        router.replace("/(tabs)");
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        Vibration.vibrate(200);
        setError(
          newAttempts >= 5
            ? t("pin.tooManyAttempts", "Too many attempts. Please wait.")
            : t("pin.invalid", "Invalid PIN")
        );
        setPin("");
      }
    } catch {
      setError(t("pin.error", "Error verifying PIN"));
    } finally {
      setLoading(false);
    }
  };

  const isBlocked = attempts >= 5;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0a0e1a",
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: "rgba(59,130,246,0.15)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <Lock size={36} color="#3b82f6" />
      </View>

      <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 8 }}>
        {t("lock.title", "Wallet Locked")}
      </Text>
      <Text style={{ color: "#6b7280", fontSize: 14, textAlign: "center", marginBottom: 32 }}>
        {t("lock.subtitle", "Enter your PIN to unlock")}
      </Text>

      {/* PIN Input */}
      <TextInput
        value={pin}
        onChangeText={setPin}
        placeholder="••••••"
        placeholderTextColor="#6b7280"
        secureTextEntry
        keyboardType="number-pad"
        maxLength={20}
        editable={!isBlocked}
        autoFocus
        style={{
          backgroundColor: "#111827",
          borderWidth: 1,
          borderColor: error ? "#ef4444" : "#1f2937",
          borderRadius: 14,
          color: "#fff",
          paddingHorizontal: 20,
          paddingVertical: 16,
          fontSize: 20,
          textAlign: "center",
          letterSpacing: 8,
          width: "100%",
          marginBottom: 12,
        }}
        onSubmitEditing={handleUnlock}
      />

      {error ? (
        <Text style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, textAlign: "center" }}>
          {error}
        </Text>
      ) : null}

      {/* Unlock Button */}
      <TouchableOpacity
        onPress={handleUnlock}
        disabled={loading || isBlocked}
        style={{
          backgroundColor: "#3b82f6",
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: "center",
          width: "100%",
          opacity: loading || isBlocked ? 0.5 : 1,
          marginBottom: 16,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {t("lock.unlock", "Unlock")}
          </Text>
        )}
      </TouchableOpacity>

      {/* Biometrics Button */}
      {biometricsEnabled && biometricsAvailable && (
        <TouchableOpacity
          onPress={tryBiometrics}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor: "#1f2937",
            borderRadius: 14,
            width: "100%",
          }}
        >
          <Fingerprint size={20} color="#8b5cf6" />
          <Text style={{ color: "#8b5cf6", fontSize: 14, fontWeight: "500" }}>
            {t("lock.useBiometrics", "Use Biometrics")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}