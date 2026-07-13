import { Pressable, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

export interface FilterChip {
  label: string;
  value: string | undefined;
}

export interface FilterChipsProps {
  options: FilterChip[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

/** Horizontal status filter chips designed to sit on the teal gradient header. */
export function FilterChips({ options, value, onChange }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.label}
            onPress={() => onChange(opt.value)}
            className={cn(
              'rounded-full px-4 py-2 border',
              active ? 'bg-white border-white' : 'bg-white/10 border-white/25',
            )}
          >
            <Text
              size="sm"
              bold={active}
              className={active ? 'text-staff-800' : 'text-white/90'}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
