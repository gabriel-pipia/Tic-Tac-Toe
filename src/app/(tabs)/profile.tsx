import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/utils/supabase';
import { LogOut, MinusCircle, Moon, Sun, Trophy, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { isDark, setTheme } = useTheme();
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchStats() {
      if (!user) return;
      
      try {
        setLoading(true);
        // This is a bit inefficient without a dedicated stats table or view, but works for MVP
        // Wins: Winner is 'X' and I am player_x, OR Winner is 'O' and I am player_o
        const { count: winsAsX } = await supabase.from('games').select('*', { count: 'exact', head: true })
            .eq('player_x', user.id).eq('winner', 'X');
        const { count: winsAsO } = await supabase.from('games').select('*', { count: 'exact', head: true })
            .eq('player_o', user.id).eq('winner', 'O');
        
        // Losses: Winner is 'O' and I am player_x, OR Winner is 'X' and I am player_o
        const { count: lossAsX } = await supabase.from('games').select('*', { count: 'exact', head: true })
            .eq('player_x', user.id).eq('winner', 'O');
        const { count: lossAsO } = await supabase.from('games').select('*', { count: 'exact', head: true })
            .eq('player_o', user.id).eq('winner', 'X');

        // Draws: Winner is 'DRAW' and I am player_x OR player_o
        const { count: draws } = await supabase.from('games').select('*', { count: 'exact', head: true })
            .or(`player_x.eq.${user.id},player_o.eq.${user.id}`).eq('winner', 'DRAW');

        if (isMounted) {
          setStats({
              wins: (winsAsX || 0) + (winsAsO || 0),
              losses: (lossAsX || 0) + (lossAsO || 0),
              draws: draws || 0,
          });
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) setLoading(false);
      }
    }

    fetchStats();

    return () => { isMounted = false; };
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error(error);
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-6">
      <View className="mb-8">
        <Text className="text-4xl font-bold text-foreground mb-2">Profile</Text>
        <Text className="text-muted-foreground text-lg">{user?.email}</Text>
      </View>

      <View className="bg-secondary/30 rounded-3xl p-6 mb-8 flex-row justify-between">
         {loading ? <ActivityIndicator size="large" className="flex-1" /> : (
            <>
                <View className="items-center flex-1">
                    <Trophy size={32} className="text-yellow-500 mb-2" color="#eab308" />
                    <Text className="text-2xl font-bold text-foreground">{stats.wins}</Text>
                    <Text className="text-muted-foreground text-xs uppercase tracking-widest">Wins</Text>
                </View>
                <View className="w-[1px] bg-border mx-2" />
                 <View className="items-center flex-1">
                    <XCircle size={32} className="text-red-500 mb-2" color="#ef4444" />
                    <Text className="text-2xl font-bold text-foreground">{stats.losses}</Text>
                    <Text className="text-muted-foreground text-xs uppercase tracking-widest">Losses</Text>
                </View>
                <View className="w-[1px] bg-border mx-2" />
                 <View className="items-center flex-1">
                    <MinusCircle size={32} className="text-gray-500 mb-2" color="#6b7280" />
                    <Text className="text-2xl font-bold text-foreground">{stats.draws}</Text>
                    <Text className="text-muted-foreground text-xs uppercase tracking-widest">Draws</Text>
                </View>
            </>
         )}
      </View>

      <View className="space-y-4">
        <View className="flex-row items-center justify-between bg-secondary/50 p-4 rounded-xl border border-border">
            <View className="flex-row items-center">
                {isDark ? <Moon size={24} className="text-foreground mr-4" color="#a855f7" /> : <Sun size={24} className="text-foreground mr-4" color="#eab308" />}
                <Text className="text-lg font-medium text-foreground">Dark Mode</Text>
            </View>
            <Switch 
                value={isDark} 
                onValueChange={(val) => setTheme(val ? 'dark' : 'light')} 
            />
        </View>

        <TouchableOpacity 
            onPress={handleSignOut}
            className="flex-row items-center bg-destructive/10 p-4 rounded-xl mt-4"
        >
            <LogOut size={24} className="text-destructive mr-4" color="#ef4444" />
             <Text className="text-lg font-medium text-destructive">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
