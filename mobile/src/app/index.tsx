import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
export default function Introduction() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background-0"
    >
      <View className="min-h-screen justify-between px-6 py-10">
        <View className="gap-6 pt-10">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary-600">
            <Text className="text-xl text-white" bold>
              S
            </Text>
          </View>
          <View className="gap-3">
            <Text className="text-primary-600 font-semibold">SMARTSTAY AI</Text>
            <Heading size="4xl">Your next trip, made easier.</Heading>
            <Text className="text-typography-600 text-lg">
              Discover the right stay, manage your itinerary, and keep every detail in one app.
            </Text>
          </View>
          <Card className="bg-primary-50 border-primary-100 gap-2">
            <Text className="text-2xl">✦</Text>
            <Text bold>Book your way</Text>
            <Text className="text-typography-600">
              Search destinations, see transparent prices, and manage your bookings.
            </Text>
          </Card>
        </View>
        <View className="gap-3">
          <Button size="lg" onPress={() => router.push('/login' as never)}>
            <ButtonText>Get started</ButtonText>
          </Button>
          <Pressable onPress={() => router.push('/register' as never)}>
            <Text className="text-center text-primary-600 font-medium">
              Create an account
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}


