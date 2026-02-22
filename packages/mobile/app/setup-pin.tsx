import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../src/shared/store/auth";
import { ShieldCheck, Fingerprint } from "lucide-react-native";

export default function SetupPinScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setPin, enableBiometrics, biometricsAvailable } = useAuthStore();

  const [step, setStep] = useState<"create" | "confirm" | "biometrics">("create");
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    if (pin1.length < 6) {
      setError(t("pin.tooShort", "PIN must be at least 6 characters"));
      return;
    }
    setError("");
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (pin2 !== pin1) {
      setError(t("pin.mismatch", "PINs do not match"));
      setPin2("");
      return;
    }
    setLoading(true);
    try {
      await setPin(pin1);
      if (biometricsAvailable) {
        setStep("biometrics");
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      setError(t("pin.error", "Error setting PIN"));
    } finally {
      setLoading(false);
    }
  };

  const handleBiometrics = async (enable: boolean) => {
    await enableBiometrics(enable);
    router.replace("/(tabs)");
  };

  if (step === "biometrics") {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0e1a", justifyContent: "center", alignItems: "center", padding: 32 }}>
        <View
          style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: "rgba(139,92,246,0.15)",
            alignItems: "center", justifyContent: "center", marginBottom: 24,
          }}
        >
          <Fingerprint size={36} color="#8b5cf6" />
        </View>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 8 }}>
          {t("pin.biometricsTitle", "Enable Biometrics?")}
        </Text>
        <Text style={{ color: "#6b7280", fontSize: 14, textAlign: "center", marginBottom: 32, lineHeight: 22 }}>
          {t("pin.biometricsDesc", "Use fingerprint or face recognition for quick access to your wallet.")}
        </Text>
        <TouchableOpacity
          onPress={() => handleBiometrics(true)}
          style={{
            backgroundColor: "#8b5cf6", borderRadius: 14, paddingVertical: 16,
            alignItems: "center", width: "100%", marginBottom: 12,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {t("pin.enableBiometrics", "Enable Biometrics")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleBiometrics(false)}
          style={{
            borderWidth: 1, borderColor: "#1f2937", borderRadius: 14,
            paddingVertical: 16, alignItems: "center", width: "100%",
          }}
        >
          <Text style={{ color: "#6b7280", fontSize: 14 }}>
            {t("pin.skipBiometrics", "Maybe Later")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0e1a", justifyContent: "center", alignItems: "center", padding: 32 }}>
      <View
        style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: "rgba(59,130,246,0.15)",
          alignItems: "center", justifyContent: "center", marginBottom: 24,
        }}
      >
        <ShieldCheck size={36} color="#3b82f6" />
      </View>

      <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 8 }}>
        {step === "create"
          ? t("pin.createTitle", "Create App PIN")
          : t("pin.confirmTitle", "Confirm PIN")}
      </Text>
      <Text style={{ color: "#6b7280", fontSize: 14, textAlign: "center", marginBottom: 32 }}>
        {step === "create"
          ? t("pin.createDesc", "This PIN protects access to your wallet app.")
          : t("pin.confirmDesc", "Enter your PIN again to confirm.")}
      </Text>

      <TextInput
        value={step === "create" ? pin1 : pin2}
        onChangeText={step === "create" ? setPin1 : setPin2}
        placeholder="••••••"
        placeholderTextColor="#6b7280"
        secureTextEntry
        keyboardType="number-pad"
        maxLength={20}
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
        onSubmitEditing={step === "create" ? handleCreate : handleConfirm}
      />

      {error ? (
        <Text style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</Text>
      ) : null}

      <TouchableOpacity
        onPress={step === "create" ? handleCreate : handleConfirm}
        disabled={loading}
        style={{
          backgroundColor: "#3b82f6",
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: "center",
          width: "100%",
          opacity: loading ? 0.5 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {step === "create" ? t("common.next", "Next") : t("common.confirm", "Confirm")}
          </Text>
        )}
      </TouchableOpacity>

      {step === "confirm" && (
        <TouchableOpacity
          onPress={() => { setStep("create"); setPin2(""); setError(""); }}
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: "#6b7280", fontSize: 13 }}>
            ← {t("common.back", "Back")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}