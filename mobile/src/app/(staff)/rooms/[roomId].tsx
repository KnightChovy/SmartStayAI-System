import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import {
  StaffScreenHeader,
  StaffButton,
  StaffEmptyState,
  StatusPill,
  Card,
} from '@/components/staff';
import {
  useHotelRooms,
  useRoomBlocks,
  useCreateRoomBlock,
  useUpdateRoomBlock,
  useResolveRoomBlock,
  useStaffHotelId,
} from '@/hooks/staff';
import { ROOM_STATUS_STYLE } from '@/constants/staffTheme';
import { formatDate, todayKey } from '@/utils/formatDate';
import { cn } from '@/lib/cn';
import type { RoomBlockType } from '@/types/staff.type';

const BLOCK_TYPES: { label: string; value: RoomBlockType }[] = [
  { label: 'Out of order', value: 'ooo' },
  { label: 'Out of service', value: 'oos' },
];

export default function StaffRoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const hotelId = useStaffHotelId();
  const id = roomId ?? '';

  const { data: roomsPage, isLoading: loadingRooms } = useHotelRooms(hotelId ?? '', { limit: 200 });
  const { data: blocks, isLoading: loadingBlocks } = useRoomBlocks(hotelId ?? '');
  const createBlock = useCreateRoomBlock(hotelId ?? '');
  const updateBlock = useUpdateRoomBlock(hotelId ?? '');
  const resolveBlock = useResolveRoomBlock(hotelId ?? '');

  const room = (roomsPage?.results ?? []).find((r) => r.id === id);
  const activeBlock = (blocks ?? []).find((b) => b.roomId === id);

  const [blockType, setBlockType] = useState<RoomBlockType>('ooo');
  const [reason, setReason] = useState('');
  const [endDate, setEndDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');

  function onError(e: unknown) {
    const message =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Something went wrong. Please try again.';
    Alert.alert('Error', message);
  }

  function handleCreateBlock() {
    if (!reason.trim() || !endDate.trim()) {
      Alert.alert('Missing info', 'Reason and expected end date are required.');
      return;
    }
    createBlock.mutate(
      {
        roomId: id,
        payload: {
          blockType,
          startDate: todayKey(),
          endDate: endDate.trim(),
          reason: reason.trim(),
          ...(estimatedCost.trim() ? { estimatedCost: Number(estimatedCost) } : {}),
        },
      },
      {
        onSuccess: () => {
          setReason('');
          setEndDate('');
          setEstimatedCost('');
          Alert.alert('Room blocked', 'The room has been taken out of the sellable pool.');
        },
        onError,
      }
    );
  }

  function handleExtend() {
    if (!activeBlock) return;
    if (!endDate.trim()) {
      Alert.alert('Missing info', 'Enter the new expected end date.');
      return;
    }
    updateBlock.mutate(
      {
        roomId: id,
        blockId: activeBlock.id,
        payload: { endDate: endDate.trim() },
      },
      {
        onSuccess: () => {
          setEndDate('');
          Alert.alert('Block updated', 'The expected end date has been changed.');
        },
        onError,
      }
    );
  }

  function handleResolve() {
    if (!activeBlock) return;
    Alert.alert('Resolve block', 'Mark this block as fixed and put the room back for sale?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        onPress: () =>
          resolveBlock.mutate(
            { roomId: id, blockId: activeBlock.id },
            { onSuccess: () => Alert.alert('Resolved', 'The room is sellable again.'), onError }
          ),
      },
    ]);
  }

  const isLoading = loadingRooms || loadingBlocks;

  return (
    <View className="flex-1 bg-gray-50">
      <StaffScreenHeader title="Room details" onBack={() => router.back()} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner color="#0F766E" size="large" />
        </View>
      ) : !room ? (
        <StaffEmptyState icon="alert-circle-outline" tone="danger" title="Room not found" />
      ) : (
        <SafeAreaView className="flex-1" edges={['bottom']}>
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Room summary */}
            <Card className="p-4 flex-row items-center justify-between">
              <View>
                <Text bold className="text-gray-900 text-lg">
                  {room.roomNumber}
                </Text>
                <Text size="xs" className="text-gray-400 mt-0.5">
                  {room.roomType?.name}
                  {room.floor != null ? ` · Floor ${room.floor}` : ''}
                </Text>
              </View>
              <StatusPill style={ROOM_STATUS_STYLE[room.status]} size="md" />
            </Card>

            {activeBlock ? (
              <View className="gap-3">
                <Card className="p-4">
                  <Text bold className="text-gray-900 mb-2">
                    Active block
                  </Text>
                  <Text size="sm" className="text-gray-600">
                    {activeBlock.blockType === 'ooo' ? 'Out of order' : 'Out of service'}
                  </Text>
                  <Text size="sm" className="text-gray-800 mt-1">
                    {activeBlock.reason}
                  </Text>
                  <Text size="xs" className="text-gray-400 mt-2">
                    {formatDate(activeBlock.startDate)} → {formatDate(activeBlock.endDate)}
                    {activeBlock.estimatedCost ? ` · ~${activeBlock.estimatedCost}` : ''}
                  </Text>
                </Card>

                <Card className="p-4">
                  <Text bold className="text-gray-900 mb-2">
                    Extend / shorten
                  </Text>
                  <TextInput
                    placeholder="New expected end date (YYYY-MM-DD)"
                    placeholderTextColor="#9CA3AF"
                    value={endDate}
                    onChangeText={setEndDate}
                    className="border border-gray-200 rounded-xl px-3.5 h-11 text-gray-900 text-base mb-3"
                  />
                  <StaffButton
                    label="Update end date"
                    variant="outline"
                    loading={updateBlock.isPending}
                    onPress={handleExtend}
                  />
                </Card>

                <StaffButton
                  label="Resolve block"
                  variant="danger"
                  loading={resolveBlock.isPending}
                  onPress={handleResolve}
                />
              </View>
            ) : (
              <Card className="p-4">
                <Text bold className="text-gray-900 mb-1">
                  Create emergency block
                </Text>
                <Text size="2xs" className="text-gray-400 mb-3">
                  Takes the room out of the sellable pool starting today.
                </Text>

                <View className="flex-row gap-2 mb-3">
                  {BLOCK_TYPES.map((t) => {
                    const active = t.value === blockType;
                    return (
                      <Pressable
                        key={t.value}
                        onPress={() => setBlockType(t.value)}
                        className={cn(
                          'rounded-xl px-4 py-2.5 border',
                          active ? 'bg-staff-700 border-staff-700' : 'bg-white border-gray-200'
                        )}
                      >
                        <Text size="sm" bold={active} className={active ? 'text-white' : 'text-gray-700'}>
                          {t.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <TextInput
                  placeholder="Reason (required)"
                  placeholderTextColor="#9CA3AF"
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 text-base mb-3 min-h-[44px]"
                />
                <TextInput
                  placeholder="Expected end date (YYYY-MM-DD)"
                  placeholderTextColor="#9CA3AF"
                  value={endDate}
                  onChangeText={setEndDate}
                  className="border border-gray-200 rounded-xl px-3.5 h-11 text-gray-900 text-base mb-3"
                />
                <TextInput
                  placeholder="Estimated cost (optional)"
                  placeholderTextColor="#9CA3AF"
                  value={estimatedCost}
                  onChangeText={setEstimatedCost}
                  keyboardType="numeric"
                  className="border border-gray-200 rounded-xl px-3.5 h-11 text-gray-900 text-base mb-3"
                />

                <StaffButton
                  label="Block room"
                  variant="danger"
                  loading={createBlock.isPending}
                  onPress={handleCreateBlock}
                />
              </Card>
            )}
          </ScrollView>
        </SafeAreaView>
      )}
    </View>
  );
}
