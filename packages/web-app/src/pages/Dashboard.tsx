import { Link } from "react-router-dom";
import { useBalances } from "../hooks/useBalances";
import { useWalletStore } from "../store/wallet";
import TokenIcon from "../components/TokenIcon";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const publicKey = useWalletStore(
  (s) => s.accounts.find((a) => a.id === s.activeAccountId)?.publicKey ?? null
);
  const { data: balances, isLoading } = useBalances();

  const totalXlm = balances?.find((b) => b.assetCode === "XLM")?.balance || "0";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-stellar-muted font-mono">{publicKey}</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-stellar-blue/30 to-stellar-purple/20 border border-stellar-border rounded-2xl p-8">
        <p className="text-sm text-stellar-muted">Total XLM Balance</p>
        <p className="mt-2 text-4xl font-bold text-white">
          {parseFloat(totalXlm).toLocaleString(undefined, { maximumFractionDigits: 4 })} XLM
        </p>
      </div>

      {/* Token List */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Your Assets</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-stellar-muted" size={32} />
          </div>
        ) : !balances || balances.length === 0 ? (
          <p className="text-stellar-muted text-center py-12">
            No assets found. Fund your wallet to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {balances.map((b) => (
              <Link
                key={`${b.assetCode}-${b.assetIssuer}`}
                to={`/tokens/${encodeURIComponent(b.assetCode)}/${encodeURIComponent(b.assetIssuer || "native")}`}
                className="flex items-center justify-between bg-stellar-card border border-stellar-border rounded-xl px-5 py-4 hover:border-stellar-blue/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <TokenIcon code={b.assetCode} image={b.token?.tomlImage} />
                  <div>
                    <p className="font-medium text-white">{b.assetCode}</p>
                    <p className="text-xs text-stellar-muted">
                      {b.token?.tomlName ||
                        b.token?.domain ||
                        (b.assetType === "native"
                          ? "Stellar Lumens"
                          : b.assetIssuer?.slice(0, 12) + "...")}
                    </p>
                  </div>
                </div>
                <p className="font-mono text-white">
                  {parseFloat(b.balance).toLocaleString(undefined, { maximumFractionDigits: 7 })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
