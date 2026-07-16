import { View, Pressable, Linking, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { GUEST_COLORS } from '@/constants/guestTheme';

const TILE_URL = process.env.EXPO_PUBLIC_MAP_TILE_URL ?? '';
const ATTRIBUTION = process.env.EXPO_PUBLIC_MAP_ATTRIBUTION ?? '© VietMap';
// Khớp version maplibre-gl đã cài trong package.json.
const MAPLIBRE_CDN = 'https://unpkg.com/maplibre-gl@5.24.0/dist';

export interface HotelMapProps {
  latitude?: string | number | null;
  longitude?: string | number | null;
  name: string;
  address?: string;
  /** Chiều cao map (px). */
  height?: number;
}

/** Mở app bản đồ của thiết bị tới toạ độ (hoặc tìm theo tên nếu thiếu toạ độ). */
function openExternalMaps(lat: number | null, lng: number | null, label: string) {
  const query = lat != null && lng != null ? `${lat},${lng}` : encodeURIComponent(label);
  const url = Platform.select({
    ios: lat != null && lng != null ? `maps:0,0?q=${label}@${query}` : `maps:0,0?q=${query}`,
    android: `geo:0,0?q=${query}(${encodeURIComponent(label)})`,
    default: `https://www.google.com/maps/search/?api=1&query=${query}`,
  });
  if (url) Linking.openURL(url).catch(() => {});
}

/** HTML nhúng maplibre-gl (qua CDN) render raster tile VietMap + marker tại toạ độ khách sạn. */
function buildMapHtml(lat: number, lng: number): string {
  const style = {
    version: 8,
    sources: {
      vietmap: { type: 'raster', tiles: [TILE_URL], tileSize: 256, attribution: ATTRIBUTION },
    },
    layers: [{ id: 'vietmap', type: 'raster', source: 'vietmap', minzoom: 0, maxzoom: 22 }],
  };
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link href="${MAPLIBRE_CDN}/maplibre-gl.css" rel="stylesheet" />
  <script src="${MAPLIBRE_CDN}/maplibre-gl.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: ${GUEST_COLORS.surfaceContainer}; }
    .pin {
      width: 22px; height: 22px; border-radius: 50% 50% 50% 0;
      background: ${GUEST_COLORS.bronze}; transform: rotate(-45deg);
      border: 2px solid ${GUEST_COLORS.onSurface}; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    try {
      const map = new maplibregl.Map({
        container: 'map',
        style: ${JSON.stringify(style)},
        center: [${lng}, ${lat}],
        zoom: 15,
        attributionControl: false,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      const el = document.createElement('div');
      el.className = 'pin';
      new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([${lng}, ${lat}]).addTo(map);
    } catch (e) {
      document.body.innerHTML = '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#9CA3AF;font-family:sans-serif">Map unavailable</div>';
    }
  </script>
</body>
</html>`;
}

/** Bản đồ vị trí khách sạn (maplibre-gl qua WebView trên native). */
export function HotelMap({ latitude, longitude, name, address, height = 160 }: HotelMapProps) {
  const lat = latitude != null && latitude !== '' ? Number(latitude) : null;
  const lng = longitude != null && longitude !== '' ? Number(longitude) : null;
  const hasCoords = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  return (
    <View className="bg-white rounded-2xl overflow-hidden mb-4">
      {hasCoords && TILE_URL ? (
        <View style={{ height }}>
          <WebView
            originWhitelist={['*']}
            source={{ html: buildMapHtml(lat, lng) }}
            style={{ flex: 1, backgroundColor: '#E5E7EB' }}
            scrollEnabled={false}
            javaScriptEnabled
            domStorageEnabled
            // Cho phép kéo map mà không nuốt toàn bộ cử chỉ của ScrollView cha.
            nestedScrollEnabled
          />
        </View>
      ) : (
        <View className="items-center justify-center bg-surface-container" style={{ height }}>
          <Ionicons name="map-outline" size={44} color={GUEST_COLORS.hairline} />
        </View>
      )}

      <Pressable
        onPress={() => openExternalMaps(lat, lng, address ? `${name}, ${address}` : name)}
        className="flex-row items-center gap-2 p-3.5"
      >
        <Ionicons name="location" size={16} color={GUEST_COLORS.bronze} />
        <Text className="flex-1 font-bevi-medium text-on-surface-variant" size="sm">
          {address ?? name}
        </Text>
        <View className="flex-row items-center gap-1">
          <Text className="font-bevi-bold text-bronze" size="xs">
            Chỉ đường
          </Text>
          <Ionicons name="open-outline" size={14} color={GUEST_COLORS.bronze} />
        </View>
      </Pressable>
    </View>
  );
}
