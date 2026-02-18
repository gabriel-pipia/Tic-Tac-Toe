import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';
import { ThemedText } from '@/components/ui/Text';
import { ThemedView } from '@/components/ui/View';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUI } from '@/context/UIContext';
import { Layout } from '@/lib/constants/Layout';
import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const { resetPassword, loading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useUI();

  const handleReset = async () => {
    if (!email) {
      showToast({ type: 'warning', title: 'Missing Email', message: 'Please enter your email address' });
      return;
    }
    
    const { error } = await resetPassword(email);
    if (error) {
      showToast({ type: 'error', title: 'Start Failed', message: error.message });
    } else {
      showToast({ type: 'success', title: 'Email Sent', message: 'Check your email for reset instructions.' });
      router.back();
    }
  };

  return (
    <ThemedView style={styles.container} keyboardAvoiding safe themed>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={styles.content}>
            <View style={styles.header}>
                <View style={styles.logoWrapper}>
                    <Logo variant="filled" size={100} />
                </View>
                <ThemedText size="3xl" weight="bold" style={{ marginBottom: 8, textAlign: 'center' }}>Reset Password</ThemedText>
                <ThemedText size='md' colorType='subtext' style={{ textAlign: 'center' }}>
                  Enter your email to receive instructions
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

                <Button
                    title={loading ? 'Sending...' : 'Send Reset Link'}
                    onPress={handleReset}
                    disabled={loading}
                />
            </View>

            <View style={styles.footer}>
                <Button 
                    variant="ghost" 
                    title="Back to Login" 
                    onPress={() => router.back()} 
                    textStyle={{ color: colors.subtext }} 
                />
            </View>
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
    marginBottom: 48,
  },
  logoWrapper: {
    marginBottom: 32,
  },
  form: {
    width: '100%',
    gap: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 36,
  },
});
