import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbfbfa",
          color: "#111412",
          fontFamily: "serif",
          fontSize: 24,
          letterSpacing: 2,
        }}
      >
        JT
      </div>
    ),
    size,
  );
}
