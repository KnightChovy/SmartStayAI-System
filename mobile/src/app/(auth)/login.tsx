import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useLogin } from '@/hooks/auth';
import { useAuthStore } from '@/stores/auth-store';
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useLogin();
  const setSession = useAuthStore(s => s.setSession);
  const submit = () => {
    setError('');
    login.mutate(
      { email, password },
      {
        onSuccess: data => {
          setSession(
            data.user,
            data.tokens.access.token,
            data.tokens.refresh.token
          );
          router.replace('/');
        },
        onError: () => setError('Incorrect email or password.'),
      }
    );
  };
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background-0"
    >
      <View className="px-6 py-12 gap-8">
        <View className="gap-2">
          <Text className="text-primary-600 font-semibold">
            WELCOME BACK
          </Text>
          <Heading size="3xl">Sign in</Heading>
          <Text className="text-typography-600">
            Manage all your trips in one place.
          </Text>
        </View>
        <View className="gap-4">
          <View className="gap-2">
            <Text>Email</Text>
            <Input>
              <InputField
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
              />
            </Input>
          </View>
          <View className="gap-2">
            <Text>Password</Text>
            <Input>
              <InputField
                secureTextEntry
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
              />
            </Input>
          </View>
          {error ? <Text className="text-error-600">{error}</Text> : null}
          <Button
            size="lg"
            onPress={submit}
            isDisabled={login.isPending || !email || !password}
          >
            {login.isPending ? <ButtonSpinner /> : null}
            <ButtonText>Sign in</ButtonText>
          </Button>
        </View>
        <Pressable onPress={() => router.push('/register' as never)}>
          <Text className="text-center text-primary-600">
            New here? Create an account
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

