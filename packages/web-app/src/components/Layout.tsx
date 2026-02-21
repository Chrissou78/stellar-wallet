import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Coins,
  Send,
  QrCode,
  ArrowLeftRight,
  Clock,
  Settings,
  Lock,
} from "lucide-react";
import { useWalletStore } from "../store/wallet";
import AccountSwitcher from "./AccountSwitcher";
import clsx from "clsx";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/tokens", icon: Coins, label: "Tokens" },
  { to: "/send", icon: Send, label: "Send" },
  { to: "/receive", icon: QrCode, label: "Receive" },
  { to: "/swap", icon: ArrowLeftRight, label: "Swap" },
  { to: "/history", icon: Clock, label: "History" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Layout() {
  const lock = useWalletStore((s) => s.lock);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-stellar-border bg-stellar-card flex flex-col">
        {/* Account Switcher */}
        <div className="p-3 border-b border-stellar-border">
          <AccountSwitcher />
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-stellar-blue/20 text-white font-medium"
                    : "text-stellar-muted hover:text-white hover:bg-white/5"
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-stellar-border">
          <button
            onClick={lock}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stellar-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <Lock size={16} />
            Lock Wallet
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
