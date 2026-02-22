const API_BASE = "https://stellar-wallet.onrender.com";

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function getHorizonUrl(network: "testnet" | "public") {
  return network === "testnet"
    ? "https://horizon-testnet.stellar.org"
    : "https://horizon.stellar.org";
}

export function getNetworkPassphrase(network: "testnet" | "public") {
  return network === "testnet"
    ? "Test SDF Network ; September 2015"
    : "Public Global Stellar Network ; September 2015";
}

export const tokenApi = {
  featured: () => request("/api/v1/tokens/featured"),
  search: (query: string) => request(`/api/v1/tokens?query=${encodeURIComponent(query)}`),
  userTokens: (publicKey: string) => request(`/api/v1/tokens/user/${publicKey}`),
  detail: (code: string, issuer: string) => request(`/api/v1/tokens/${code}/${issuer}`),
  toggleFavorite: (publicKey: string, code: string, issuer: string) =>
    request("/api/v1/tokens/favorite", {
      method: "POST",
      body: JSON.stringify({ publicKey, assetCode: code, assetIssuer: issuer }),
    }),
};

export const swapApi = {
  quote: (params: Record<string, string>) =>
    request(`/api/v1/swap/quote?${new URLSearchParams(params).toString()}`),
  build: (params: any) =>
    request("/api/v1/swap/build", { method: "POST", body: JSON.stringify(params) }),
};

export const walletApi = {
  accountInfo: (publicKey: string) => request(`/api/v1/wallet/account/${publicKey}`),
  fund: (publicKey: string) => request(`/api/v1/wallet/fund/${publicKey}`, { method: "POST" }),
};

export const txApi = {
  history: (publicKey: string, limit = 20, cursor?: string) => {
    let url = `/api/v1/transactions/history/${publicKey}?limit=${limit}`;
    if (cursor) url += `&cursor=${cursor}`;
    return request(url);
  },
  submit: (xdr: string) =>
    request("/api/v1/transactions/submit", { method: "POST", body: JSON.stringify({ xdr }) }),
};
