import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Spinner } from '@/components/ui/spinner';
import {
  StaffScreenHeader,
  ConversationCard,
  StaffEmptyState,
  FilterChips,
} from '@/components/staff';
import { useConversations, useStaffHotelId } from '@/hooks/staff';
import type { ConversationStatus } from '@/types/staff.type';
import type { FilterChip } from '@/components/staff/FilterChips';

const FILTERS: FilterChip[] = [
  { label: 'Needs takeover', value: 'escalated' },
  { label: 'In progress', value: 'active' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'All', value: undefined },
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
      <StaffScreenHeader title="Inbox" subtitle="Guest chats & complaints" large>
        <FilterChips
          options={FILTERS}
          value={status}
          onChange={(v) => setStatus(v as ConversationStatus | undefined)}
        />
      </StaffScreenHeader>

      {!hotelId ? (
        <StaffEmptyState
          icon="business-outline"
          title="No hotel assigned"
          subtitle="This account isn't linked to a hotel yet."
        />
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner color="#0F766E" size="large" />
        </View>
      ) : isError ? (
        <StaffEmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="Couldn't load conversations"
          actionLabel="Retry"
          onAction={refetch}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <StaffEmptyState
              icon="chatbubbles-outline"
              title="Inbox is empty"
              subtitle="No conversations match this filter."
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
