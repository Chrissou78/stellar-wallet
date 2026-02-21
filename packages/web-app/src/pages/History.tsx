import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { txApi } from "../lib/api";
import { useWalletStore } from "../store/wallet";
import {
  ArrowUpRight,
  ArrowDownLeft,
  UserPlus,
  Link as LinkIcon,
  Settings,
  Loader2,
  ExternalLink,
} from "lucide-react";

function unwrap(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.records)) return raw.records;
  if (Array.isArray(raw.data)) return raw.data;
  if (raw._embedded && Array.isArray(raw._embedded.records))
    return raw._embedded.records;
  return [];
}

function getOpIcon(type: string, isSent: boolean) {
  switch (type) {
    case "create_account":
      return <UserPlus size={16} className="text-stellar-blue" />;
    case "change_trust":
      return <LinkIcon size={16} className="text-stellar-purple" />;
    case "set_options":
    case "manage_data":
      return <Settings size={16} className="text-stellar-muted" />;
    default:
      return isSent ? (
        <ArrowUpRight size={16} className="text-stellar-danger" />
      ) : (
        <ArrowDownLeft size={16} className="text-stellar-success" />
      );
  }
}

function getOpLabel(type: string, isSent: boolean): string {
  switch (type) {
    case "create_account":
      return isSent ? "Created Account" : "Account Funded";
    case "payment":
      return isSent ? "Sent" : "Received";
    case "path_payment_strict_receive":
    case "path_payment_strict_send":
      return isSent ? "Swapped (Sent)" : "Swapped (Received)";
    case "change_trust":
      return "Trustline Changed";
    case "manage_sell_offer":
    case "manage_buy_offer":
      return "DEX Offer";
    case "set_options":
      return "Account Updated";
    case "manage_data":
      return "Data Updated";
    default:
      return type.replace(/_/g, " ");
  }
}

export default function HistoryPage() {
  const publicKey = useWalletStore(
  (s) => s.accounts.find((a) => a.id === s.activeAccountId)?.publicKey ?? null
)!;
  const [limit] = useState(20);

  const { data: raw, isLoading, error } = useQuery<any>({
    queryKey: ["tx-history", publicKey, limit],
    queryFn: () => txApi.history(publicKey, limit),
    enabled: !!publicKey,
    refetchInterval: 30_000,
  });

  const operations = unwrap(raw);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Transaction History</h1>

      {/* Error state */}
      {error && (
        <div className="bg-stellar-danger/10 border border-stellar-danger/30 rounded-lg p-4">
          <p className="text-sm text-stellar-danger">
            Failed to load history: {(error as Error).message}
          </p>
          <p className="text-xs text-stellar-muted mt-1">
            Make sure the backend is running on http://localhost:3001
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-stellar-muted" size={32} />
        </div>
      ) : operations.length === 0 && !error ? (
        <p className="text-stellar-muted text-center py-12">No transactions yet.</p>
      ) : (
        <div className="space-y-2">
          {operations.map((op: any, index: number) => {
            const from = op.from || op.sourceAccount || op.source_account || op.funder || "";
            const to = op.to || op.account || "";
            const isSent = from === publicKey;
            const amount = op.amount || op.startingBalance || op.starting_balance || "";
            const assetCode = op.assetCode || op.asset_code || (op.assetType === "native" || op.asset_type === "native" ? "XLM" : "");
            const type = op.type || "unknown";
            const hash = op.transactionHash || op.transaction_hash || op.hash || "";
            const createdAt = op.createdAt || op.created_at || "";
            const counterparty = isSent ? to : from;
            const hasAmount = amount && parseFloat(amount) > 0;

            return (
              <div
                key={op.id || hash || index}
                className="flex items-center justify-between bg-stellar-card border border-stellar-border rounded-xl px-5 py-4"
              >
                {/* Left: icon + details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-full shrink-0 ${
                      type === "create_account"
                        ? "bg-stellar-blue/20"
                        : type === "change_trust"
                        ? "bg-stellar-purple/20"
                        : isSent
                        ? "bg-stellar-danger/20"
                        : "bg-stellar-success/20"
                    }`}
                  >
                    {getOpIcon(type, isSent)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">
                      {getOpLabel(type, isSent)}
                      {hasAmount && assetCode ? ` ${assetCode}` : ""}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-stellar-muted">
                      {createdAt && (
                        <span>{new Date(createdAt).toLocaleString()}</span>
                      )}
                      {counterparty && (
                        <>
                          <span>·</span>
                          <span className="font-mono truncate max-w-[120px]">
                            {counterparty.slice(0, 6)}...{counterparty.slice(-6)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: amount + link */}
                <div className="text-right shrink-0 ml-4">
                  {hasAmount ? (
                    <p
                      className={`font-mono text-sm ${
                        type === "change_trust"
                          ? "text-stellar-purple"
                          : isSent
                          ? "text-stellar-danger"
                          : "text-stellar-success"
                      }`}
                    >
                      {isSent ? "-" : "+"}
                      {parseFloat(amount).toLocaleString(undefined, {
                        maximumFractionDigits: 7,
                      })}
                    </p>
                  ) : (
                    <p className="text-xs text-stellar-muted">{type.replace(/_/g, " ")}</p>
                  )}
                  {hash && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-stellar-blue hover:underline"
                    >
                      View <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Count */}
      {!isLoading && !error && operations.length > 0 && (
        <p className="text-xs text-stellar-muted text-center">
          Showing {operations.length} operation{operations.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
