import { View, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';

const NAVY = '#0B1D45';
const GOLD = '#F5A623';

const LINKS = [
  { icon: 'globe-outline' as const, label: 'Visit our website', url: 'https://smartstay.ai' },
  { icon: 'document-text-outline' as const, label: 'Terms of service', url: 'https://smartstay.ai/terms' },
  { icon: 'shield-outline' as const, label: 'Privacy policy', url: 'https://smartstay.ai/privacy' },
];

export default function AboutScreen() {
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-navy" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} hitSlop={8} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </Pressable>
        <Heading size="lg" className="text-navy">About</Heading>
      </View>

      <ScrollView className="flex-1 bg-gray-100" contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        <View className="items-center bg-white rounded-2xl p-6">
          <View className="w-16 h-16 rounded-2xl bg-navy items-center justify-center mb-3">
            <Ionicons name="bed" size={28} color={GOLD} />
          </View>
          <Heading size="lg" className="text-navy">SmartStay AI</Heading>
          <Text size="sm" className="text-gray-400 mt-1">Version {version}</Text>
          <Text size="sm" className="text-gray-500 text-center mt-3 leading-5">
            AI-powered hotel booking and customer engagement — find your stay, book in seconds, and check in
            with a tap.
          </Text>
        </View>

        <View className="bg-white rounded-2xl overflow-hidden">
          {LINKS.map((link, index) => (
            <Pressable
              key={link.label}
              onPress={() => Linking.openURL(link.url)}
              className={`flex-row items-center justify-between p-4 ${index < LINKS.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name={link.icon} size={18} color={NAVY} />
                <Text bold className="text-navy text-sm">{link.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
