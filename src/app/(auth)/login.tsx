import { supabase } from '@/utils/supabase';
import { Link, useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
    } else {
        // Auth state listener in _layout or context will handle redirect, 
        // but explicit replace helps UX immediately.
        // router.replace('/(tabs)'); 
        // actually Context listener is safer.
        setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background justify-center px-8">
      <View className="mb-10">
        <Text className="text-4xl font-bold text-foreground mb-2">Welcome Back</Text>
        <Text className="text-muted-foreground text-lg">Sign in to continue playing.</Text>
      </View>

      <View className="space-y-4">
        <View className="flex-row items-center bg-secondary/50 p-4 rounded-xl border border-border">
          <Mail size={20} className="text-muted-foreground mr-3" color="gray" />
          <TextInput
            placeholder="Email"
            placeholderTextColor="gray"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            className="flex-1 text-foreground"
          />
        </View>

        <View className="flex-row items-center bg-secondary/50 p-4 rounded-xl border border-border mb-6">
          <Lock size={20} className="text-muted-foreground mr-3" color="gray" />
          <TextInput
            placeholder="Password"
            placeholderTextColor="gray"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="flex-1 text-foreground"
          />
        </View>

        <TouchableOpacity
          onPress={signInWithEmail}
          disabled={loading}
          className="bg-primary py-4 rounded-xl items-center shadow-lg shadow-primary/30"
        >
          {loading ? (
             <ActivityIndicator color="white" />
          ) : (
            <Text className="text-primary-foreground font-bold text-lg">Sign In</Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-center mt-8">
        <Text className="text-muted-foreground">Don't have an account? </Text>
        <Link href="/signup" asChild>
          <TouchableOpacity>
            <Text className="text-primary font-bold">Sign Up</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}
