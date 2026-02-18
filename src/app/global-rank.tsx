import AvatarViewer from '@/components/AvatarViewer';
import ProfileModal from '@/components/ProfileModal';
import Button from '@/components/ui/Button';
import RefreshControl from '@/components/ui/RefreshControl';
import { ThemedText } from '@/components/ui/Text';
import { ThemedView } from '@/components/ui/View';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/lib/constants/Layout';
import { supabase } from '@/lib/supabase/client';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronLeft, Crown, User as UserIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  wins: number;
  losses: number;
  draws: number;
    total_wins?: number;
    is_public?: boolean;
 };
 
 type FilterType = 'day' | 'month' | 'year' | 'all';
 
 export default function GlobalRankScreen() {
   const { user } = useAuth();
   const { colors } = useTheme();
   const router = useRouter();
   
   const [profiles, setProfiles] = useState<Profile[]>([]);
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
   const [filter, setFilter] = useState<FilterType>('all');
   const [viewAvatar, setViewAvatar] = useState<string | null>(null);
 
   const fetchRankings = React.useCallback(async () => {
     // If refreshing, don't set main loading to true to avoid flicker, just use refreshing state
     if (!refreshing) setLoading(true);
     
     try {
       if (filter === 'all') {
         const { data, error } = await supabase
           .from('profiles')
           .select('*')
           .order('wins', { ascending: false })
           .limit(50);
 
         if (error) throw error;
         setProfiles(data?.map(p => ({ ...p, total_wins: p.wins })) || []);
       } else {
         // Time based filtering
         const startDate = new Date();
         if (filter === 'day') startDate.setDate(startDate.getDate() - 1);
         if (filter === 'month') startDate.setMonth(startDate.getMonth() - 1);
         if (filter === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
 
         // Fetch games within timerange
         const { data: games, error } = await supabase
            .from('games')
            .select('winner')
            .eq('status', 'finished')
            .neq('winner', 'DRAW') 
            .gte('created_at', startDate.toISOString()); 
 
         if (error) throw error;
 
         // Aggregate wins
         const winCounts: Record<string, number> = {};
         games?.forEach((g: any) => {
              if (g.winner) winCounts[g.winner] = (winCounts[g.winner] || 0) + 1;
         });
 
         // Convert to array and sort
         const sortedWinners = Object.entries(winCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 50);
 
         if (sortedWinners.length === 0) {
             setProfiles([]);
         } else {
              // Fetch profile details
             const { data: profilesData } = await supabase
             .from('profiles')
             .select('id, username, avatar_url, wins, losses, draws, is_public')
             .in('id', sortedWinners.map(([id]) => id));
 
              // Merge
              const mappedProfiles = sortedWinners.map(([id, wins]) => {
                 const p = profilesData?.find(pd => pd.id === id);
                 return {
                     id,
                     username: p?.username || 'Unknown',
                     avatar_url: p?.avatar_url || null,
                     wins, // Period Wins (for sorting/display in list)
                     total_wins: p?.wins || 0, // All Time Wins (for modal)
                     losses: p?.losses || 0, 
                     draws: p?.draws || 0,
                     is_public: p?.is_public
                 };
              });
              setProfiles(mappedProfiles);
         }
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, refreshing]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRankings();
  };

  const topThree = profiles.slice(0, 3);
  const rest = profiles.slice(3);

  const renderItem = ({ item, index }: { item: Profile, index: number }) => {
    const isCurrentUser = item.id === user?.id;
    const rank = index + 4; 
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 50 + 500)}>
        <TouchableOpacity 
            onPress={() => setSelectedProfile(item)}
            style={[
            styles.rankItem, 
            { backgroundColor: isCurrentUser ? `${colors.accent}1A` : colors.card, borderColor: isCurrentUser ? colors.accent : colors.border }
            ]}
        >
            <View style={styles.rankNumber}>
                <ThemedText weight="bold" colorType='subtext'>#{rank}</ThemedText>
            </View>
            
            <View style={[styles.avatarContainer, { backgroundColor: colors.border }]}>
                {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                ) : (
                    <UserIcon size={20} color={colors.subtext} />
                )}
            </View>

            <View style={styles.userInfo}>
                <ThemedText weight="bold" numberOfLines={1}>{item.username || 'Anonymous'}</ThemedText>
                <View style={styles.miniStatsRow}>
                    <ThemedText size="xs" colorType="success" weight="bold">{item.wins}W</ThemedText>
                    <View style={[styles.statDot, { backgroundColor: colors.border }]} />
                    <ThemedText size="xs" colorType="error" weight="bold">{item.losses}L</ThemedText>
                    <View style={[styles.statDot, { backgroundColor: colors.border }]} />
                    <ThemedText size="xs" colorType="subtext" weight="bold">{item.draws}D</ThemedText>
                </View>
                {isCurrentUser && <ThemedText size="xs" colorType='accent' style={{ marginTop: 2 }}>You</ThemedText>}
            </View>

            <View style={styles.simpleStat}>
                <ThemedText size="lg" weight="black" colorType='accent'>{Math.round((item.wins / (item.wins + item.losses + item.draws || 1)) * 100)}%</ThemedText>
                <ThemedText size="xs" colorType='subtext' weight="bold">Win Rate</ThemedText>
            </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Helper to find rank of selected profile
  const getSelectedRank = () => {
      if (!selectedProfile) return 0;
      return profiles.findIndex(p => p.id === selectedProfile.id) + 1;
  };

  return (
    <ThemedView safe themed style={styles.container}>
      <View style={styles.responsiveContainer}>
        <ThemedView style={styles.header}>
            <Button variant="secondary" type='icon' size='sm' icon={<ChevronLeft size={20} color={colors.text} />} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
            <ThemedText size="xl" weight="bold">Global Rank</ThemedText>
            <View style={{ width: 40 }} /> 
        </ThemedView>

        <ThemedView style={styles.filterContainer}>
            {(['all', 'day', 'month', 'year'] as const).map((f) => (
              <Button key={f} title={f === 'all' ? 'All Time' : f.charAt(0).toUpperCase() + f.slice(1)} variant={filter === f ? "primary" : "secondary"} type='icon' size='sm' onPress={() => setFilter(f)} />
            ))}
        </ThemedView>

        {loading ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
            <FlatList
                data={rest}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListHeaderComponent={
                    <View style={styles.podiumContainer}>
                        {topThree.length > 0 ? (
                            <>
                                <View style={styles.podiumPlace}>
                                    {topThree[1] && <PodiumItem profile={topThree[1]} rank={2} onPress={() => setSelectedProfile(topThree[1])} />}
                                </View>
                                <View style={[styles.podiumPlace, { zIndex: 10 }]}>
                                    {topThree[0] && <PodiumItem profile={topThree[0]} rank={1} onPress={() => setSelectedProfile(topThree[0])} />}
                                </View>
                                <View style={styles.podiumPlace}>
                                    {topThree[2] && <PodiumItem profile={topThree[2]} rank={3} onPress={() => setSelectedProfile(topThree[2])} />}
                                </View>
                            </>
                        ) : (
                            <ThemedView style={styles.emptyContainer}>
                                <ThemedText colorType='subtext' size="3xl" weight='bold'>No rankings yet.</ThemedText>
                            </ThemedView>
                        )}
                    </View>
                }
            />
        )}
      </View>

      <ProfileModal 
        visible={!!selectedProfile}
        profile={selectedProfile} 
        onClose={() => setSelectedProfile(null)}
        rank={getSelectedRank()}
        periodWins={filter !== 'all' ? selectedProfile?.wins : undefined}
        isMe={selectedProfile?.id === user?.id}
        onAvatarPress={(url) => setViewAvatar(url)}
      />
      
      <AvatarViewer 
          visible={!!viewAvatar}
          url={viewAvatar}
          onClose={() => setViewAvatar(null)}
      />

    </ThemedView>
  );
}

const PodiumItem = ({ profile, rank, onPress }: { profile: Profile, rank: number, onPress: () => void }) => {
    const { colors } = useTheme();
    const isFirst = rank === 1;
    const size = isFirst ? 100 : 80;
    const color = rank === 1 ? '#eab308' : rank === 2 ? '#94a3b8' : '#b45309'; 
    
    return (
        <TouchableOpacity onPress={onPress}>
        <Animated.View 
            entering={FadeInUp.delay(rank * 200).springify()} 
            style={[styles.podiumItem, { marginTop: isFirst ? 0 : 32 }]}
        >
            <View style={[styles.crownContainer]}>
                <Crown size={isFirst ? 30 : 24} color={color} fill={color} />
            </View>
            
            <View style={[
                styles.podiumAvatarContainer, 
                { width: size, height: size, borderColor: color,  shadowColor: color }
            ]}>
                {profile.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                    <UserIcon size={size/2} color={colors.subtext} />
                )}
                <View style={[styles.rankBadge, { backgroundColor: color }]}>
                    <ThemedText size="sm" weight="bold" style={{ color: 'white' }}>{rank}</ThemedText>
                </View>
            </View>

            <ThemedText weight="bold" numberOfLines={1} style={{ marginTop: 8, maxWidth: 100 }} align="center">
                {profile.username || 'Anonymous'}
            </ThemedText>
            <ThemedText size="sm" colorType="accent" weight="bold">{profile.wins} Wins</ThemedText>
        </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 12,
    marginBottom: 16,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 40,
    marginTop: 16,
    height: 220,
  },
  podiumPlace: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  podiumItem: {
    alignItems: 'center',
  },
  crownContainer: {
    marginBottom: 8,
  },
  podiumAvatarContainer: {
    borderRadius: 100,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'visible', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  rankNumber: {
    width: 30,
    alignItems: 'center',
    marginRight: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  userInfo: {
    flex: 1,
  },
  miniStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.5,
  },
  simpleStat: {
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    width: '100%',
  },
  sheetContent: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  sheetHeader: {
        paddingBottom: 8,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
  sheetProfileHeader: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 24,
    },
  sheetAvatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      marginBottom: 16,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
  },
  rankBadgeLarge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginTop: 8,
  },
  statsGrid: {
      flexDirection: 'row',
      width: '100%',
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      justifyContent: 'space-between',
      marginBottom: 24,
  },
  statBox: {
      alignItems: 'center',
      flex: 1,
  },
  statDivider: {
      width: 1,
      height: '100%',
      backgroundColor: 'rgba(150,150,150,0.2)',
  },
  winRateBar: {
      width: '100%',
      height: 30,
      borderRadius: 8,
      overflow: 'hidden',
  },
  winRateFill: {
      height: '100%',
      borderRadius: 4,
  }
});
