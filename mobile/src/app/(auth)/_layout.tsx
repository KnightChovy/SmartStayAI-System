import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { homeRouteForRole } from '@/constants/roles';

export default function AuthLayout() {
  const { isAuthenticated, _hasHydrated, user } = useAuthStore();

  if (_hasHydrated && isAuthenticated) {
    return <Redirect href={homeRouteForRole(user?.role)} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
