import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Heading } from '@/components/ui/heading';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import {
  StatCard,
  QuickAction,
  StaffBookingCard,
  StaffEmptyState,
} from '@/components/staff';
import { STAFF_GRADIENT } from '@/constants/staffTheme';
import {
  useConversations,
  useGetBookings,
  useHotelRooms,
  useHousekeepingTasks,
  useMyStaffHotels,
  useStaffHotelId,
} from '@/hooks/staff';
import { useAuthStore } from '@/stores/authStore';
import { formatDateShort, todayKey } from '@/utils/formatDate';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Translucent hero metric inside the gradient header. */
function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 bg-white/10 rounded-2xl px-4 py-3">
      <Text bold className="text-white text-2xl">
        {value}
      </Text>
      <Text size="xs" className="text-teal-50/90 mt-0.5">
        {label}
      </Text>
    </View>
  );
}

function SectionRow({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between mb-3 px-1">
      <Text bold className="text-gray-900 text-base">
        {title}
      </Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text size="sm" bold className="text-staff-700">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function StaffDashboardScreen() {
  const router = useRouter();
  const hotelId = useStaffHotelId();
  const { user } = useAuthStore();
  const { data: hotels } = useMyStaffHotels(!!user);
  const today = todayKey();

  const arrivalsQ = useGetBookings(hotelId ?? '', { status: 'confirmed', limit: 100 });
  const inhouseQ = useGetBookings(hotelId ?? '', { status: 'checked_in', limit: 100 });
  const housekeepingQ = useHousekeepingTasks(hotelId ?? '', { status: 'pending' });
  const roomsQ = useHotelRooms(hotelId ?? '', { limit: 200 });
  const escalatedQ = useConversations(hotelId ?? '', { status: 'escalated', limit: 1 });

  const arrivals = (arrivalsQ.data?.results ?? []).filter(
    (b) => b.checkInDate.slice(0, 10) === today
  );
  const inhouse = inhouseQ.data?.results ?? [];
  const departures = inhouse.filter((b) => b.checkOutDate.slice(0, 10) === today);
  const rooms = roomsQ.data?.results ?? [];
  const roomsFree = rooms.filter((r) => r.status === 'available').length;
  const toClean = housekeepingQ.data?.length ?? 0;
  const escalated = escalatedQ.data?.totalResults ?? 0;

  const hotelName = hotels?.find((h) => h.id === hotelId)?.name ?? 'Your hotel';
  const firstLoading = !!hotelId && arrivalsQ.isLoading && inhouseQ.isLoading;

  function refetchAll() {
    arrivalsQ.refetch();
    inhouseQ.refetch();
    housekeepingQ.refetch();
    roomsQ.refetch();
    escalatedQ.refetch();
  }
  const refreshing =
    arrivalsQ.isRefetching ||
    inhouseQ.isRefetching ||
    housekeepingQ.isRefetching ||
    roomsQ.isRefetching;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Hero */}
      <LinearGradient
        colors={STAFF_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          shadowColor: '#0F766E',
          shadowOpacity: 0.25,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        <SafeAreaView edges={['top']}>
          <View className="px-5 pt-2 pb-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-teal-50/90">{greeting()},</Text>
                <Heading size="2xl" className="text-white" numberOfLines={1}>
                  {user?.fullName ?? 'Staff'}
                </Heading>
              </View>
              <View className="h-12 w-12 rounded-2xl bg-white/15 items-center justify-center">
                <Text bold className="text-white text-lg">
                  {(user?.fullName ?? 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-1.5 mt-2">
              <Ionicons name="business" size={13} color="rgba(255,255,255,0.85)" />
              <Text size="sm" className="text-teal-50/90">
                {hotelName} · {formatDateShort(new Date())}
              </Text>
            </View>

            {hotelId ? (
              <View className="flex-row gap-3 mt-4">
                <HeroStat label="Arrivals today" value={arrivals.length} />
                <HeroStat label="In-house" value={inhouse.length} />
              </View>
            ) : null}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {!hotelId ? (
        <StaffEmptyState
          icon="business-outline"
          title="No hotel assigned"
          subtitle="This staff account isn't linked to a hotel yet. Contact your manager to get started."
        />
      ) : firstLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner color="#0F766E" size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refetchAll} tintColor="#0F766E" />
          }
        >
          {/* Quick actions */}
          <View className="flex-row gap-3 mb-6">
            <QuickAction
              icon="qr-code-outline"
              label="Check-in"
              onPress={() => router.push('/(staff)/scan')}
            />
            <QuickAction
              icon="calendar-outline"
              label="Bookings"
              onPress={() => router.push('/(staff)/bookings')}
            />
            <QuickAction
              icon="bed-outline"
              label="Rooms"
              onPress={() => router.push('/(staff)/rooms')}
            />
            <QuickAction
              icon="chatbubbles-outline"
              label="Inbox"
              badge={escalated}
              onPress={() => router.push('/(staff)/inbox')}
            />
          </View>

          {/* Overview */}
          <SectionRow title="Overview" />
          <View className="flex-row flex-wrap justify-between">
            <View style={{ width: '48%' }} className="mb-3">
              <StatCard
                icon="log-out-outline"
                value={departures.length}
                label="Departures today"
                tone="amber"
              />
            </View>
            <View style={{ width: '48%' }} className="mb-3">
              <StatCard
                icon="bed-outline"
                value={`${roomsFree}/${rooms.length}`}
                label="Rooms available"
                tone="emerald"
                onPress={() => router.push('/(staff)/rooms')}
              />
            </View>
            <View style={{ width: '48%' }} className="mb-3">
              <StatCard
                icon="sparkles-outline"
                value={toClean}
                label="Rooms to clean"
                tone="blue"
              />
            </View>
            <View style={{ width: '48%' }} className="mb-3">
              <StatCard
                icon="alert-circle-outline"
                value={escalated}
                label="Needs takeover"
                tone="rose"
                onPress={() => router.push('/(staff)/inbox')}
              />
            </View>
          </View>

          {/* Today's arrivals */}
          <View className="mt-3">
            <SectionRow
              title="Today's arrivals"
              actionLabel="See all"
              onAction={() => router.push('/(staff)/bookings')}
            />
            {arrivals.length === 0 ? (
              <View className="bg-white rounded-3xl border border-gray-100/80 p-6 items-center">
                <Ionicons name="checkmark-circle-outline" size={30} color="#9CA3AF" />
                <Text size="sm" className="text-gray-400 mt-2">
                  No arrivals scheduled for today.
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {arrivals.slice(0, 5).map((b) => (
                  <StaffBookingCard
                    key={b.id}
                    booking={b}
                    onPress={() =>
                      router.push({
                        pathname: '/(staff)/bookings/[id]',
                        params: { id: b.id },
                      })
                    }
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
