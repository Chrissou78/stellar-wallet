import { useState } from "react";

interface TokenIconProps {
  code: string;
  image?: string;
  size?: number;
}

export default function TokenIcon({ code, image, size = 36 }: TokenIconProps) {
  const [failed, setFailed] = useState(false);

  if (image && !failed) {
    return (
      <img
        src={image}
        alt={code}
        width={size}
        height={size}
        className="rounded-full"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-stellar-blue/30 flex items-center justify-center text-xs font-bold text-white"
    >
      {code.slice(0, 3)}
    </div>
  );
}
