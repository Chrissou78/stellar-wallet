import { useAuthStore } from "../store/auth";
import { useWalletStore } from "../store/wallet";
import LockScreen from "./LockScreen";
import SetupPassword from "./SetupPassword";

export default function AppLock({ children }: { children: React.ReactNode }) {
  const hasWallet = useWalletStore((s) => s.accounts.length > 0);
  const { isLocked, hasPassword } = useAuthStore();

  // No wallet yet — skip lock, show onboarding
  if (!hasWallet) return <>{children}</>;

  // Has wallet but no password — set one up
  if (!hasPassword) return <SetupPassword />;

  // Has password and locked
  if (isLocked) return <LockScreen />;

  // Unlocked
  return <>{children}</>;
}
