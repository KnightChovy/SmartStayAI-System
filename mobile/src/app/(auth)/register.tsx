import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useRegister, useSendOtp } from '@/hooks/auth';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const sendOtp = useSendOtp();
  const register = useRegister();

  const handleSendOtp = () => {
    sendOtp.mutate(email, {
      onSuccess: () => setMessage('A verification code has been sent to your email.'),
      onError: () => setMessage('We could not send the code. Please check your email address.'),
    });
  };

  const submit = () => {
    register.mutate(
      { name, email, password, verificationCode: code },
      {
        onSuccess: () => router.replace('/login' as never),
        onError: () =>
          setMessage(
            'Sign-up failed. Please check your details and verification code.'
          ),
      }
    );
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background-0"
    >
      <View className="gap-7 px-6 py-12">
        <View className="gap-2">
          <Text className="text-primary-600 font-semibold">SMARTSTAY AI</Text>
          <Heading size="3xl">Create an account</Heading>
          <Text className="text-typography-600">
            Start saving your memorable trips.
          </Text>
        </View>
        <View className="gap-4">
          <Input>
            <InputField
              placeholder="Full name"
              value={name}
              onChangeText={setName}
            />
          </Input>
          <Input>
            <InputField
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />
          </Input>
          <Button
            variant="outline"
            onPress={handleSendOtp}
            isDisabled={!email || sendOtp.isPending}
          >
            {sendOtp.isPending ? <ButtonSpinner /> : null}
            <ButtonText>Send verification code</ButtonText>
          </Button>
          <Input>
            <InputField
              keyboardType="number-pad"
              placeholder="6-digit verification code"
              value={code}
              onChangeText={setCode}
            />
          </Input>
          <Input>
            <InputField
              secureTextEntry
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
            />
          </Input>
          {message ? (
            <Text className="text-typography-600">{message}</Text>
          ) : null}
          <Button
            size="lg"
            onPress={submit}
            isDisabled={
              register.isPending || !name || !email || !password || !code
            }
          >
            {register.isPending ? <ButtonSpinner /> : null}
            <ButtonText>Create an account</ButtonText>
          </Button>
        </View>
        <Pressable onPress={() => router.back()}>
          <Text className="text-center text-primary-600">
            Already have an account? Sign in
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

