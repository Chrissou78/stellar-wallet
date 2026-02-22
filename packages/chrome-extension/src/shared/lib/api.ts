const API_BASE = import.meta.env.VITE_API_URL || "https://stellar-wallet.onrender.com";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── Tokens ────────────────────────────────────────────────
export const tokenApi = {
  featured: () => request<any[]>("/api/v1/tokens/featured"),
  search: (query: string, sortBy = "rating", limit = 50) =>
    request<any[]>(`/api/v1/tokens?query=${encodeURIComponent(query)}&sortBy=${sortBy}&limit=${limit}`),
  detail: (code: string, issuer: string) =>
    request<any>(`/api/v1/tokens/${encodeURIComponent(code)}/${encodeURIComponent(issuer)}`),
  userTokens: (publicKey: string) =>
    request<any[]>(`/api/v1/tokens/user/${publicKey}`),
  toggleFavorite: (publicKey: string, code: string, issuer: string) =>
    request<any>("/api/v1/tokens/favorite", {
      method: "POST",
      body: JSON.stringify({ publicKey, assetCode: code, assetIssuer: issuer }),
    }),
};

// ─── Swap ──────────────────────────────────────────────────
export const swapApi = {
  quote: (params: { fromCode: string; fromIssuer: string; toCode: string; toIssuer: string; amount: string }) =>
    request<any[]>(`/api/v1/swap/quote?fromCode=${params.fromCode}&fromIssuer=${params.fromIssuer}&toCode=${params.toCode}&toIssuer=${params.toIssuer}&amount=${params.amount}`),
  build: (params: any) =>
    request<{ xdr: string; networkPassphrase: string }>("/api/v1/swap/build", {
      method: "POST",
      body: JSON.stringify(params),
    }),
};

// ─── Wallet ────────────────────────────────────────────────
export const walletApi = {
  account: (publicKey: string) => request<any>(`/api/v1/wallet/${publicKey}`),
  fund: (publicKey: string) =>
    request<any>("/api/v1/wallet/fund", { method: "POST", body: JSON.stringify({ publicKey }) }),
};

// ─── Transactions ──────────────────────────────────────────
export const txApi = {
  submit: (xdr: string, network: string) =>
    request<any>("/api/v1/transactions/submit", {
      method: "POST",
      body: JSON.stringify({ xdr, networkPassphrase: network }),
    }),
  history: (publicKey: string, limit = 20, cursor?: string) =>
    request<any[]>(
      `/api/v1/transactions/${publicKey}?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`
    ),
};
