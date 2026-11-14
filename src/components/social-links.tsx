import React from "react";
import { Instagram, Facebook, ArrowUpRight } from "lucide-react";
import type { StoreSettings } from "@/lib/types";

export function TikTokIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

export function formatSocialUrl(
  platform: "instagram" | "tiktok" | "facebook",
  raw?: string | null
): { url: string; handle: string } | null {
  if (!raw) return null;
  const str = raw.trim();
  if (!str) return null;

  if (str.startsWith("http://") || str.startsWith("https://")) {
    const parts = str.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    const cleanHandle = last.startsWith("@") ? last : `@${last}`;
    return { url: str, handle: cleanHandle };
  }

  const clean = str.replace(/^@/, "");
  if (platform === "instagram") {
    return { url: `https://instagram.com/${clean}`, handle: `@${clean}` };
  }
  if (platform === "tiktok") {
    return { url: `https://tiktok.com/@${clean}`, handle: `@${clean}` };
  }
  if (platform === "facebook") {
    return { url: `https://facebook.com/${clean}`, handle: clean };
  }
  return { url: str, handle: str };
}

export function SocialLinks({
  store,
  variant = "footer",
}: {
  store?: StoreSettings | null;
  variant?: "footer" | "contact";
}) {
  const ig = formatSocialUrl("instagram", store?.instagram);
  const tt = formatSocialUrl("tiktok", store?.tiktok);
  const fb = formatSocialUrl("facebook", store?.facebook);

  if (!ig && !tt && !fb) return null;

  if (variant === "contact") {
    return (
      <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
        {ig && (
          <a
            href={ig.url}
            target="_blank"
            rel="noopener noreferrer"
            className="button secondary button-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 500,
              textDecoration: "none",
              borderRadius: "8px",
            }}
          >
            <Instagram size={15} style={{ color: "#E1306C" }} />
            <span>Instagram ({ig.handle})</span>
            <ArrowUpRight size={13} style={{ opacity: 0.6 }} />
          </a>
        )}
        {tt && (
          <a
            href={tt.url}
            target="_blank"
            rel="noopener noreferrer"
            className="button secondary button-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 500,
              textDecoration: "none",
              borderRadius: "8px",
            }}
          >
            <TikTokIcon size={15} />
            <span>TikTok ({tt.handle})</span>
            <ArrowUpRight size={13} style={{ opacity: 0.6 }} />
          </a>
        )}
        {fb && (
          <a
            href={fb.url}
            target="_blank"
            rel="noopener noreferrer"
            className="button secondary button-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 500,
              textDecoration: "none",
              borderRadius: "8px",
            }}
          >
            <Facebook size={15} style={{ color: "#1877F2" }} />
            <span>Facebook ({fb.handle})</span>
            <ArrowUpRight size={13} style={{ opacity: 0.6 }} />
          </a>
        )}
      </div>
    );
  }

  // Footer variant
  return (
    <div
      className="footer-socials"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "14px",
        flexWrap: "wrap",
      }}
    >
      {ig && (
        <a
          href={ig.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Instagram ${ig.handle}`}
          title={`Instagram: ${ig.handle}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.04)",
            color: "#4a5568",
            transition: "all 0.2s ease",
          }}
        >
          <Instagram size={15} />
        </a>
      )}
      {tt && (
        <a
          href={tt.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`TikTok ${tt.handle}`}
          title={`TikTok: ${tt.handle}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.04)",
            color: "#4a5568",
            transition: "all 0.2s ease",
          }}
        >
          <TikTokIcon size={15} />
        </a>
      )}
      {fb && (
        <a
          href={fb.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Facebook ${fb.handle}`}
          title={`Facebook: ${fb.handle}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.04)",
            color: "#4a5568",
            transition: "all 0.2s ease",
          }}
        >
          <Facebook size={15} />
        </a>
      )}
    </div>
  );
}
