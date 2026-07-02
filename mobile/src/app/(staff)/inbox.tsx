import { useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import {
  StaffScreenHeader,
  ConversationCard,
  StaffEmptyState,
} from '@/components/staff';
import { useConversations, useStaffHotelId } from '@/hooks/staff';
import { cn } from '@/lib/cn';
import type { ConversationStatus } from '@/types/staff.type';

const FILTERS: { label: string; value: ConversationStatus | undefined }[] = [
  { label: 'Cần tiếp quản', value: 'escalated' },
  { label: 'Đang xử lý', value: 'active' },
  { label: 'Đã xong', value: 'resolved' },
  { label: 'Tất cả', value: undefined },
];

export default function StaffInboxScreen() {
  const router = useRouter();
  const hotelId = useStaffHotelId();
  const [status, setStatus] = useState<ConversationStatus | undefined>('escalated');

  const { data, isLoading, isError, refetch, isRefetching } = useConversations(
    hotelId ?? '',
    { status }
  );
  const conversations = data?.results ?? [];

  return (
    <View className="flex-1 bg-gray-50">
      <StaffScreenHeader title="Hộp thư" subtitle="Tiếp quản chat & khiếu nại (S04)" />

      <View className="bg-staff-800 pb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {FILTERS.map((f) => {
            const active = f.value === status;
            return (
              <Pressable
                key={f.label}
                onPress={() => setStatus(f.value)}
                className={cn(
                  'rounded-full px-4 py-1.5 border',
                  active ? 'bg-white border-white' : 'border-white/30'
                )}
              >
                <Text
                  size="sm"
                  bold={active}
                  className={active ? 'text-staff-800' : 'text-white'}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {!hotelId ? (
        <StaffEmptyState
          icon="business-outline"
          title="Chưa gán khách sạn"
          subtitle="Tài khoản chưa liên kết khách sạn nào."
        />
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner color="#0F766E" size="large" />
        </View>
      ) : isError ? (
        <StaffEmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="Không tải được hội thoại"
          actionLabel="Thử lại"
          onAction={refetch}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <StaffEmptyState
              icon="chatbubbles-outline"
              title="Hộp thư trống"
              subtitle="Không có hội thoại nào ở bộ lọc này."
            />
          }
          renderItem={({ item }) => (
            <ConversationCard
              conversation={item}
              onPress={() =>
                router.push({
                  pathname: '/(staff)/conversation/[id]',
                  params: { id: item.id },
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}
