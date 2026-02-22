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

export const tokenApi = {
  featured: () => request("/api/v1/tokens/featured"),
  search: (query: string) => request(`/api/v1/tokens?query=${encodeURIComponent(query)}`),
  userTokens: (publicKey: string) => request(`/api/v1/tokens/user/${publicKey}`),
};

export const swapApi = {
  quote: (params: any) =>
    request(`/api/v1/swap/quote?${new URLSearchParams(params).toString()}`),
};
