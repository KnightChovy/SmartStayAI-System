import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
} from '@expo-google-fonts/be-vietnam-pro';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { QueryProvider } from '@/providers/query';
import { initI18n } from '@/i18n';
import '../../global.css';

// Giữ splash tới khi font sẵn sàng — nếu không, chữ hiện bằng font hệ thống rồi
// nhảy sang Be Vietnam Pro, layout giật một nhịp ngay lần mở app đầu.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash có thể đã tự ẩn (fast refresh) — không phải lỗi đáng chặn app.
});

export default function RootLayout() {
  // Be Vietnam Pro = font của client; RN cần nạp từng weight thành family riêng
  // (xem `fontFamily` trong tailwind.config.js).
  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
  });

  // i18n phải xong TRƯỚC khi render: ngôn ngữ nằm trong AsyncStorage (bất đồng bộ), render
  // sớm sẽ hiện tiếng Anh rồi nháy sang tiếng Việt của lần chọn trước.
  const [i18nReady, setI18nReady] = useState(false);
  useEffect(() => {
    initI18n()
      .catch(() => {})
      // Hỏng i18n cũng phải mở app — i18next tự rơi về `fallbackLng`.
      .finally(() => setI18nReady(true));
  }, []);

  const ready = (fontsLoaded || fontError) && i18nReady;

  useEffect(() => {
    // Font lỗi vẫn phải mở app (rơi về font hệ thống) — không để khách kẹt ở splash.
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <GluestackUIProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </GluestackUIProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
