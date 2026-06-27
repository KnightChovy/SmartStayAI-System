import { useState } from 'react';
import { View, Pressable, FlatList, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText } from '@/components/ui/button';
import { HotelCard } from '@/components/shared/HotelCard';
import { useGetHotels } from '@/hooks/hotels';
import { useAuthStore } from '@/stores/authStore';
import { getInitials } from '@/utils/hotel';

const DESTINATIONS = [
  { id: '1', name: 'Đà Nẵng', hotels: 340, color: '#1D4ED8' },
  { id: '2', name: 'Hạ Long', hotels: 215, color: '#0891B2' },
  { id: '3', name: 'Hội An', hotels: 180, color: '#B45309' },
  { id: '4', name: 'Huế', hotels: 120, color: '#7C3AED' },
  { id: '5', name: 'Phú Quốc', hotels: 290, color: '#059669' },
];

const PROPERTY_TYPES = [
  { id: '1', label: 'Hotels', icon: 'bed-outline' as const },
  { id: '2', label: 'Apartments', icon: 'business-outline' as const },
  { id: '3', label: 'Resorts', icon: 'umbrella-outline' as const },
];

export default function HomeScreen() {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [activeType, setActiveType] = useState('1');
  const { top, bottom } = useSafeAreaInsets();

  const { user } = useAuthStore();
  const initials = getInitials(user?.fullName);

  const { data: hotelsData, isLoading } = useGetHotels({ limit: 10 });
  const hotels = hotelsData?.results ?? [];

  function goToSearch() {
    router.push({
      pathname: '/(tabs)/search',
      params: destination.trim() ? { city: destination.trim() } : {},
    });
  }

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar style="light" />

      {/* ── Fixed Header ── */}
      <View className="bg-navy" style={{ paddingTop: top }}>
        <View className="flex-row items-center justify-between px-5 py-3">
          <Pressable hitSlop={8}>
            <Ionicons name="menu" size={26} color="#fff" />
          </Pressable>
          <Heading size="lg" className="text-white">SmartStay AI</Heading>
          <View className="flex-row items-center gap-3">
            {/* Notifications */}
            <Pressable hitSlop={8} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-navy" />
            </Pressable>
            {/* Avatar → profile */}
            <Pressable onPress={() => router.push('/(tabs)/profile')}>
              <View className="w-9 h-9 rounded-full bg-gold items-center justify-center">
                <Text bold className="text-navy text-sm">{initials}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom + 16 }}
      >
        {/* Hero search */}
        <View className="bg-navy pb-7">
          <View className="px-5 mb-5">
            <Heading size="xl" className="text-white leading-8">Find your next stay</Heading>
            <Text size="sm" className="text-blue-200 mt-1">Smarter travel experiences with AI assistant</Text>
          </View>

          {/* Search card */}
          <View className="mx-5 bg-white rounded-2xl p-4 shadow-hard-2">
            {/* Destination */}
            <View className="flex-row items-center border border-gray-200 rounded-xl px-3 mb-3">
              <Ionicons name="bed-outline" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 text-navy text-sm ml-2 h-11"
                placeholder="Where are you going?"
                placeholderTextColor="#9CA3AF"
                value={destination}
                onChangeText={setDestination}
              />
            </View>

            {/* Date + Guests */}
            <View className="flex-row gap-2 mb-3">
              <Pressable className="flex-1 flex-row items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text size="sm" className="text-navy font-medium">Mon, Aug 21</Text>
              </Pressable>
              <Pressable className="flex-1 flex-row items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
                <Ionicons name="people-outline" size={16} color="#6B7280" />
                <Text size="sm" className="text-navy font-medium">2 guests, 1 room</Text>
              </Pressable>
            </View>

            {/* Search button */}
            <Button className="bg-gold rounded-xl" onPress={goToSearch}>
              <ButtonText className="text-navy font-extrabold text-base">Search</ButtonText>
            </Button>
          </View>
        </View>

        {/* ── Body ── */}
        <View className="px-4 pt-5">

          {/* Flash Deals */}
          <Pressable className="bg-amber-50 border-l-4 border-gold rounded-2xl p-4 flex-row items-center mb-6">
            <View className="w-10 h-10 rounded-xl bg-gold items-center justify-center mr-3">
              <Ionicons name="flash" size={20} color="#0B1D45" />
            </View>
            <View className="flex-1">
              <Text bold className="text-navy">Flash Deals</Text>
              <Text size="sm" className="text-amber-800 mt-0.5">Save at least 15% when booking before 24h today.</Text>
              <Text size="sm" bold className="text-navy mt-1">Check now →</Text>
            </View>
          </Pressable>

          {/* Property types */}
          <Heading size="md" className="text-navy mb-3">Browse by property type</Heading>
          <View className="flex-row gap-2 mb-6">
            {PROPERTY_TYPES.map((type) => (
              <Pressable
                key={type.id}
                onPress={() => setActiveType(type.id)}
                className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-full border-2 ${
                  activeType === type.id
                    ? 'bg-navy border-navy'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Ionicons
                  name={type.icon}
                  size={16}
                  color={activeType === type.id ? '#fff' : '#6B7280'}
                />
                <Text
                  size="sm"
                  bold
                  className={activeType === type.id ? 'text-white' : 'text-navy'}
                >
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Explore Vietnam */}
          <View className="flex-row items-center justify-between mb-3">
            <Heading size="md" className="text-navy">Explore Vietnam</Heading>
            <Pressable>
              <Text size="sm" bold className="text-gold">See all</Text>
            </Pressable>
          </View>

          <FlatList
            data={DESTINATIONS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(d) => d.id}
            contentContainerStyle={{ gap: 10, paddingBottom: 4, marginBottom: 24 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push({ pathname: '/(tabs)/search', params: { city: item.name } })}
                style={{ width: 130, height: 160, borderRadius: 16, backgroundColor: item.color, overflow: 'hidden', justifyContent: 'flex-end' }}
              >
                <View className="absolute inset-0 items-center justify-center">
                  <Ionicons name="location-outline" size={40} color="rgba(255,255,255,0.3)" />
                </View>
                <View style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.35)' }}>
                  <Text bold className="text-white text-base">{item.name}</Text>
                  <Text size="xs" className="text-white/80">{item.hotels} hotels</Text>
                </View>
              </Pressable>
            )}
          />

          {/* Guest Favorites */}
          <Heading size="md" className="text-navy mb-3">Guest Favorites</Heading>
          {isLoading ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="large" color="#0B1D45" />
            </View>
          ) : hotels.length === 0 ? (
            <View className="py-10 items-center gap-2">
              <Ionicons name="bed-outline" size={40} color="#D1D5DB" />
              <Text size="sm" className="text-gray-400">No hotels available yet</Text>
            </View>
          ) : (
            hotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onPress={() => router.push({ pathname: '/hotel/[id]', params: { id: hotel.id } })}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
