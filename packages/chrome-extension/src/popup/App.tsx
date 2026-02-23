import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home,
  Coins,
  Send,
  QrCode,
  ArrowLeftRight,
  History as HistoryIcon,
  Settings as SettingsIcon,
} from "lucide-react";
import { useAuthStore } from "../shared/store/auth";
import { useWalletStore } from "../shared/store/wallet";
import AccountSwitcher from "../shared/components/AccountSwitcher";
import clsx from "clsx";

import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Tokens from "./pages/Tokens";
import SendPage from "./pages/Send";
import ReceivePage from "./pages/Receive";
import SwapPage from "./pages/Swap";
import HistoryPage from "./pages/History";
import SettingsPage from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import TokenDetailPage from "./pages/TokenDetail";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasAccount = useWalletStore(
    (s) => s.accounts.length > 0 && s.activeAccountId !== null
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasAccount) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function BottomNav() {
  const { t } = useTranslation();

  const tabs = [
    { to: "/dashboard", icon: Home, label: t("nav.dashboard") },
    { to: "/tokens", icon: Coins, label: t("nav.tokens") },
    { to: "/send", icon: Send, label: t("nav.send") },
    { to: "/receive", icon: QrCode, label: t("nav.receive") },
    { to: "/swap", icon: ArrowLeftRight, label: t("nav.swap") },
  ];

  return (
    <nav className="flex items-center justify-around border-t border-stellar-border bg-stellar-card px-1 py-1.5">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            clsx(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] transition-colors",
              isActive
                ? "text-stellar-blue"
                : "text-stellar-muted hover:text-white"
            )
          }
        >
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Header() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-2 py-1.5 border-b border-stellar-border bg-stellar-card">
      <div className="flex-1 min-w-0">
        <AccountSwitcher />
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => navigate("/history")}
          className="p-1.5 rounded-lg hover:bg-white/5 text-stellar-muted hover:text-white transition-colors"
        >
          <HistoryIcon size={16} />
        </button>
        <button
          onClick={() => navigate("/settings")}
          className="p-1.5 rounded-lg hover:bg-white/5 text-stellar-muted hover:text-white transition-colors"
        >
          <SettingsIcon size={16} />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loadProfile = useAuthStore((s) => s.loadProfile);

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <div className="flex flex-col h-[600px] w-[380px] bg-stellar-bg">
      <Routes>
        {/* Auth routes */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          }
        />
        <Route
          path="/register"
          element={
            <AuthRoute>
              <RegisterPage />
            </AuthRoute>
          }
        />

        {/* Onboarding — auth required, no wallet yet */}
        <Route
          path="/onboarding"
          element={
            isAuthenticated ? (
              <Onboarding />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Root redirect */}
        <Route
          path="/"
          element={
            <Navigate
              to={isAuthenticated ? "/dashboard" : "/login"}
              replace
            />
          }
        />

        {/* Protected app routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Header />
              <div className="flex-1 overflow-y-auto">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tokens" element={<Tokens />} />
                  <Route path="/send" element={<SendPage />} />
                  <Route path="/receive" element={<ReceivePage />} />
                  <Route path="/swap" element={<SwapPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route
                    path="/tokens/:code/:issuer"
                    element={<TokenDetailPage />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </div>
              <BottomNav />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
