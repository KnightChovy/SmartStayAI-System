import { View, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';

const NAVY = '#0B1D45';

const FAQS = [
  {
    q: 'How do I cancel or modify a booking?',
    a: 'Open the booking from My Bookings, then use Cancel or Modify reservation. Pending and confirmed bookings can be changed.',
  },
  {
    q: 'How do I check in at the hotel?',
    a: 'Show the QR code on your booking detail screen at the front desk — it encodes your booking code for a quick check-in.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'Bookings are paid securely through VNPay at checkout. We don’t store your card details.',
  },
  {
    q: 'How do I get a refund?',
    a: 'Cancellations follow each hotel’s policy. Contact us below if you need help with a refund.',
  },
];

const CONTACTS = [
  { icon: 'mail-outline' as const, label: 'support@smartstay.ai', action: () => Linking.openURL('mailto:support@smartstay.ai') },
  { icon: 'call-outline' as const, label: '+84 24 1234 5678', action: () => Linking.openURL('tel:+842412345678') },
];

export default function HelpSupportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-navy" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </Pressable>
        <Heading size="lg" className="text-navy">Help & Support</Heading>
      </View>

      <ScrollView className="flex-1 bg-gray-100" contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        <Heading size="md" className="text-navy px-1">Frequently asked questions</Heading>
        <View className="bg-white rounded-2xl overflow-hidden">
          {FAQS.map((faq, index) => (
            <View
              key={faq.q}
              className={`p-4 ${index < FAQS.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <Text bold className="text-navy text-sm">{faq.q}</Text>
              <Text size="sm" className="text-gray-500 mt-1 leading-5">{faq.a}</Text>
            </View>
          ))}
        </View>

        <Heading size="md" className="text-navy px-1 mt-2">Contact us</Heading>
        <View className="bg-white rounded-2xl overflow-hidden">
          {CONTACTS.map((c, index) => (
            <Pressable
              key={c.label}
              onPress={c.action}
              className={`flex-row items-center gap-3 p-4 ${index < CONTACTS.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <Ionicons name={c.icon} size={18} color={NAVY} />
              <Text bold className="text-navy text-sm">{c.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
