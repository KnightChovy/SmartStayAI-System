import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '../../global.css';
export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <GluestackUIProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </GluestackUIProvider>
    </QueryClientProvider>
  );
}
