import { MapPin, ArrowUpRight } from "lucide-react";
import type { StoreSettings } from "@/lib/types";

export function parseGoogleMaps(raw?: string | null, address?: string | null) {
  if (!raw && !address) return null;
  const str = (raw || "").trim();

  // 1. If HTML iframe code was pasted (<iframe src="...">)
  const iframeMatch = str.match(/src=["'](https:\/\/[^"']+)["']/i);
  if (iframeMatch) {
    return { embedUrl: iframeMatch[1], directUrl: iframeMatch[1] };
  }

  // 2. If standard google maps embed URL
  if (str.startsWith("https://www.google.com/maps/embed")) {
    return { embedUrl: str, directUrl: str };
  }

  // 3. If GPS coordinates (e.g. -8.2934, 113.7123)
  const coordMatch = str.match(/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/);
  if (coordMatch) {
    const q = str.replace(/\s+/g, "");
    return {
      embedUrl: `https://maps.google.com/maps?q=${q}&hl=id&z=16&output=embed`,
      directUrl: `https://www.google.com/maps/search/?api=1&query=${q}`,
    };
  }

  // 4. If Google Maps Share Link or custom URL
  if (str.startsWith("http")) {
    return {
      embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(address || "")}&hl=id&z=16&output=embed`,
      directUrl: str,
    };
  }

  // 5. Fallback to address or text
  const target = str || address;
  if (!target) return null;
  return {
    embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(target)}&hl=id&z=16&output=embed`,
    directUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target)}`,
  };
}

export function LocationPanel({ store }: { store?: StoreSettings }) {
  const mapData = parseGoogleMaps(store?.mapsUrl, store?.address);

  if (mapData?.embedUrl) {
    return (
      <div className="location-map" style={{ minHeight: "440px", position: "relative" }}>
        <iframe
          src={mapData.embedUrl}
          width="100%"
          height="100%"
          style={{
            border: 0,
            width: "100%",
            height: "100%",
            minHeight: "440px",
            display: "block",
            borderRadius: "12px",
          }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Peta Lokasi ${store?.name || "Toko"}`}
        />
        {mapData.directUrl && (
          <a
            className="button white map-link"
            href={mapData.directUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: "absolute",
              bottom: "16px",
              right: "16px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
              zIndex: 10,
            }}
          >
            Buka di Google Maps
            <ArrowUpRight size={16} />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="location-map">
      <div className="map-block block-one" />
      <div className="map-block block-two" />
      <div className="map-block block-three" />
      <div className="map-road road-one" />
      <div className="map-road road-two" />
      <div className="map-road road-three" />
      <div className="map-marker">
        <MapPin
          size={40}
          fill="currentColor"
          stroke="white"
          strokeWidth={1.4}
        />
        <strong>{store?.name || "Toko"}</strong>
        <span>{store?.address || "Lokasi akan dilengkapi"}</span>
      </div>
      <span className="map-label">
        Ilustrasi peta · Bukan lokasi sebenarnya
      </span>
      {store?.mapsUrl && (
        <a
          className="button white map-link"
          href={store.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Buka Google Maps
          <ArrowUpRight size={16} />
        </a>
      )}
    </div>
  );
}
