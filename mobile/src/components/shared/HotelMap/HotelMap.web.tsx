import { useEffect, useRef } from 'react';
import { View, Pressable, Linking } from 'react-native';
import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';

const GOLD = '#F5A623';
const TILE_URL = process.env.EXPO_PUBLIC_MAP_TILE_URL ?? '';
const ATTRIBUTION = process.env.EXPO_PUBLIC_MAP_ATTRIBUTION ?? '© VietMap';
const MAPLIBRE_CSS = 'https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css';

export interface HotelMapProps {
  latitude?: string | number | null;
  longitude?: string | number | null;
  name: string;
  address?: string;
  height?: number;
}

/** Bảo đảm CSS của maplibre-gl được nạp (chèn 1 lần qua CDN, tránh Metro xử lý CSS). */
function ensureMaplibreCss() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('maplibre-gl-css')) return;
  const link = document.createElement('link');
  link.id = 'maplibre-gl-css';
  link.rel = 'stylesheet';
  link.href = MAPLIBRE_CSS;
  document.head.appendChild(link);
}

function buildStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      vietmap: { type: 'raster', tiles: [TILE_URL], tileSize: 256, attribution: ATTRIBUTION },
    },
    layers: [{ id: 'vietmap', type: 'raster', source: 'vietmap', minzoom: 0, maxzoom: 22 }],
  };
}

/** Bản đồ vị trí khách sạn — dùng maplibre-gl trực tiếp trên web (react-native-web). */
export function HotelMap({ latitude, longitude, name, address, height = 160 }: HotelMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const lat = latitude != null && latitude !== '' ? Number(latitude) : null;
  const lng = longitude != null && longitude !== '' ? Number(longitude) : null;
  const hasCoords = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  useEffect(() => {
    if (!hasCoords || !containerRef.current || !TILE_URL) return;
    ensureMaplibreCss();
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildStyle(),
      center: [lng as number, lat as number],
      zoom: 15,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    const el = document.createElement('div');
    el.style.cssText =
      'width:22px;height:22px;border-radius:50% 50% 50% 0;background:' +
      GOLD + ';transform:rotate(-45deg);border:2px solid #0B1D45;box-shadow:0 2px 6px rgba(0,0,0,0.3)';
    new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([lng as number, lat as number]).addTo(map);
    return () => map.remove();
  }, [hasCoords, lat, lng]);

  function openExternalMaps() {
    const label = address ? `${name}, ${address}` : name;
    const query = hasCoords ? `${lat},${lng}` : encodeURIComponent(label);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
  }

  return (
    <View className="bg-white rounded-2xl overflow-hidden mb-4">
      {hasCoords && TILE_URL ? (
        <div ref={containerRef} style={{ height, width: '100%', background: '#E5E7EB' }} />
      ) : (
        <View className="items-center justify-center bg-blue-200" style={{ height }}>
          <Ionicons name="map" size={48} color="#3B82F6" />
        </View>
      )}

      <Pressable onPress={openExternalMaps} className="p-3.5 flex-row items-center gap-2">
        <Ionicons name="location" size={16} color={GOLD} />
        <Text size="sm" className="text-gray-700 font-medium flex-1">{address ?? name}</Text>
        <View className="flex-row items-center gap-1">
          <Text size="xs" bold className="text-gold">Directions</Text>
          <Ionicons name="open-outline" size={14} color={GOLD} />
        </View>
      </Pressable>
    </View>
  );
}
