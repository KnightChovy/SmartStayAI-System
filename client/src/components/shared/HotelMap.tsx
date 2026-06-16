import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface HotelMapProps {
  /** Toạ độ thật của khách sạn (DB `Hotel.latitude/longitude`). */
  latitude: number;
  longitude: number;
  label?: string;
  className?: string;
}

/**
 * Bản đồ chỉ-đọc ghim vị trí khách sạn. Ưu tiên VietMap raster (nếu có
 * `VITE_MAP_TILE_URL`), fallback OpenStreetMap (miễn phí, không cần key)
 * để luôn render được trên local.
 */
export default function HotelMap({ latitude, longitude, label, className }: HotelMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const tileUrl = import.meta.env.VITE_MAP_TILE_URL as string | undefined;
    const tiles = tileUrl
      ? [tileUrl]
      : ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'];
    const attribution = tileUrl
      ? ((import.meta.env.VITE_MAP_ATTRIBUTION as string | undefined) ?? '© VietMap')
      : '© OpenStreetMap contributors';

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: { base: { type: 'raster', tiles, tileSize: 256, attribution } },
        layers: [{ id: 'base', type: 'raster', source: 'base' }],
      },
      center: [longitude, latitude],
      zoom: 14,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    const marker = new maplibregl.Marker({ color: '#2563eb' })
      .setLngLat([longitude, latitude])
      .addTo(map);
    if (label) {
      marker.setPopup(new maplibregl.Popup({ offset: 24 }).setText(label));
    }

    mapRef.current = map;
    return () => map.remove();
  }, [latitude, longitude, label]);

  return <div ref={containerRef} className={className} />;
}
