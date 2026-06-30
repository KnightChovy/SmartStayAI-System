import { useState } from 'react';
import { View, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { PageDots } from '@/components/shared/PageDots';

const { width: W } = Dimensions.get('window');

const FEATURES = [
  {
    icon: '🤖',
    badge: 'AI Driven',
    badgeBackground: '#EFF6FF',
    badgeText: '#3B82F6',
    title: 'AI-Powered Recommendations',
    description:
      'Our algorithms analyze thousands of data points to curate stays perfectly matched to your preferences and travel style.',
  },
  {
    icon: '🔄',
    badge: 'Operational',
    badgeBackground: '#F0FDF4',
    badgeText: '#16A34A',
    title: 'Seamless Operations',
    description:
      'We provide hotel staff with real-time operational insights, ensuring faster check-ins, immaculate rooms, and proactive service.',
  },
  {
    icon: '✅',
    badge: 'Guarantee',
    badgeBackground: '#FFFBEB',
    badgeText: '#D97706',
    title: 'Best Price Guarantee',
    description:
      'Direct integration with property management systems ensures you always receive the most transparent and competitive rates available.',
  },
] as const;

export default function IntroScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);

  if (page === 0) {
    return (
      <View className="flex-1 bg-gray-50" style={{ width: W }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <SafeAreaView edges={['top']}>
            <View className="bg-navy px-6 pt-16 pb-10 min-h-[260px] justify-end">
              <Text size="xs" bold className="text-gold tracking-[2px] uppercase mb-2">
                Welcome to
              </Text>
              <Heading className="text-white text-4xl leading-[44px] mb-3">
                Smarter Travel{'\n'}with SmartStay{'\n'}AI
              </Heading>
              <Text size="md" className="text-blue-200 leading-[22px]">
                Experience the future of seamless hospitality.
              </Text>
            </View>

            <View className="m-4 mt-5 bg-white rounded-2xl p-5 shadow-hard-5">
              <View className="flex-row items-center mb-3">
                <View className="bg-blue-50 w-12 h-12 rounded-xl items-center justify-center mr-3">
                  <Text className="text-[22px]">🚀</Text>
                </View>
                <Heading size="lg" className="text-navy">Our Mission</Heading>
              </View>
              <Text size="sm" className="text-gray-500 leading-[22px]">
                We leverage advanced AI to transform the travel experience. By bridging the gap between
                intelligent booking algorithms and streamlined hotel operations, SmartStay AI ensures every
                journey is personalized, efficient, and exceptionally managed from search to checkout.
              </Text>
            </View>

            <View className="flex-row items-center justify-between px-6 mt-2 mb-8">
              <PageDots current={page} />
              <Pressable
                onPress={() => setPage(1)}
                className="bg-navy px-6 py-3 rounded-full"
              >
                <Text size="md" bold className="text-white">Next →</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ width: W }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          <View className="px-4 pt-6">
            <View className="flex-row items-center mb-4">
              <View className="w-1 h-[22px] bg-gold rounded-sm mr-3" />
              <Heading size="lg" className="text-navy">Why Choose Us</Heading>
            </View>

            {FEATURES.map((feature) => (
              <View key={feature.title} className="bg-white rounded-2xl p-4 mb-3 shadow-hard-5">
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="text-[22px]">{feature.icon}</Text>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: feature.badgeBackground }}
                  >
                    <Text size="xs" bold style={{ color: feature.badgeText }}>{feature.badge}</Text>
                  </View>
                </View>
                <Text size="sm" bold className="text-navy mb-1">{feature.title}</Text>
                <Text size="xs" className="text-gray-500 leading-[18px]">{feature.description}</Text>
              </View>
            ))}
          </View>

          <View className="bg-navy mx-4 mt-2 mb-4 rounded-2xl p-6 items-center">
            <Text className="text-gold text-4xl">👥</Text>
            <Heading size="lg" className="text-white mt-2 mb-1">Join 1M+ Travelers</Heading>
            <Text size="sm" className="text-blue-200 text-center mb-5 leading-5">
              Trust SmartStay AI to manage your next journey with precision and care.
            </Text>

            <Pressable
              onPress={() => router.push('/(auth)/register')}
              className="bg-gold w-full py-3.5 rounded-xl items-center mb-3"
            >
              <Text bold className="text-navy text-[15px]">Get Started</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(auth)/login')}
              className="w-full py-3.5 rounded-xl items-center border border-white/30"
            >
              <Text bold className="text-white text-[15px]">Sign In</Text>
            </Pressable>
          </View>

          <PageDots current={page} />
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
