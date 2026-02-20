import Button from '@/components/ui/Button';
import FloatingShape from '@/components/ui/FloatingShape';
import Logo from '@/components/ui/Logo';
import RefreshControl from '@/components/ui/RefreshControl';
import { ThemedText } from '@/components/ui/Text';
import { ThemedView } from '@/components/ui/View';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUI } from '@/context/UIContext';
import { Layout } from '@/lib/constants/Layout';
import { supabase } from '@/lib/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Circle, Info, ScanLine, Trophy, User, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, SensorType, useAnimatedSensor } from 'react-native-reanimated';

const { width, height } = Layout.window;

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const sensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 20 });
  const [refreshing, setRefreshing] = useState(false);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const { showModal, hideModal, showAuthModal, showIntroductionModal, showProfileModal, showAvatarViewer } = useUI();

  const fetchTopPlayers = useCallback(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, wins, losses, draws, is_public, created_at')
        .not('username', 'is', null)
        .eq('is_public', true)
        .order('wins', { ascending: false })
        .limit(3);
      
      if (data) {
          setTopPlayers(data);
      }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTopPlayers();
    setRefreshing(false);
  };

  // Real-time subscription for rank changes
  useEffect(() => {
    const channel = supabase
      .channel('home_profiles')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
      }, () => {
        // Re-fetch top players when any profile changes
        fetchTopPlayers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTopPlayers]);

  useFocusEffect(
    useCallback(() => {
      // Always fetch top players - visible to everyone
      fetchTopPlayers();

      if (user) {
        const ensureProfile = async () => {
            // Check if profile exists and has username
            const { data, error } = await supabase.from('profiles').select('username').eq('id', user.id).single();
            
            if (error || !data || !data.username) {
                console.log("Repairing profile...");
                const username = user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Player';
                const avatar_url = user.user_metadata?.avatar_url || null;
                
                await supabase.from('profiles').upsert({
                    id: user.id,
                    username: username,
                    avatar_url: avatar_url,
                    updated_at: new Date()
                });
            }
        };
      
        const checkActiveGame = async () => {
           const { data, error } = await supabase
             .from('games')
             .select('id, status')
             .in('status', ['playing', 'waiting'])
             .or(`player_x.eq.${user.id},player_o.eq.${user.id}`)
             .maybeSingle();
           
           if (data && !error) {
               const isWaiting = data.status === 'waiting';
               showModal({
                   title: isWaiting ? 'Open Lobby Found' : 'Active Game Found',
                   description: isWaiting 
                      ? 'You have an open game room waiting for a player. Do you want to return to it?'
                      : 'You have a game in progress. Do you want to rejoin?',
                   actions: [
                       { 
                           text: isWaiting ? 'Cancel' : 'Forfeit', 
                           variant: 'danger',
                           onPress: async () => {
                               hideModal();
                               await supabase.from('games').update({ status: 'abandoned' }).eq('id', data.id);
                           }
                       },
                       { 
                           text: 'Rejoin', 
                           variant: 'primary',
                           onPress: () => {
                               hideModal();
                               router.push(`/game/${data.id}`);
                           }
                       }
                   ]
               });
           }
        };

        checkActiveGame();
        ensureProfile();
      } else {
          const checkOnboarding = async () => {
             const hasSeen = await AsyncStorage.getItem('hasSeenOnboarding');
             if (hasSeen !== 'true') {
                 showIntroductionModal();
             }
          };
          checkOnboarding();
      }
    }, [user, hideModal, router, showModal, fetchTopPlayers, showIntroductionModal])
  );

  return (
     <ThemedView 
        themed safe edges={['top', 'left', 'right', 'bottom']} 
        style={[styles.container]}
    >
            {/* Fixed background floating shapes */}
            <FloatingShape initialX={width * 0.1} initialY={height * 0.1} delay={0} depth={2} sensor={sensor} initialRotation={45} direction={1} duration={25000} opacity={0.5} sensorMultiplier={1}>
                 <X size={100} color={colors.accent} />
            </FloatingShape>
            
            <FloatingShape initialX={width * 0.8} initialY={height * 0.2} delay={500} depth={-1.5} sensor={sensor} initialRotation={120} direction={-1} duration={35000} opacity={0.5} sensorMultiplier={1}>
                 <Circle size={100} color={colors.secondary} />
            </FloatingShape>

            <FloatingShape initialX={width * 0.15} initialY={height * 0.75} delay={1000} depth={3} sensor={sensor} initialRotation={200} direction={1} duration={40000} opacity={0.5} sensorMultiplier={2}>
                   <X size={150} color={colors.accent} />
            </FloatingShape>
          
            <FloatingShape initialX={width * 0.45} initialY={height * 0.35} delay={1500} depth={2} sensor={sensor} initialRotation={200} direction={-1} duration={30000} opacity={0.5} sensorMultiplier={5}>
                   <X size={150} color={colors.accent} />
            </FloatingShape>

            <FloatingShape initialX={width * 0.7} initialY={height * 0.65} delay={1500} depth={-1} sensor={sensor} initialRotation={300} direction={-1} duration={30000} opacity={0.5} sensorMultiplier={5}>
                   <Circle size={120} color={colors.secondary} />
            </FloatingShape>

            {/* Scrollable content */}
            <ThemedView
                style={[styles.container]}
                scroll
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 80, paddingTop: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
            <Animated.View exiting={FadeOut} style={styles.mainContent}>
                <Animated.View entering={FadeInDown.delay(100)} style={styles.logoSection}>
                    <View style={styles.logoContainer}>
                      <Logo variant="filled" size={100} />
                  </View>
                   <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.logoTextContainer}>
                      <ThemedText type='title' size='3xl' weight='black' colorType='text' align='center' style={{ width: "auto" }}>Tic Tac Toe</ThemedText>
                   <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.logoProText, { backgroundColor: colors.accent }]}>
                      <ThemedText type='subtitle' size='lg' weight='black' colorType='white' align='center'>Pro Edition</ThemedText>
                   </Animated.View>
                   </Animated.View>
                </Animated.View>
                <View style={styles.menuOptions}>
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <Button 
                        variant="primary"
                        onPress={() => router.push('/game/solo' as any)}
                        style={[styles.menuButton]}
                    >
                        <View style={styles.buttonContent}>
                            <View style={styles.buttonIconBadgePrimary}>
                                <User size={24} color="white" strokeWidth={3} />
                            </View>
                            <View style={styles.buttonTextWrapper}>
                                <ThemedText weight="bold" size="xl" colorType="white">Play Solo</ThemedText>
                                <ThemedText type="label" colorType="white">with Bot</ThemedText>
                            </View>
                        </View>
                    </Button>
                </Animated.View>
        
                <Animated.View entering={FadeInDown.delay(300).springify()}>
                    <Button 
                        variant="secondary"
                        onPress={() => {
                            if (!user) {
                                showAuthModal('login');
                                return;
                            }
                            router.push('/play-friend' as any);
                        }}
                        style={[styles.menuButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                        <View style={styles.buttonContent}>
                            <View style={[styles.buttonIconBadgeSecondary, { backgroundColor: `${colors.accent}1A` }]}>
                                <ScanLine size={24} color={colors.accent} strokeWidth={3} />
                            </View>
                            <View style={styles.buttonTextWrapper}>
                                <ThemedText weight="bold" size="xl">Play with Friend</ThemedText>
                                <ThemedText type="label" colorType="subtext">Scan & Connect</ThemedText>
                            </View>
                        </View>
                    </Button>
                </Animated.View>
        
                <Animated.View entering={FadeInDown.delay(400).springify()}>
                    <Button 
                        variant="secondary"
                        onPress={() => router.push('/global-rank' as any)}
                        style={[styles.menuButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                        <View style={styles.buttonContent}>
                                <View style={[styles.buttonIconBadgeSecondary, { backgroundColor: `${colors.accent}1A` }]}>
                                    <Trophy size={24} color={colors.accent} strokeWidth={3} />
                                </View>
                                <View style={styles.buttonTextWrapper}>
                                    <ThemedText weight="bold" size="xl">Global Ranks</ThemedText>
                                    <ThemedText type="label" colorType="subtext">Compete with the world</ThemedText>
                                </View>
                                
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                                    {topPlayers.map((player, i) => (
                                        <View key={player.id} style={{ 
                                            width: 24, 
                                            height: 24, 
                                            borderRadius: 12, 
                                            borderWidth: 2, 
                                            borderColor: colors.card, 
                                            marginLeft: i > 0 ? -10 : 0,
                                            zIndex: 3 - i,
                                            backgroundColor: colors.border
                                        }}>
                                            {player.avatar_url ? (
                                                <Image source={{ uri: player.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 12 }} contentFit="cover" transition={200} />
                                            ) : (
                                                <View style={{ width: '100%', height: '100%', borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                                                    <ThemedText size="xs" colorType="white" weight="bold">{player.username?.[0]?.toUpperCase()}</ThemedText>
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>

                                <View style={{ marginLeft: 4 }}>
                                    <ChevronRight size={20} color={colors.subtext} />
                                </View>
                        </View>
                    </Button>
                </Animated.View>

                {topPlayers.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(500).springify()} style={[styles.topPlayersSection]}>
                        <ThemedText type="label" colorType="subtext" weight='black' style={styles.sectionTitle}>Top Players</ThemedText>
                        <View style={[styles.groupedContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                             {topPlayers.map((player, index) => (
                                <Animated.View entering={FadeInDown.delay(index * 100).springify()} key={player.id}>
                                    <TouchableOpacity 
                                        activeOpacity={0.9} 
                                        onPress={() => showProfileModal({
                                            profile: player,
                                            rank: index + 1,
                                            isMe: player.id === user?.id
                                        })}
                                        style={[styles.playerItem, { backgroundColor: colors.card }]}
                                    >
                                        <View style={styles.playerInfo}>
                                            <View style={styles.rankBadge}>
                                                <ThemedText weight="bold" size="sm" colorType="subtext">#{index + 1}</ThemedText>
                                            </View>
                                            <TouchableOpacity onPress={() => player.avatar_url && showAvatarViewer(player.avatar_url)} disabled={!player.avatar_url}>
                                              {player.avatar_url ? (
                                                  <Image source={{ uri: player.avatar_url }} style={styles.playerAvatar} contentFit="cover" transition={200} />
                                              ) : (
                                                  <View style={[styles.playerAvatar, { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }]}>
                                                      <ThemedText colorType="white" weight="bold">{player.username?.[0]?.toUpperCase()}</ThemedText>
                                                  </View>
                                              )}
                                            </TouchableOpacity>
                                            <View style={styles.playerNameWrapper}>
                                                <ThemedText weight="bold" numberOfLines={1}>{player.username}</ThemedText>
                                                <View style={styles.miniStatsRow}>
                                                    <ThemedText size="xs" colorType="success" weight="bold">{player.wins} Total Wins</ThemedText>
                                                </View>
                                            </View>
                                        </View>
                                        {index === 0 && <Trophy size={18} color="#eab308" />}
                                        {index === 1 && <Trophy size={16} color="#94a3b8" />}
                                        {index === 2 && <Trophy size={14} color="#b45309" />}
                                    </TouchableOpacity>
                                    {index < topPlayers.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                                </Animated.View>
                            ))}
                        </View>
                    </Animated.View>
                )}
                
                <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.rulesButtonContainer}>
                    <Button variant="ghost" onPress={showIntroductionModal}> 
                        <Info size={16} color={colors.text} />
                        <ThemedText style={[styles.rulesButtonText, { color: colors.text }]}>Introduction & Rules</ThemedText>
                    </Button>
                </Animated.View>
                </View>
            </Animated.View>

      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    logoTextContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    logoText: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoProText: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 10,
    },
    miniBoard: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        flexDirection: 'column',
    },
    miniRow: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
    },
    miniCell: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ruleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 16,
    },
    ruleTextContent: {
        flex: 1,
        marginRight: 16,
    },
    ruleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ruleIcon: {
        marginRight: 12,
    },
    ruleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    ruleDesc: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    ruleVisual: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
    mainContent: {
        flex: 1,
        width: Layout.CONTAINER_WIDTH_PERCENT,
        maxWidth: Layout.MAX_CONTENT_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 'auto',
        zIndex: 10,
    },
    logoSection: {
        marginBottom: 48,
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Layout.spacing.lg,
    },
    logoX: {
        fontSize: 60,
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    logoO: {
        fontSize: 60,
        fontWeight: '900',
        position: 'absolute',
        bottom: -12,
        right: -12,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 12,
        letterSpacing: 3,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    menuOptions: {
        width: '100%',
        paddingVertical: 16,
    },
    menuButton: {
        width: '100%',
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginBottom: 16,
        borderRadius: 16,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    buttonIconBadgePrimary: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    buttonIconBadgeSecondary: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    buttonTextWrapper: {
        alignItems: 'flex-start',
        flex: 1,
    },
    loadingIndicator: {
        position: 'absolute',
        right: 24,
    },
    rulesButtonContainer: {
        marginTop: 16,
        width: '100%',
    },
    rulesButtonText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    topPlayersSection: {
        width: '100%',
        marginTop: 8,
    },
    sectionTitle: {
        marginBottom: 12,
        paddingLeft: 4,
        letterSpacing: 1,
        textTransform: 'uppercase',
        opacity: 0.7,
    },
    groupedContainer: {
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
    },
    playerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rankBadge: {
        width: 30,
        marginRight: 8,
    },
    playerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },
    playerNameWrapper: {
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
    divider: {
        height: 1,
        width: '100%',
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
    sheetSpacer: {
        width: 32,
    },
    sheetClose: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheetContent: {
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
});
