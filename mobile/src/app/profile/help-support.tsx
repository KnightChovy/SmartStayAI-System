import { View, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { GUEST_COLORS } from '@/constants/guestTheme';


interface Faq {
  q: string;
  a: string;
}

const CONTACTS = [
  { icon: 'mail-outline' as const, label: 'support@stayhub.ai', action: () => Linking.openURL('mailto:support@stayhub.ai') },
  { icon: 'call-outline' as const, label: '+84 24 1234 5678', action: () => Linking.openURL('tel:+842412345678') },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const { t } = useTranslation(['account', 'common']);
  const faqs = t('account:help.faqs', { returnObjects: true }) as Faq[];

  return (
    <SafeAreaView className="flex-1 bg-on-surface" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-surface border-b border-hairline/30">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={GUEST_COLORS.onSurface} />
        </Pressable>
        <Heading size="lg" className="font-bevi-bold text-on-surface">{t('account:help.title')}</Heading>
      </View>

      <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        <Heading size="md" className="font-bevi-bold text-on-surface px-1">{t('account:help.faq')}</Heading>
        <View className="bg-surface rounded-card overflow-hidden">
          {faqs.map((faq, index) => (
            <View
              key={faq.q}
              className={`p-4 ${index < faqs.length - 1 ? 'border-b border-hairline/30' : ''}`}
            >
              <Text bold className="font-bevi-bold text-on-surface text-sm">{faq.q}</Text>
              <Text size="sm" className="font-bevi text-on-surface-variant mt-1 leading-5">{faq.a}</Text>
            </View>
          ))}
        </View>

        <Heading size="md" className="font-bevi-bold text-on-surface px-1 mt-2">{t('account:help.contact')}</Heading>
        <View className="bg-surface rounded-card overflow-hidden">
          {CONTACTS.map((c, index) => (
            <Pressable
              key={c.label}
              onPress={c.action}
              className={`flex-row items-center gap-3 p-4 ${index < CONTACTS.length - 1 ? 'border-b border-hairline/30' : ''}`}
            >
              <Ionicons name={c.icon} size={18} color={GUEST_COLORS.onSurface} />
              <Text bold className="font-bevi-bold text-on-surface text-sm">{c.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
