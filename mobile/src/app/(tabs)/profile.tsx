import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar, AvatarFallbackText } from '@/components/ui/avatar';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useMyProfile, useUpdateMyProfile } from '@/hooks/profile';
import { useAuthStore } from '@/stores/auth-store';

export default function ProfileScreen() {
  const sessionUser = useAuthStore(state => state.user);
  const clearSession = useAuthStore(state => state.clearSession);
  const updateUser = useAuthStore(state => state.updateUser);
  const { data, isLoading } = useMyProfile();
  const updateProfile = useUpdateMyProfile();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');
  const user = data ?? sessionUser;

  const save = () => {
    if (!user) return;
    updateProfile.mutate(
      {
        name: name || user.fullName,
        phone: phone || user.phone || null,
        nationality: nationality || user.profile?.nationality || null,
      },
      { onSuccess: updateUser }
    );
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background-50"
    >
      <View className="gap-5 px-5 py-6">
        <Heading size="2xl">Profile</Heading>
        {isLoading && !user ? <Text>Loading profile...</Text> : null}
        {user ? (
          <>
            <Card className="items-center gap-3">
              <Avatar className="h-20 w-20 bg-primary-100">
                <AvatarFallbackText>{user.fullName}</AvatarFallbackText>
              </Avatar>
              <View className="items-center">
                <Text bold>{user.fullName}</Text>
                <Text className="text-typography-600">{user.email}</Text>
              </View>
            </Card>
            <View className="gap-3">
              <Text bold>Personal information</Text>
              <Input>
                <InputField
                  placeholder="Full name"
                  value={name || user.fullName}
                  onChangeText={setName}
                />
              </Input>
              <Input>
                <InputField
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  value={phone || user.phone || ''}
                  onChangeText={setPhone}
                />
              </Input>
              <Input>
                <InputField
                  placeholder="Nationality"
                  value={nationality || user.profile?.nationality || ''}
                  onChangeText={setNationality}
                />
              </Input>
              <Button onPress={save} isDisabled={updateProfile.isPending}>
                <>
                  {updateProfile.isPending ? <ButtonSpinner /> : null}
                  <ButtonText>Save changes</ButtonText>
                </>
              </Button>
              {updateProfile.isError ? (
                <Text className="text-error-600">
                  Unable to save your profile. Please try again.
                </Text>
              ) : null}
            </View>
            <Button
              variant="outline"
              onPress={() => {
                clearSession();
                router.replace('/');
              }}
            >
              <ButtonText>Sign out</ButtonText>
            </Button>
          </>
        ) : (
          <Card>
            <Text>Please sign in to view your profile.</Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

