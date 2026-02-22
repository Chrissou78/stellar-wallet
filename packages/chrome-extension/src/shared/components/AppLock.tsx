import { useAuthStore } from "../store/auth";
import { useWalletStore } from "../store/wallet";
import LockScreen from "./LockScreen";
import SetupPassword from "./SetupPassword";

export default function AppLock({ children }: { children: React.ReactNode }) {
  const hasWallet = useWalletStore((s) => s.accounts.length > 0);
  const { isLocked, hasPassword } = useAuthStore();

  if (!hasWallet) return <>{children}</>;
  if (!hasPassword) return <SetupPassword />;
  if (isLocked) return <LockScreen />;
  return <>{children}</>;
}
