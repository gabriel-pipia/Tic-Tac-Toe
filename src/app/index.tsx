import { ThemedText } from '@/components/Text';
import { ThemedView } from '@/components/View';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

export default function Index() {
  const { session, loading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const params = useLocalSearchParams();

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then((value) => {
      setHasSeenOnboarding(value === 'true');
    });
  }, []);

  if (loading || hasSeenOnboarding === null) {
    return (
      <ThemedView themed className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" className="text-primary" />
        <ThemedText size='lg' weight='bold' colorType='text' className='mt-4'>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Forward any params (like gameId) to the tabs route
  return <Redirect href={{ pathname: "/(tabs)", params: params as any }} />;
}
