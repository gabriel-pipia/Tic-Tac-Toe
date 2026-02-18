import { ThemedText } from '@/components/ui/Text';
import { ThemedView } from '@/components/ui/View';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

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
      <ThemedView themed style={styles.container}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <ThemedText size='lg' weight='bold' colorType='text' style={styles.text}>Loading...</ThemedText>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
  },
});
