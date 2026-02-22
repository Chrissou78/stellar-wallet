import { Redirect } from "expo-router";
import { useWalletStore } from "../src/store/wallet";

export default function Index() {
  const hasAccount = useWalletStore(
    (s) => s.accounts.length > 0 && s.activeAccountId !== null
  );

  if (!hasAccount) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
