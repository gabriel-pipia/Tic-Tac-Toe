import Button from '@/components/Button';
import Input from '@/components/Input';
import { ThemedText } from '@/components/Text';
import { ThemedView } from '@/components/View';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUI } from '@/context/UIContext';
import { Link } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useUI();

  const handleLogin = async () => {
    if (!email || !password) {
      showToast({ type: 'error', title: 'Missing Fields', message: 'Please fill in all fields' });
      return;
    }
    
    const { error } = await signIn(email, password);
    if (error) {
      showToast({ type: 'error', title: 'Login Failed', message: error.message });
    }
    // Auth context handles redirection in _layout
  };

  return (
    <ThemedView style={styles.container} keyboardAvoiding safe themed>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={styles.content}>
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <ThemedText style={styles.logoText}>X</ThemedText>
                </View>
                <ThemedText size="3xl" weight="bold"colorType='text'>Welcome Back</ThemedText>
                <ThemedText size='md' weight='medium' colorType='subtext'>
                  Sign in to continue your progress
                </ThemedText>
              </View>

                <View style={styles.form}>
                    <Input
                    label="Email"
                    placeholder="hello@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    leftIcon={<Mail size={20} color={colors.subtext} />}
                    />
                    <Input
                    label="Password"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    leftIcon={<Lock size={20} color={colors.subtext} />}
                    />
                    <Link href="/(auth)/forgot-password" asChild> 
                        <ThemedText align="right" size="md" weight="bold" type='link' colorType='primary'>Forgot Password?</ThemedText>
                    </Link>
                    <Button
                      title={loading ? 'Signing In...' : 'Sign In'}
                      onPress={handleLogin}
                      disabled={loading}
                    />
                </View>

              <ThemedView style={styles.footer}>
                <ThemedText colorType='subtext' size='md' weight='medium'>Don&apos;t have an account?</ThemedText>
                <Link href="/signup" asChild>
                    <ThemedText size="md" weight="bold" type='link' colorType='primary'>Sign Up</ThemedText>
                </Link>
              </ThemedView>
          </ThemedView>
        </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  content: {
    width: Layout.CONTAINER_WIDTH_PERCENT,
    maxWidth: Layout.MAX_CONTENT_WIDTH,
    marginHorizontal: 'auto'
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 12,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    transform: [{ rotate: '3deg' }],
    borderWidth: 2,
    borderColor: 'rgba(192, 132, 252, 0.5)',
  },
  logoText: {
    fontSize: 36,
    color: '#C084FC',
  },
  form: {
    width: '100%',
    gap: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 36,
    gap: 4,
  },
});
