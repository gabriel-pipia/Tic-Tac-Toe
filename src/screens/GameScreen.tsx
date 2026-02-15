import Button from '@/components/Button';
import OnlineBoard from '@/components/game/OnlineBoard';
import ResultAnimation from '@/components/game/ResultAnimation';
import SoloBoard from '@/components/game/SoloBoard';
import { ThemedText } from '@/components/Text';
import { ThemedView } from '@/components/View';
import { Layout } from '@/constants/Layout';
import { useTheme } from '@/context/ThemeContext';
import { Player } from '@/utils/gameLogic';
import { Image } from 'expo-image';
import { ArrowLeft, BookOpen, Bot, Circle, Copy, Crown, RefreshCw, User as UserIcon, X as XIcon } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

export interface GameProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface GameScreenProps {
  board: (Player | null)[];
  onPress: (index: number) => void;
  winner: Player | 'DRAW' | null;
  turn: Player;
  myMark: Player | null; 
  isBotGame?: boolean;
  gameId?: string | null;
  onlineStatus?: string;
  onReset: () => void;
  onHome: () => void;
  onShare?: () => void;
  onShowRules: () => void;
  score?: { player: number; opponent: number };
  playerXProfile?: GameProfile | null;
  playerOProfile?: GameProfile | null;
  onProfilePress?: (profile: GameProfile) => void;
}

export default function GameScreen({
  board,
  onPress,
  winner,
  turn,
  myMark,
  isBotGame,
  gameId,
  onlineStatus,
  onReset,
  onHome,
  onShare,
  onShowRules,
  score = { player: 0, opponent: 0 },
  playerXProfile,
  playerOProfile,
  onProfilePress
}: GameScreenProps) {
  const { colors } = useTheme();
  
  const isMyTurn = !winner && (myMark ? turn === myMark : true);
  
  // Determine Mode Title
  const modeTitle = isBotGame ? "Play Solo" : "Online Match";

  const scoreX = myMark === 'X' || !myMark ? score.player : score.opponent;
  const scoreO = myMark === 'O' ? score.player : score.opponent;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.responsiveContainer}>
          {/* Top Bar */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.topBar}>
              <Button 
                onPress={onHome} 
                variant='secondary'
                size='sm'
                type='icon'
                icon={<ArrowLeft size={20} color={colors.text} />}
              />
              
              <View style={styles.gameInfo}>
                 <ThemedText size='lg' weight='bold' colorType='text'>{modeTitle}</ThemedText>
                 {gameId && (
                    <ThemedText size="xs" colorType="subtext" lineBreakMode='tail' numberOfLines={1} align='center' style={{width: "100%"}}>ID: {gameId}</ThemedText>
                 )}
              </View>
            
            <Button 
                onPress={onShowRules} 
                variant='secondary'
                size='sm'
                type='icon'
                icon={<BookOpen size={20} color={colors.text} />}
              />
          </Animated.View>

          {/* Players Header */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.playersContainer}>
              {/* Player X */}
              <PlayerCard 
                profile={playerXProfile} 
                mark="X" 
                score={scoreX} 
                active={turn === 'X' && !winner} 
                isWinner={winner === 'X'}
                isMe={myMark === 'X'}
                onPress={() => playerXProfile && onProfilePress?.(playerXProfile)}
              />

              {/* VS / Status */}
              <View style={styles.vsContainer}>
                  {winner ? (
                     <Animated.View entering={ZoomIn} style={styles.winnerBadge}>
                         <Crown size={24} color="#eab308" fill="#eab308" />
                     </Animated.View>
                  ) : (
                     <ThemedText weight="black" size="2xl" colorType="subtext">VS</ThemedText>
                  )}
              </View>

              {/* Player O */}
              <PlayerCard 
                profile={playerOProfile} 
                mark="O" 
                score={scoreO} 
                active={turn === 'O' && !winner} 
                isWinner={winner === 'O'}
                isMe={myMark === 'O'}
                isBot={isBotGame}
                waiting={onlineStatus === 'waiting'}
                onPress={() => playerOProfile && onProfilePress?.(playerOProfile)}
              />
          </Animated.View>

          {/* Board Area */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.boardContainer}>
             {onlineStatus === 'waiting' ? (
                 <View style={[styles.waitingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                     <ThemedText size="xl" weight="bold" style={{ marginBottom: 8 }}>Waiting for Player...</ThemedText>
                     <ActivityIndicator size="large" color={colors.accent} style={{ marginBottom: 20 }} />
                     
                     <ThemedText align="center" colorType="subtext" style={{ marginBottom: 20 }}>
                        Share this Game ID with a friend:
                     </ThemedText>
                     
                     <TouchableOpacity onPress={onShare} style={[styles.codeBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                        <ThemedText weight="bold" size="lg" style={{ fontFamily: 'monospace' }}>{gameId}</ThemedText>
                        <Copy size={16} color={colors.subtext} style={{ marginLeft: 12 }} />
                     </TouchableOpacity>
                 </View>
             ) : (
                 <View style={styles.boardWrapper}>
                    {isBotGame ? 
                        <SoloBoard board={board} onPress={onPress} disabled={!!winner || (!isMyTurn && !!myMark)} winner={winner} />
                    : onlineStatus ? 
                        <OnlineBoard 
                            board={board} 
                            onPress={onPress} 
                            disabled={!!winner || (!isMyTurn && !!myMark)} 
                            waiting={onlineStatus === 'waiting'} 
                            turn={turn} 
                            myMark={myMark}
                            winner={winner}
                        />
                    : null}
                 </View>
             )}
          </Animated.View>

          {/* Footer Controls */}
          {(!onlineStatus || onlineStatus !== 'waiting') && (
            <Animated.View entering={FadeInDown.delay(500)} style={styles.footer}>
                 <Button 
                    title={winner ? "Play Again" : "Reset Game"}
                    onPress={onReset}
                    variant={winner ? "primary" : "secondary"}
                    icon={<RefreshCw size={20} color={winner ? 'white' : colors.text} />}
                    style={{ minWidth: "100%" }}
                />
            </Animated.View>
          )}

          {winner && (
                  <ResultAnimation type={winner === 'DRAW' ? 'draw' : (!onlineStatus || winner === myMark ? 'win' : 'loss')} />
          )}
      </View>
    </ThemedView>
  );
}

const PlayerCard = ({ profile, mark, score, active, isWinner, isMe, isBot, waiting, onPress }: any) => {
    const { colors } = useTheme();
    
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            disabled={waiting || isBot} // Disable press for Bot or Waiting
            style={{ width: '40%' }} // Wrap in container or just apply style
        >
        <Animated.View
            style={[
                styles.playerCard, 
                { 
                    width: '100%', // Take full width of container
                    backgroundColor: colors.border, 
                    borderColor: active ? (mark === 'X' ? colors.primary : colors.secondary) : colors.border,
                    borderWidth: (active || isWinner) ? 2 : 1,
                }
            ]}
        >
            <View style={styles.avatarSection}>
                <View style={[styles.avatarContainer, { backgroundColor: colors.background }]}>
                    {waiting ? (
                        <ActivityIndicator color={colors.subtext} />
                    ) : profile?.avatar_url ? (
                        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                    ) : isBot ? (
                        <Bot size={24} color={colors.subtext} />
                    ) : (
                        <UserIcon size={24} color={colors.subtext} />
                    )}
                    
                    {/* Mark Badge */}
                    <View style={[styles.markBadge, { backgroundColor: colors.background }]}>
                        {mark === 'X' ? (
                            <XIcon size={18} color={colors.primary} strokeWidth={3} />
                        ) : (
                            <Circle size={18} color={colors.secondary} strokeWidth={3} />
                        )}
                    </View>
                </View>
                {isWinner && (
                    <View style={styles.winnerCrown}>
                        <Crown size={20} color="#eab308" fill="#eab308" />
                    </View>
                )}
            </View>

            <View style={{ alignItems: 'center' }}>
                <ThemedText weight="bold" numberOfLines={1} style={{ maxWidth: 80, fontSize: 13 }}>
                    {waiting ? 'Waiting...' : (profile?.username || (isBot ? 'Bot' : 'Guest'))}
                {isMe && <ThemedText size="xs" colorType="accent"> (You)</ThemedText>}
                </ThemedText>
            </View>

            <View style={[styles.scoreBadge, { backgroundColor: colors.background }]}>
                 <ThemedText weight="black" size="lg">{score}</ThemedText>
            </View>
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
    width: Layout.CONTAINER_WIDTH_PERCENT,
    maxWidth: Layout.MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    width: "100%",
  },
  gameInfo: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 16,
  },
  gameIdBadge: {
      marginTop: 2,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: 'rgba(0,0,0,0.05)',
      borderRadius: 4,
  },
  playersContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 32,
  },
  playerCard: {
      width: '40%',
      padding: 12,
      borderRadius: 20,
      alignItems: 'center',
      gap: 8,
  },
  avatarSection: {
      position: 'relative',
      marginBottom: 4,
  },
  avatarContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
  },
  avatar: {
      width: '100%',
      height: '100%',
      borderRadius: 28,
  },
  markBadge: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      width: 28,
      height: 28,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
  },
  winnerCrown: {
      position: 'absolute',
      top: -16,
      left: 18,
  },
  scoreBadge: {
      paddingHorizontal: 12,
      paddingVertical: 2,
      borderRadius: 12,
      marginTop: 4,
  },
  vsContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '20%',
  },
  winnerBadge: {
      alignItems: 'center',
      justifyContent: 'center',
  },
  boardContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  boardWrapper: {
      width: '100%',
    maxWidth: Layout.MAX_CONTENT_WIDTH,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
  },
  waitingCard: {
      width: '100%',
      padding: 32,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderStyle: 'dashed',
  },
  codeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 8,
      borderWidth: 1,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 24,
  },
  resultOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
  }
});
