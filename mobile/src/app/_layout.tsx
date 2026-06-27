import { Stack } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { QueryProvider } from '@/providers/query';
import '../../global.css';

export default function RootLayout() {
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
