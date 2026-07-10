import { ImageResponse } from "next/og";
import { CursorArrow } from "@/components/presence/cursor-arrow";
import { site } from "@/lib/site";
import { COLORS } from "@/party/protocol";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const cursorColor = COLORS[4];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          padding: "0 120px",
          background: "#fdfdfc",
          color: "#111",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: "#ffe270",
            marginBottom: 48,
          }}
        />
        <div style={{ fontSize: 72, fontWeight: 600 }}>{site.name}</div>
        <div
          style={{
            fontSize: 40,
            color: "rgba(0, 0, 0, 0.55)",
            marginTop: 16,
          }}
        >
          {site.tagline}
        </div>
        <div
          style={{
            position: "absolute",
            top: 150,
            right: 165,
            width: 270,
            height: 150,
            display: "flex",
          }}
        >
          <CursorArrow
            color={cursorColor}
            size={58}
            backgroundColor="#fdfdfc"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.16))" }}
          />
          <div
            style={{
              position: "absolute",
              top: 50,
              left: 40,
              display: "flex",
              padding: "12px 20px 14px",
              borderRadius: "6px 22px 22px 22px",
              background: cursorColor,
              color: "#fff",
              fontSize: 28,
              fontWeight: 600,
              lineHeight: 1,
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.14)",
            }}
          >
            Linus
          </div>
        </div>
      </div>
    ),
    size,
  );
}
