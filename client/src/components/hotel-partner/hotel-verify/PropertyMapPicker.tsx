import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin } from 'lucide-react';

const VIETNAM_CENTER: [number, number] = [108.20623, 16.047079];

interface LatLng {
  lat: number;
  lng: number;
}

export interface FlyTarget {
  lat: number;
  lng: number;
  zoom: number;
  label?: string;   // address label shown in popup
  autoPin?: boolean; // if true, place marker automatically (no click needed)
}

export interface PropertyMapPickerProps {
  value?: LatLng;
  onChange: (loc: LatLng) => void;
  flyTarget?: FlyTarget;
}

function buildRasterStyle(tileUrl: string, attribution: string): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      vietmap: {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        attribution,
      },
    },
    layers: [{ id: 'vietmap-tiles', type: 'raster', source: 'vietmap' }],
  };
}

function createPopupHtml(label: string) {
  return `<div style="font-size:12px;font-weight:600;color:#1e293b;max-width:220px;line-height:1.4">${label}</div>`;
}

export function PropertyMapPicker({ value, onChange, flyTarget }: PropertyMapPickerProps) {
  const tileUrl = import.meta.env.VITE_MAP_TILE_URL as string | undefined;
  const attribution = (import.meta.env.VITE_MAP_ATTRIBUTION as string | undefined) ?? '© VietMap';
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [pinned, setPinned] = useState<LatLng | null>(value ?? null);

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !tileUrl) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildRasterStyle(tileUrl, attribution),
      center: value ? [value.lng, value.lat] : VIETNAM_CENTER,
      zoom: value ? 15 : 6,
    });

    mapRef.current = map;

    // Restore initial marker if value provided
    if (value) {
      const marker = new maplibregl.Marker({ color: '#10b981' })
        .setLngLat([value.lng, value.lat])
        .addTo(map);
      markerRef.current = marker;
    }

    // Click to pin
    map.on('click', (e) => {
      const loc: LatLng = { lat: e.lngLat.lat, lng: e.lngLat.lng };

      // Remove old popup
      popupRef.current?.remove();
      popupRef.current = null;

      if (markerRef.current) {
        markerRef.current.setLngLat([loc.lng, loc.lat]);
      } else {
        markerRef.current = new maplibregl.Marker({ color: '#10b981' })
          .setLngLat([loc.lng, loc.lat])
          .addTo(map);
      }
      setPinned(loc);
      onChange(loc);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      popupRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileUrl]);

  // ── Handle flyTarget: fly + optionally auto-pin with popup ────────────────
  useEffect(() => {
    if (!flyTarget || !mapRef.current) return;
    const map = mapRef.current;

    map.flyTo({
      center: [flyTarget.lng, flyTarget.lat],
      zoom: flyTarget.zoom,
      duration: 700,
    });

    if (!flyTarget.autoPin) return;

    const loc: LatLng = { lat: flyTarget.lat, lng: flyTarget.lng };

    // Remove old popup before creating new one
    popupRef.current?.remove();
    popupRef.current = null;

    // Place or move marker
    if (markerRef.current) {
      markerRef.current.setLngLat([flyTarget.lng, flyTarget.lat]);
    } else {
      markerRef.current = new maplibregl.Marker({ color: '#10b981' })
        .setLngLat([flyTarget.lng, flyTarget.lat])
        .addTo(map);
    }

    // Attach popup if label is provided
    if (flyTarget.label) {
      const popup = new maplibregl.Popup({ closeButton: true, offset: 28, maxWidth: '260px' })
        .setHTML(createPopupHtml(flyTarget.label));
      markerRef.current.setPopup(popup);
      // Wait until flyTo animation ends before opening popup
      map.once('moveend', () => markerRef.current?.togglePopup());
      popupRef.current = popup;
    }

    setPinned(loc);
    onChange(loc);
  // onChange is stable (useCallback in parent) — safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTarget]);

  if (!tileUrl) {
    return (
      <div className="w-full h-full bg-slate-100 rounded-xl flex flex-col items-center justify-center gap-2 border border-dashed border-slate-300">
        <MapPin className="w-7 h-7 text-slate-400" />
        <p className="text-sm font-medium text-slate-500">Map chưa cấu hình</p>
        <p className="text-xs text-slate-400 text-center px-6">
          Thêm{' '}
          <code className="bg-slate-200 px-1 rounded text-slate-600">VITE_MAP_TILE_URL</code> vào
          .env
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-xl" />
      {pinned && (
        <span className="absolute bottom-2 left-2 z-10 text-xs text-emerald-700 font-medium bg-white/90 border border-emerald-200 px-2 py-0.5 rounded-md shadow-sm pointer-events-none">
          {pinned.lat.toFixed(5)}, {pinned.lng.toFixed(5)}
        </span>
      )}
    </div>
  );
}
