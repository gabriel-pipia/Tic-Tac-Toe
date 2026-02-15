import { useTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
    }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
