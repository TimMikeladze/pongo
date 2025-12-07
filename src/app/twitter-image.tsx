import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "pongo.sh - Self-hosted uptime monitoring";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#080808",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      {/* Logo circle with dalmatian */}
      <div
        style={{
          width: 280,
          height: 280,
          borderRadius: "50%",
          border: "8px solid #4ade80",
          background: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://pongo.sh/banner.png"
          alt="pongo.sh logo"
          width={280}
          height={280}
          style={{
            objectFit: "cover",
          }}
        />
      </div>

      {/* Text */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-2px",
          }}
        >
          pongo.sh
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#a1a1aa",
          }}
        >
          Self-hosted uptime monitoring
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
