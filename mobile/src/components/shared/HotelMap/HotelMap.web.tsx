import { useEffect, useRef } from 'react';
import { View, Pressable, Linking } from 'react-native';
import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { GUEST_COLORS } from '@/constants/guestTheme';

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
  const { t } = useTranslation('hotel');
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
      GUEST_COLORS.bronze + ';transform:rotate(-45deg);border:2px solid ' + GUEST_COLORS.onSurface + ';box-shadow:0 2px 6px rgba(0,0,0,0.3)';
    new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([lng as number, lat as number]).addTo(map);
    return () => map.remove();
  }, [hasCoords, lat, lng]);

  function openExternalMaps() {
    const label = address ? `${name}, ${address}` : name;
    const query = hasCoords ? `${lat},${lng}` : encodeURIComponent(label);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
  }

  return (
    <View className="mb-4 overflow-hidden rounded-card border border-hairline/30 bg-surface">
      {hasCoords && TILE_URL ? (
        <div ref={containerRef} style={{ height, width: '100%', background: GUEST_COLORS.surfaceContainer }} />
      ) : (
        <View className="items-center justify-center bg-blue-200" style={{ height }}>
          <Ionicons name="map" size={48} color="#3B82F6" />
        </View>
      )}

      <Pressable onPress={openExternalMaps} className="flex-row items-center gap-2 p-3.5">
        <Ionicons name="location" size={16} color={GUEST_COLORS.bronze} />
        <Text className="flex-1 font-bevi-medium text-on-surface-variant" size="sm">
          {address ?? name}
        </Text>
        <View className="flex-row items-center gap-1">
          <Text className="font-bevi-bold text-bronze" size="xs">
            {t('directions')}
          </Text>
          <Ionicons name="open-outline" size={14} color={GUEST_COLORS.bronze} />
        </View>
      </Pressable>
    </View>
  );
}
