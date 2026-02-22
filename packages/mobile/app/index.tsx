import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useWalletStore } from "../src/shared/store/wallet";
import { useAuthStore } from "../src/shared/store/auth";

export default function Index() {
  const router = useRouter();
  const accounts = useWalletStore((s) => s.accounts);
  const { isLocked, hasPin, initialize } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initialize();
      setReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (accounts.length === 0) {
      // No wallet — go to onboarding
      router.replace("/onboarding");
    } else if (!hasPin) {
      // Has wallet but no app PIN — set one up
      router.replace("/setup-pin");
    } else if (isLocked) {
      // Has PIN and locked — go to lock screen
      router.replace("/lock-screen");
    } else {
      // Unlocked — go to app
      router.replace("/(tabs)");
    }
  }, [ready, accounts.length, hasPin, isLocked]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0e1a", justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator color="#3b82f6" size="large" />
    </View>
  );
}