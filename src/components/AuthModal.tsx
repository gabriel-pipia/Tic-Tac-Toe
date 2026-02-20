import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SheetHeader from '@/components/ui/SheetHeader';
import { ThemedText } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUI } from '@/context/UIContext';
import { supabase } from '@/lib/supabase/client';
import { Lock, Mail, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Keyboard, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Logo from './ui/Logo';
import { ThemedView } from './ui/View';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export default function AuthModal({ visible, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const { colors } = useTheme();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const { showToast } = useUI();

  useEffect(() => {
    if (visible) {
      setMode(defaultMode);
    } else {
        // Reset form
        setEmail('');
        setPassword('');
        setUsername('');
    }
  }, [visible, defaultMode]);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!email || !password || (mode === 'signup' && !username)) {
       showToast({ type: 'error', title: 'Missing Fields', message: 'Please fill in all fields.' });
       return;
    }

    setLoading(true);
    try {
        if (mode === 'login') {
            const { error } = await signIn(email, password);
            if (error) throw error;
            showToast({ type: 'success', title: 'Welcome Back!', message: 'Successfully signed in.' });
            onClose();
        } else {
            // Check username availability
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .maybeSingle();
            
            if (existingUser) {
                throw new Error('Username is already taken.');
            }

            const { error } = await signUp(username, email, password);
            if (error) throw error;
            showToast({ type: 'success', title: 'Account Created', message: 'Welcome to Tic Tac Toe Pro!' });
            onClose();
        }
    } catch (error: any) {
        showToast({ type: 'error', title: mode === 'login' ? 'Login Failed' : 'Signup Failed', message: error.message });
    } finally {
        setLoading(false);
    }
  };

  const toggleMode = () => {
      setMode(prev => prev === 'login' ? 'signup' : 'login');
  };

  return (
    <BottomSheet
        visible={visible}
        onClose={onClose}
        height="auto"
        scrollable
    >
        <SheetHeader 
            title={mode === 'login' ? 'Sign In' : 'Create Account'} 
            subtitle={mode === 'login' ? 'Sign in to sync your stats and play with friends.' : 'Join the community and climb the global leaderboards.'}
            onClose={onClose} 
        />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ThemedView style={styles.header}>
                <Logo variant="filled" size={80} />
            </ThemedView>

            <View style={styles.form}>
                {mode === 'signup' && (
                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                        <Input
                            label="Username"
                            placeholder="@username"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            leftIcon={<User size={20} color={colors.subtext} />}
                            containerStyle={{ marginBottom: 16 }}
                        />
                    </Animated.View>
                )}

                <Input
                    label="Email"
                    placeholder="hello@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    leftIcon={<Mail size={20} color={colors.subtext} />}
                    containerStyle={{ marginBottom: 16 }}
                />

                <Input
                    label="Password"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    leftIcon={<Lock size={20} color={colors.subtext} />}
                    containerStyle={{ marginBottom: 16 }}
                />

                <Button 
                    title={loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
                    onPress={handleSubmit}
                    variant="primary"
                    disabled={loading}
                    style={{ marginTop: 8 }}
                />

                <View style={styles.footer}>
                    <ThemedText colorType="subtext">
                        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                    </ThemedText>
                    <TouchableOpacity onPress={toggleMode}>
                        <ThemedText colorType="primary" weight="bold">
                            {mode === 'login' ? 'Sign Up' : 'Sign In'}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
      width: '100%',
      padding:20,
  },
  header: {
      alignItems: 'center',
      marginBottom: 24,
  },
  form: {
      width: '100%',
  },
  footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
  },
});
