import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width: W } = Dimensions.get('window');

const NAVY = '#0B1D45';
const GOLD = '#F5A623';

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

function PageDots({ current }: { current: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 16 }}>
      {[0, 1].map((i) => (
        <View
          key={i}
          style={{
            width: current === i ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: current === i ? NAVY : '#D1D5DB',
          }}
        />
      ))}
    </View>
  );
}

export default function IntroScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);

  if (page === 0) {
    return (
      <View style={{ flex: 1, width: W, backgroundColor: '#F9FAFB' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <SafeAreaView edges={['top']}>
            <View style={{ backgroundColor: NAVY, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40, minHeight: 260, justifyContent: 'flex-end' }}>
              <Text style={{ color: GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                Welcome to
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 36, fontWeight: '800', lineHeight: 44, marginBottom: 12 }}>
                Smarter Travel{'\n'}with SmartStay{'\n'}AI
              </Text>
              <Text style={{ color: '#BFDBFE', fontSize: 14, lineHeight: 22 }}>
                Experience the future of seamless hospitality.
              </Text>
            </View>

            <View style={{ margin: 16, marginTop: 20, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ backgroundColor: '#EFF6FF', width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 22 }}>🚀</Text>
                </View>
                <Text style={{ color: NAVY, fontSize: 20, fontWeight: '700' }}>Our Mission</Text>
              </View>
              <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 22 }}>
                We leverage advanced AI to transform the travel experience. By bridging the gap between intelligent booking algorithms and streamlined hotel operations, SmartStay AI ensures every journey is personalized, efficient, and exceptionally managed from search to checkout.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginTop: 8, marginBottom: 32 }}>
              <PageDots current={page} />
              <Pressable
                onPress={() => setPage(1)}
                style={{ backgroundColor: NAVY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Next →</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, width: W, backgroundColor: '#F9FAFB' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 4, height: 22, backgroundColor: GOLD, borderRadius: 2, marginRight: 12 }} />
              <Text style={{ color: NAVY, fontSize: 20, fontWeight: '700' }}>Why Choose Us</Text>
            </View>

            {FEATURES.map((feature) => (
              <View
                key={feature.title}
                style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 22 }}>{feature.icon}</Text>
                  <View style={{ backgroundColor: feature.badgeBackground, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
                    <Text style={{ color: feature.badgeText, fontSize: 11, fontWeight: '600' }}>{feature.badge}</Text>
                  </View>
                </View>
                <Text style={{ color: NAVY, fontWeight: '600', fontSize: 14, marginBottom: 4 }}>{feature.title}</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, lineHeight: 18 }}>{feature.description}</Text>
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: NAVY, marginHorizontal: 16, marginTop: 8, marginBottom: 16, borderRadius: 16, padding: 24, alignItems: 'center' }}>
            <Text style={{ color: GOLD, fontSize: 36 }}>👥</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 8, marginBottom: 4 }}>Join 1M+ Travelers</Text>
            <Text style={{ color: '#BFDBFE', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
              Trust SmartStay AI to manage your next journey with precision and care.
            </Text>

            <Pressable
              onPress={() => router.push('/(auth)/register')}
              style={{ backgroundColor: GOLD, width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 }}
            >
              <Text style={{ color: NAVY, fontWeight: '700', fontSize: 15 }}>Get Started</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(auth)/login')}
              style={{ width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>Sign In</Text>
            </Pressable>
          </View>

          <PageDots current={page} />
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
