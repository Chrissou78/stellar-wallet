import { Routes, Route, Navigate } from "react-router-dom";
import { useWalletStore } from "./store/wallet";
import Layout from "./components/Layout";
import AppLock from "./components/AppLock";
import OnboardingPage from "./pages/Onboarding";
import DashboardPage from "./pages/Dashboard";
import TokensPage from "./pages/Tokens";
import TokenDetailPage from "./pages/TokenDetail";
import SendPage from "./pages/Send";
import ReceivePage from "./pages/Receive";
import SwapPage from "./pages/Swap";
import HistoryPage from "./pages/History";
import SettingsPage from "./pages/Settings";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const activeAccountId = useWalletStore((s) => s.activeAccountId);
  const accounts = useWalletStore((s) => s.accounts);
  if (!activeAccountId || accounts.length === 0) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const activeAccountId = useWalletStore((s) => s.activeAccountId);
  const accounts = useWalletStore((s) => s.accounts);
  const hasWallet = accounts.length > 0 && activeAccountId;

  return (
    <AppLock>
      <Routes>
        <Route
          path="/"
          element={hasWallet ? <Navigate to="/dashboard" replace /> : <OnboardingPage />}
        />
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tokens" element={<TokensPage />} />
          <Route path="/tokens/:code/:issuer" element={<TokenDetailPage />} />
          <Route path="/send" element={<SendPage />} />
          <Route path="/receive" element={<ReceivePage />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLock>
  );
}
