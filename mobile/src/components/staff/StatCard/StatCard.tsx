import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/staff/Card';
import { cn } from '@/lib/cn';

export type StatTone = 'teal' | 'blue' | 'amber' | 'emerald' | 'rose';

export interface StatCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string | number;
  label: string;
  tone?: StatTone;
  hint?: string;
  onPress?: () => void;
}

const TONE: Record<StatTone, { bg: string; color: string }> = {
  teal: { bg: 'bg-staff-50', color: '#0F766E' },
  blue: { bg: 'bg-blue-50', color: '#2563EB' },
  amber: { bg: 'bg-amber-50', color: '#D97706' },
  emerald: { bg: 'bg-emerald-50', color: '#059669' },
  rose: { bg: 'bg-rose-50', color: '#E11D48' },
};

/** KPI stat tile — icon in a tinted square, big value, label. */
export function StatCard({ icon, value, label, tone = 'teal', hint, onPress }: StatCardProps) {
  const t = TONE[tone];
  const body = (
    <Card className="p-4">
      <View className={cn('h-10 w-10 rounded-2xl items-center justify-center', t.bg)}>
        <Ionicons name={icon} size={20} color={t.color} />
      </View>
      <Text bold className="text-gray-900 text-2xl mt-3">
        {value}
      </Text>
      <Text size="xs" className="text-gray-400 mt-0.5">
        {label}
      </Text>
      {hint ? (
        <Text size="2xs" className="text-gray-300 mt-0.5">
          {hint}
        </Text>
      ) : null}
    </Card>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-90">
        {body}
      </Pressable>
    );
  }
  return body;
}
