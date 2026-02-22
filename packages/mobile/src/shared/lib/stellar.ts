const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const HORIZON_PUBLIC = "https://horizon.stellar.org";
const FRIENDBOT_URL = "https://friendbot.stellar.org";

export function getHorizonUrl(network: "testnet" | "public") {
  return network === "testnet" ? HORIZON_TESTNET : HORIZON_PUBLIC;
}

export async function fundTestnet(publicKey: string) {
  const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
  if (!res.ok) throw new Error("Friendbot funding failed");
  return res.json();
}

export async function getBalances(publicKey: string, network: "testnet" | "public" = "testnet") {
  const url = getHorizonUrl(network);
  const res = await fetch(`${url}/accounts/${publicKey}`);
  if (!res.ok) throw new Error("Failed to load account");
  const data = await res.json();
  return data.balances || [];
}

export async function buildPaymentTx(
  _secretKey: string,
  _destination: string,
  _amount: string,
  _assetCode: string = "XLM",
  _assetIssuer?: string
) {
  // TODO: Implement via backend signing endpoint or use stellar-base
  throw new Error("Send not yet implemented on mobile — coming soon");
}
