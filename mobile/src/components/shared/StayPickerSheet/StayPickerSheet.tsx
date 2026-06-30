import { useMemo, useState } from 'react';
import { Modal, View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { QuantityStepper } from '@/components/shared/QuantityStepper';
import { toDateKey, nightsBetween, formatDateShort } from '@/utils/formatDate';

const NAVY = '#0B1D45';
const GOLD = '#F5A623';
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_AHEAD = 6;

/** Số ngày trong tháng + thứ của ngày 1 → lưới ngày (null cho ô đệm đầu tháng). */
function buildMonth(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

/** So sánh chỉ theo ngày (bỏ giờ). */
function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface StaySelection {
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface StayPickerSheetProps {
  visible: boolean;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  maxGuests?: number;
  onClose: () => void;
  onApply: (selection: StaySelection) => void;
}

/**
 * Bottom-sheet chọn ngày nhận/trả phòng (range calendar tự dựng) + số khách.
 * Trả về `{ checkIn, checkOut, guests }` dạng `YYYY-MM-DD` cho luồng đặt phòng.
 */
export function StayPickerSheet({
  visible,
  initialCheckIn,
  initialCheckOut,
  initialGuests = 2,
  maxGuests = 20,
  onClose,
  onApply,
}: StayPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [checkIn, setCheckIn] = useState<Date | null>(initialCheckIn ? new Date(initialCheckIn) : null);
  const [checkOut, setCheckOut] = useState<Date | null>(initialCheckOut ? new Date(initialCheckOut) : null);
  const [guests, setGuests] = useState(initialGuests);

  const today = startOfToday();

  const months = useMemo(() => {
    const base = startOfToday();
    return Array.from({ length: MONTHS_AHEAD }, (_, i) => {
      const m = base.getMonth() + i;
      const year = base.getFullYear() + Math.floor(m / 12);
      const month = m % 12;
      return { year, month, cells: buildMonth(year, month) };
    });
  }, []);

  function handleDayPress(day: Date) {
    if (day < today) return;
    // Chưa chọn / đã chọn đủ cặp / chọn lùi → bắt đầu lại từ ngày nhận.
    if (!checkIn || (checkIn && checkOut) || day <= checkIn) {
      setCheckIn(day);
      setCheckOut(null);
    } else {
      setCheckOut(day);
    }
  }

  function dayState(day: Date) {
    const isStart = sameDay(day, checkIn);
    const isEnd = sameDay(day, checkOut);
    const inRange = checkIn && checkOut && day > checkIn && day < checkOut;
    const disabled = day < today;
    return { isStart, isEnd, inRange, disabled };
  }

  const nights = nightsBetween(checkIn, checkOut);
  const canApply = !!checkIn && !!checkOut && nights > 0;

  function handleApply() {
    if (!checkIn || !checkOut) return;
    onApply({ checkIn: toDateKey(checkIn), checkOut: toDateKey(checkOut), guests });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '88%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
            <Heading size="lg" className="text-navy">Select dates</Heading>
            <Pressable onPress={onClose} hitSlop={8} className="w-9 h-9 items-center justify-center">
              <Ionicons name="close" size={22} color={NAVY} />
            </Pressable>
          </View>

          {/* Weekday header */}
          <View className="flex-row px-4 pt-3 pb-1">
            {WEEKDAYS.map((w, i) => (
              <View key={i} className="flex-1 items-center">
                <Text size="xs" bold className="text-gray-400">{w}</Text>
              </View>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="px-4">
            {months.map(({ year, month, cells }) => (
              <View key={`${year}-${month}`} className="mb-4">
                <Text bold className="text-navy mb-2 mt-1">{MONTHS[month]} {year}</Text>
                <View className="flex-row flex-wrap">
                  {cells.map((day, idx) => {
                    if (!day) return <View key={idx} style={{ width: `${100 / 7}%`, height: 44 }} />;
                    const { isStart, isEnd, inRange, disabled } = dayState(day);
                    const selected = isStart || isEnd;
                    return (
                      <View key={idx} style={{ width: `${100 / 7}%`, height: 44 }} className="items-center justify-center">
                        {inRange && <View className="absolute inset-y-1 inset-x-0 bg-amber-50" />}
                        <Pressable
                          disabled={disabled}
                          onPress={() => handleDayPress(day)}
                          className="w-10 h-10 rounded-full items-center justify-center"
                          style={{ backgroundColor: selected ? NAVY : inRange ? 'transparent' : 'transparent' }}
                        >
                          <Text
                            size="sm"
                            bold={selected}
                            className={
                              disabled ? 'text-gray-300' : selected ? 'text-white' : inRange ? 'text-navy' : 'text-gray-700'
                            }
                          >
                            {day.getDate()}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Guests */}
          <View className="flex-row items-center justify-between px-5 py-3 border-t border-gray-100">
            <View>
              <Text bold className="text-navy">Guests</Text>
              <Text size="xs" className="text-gray-400">Max {maxGuests} for this room</Text>
            </View>
            <QuantityStepper value={guests} onChange={setGuests} min={1} max={maxGuests} />
          </View>

          {/* Footer */}
          <View className="px-5 pt-2" style={{ paddingBottom: insets.bottom + 12 }}>
            <Text size="xs" className="text-gray-500 mb-2 text-center">
              {canApply
                ? `${formatDateShort(checkIn)} → ${formatDateShort(checkOut)} · ${nights} night${nights > 1 ? 's' : ''}`
                : checkIn
                  ? 'Now pick your check-out date'
                  : 'Pick your check-in date'}
            </Text>
            <Pressable
              disabled={!canApply}
              onPress={handleApply}
              className="rounded-2xl py-3.5 items-center"
              style={{ backgroundColor: canApply ? GOLD : '#E5E7EB' }}
            >
              <Text bold className={canApply ? 'text-navy text-base' : 'text-gray-400 text-base'}>
                Apply dates
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
