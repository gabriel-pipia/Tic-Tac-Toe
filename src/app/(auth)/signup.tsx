import Button from '@/components/Button';
import Input from '@/components/Input';
import { ThemedText } from '@/components/Text';
import { ThemedView } from '@/components/View';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUI } from '@/context/UIContext';
import { supabase } from '@/utils/supabase';
import { Link } from 'expo-router';
import { Lock, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp, loading } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useUI();

  const handleSignup = async () => {
    if (!username || !email || !password) {
      showToast({ type: 'error', title: 'Missing Fields', message: 'Please fill in all fields' });
      return;
    }
    
    // Check if username exists
    const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();
        
    if (existingUser) {
        showToast({ type: 'error', title: 'Username Taken', message: 'Please choose another username.' });
        return;
    }

    const { error } = await signUp(username, email, password);
    if (error) {
      showToast({ type: 'error', title: 'Signup Failed', message: error.message });
    } else {
        showToast({ type: 'success', title: 'Account Created', message: 'Please verify your email.' });
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
                <View style={[styles.logoContainer, styles.logoContainerRotate]}>
                    <ThemedText style={styles.logoText}>O</ThemedText>
                </View>
                <ThemedText size="3xl" weight="bold" colorType='text'>Create Account</ThemedText>
                <ThemedText size='md' weight='medium' colorType='subtext'>
                  Start your journey with us
                </ThemedText>
            </View>

            <View style={styles.form}>
                <Input
                    label="Username"
                    placeholder="@username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    leftIcon={<User size={20} color={colors.subtext} />}
                />
            
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

                <Button
                    title={loading ? 'Creating Account...' : 'Sign Up'}
                    onPress={handleSignup}
              disabled={loading}
              style={{ marginTop: 12 }}
                />
            </View>

            <ThemedView style={styles.footer}>
                <ThemedText colorType='subtext' size='md' weight='medium'>Already have an account?</ThemedText>
                <Link href="/(auth)/login" asChild>
                    <ThemedText size="md" weight="bold" type='link' colorType='primary'>Sign In</ThemedText>
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
    borderWidth: 2,
    borderColor: 'rgba(192, 132, 252, 0.5)',
  },
  logoContainerRotate: {
    transform: [{ rotate: '3deg' }],
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
