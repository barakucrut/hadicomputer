import { MapPin, ArrowUpRight } from "lucide-react";
import { store } from "@/lib/repository";

export function LocationPanel() {
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
        <strong>Hadi Computer</strong>
        <span>Lokasi akan dilengkapi</span>
      </div>
      <span className="map-label">
        Ilustrasi peta · Bukan lokasi sebenarnya
      </span>
      {store.mapsUrl && (
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
