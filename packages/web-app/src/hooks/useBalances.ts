import { useQuery } from "@tanstack/react-query";
import { tokenApi } from "../lib/api";
import { useWalletStore } from "../store/wallet";

export interface TokenBalance {
  assetCode: string;
  assetIssuer: string;
  balance: string;
  assetType: string;
  token?: {
    tomlName: string;
    tomlImage: string;
    domain: string;
    isVerified: boolean;
    ratingAverage: number;
  };
  isFavorite: boolean;
}

export function useBalances() {
  const publicKey = useWalletStore(
  (s) => s.accounts.find((a) => a.id === s.activeAccountId)?.publicKey ?? null
);

  return useQuery<TokenBalance[]>({
    queryKey: ["balances", publicKey],
    queryFn: () => tokenApi.userTokens(publicKey!),
    enabled: !!publicKey,
    refetchInterval: 15_000,
  });
}
