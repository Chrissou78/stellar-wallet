import { useState } from "react";
import { View, Text, Image } from "react-native";

const KNOWN_LOGOS: Record<string, string> = {
  XLM: "https://cryptologos.cc/logos/stellar-xlm-logo.png",
  USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
  BTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

interface TokenIconProps {
  code?: string | null;
  image?: string | null;
  size?: number;
}

export default function TokenIcon({ code, image, size = 36 }: TokenIconProps) {
  const [imgError, setImgError] = useState(false);
  const safeCode = code || "??";
  const resolvedImage = image || KNOWN_LOGOS[safeCode.toUpperCase()] || null;

  if (resolvedImage && !imgError) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#1e2330",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={{ uri: resolvedImage }}
          style={{ width: size * 0.75, height: size * 0.75, borderRadius: size * 0.375 }}
          onError={() => setImgError(true)}
        />
      </View>
    );
  }

  const colors = ["#2563eb", "#7c3aed", "#059669", "#ea580c", "#db2777", "#0891b2"];
  const colorIndex = safeCode.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors[colorIndex],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: size * 0.38, fontWeight: "700" }}>
        {safeCode.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}