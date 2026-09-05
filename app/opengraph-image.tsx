import { ImageResponse } from "next/og";
import { siteName, siteTagline } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteName} — case notes and pivots for OSINT work`;

/** The card every unfurl falls back to. Deliberately not a screenshot: at card
 *  size a screenshot of a dense board is unreadable, so this shows the one
 *  visual the product is actually about — two entities and the labelled line
 *  between them — at a size you can read in a chat preview.
 *
 *  Colors are literals rather than the app's CSS variables: this renders in a
 *  standalone image runtime with no stylesheet, and no viewer theme to follow. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b1220",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#5eead4",
              fontWeight: 600,
            }}
          >
            {siteName}
          </div>
          <div
            style={{
              fontSize: 62,
              lineHeight: 1.1,
              color: "#f8fafc",
              fontWeight: 800,
              marginTop: 20,
              maxWidth: 880,
            }}
          >
            {siteTagline}
          </div>
        </div>

        {/* One relationship, drawn the way the board draws it. */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <Card type="DOMAIN" value="example.com" />
          <div style={{ display: "flex", alignItems: "center", width: 190 }}>
            <div style={{ height: 2, flex: 1, background: "#334155" }} />
            <div
              style={{
                position: "absolute",
                marginLeft: 34,
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid #334155",
                background: "#111a2b",
                color: "#cbd5e1",
                fontSize: 20,
              }}
            >
              found from
            </div>
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: "9px solid transparent",
                borderBottom: "9px solid transparent",
                borderLeft: "14px solid #334155",
              }}
            />
          </div>
          <Card type="USERNAME" value="example_user" />
        </div>
      </div>
    ),
    size
  );
}

function Card({ type, value }: { type: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "22px 26px",
        borderRadius: 14,
        border: "1px solid #1e293b",
        background: "#111a2b",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 52,
          height: 52,
          borderRadius: 10,
          background: "#134e4a",
          color: "#5eead4",
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        {type.slice(0, 2)}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 17, letterSpacing: 2, color: "#94a3b8", fontWeight: 600 }}>{type}</div>
        <div style={{ fontSize: 26, color: "#f8fafc", fontWeight: 600, marginTop: 4 }}>{value}</div>
      </div>
    </div>
  );
}
