import BottomSheet from '@/components/BottomSheet';
import Button from '@/components/Button';
import { ThemedText } from '@/components/Text';
import { ThemedView } from '@/components/View';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Circle, Handshake, Info, ScanLine, ThumbsDown, Trophy, User, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, SensorType, useAnimatedSensor } from 'react-native-reanimated';

import FloatingShape from '@/components/FloatingShape';
import MiniBoard from '@/components/game/MiniBoard';
import RuleCard from '@/components/game/RuleCard';
import { Layout } from '@/constants/Layout';
import { useUI } from '@/context/UIContext';
import { supabase } from '@/utils/supabase';
import { Image } from 'expo-image';

const { width, height } = Layout.window;

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const sensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 20 });
  const [showRules, setShowRules] = useState(false);
  const [topAvatars, setTopAvatars] = useState<string[]>([]);
  const { showModal, hideModal } = useUI();

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      
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

      const fetchTopAvatars = async () => {
          const { data } = await supabase
            .from('profiles')
            .select('avatar_url')
            .not('avatar_url', 'is', null)
            .order('wins', { ascending: false })
            .limit(10);
          
          if (data) {
              const urls = data.map(p => p.avatar_url).filter(Boolean).slice(0, 3);
              setTopAvatars(urls as string[]);
          }
      };

      checkActiveGame();
      ensureProfile();
      fetchTopAvatars();
    }, [user, hideModal, router, showModal])
  );

  return (
     <ThemedView themed safe edges={['top', 'left', 'right', 'bottom']} style={[styles.container]}>
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

            <Animated.View exiting={FadeOut} style={styles.mainContent}>
                <Animated.View entering={FadeInDown.delay(100)} style={styles.logoSection}>
                <View 
                  style={[styles.logoContainer, { 
                    backgroundColor: `${colors.accent}33`, 
                    borderColor: `${colors.accent}4D`,
                    shadowColor: colors.accent,
                  }]}
                >
                    <Image source={require('../../assets/images/icon.png')} contentFit='contain' style={{ width: 100, height: 100 }} />
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
                        onPress={() => router.push('/play-friend' as any)}
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
                                    {topAvatars.map((url, i) => (
                                        <View key={i} style={{ 
                                            width: 24, 
                                            height: 24, 
                                            borderRadius: 12, 
                                            borderWidth: 2, 
                                            borderColor: colors.card, 
                                            marginLeft: i > 0 ? -10 : 0,
                                            zIndex: 3 - i,
                                            backgroundColor: colors.border
                                        }}>
                                            <Image source={{ uri: url }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                                        </View>
                                    ))}
                                </View>

                                <View style={{ marginLeft: 4 }}>
                                    <ChevronRight size={20} color={colors.subtext} />
                                </View>
                        </View>
                    </Button>
                </Animated.View>
                
                <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.rulesButtonContainer}>
                    <Button variant="ghost" onPress={() => setShowRules(true)}> 
                        <Info size={16} color={colors.text} />
                        <ThemedText style={[styles.rulesButtonText, { color: colors.text }]}>How to Play</ThemedText>
                    </Button>
                </Animated.View>
                </View>
            </Animated.View>

            <BottomSheet visible={showRules} onClose={() => setShowRules(false)}>
                <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
                    <ThemedText type="defaultSemiBold" size="lg" colorType="text" weight="bold">Game Rules</ThemedText>
                    <Button variant="secondary" size='sm' type='icon' onPress={() => setShowRules(false)} icon={<X size={20} color={colors.text} />} />
                </View>
                <ThemedView scroll style={styles.sheetContent} showsVerticalScrollIndicator={false}>
                    <RuleCard 
                        icon={<Trophy size={24} color="#eab308" />} 
                        title="WIN" 
                        desc="Get 3 marks in a row (horizontal, vertical, or diagonal). Player wins." 
                        visual={<MiniBoard board={["O", "O", 'X', null, 'X', null, 'X', null, null]} winLine={[2, 4, 6]} />}
                    />
                    <RuleCard 
                        icon={<ThumbsDown size={24} color={colors.error} />} 
                        title="DEFEAT" 
                        desc="Opponent gets 3 in a row. Player loses the round." 
                        visual={<MiniBoard board={['O', null, "X", 'O', "X", "O", 'O', null, "X"]} winLine={[0, 3, 6]} />}
                    />
                    <RuleCard 
                        icon={<Handshake size={24} color="#60a5fa" />} 
                        title="DRAW" 
                        desc="Board is full with no winner. The game ends in a draw." 
                        visual={<MiniBoard board={['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']} />}
                    />
                </ThemedView>
            </BottomSheet>
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
        width: Layout.components.logoSize,
        height: Layout.components.logoSize,
        borderRadius: Layout.borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Layout.spacing.lg,
        borderWidth: 2,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
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
