import Button from '@/components/Button';
import Input from '@/components/Input';
import { ThemedText } from '@/components/Text';
import { ThemedView } from '@/components/View';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUI } from '@/context/UIContext';
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
                <View style={styles.logoContainer}>
                    <Mail size={40} color="#C084FC" />
                </View>
                <ThemedText size="3xl" weight="bold" colorType='text'>Reset Password</ThemedText>
                <ThemedText size='md' weight='medium' colorType='subtext'>
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
    borderWidth: 2,
    borderColor: 'rgba(192, 132, 252, 0.5)',
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
