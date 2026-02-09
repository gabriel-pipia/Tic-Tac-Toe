import { supabase } from '@/utils/supabase';
import { Link } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
        Alert.alert('Error', error.message);
    } else {
        Alert.alert('Success', 'Please check your inbox for email verification!');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-background justify-center px-8">
      <View className="mb-10">
        <Text className="text-4xl font-bold text-foreground mb-2">Create Account</Text>
        <Text className="text-muted-foreground text-lg">Join the Tic Tac Toe arena.</Text>
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
          onPress={signUpWithEmail}
          disabled={loading}
          className="bg-primary py-4 rounded-xl items-center shadow-lg shadow-primary/30"
        >
          {loading ? (
             <ActivityIndicator color="white" />
          ) : (
            <Text className="text-primary-foreground font-bold text-lg">Sign Up</Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-center mt-8">
        <Text className="text-muted-foreground">Already have an account? </Text>
        <Link href="/login" asChild>
          <TouchableOpacity>
            <Text className="text-primary font-bold">Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}
