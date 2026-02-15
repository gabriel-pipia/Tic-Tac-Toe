import BottomSheet from '@/components/BottomSheet';
import Button from '@/components/Button';
import MiniBoard from '@/components/game/MiniBoard';
import RuleCard from '@/components/game/RuleCard';
import ProfileModal, { UserProfile } from '@/components/ProfileModal';
import { ThemedText } from '@/components/Text';
import { ThemedView } from '@/components/View';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUI } from '@/context/UIContext';
import GameScreen, { GameProfile } from '@/screens/GameScreen';
import { BoardState, Player, checkWinner, getBestMove, getWinningLine } from '@/utils/gameLogic';
import { supabase } from '@/utils/supabase';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Handshake, RefreshCw, ThumbsDown, Trophy, User as UserIcon, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Share, StyleSheet, View } from 'react-native';



// ─── Determine game mode from route param ───
type GameMode = 'solo' | 'local' | 'online';

function resolveMode(id: string): { mode: GameMode; onlineGameId?: string } {
  if (id === 'solo') return { mode: 'solo' };
  if (id === 'local') return { mode: 'local' };
  return { mode: 'online', onlineGameId: id };
}

export default function GameRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const {showModal, hideModal, showToast} = useUI()

  const { mode, onlineGameId } = resolveMode(id || 'solo');

  // ─── Game State ───
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [showRules, setShowRules] = useState(false);

  // Online-only state
  const [gameId] = useState<string | null>(onlineGameId ?? null);
  const [onlineStatus, setOnlineStatus] = useState<string>(onlineGameId ? 'waiting' : 'playing');
  const [myMark, setMyMark] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Profiles
  const [playerXProfile, setPlayerXProfile] = useState<GameProfile | null>(null);
  const [playerOProfile, setPlayerOProfile] = useState<GameProfile | null>(null);
  const navigation = useNavigation();
  const [opponentConnected, setOpponentConnected] = useState(true);
  const isLeavingRef = React.useRef(false);
  const onlineStatusRef = React.useRef(onlineStatus);
  const playerOProfileRef = React.useRef(playerOProfile);
  const winnerRef = React.useRef(winner);
  const disconnectTimeoutRef = React.useRef<any>(null);
  
  const [modalProfile, setModalProfile] = useState<UserProfile | null>(null);
  
  useEffect(() => {
    onlineStatusRef.current = onlineStatus;
  }, [onlineStatus]);

  useEffect(() => {
    playerOProfileRef.current = playerOProfile;
  }, [playerOProfile]);

  useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);

  useEffect(() => {
    playerOProfileRef.current = playerOProfile;
  }, [playerOProfile]);
  
  const wasMissingOpponentRef = React.useRef(false);
  const isGracePeriodRef = React.useRef(true);

  useEffect(() => {
      const timer = setTimeout(() => {
          isGracePeriodRef.current = false;
      }, 5000); // 5 seconds grace period for connection stability
      return () => clearTimeout(timer);
  }, []);

  // ─── Helper to fetch single profile ───
  const fetchProfile = useCallback(async (userId: string) => {
      const { data } = await supabase.from('profiles').select('username, avatar_url, id').eq('id', userId).maybeSingle();
      return data as GameProfile;
  }, []);

  const fetchGameProfiles = useCallback(async (pX: string, pO: string | null) => {
      if (pX) fetchProfile(pX).then(setPlayerXProfile);
      if (pO) fetchProfile(pO).then(setPlayerOProfile);
  }, [fetchProfile]);

  // ─── Move Handler ───
  const handleMove = useCallback(async (index: number) => {
    if (board[index] || winner) return;

    if (mode === 'online' && turn !== myMark) return;

    const newBoard = [...board];
    newBoard[index] = turn;
    const result = checkWinner(newBoard);
    setBoard(newBoard);

    if (result) {
      setWinner(result);
      if (result !== 'DRAW') {
        if (mode === 'solo') {
          if (result === 'X') setScore(s => ({ ...s, player: s.player + 1 }));
          else setScore(s => ({ ...s, opponent: s.opponent + 1 }));
        } else if (mode === 'online') {
          if (result === myMark) setScore(s => ({ ...s, player: s.player + 1 }));
          else setScore(s => ({ ...s, opponent: s.opponent + 1 }));
        } else {
          // Local: X is always P1 (for score tracking purposes roughly)
          if (result === 'X') setScore(s => ({ ...s, player: s.player + 1 }));
          else setScore(s => ({ ...s, opponent: s.opponent + 1 }));
        }
      }
    } else {
      setTurn(turn === 'X' ? 'O' : 'X');
    }

    // Sync with backend for online games
    if (mode === 'online' && gameId) {
      const nextTurn = result ? turn : (turn === 'X' ? 'O' : 'X');
      const winningLine = result && result !== 'DRAW' ? getWinningLine(newBoard) : null;
      const updates: any = {
        board: newBoard,
        turn: nextTurn,
        winner: result,
        winning_line: winningLine,
        status: result ? 'finished' : 'playing'
      };

      if (result && result !== 'DRAW') {
        const scoreField = result === 'X' ? 'score_x' : 'score_o';
        const { data: currentSync } = await supabase.from('games').select('score_x, score_o').eq('id', gameId).single();
        if (currentSync) {
            updates[scoreField] = (currentSync[scoreField as keyof typeof currentSync] || 0) + 1;
        }
      }
      
      const { error } = await supabase.from('games').update(updates).eq('id', gameId);
      
      
      if (error) {
        console.error("Move update failed:", error);
        showToast({
          title: 'Error',
          message: 'Failed to sync move. Check connection.',
          type: 'error',
        })
      }
    }
  }, [board, winner, mode, turn, myMark, gameId, showToast]);

  const lastUpdatedGameIdRef = React.useRef<string | null>(null);

  // ─── Stats Update ───
  useEffect(() => {
    if (!winner || !user) return;
    
    // For online, gameId is unique per match. For solo, we might not have gameId or it's just 'solo'.
    // If 'solo', we need to check if we already updated for THIS instance of winner state?
    // Winner state resets to null on reset. So checking if winner is set is enough? 
    // BUT effect deps change.
    // Let's use a flag that resets when winner becomes null.
    
    if (lastUpdatedGameIdRef.current === (gameId || 'solo_session')) return;

    const updateStats = async () => {
        let profileIdToUpdate: string | null = null;
        let resultType: 'win' | 'loss' | 'draw' | null = null;

        // Determine result type
        const isDraw = winner === 'DRAW';
        let isWin = false;

        if (mode === 'solo') {
            profileIdToUpdate = user.id;
            isWin = winner === 'X';
        } else if (mode === 'online' && playerXProfile && playerOProfile) {
            if (user.id === playerXProfile.id) {
                profileIdToUpdate = user.id;
                isWin = winner === 'X';
            } else if (user.id === playerOProfile.id) {
                profileIdToUpdate = user.id;
                isWin = winner === 'O';
            }
        }

        if (profileIdToUpdate) {
             if (isDraw) resultType = 'draw';
             else if (isWin) resultType = 'win';
             else resultType = 'loss';

             const { data: p } = await supabase.from('profiles').select('wins, losses, draws, game_combinations').eq('id', profileIdToUpdate).single();
             
             if (p) {
                 const updates: any = {};
                 if (resultType === 'draw') updates.draws = (p.draws || 0) + 1;
                 else if (resultType === 'win') {
                     updates.wins = (p.wins || 0) + 1;
                     
                     // Track winning combination
                     const winLine = getWinningLine(board);
                     if (winLine) {
                         const comboKey = winLine.join('-');
                         const currentCombos = p.game_combinations || {};
                         updates.game_combinations = {
                             ...currentCombos,
                             [comboKey]: (currentCombos[comboKey] || 0) + 1
                         };
                     }
                 }
                 else if (resultType === 'loss') updates.losses = (p.losses || 0) + 1;

                 const { error } = await supabase.from('profiles').update(updates).eq('id', profileIdToUpdate);
                 if (!error) {
                     lastUpdatedGameIdRef.current = gameId || 'solo_session';
                 }
             }
        }
    };

    updateStats();
  }, [winner, mode, user, playerXProfile, playerOProfile, gameId, board]);
  
  // Reset update flag when game resets
  useEffect(() => {
      if (!winner) {
          lastUpdatedGameIdRef.current = null;
      }
  }, [winner]);

  // ─── Bot AI ───
  useEffect(() => {
    if (mode === 'solo' && turn === 'O' && !winner) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove(board, 'O');
        if (bestMove !== -1) {
          handleMove(bestMove);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [mode, turn, winner, board, handleMove]);

  // ─── Online: Join & Profiles ───
  useEffect(() => {
    if (mode !== 'online' || !onlineGameId || !user) {
        // If Solo/Local, fetch my profile for P1
        if (mode === 'solo' && user) {
             fetchProfile(user.id).then(p => setPlayerXProfile(p));
             // P2 is Bot
             setPlayerOProfile({ username: 'Bot (AI)', id: 'bot', avatar_url: null });
        } else if (mode === 'local' && user) {
             fetchProfile(user.id).then(p => setPlayerXProfile(p));
             setPlayerOProfile({ username: 'Player O', id: 'guest', avatar_url: null });
        }
        return;
    }

    const joinOrRejoin = async () => {
      setLoading(true);
      const { data: game, error } = await supabase.from('games').select('*').eq('id', onlineGameId).single();

      if (error || !game) {
         showModal({
            title: 'Game Not Found!',
            description: 'This game ID does not exist or has been deleted.',
            icon: <ThumbsDown size={40} color={colors.accent} />,
            actions: [
                { 
                    text: 'Back to Home', 
                    variant: 'primary', 
                    onPress: () => {
                      hideModal()
                      router.replace('/')
                    }
                }
            ]
        });
        setLoading(false);
        return;
      }

      // Determine My Mark & Update/Join
      if (game.player_x === user.id) {
        setMyMark('X');
        setBoard(game.board);
        setTurn(game.turn);
        setWinner(game.winner);
        setOnlineStatus(game.status);
        setScore({ 
          player: game.player_x === user.id ? game.score_x : game.score_o, 
          opponent: game.player_x === user.id ? game.score_o : game.score_x 
        });
      } else if (!game.player_o || game.player_o === user.id) {
         if (!game.player_o) {
            const { error: joinError } = await supabase.from('games').update({ player_o: user.id, status: 'playing' }).eq('id', onlineGameId);
            if (joinError) {
                showModal({
                    title: 'Join Failed',
                    description: 'Could not join the game. Please try again.',
                    icon: <X size={40} color={colors.error} />,
                    actions: [{ text: 'Back to Home', onPress: () => router.replace('/'), variant: 'primary' }]
                });
                return;
            }
         }
         setMyMark('O');
         setBoard(game.board);
         setOnlineStatus('playing');
      } else {
        showModal({
            title: 'Game Full',
            description: 'This game already has two players.',
            icon: <UserIcon size={40} color={colors.text} />,
            actions: [{ text: 'Back to Home', onPress: () => router.replace('/'), variant: 'primary' }]
        });
        setLoading(false);
        return;
      }
      setLoading(false);

      // Fetch Profiles
      fetchGameProfiles(game.player_x, game.player_o || (game.player_x === user.id ? null : user.id));
    };

    joinOrRejoin();
  }, [mode, onlineGameId, user, router, fetchGameProfiles, fetchProfile, colors, showModal, hideModal]);

  // ─── Online: Realtime Listener & Presence ───
  const confirmLeave = useCallback((onConfirm: () => void) => {
    if (mode !== 'online' || !gameId) {
      onConfirm();
      return;
    }

    const hasWinner = winnerRef.current;
    
    showModal({
      title: 'Leave Game?',
      description: hasWinner 
        ? "The game is over. Do you want to leave the game?"
        : "Are you sure you want to leave the game? You will forfeit the match.",
      icon: <ThumbsDown size={40} color={colors.error} />,
      actions: [
        { text: 'Cancel', variant: 'secondary', onPress: () => hideModal() },
        { 
          text: 'Leave', 
          variant: 'primary', 
          onPress: async () => {
            hideModal();
            isLeavingRef.current = true;
            const hasWinner = winnerRef.current;
            
            // Only update to abandoned if the game wasn't finished
            // This preserves the 'finished' status for win/loss/draw in history
            if (!hasWinner) {
              await supabase.from('games').update({ status: 'abandoned' }).eq('id', gameId);
            }
            onConfirm();
          } 
        }
      ]
    });
  }, [mode, gameId, colors, showModal, hideModal]);

  useEffect(() => {
    if (mode !== 'online' || !gameId) return;
    
    // Prevent accidental leave
    const removeListener = navigation.addListener('beforeRemove', (e: any) => {
        if (!gameId || isLeavingRef.current) return;

        const status = onlineStatusRef.current;
        const isActive = status === 'playing' || status === 'finished' || (status && status.startsWith('rematch_'));

        if (!isActive) return;

        e.preventDefault();
        confirmLeave(() => navigation.dispatch(e.data.action));
    });

    const channel = supabase.channel(`game:${gameId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, (payload) => {
        const g = payload.new;
        
        // If status became abandoned, leave
        if (g.status === 'abandoned') {
             showModal({
                 title: 'Opponent Left',
                 description: 'Your opponent has left the game.',
                 icon: <UserIcon size={40} color={colors.subtext} />,
                  actions: [{ text: 'Go Home', onPress: async () => {
                       hideModal();
                       router.replace('/');
                  }}],
                  onDismiss: async () => {
                       router.replace('/');
                  }
             });
             return;
        }

        setBoard(g.board);
        setTurn(g.turn);
        setWinner(g.winner);
        setOnlineStatus(g.status);
        
        // Sync score
        if (user) {
            setScore({
               player: g.player_x === user.id ? g.score_x : g.score_o,
               opponent: g.player_x === user.id ? g.score_o : g.score_x
            });
        }
        
        // If P2 joined, fetch their profile
        if (g.player_o && !playerOProfileRef.current) {
            fetchProfile(g.player_o).then(setPlayerOProfile);
        }
      })
      .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          
          // Better presence counting: count unique user_ids
          const entries = Object.values(state).flat() as any[];
          const uniqueUserIds = new Set(entries.map(e => e.user_id).filter(Boolean));
          const presentUsersCount = uniqueUserIds.size;
          
          const isOpponentPresent = entries.some(e => e.user_id !== user?.id);

          if (!isOpponentPresent && (onlineStatusRef.current === 'playing' || onlineStatusRef.current === 'finished') && !isGracePeriodRef.current) {
              // Debounce disconnect: wait 3 seconds before showing overlay
              if (!disconnectTimeoutRef.current) {
                disconnectTimeoutRef.current = setTimeout(() => {
                    console.log('Opponent missing confirmed!');
                    wasMissingOpponentRef.current = true;
                    setOpponentConnected(false);
                    disconnectTimeoutRef.current = null;
                }, 3000);
              }
          } else if (isOpponentPresent || presentUsersCount >= 2) {
              // Cancel disconnect timeout if opponent is found
              if (disconnectTimeoutRef.current) {
                clearTimeout(disconnectTimeoutRef.current);
                disconnectTimeoutRef.current = null;
              }
              
              if (wasMissingOpponentRef.current) {
                  // Opponent reconnected
                  wasMissingOpponentRef.current = false;
                  showModal({
                      title: 'Opponent Reconnected',
                      description: 'Your opponent is back. Do you want to continue?',
                      icon: <UserIcon size={40} color={colors.accent} />,
                      actions: [
                          { text: 'No', variant: 'secondary', onPress: () => {
                              supabase.from('games').update({ status: 'abandoned' }).eq('id', gameId);
                              if (navigation.canGoBack()) router.back(); else router.replace('/');
                              hideModal();
                          }},
                          { text: 'Yes', variant: 'primary', onPress: () => hideModal() }
                      ]
                  });
              }
              setOpponentConnected(true);
          }
      })
      .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
              await channel.track({ online_at: new Date().toISOString(), user_id: user?.id });
          }
      });

    return () => { 
        supabase.removeChannel(channel);
        removeListener();
        if (disconnectTimeoutRef.current) clearTimeout(disconnectTimeoutRef.current);
    };
  }, [gameId, mode, fetchProfile, navigation, user, colors, router, showModal, hideModal, confirmLeave]);

  // ─── Opponent Disconnect Timeout ───
  // Removed strict timeout to allow reconnection. 
  // Overlay provides UI for this state.

  // ─── Helpers ───
  // ─── Online: Rematch Logic ───
  const requestRematch = async () => {
      if (!myMark || !gameId) return;
      setLoading(true);
      const newStatus = `rematch_requested_${myMark}`;
      await supabase.from('games').update({ status: newStatus }).eq('id', gameId);
  };

  const acceptRematch = useCallback(async () => {
      if (!gameId) return;
      setLoading(true);
      hideModal();
      const nextTurn = winner === 'X' ? 'O' : 'X'; 
      
      const { error } = await supabase.from('games').update({
          board: Array(9).fill(null),
          winner: null,
          turn: nextTurn,
          status: 'playing'
      }).eq('id', gameId);
      
      if (error) {
          setLoading(false);
          showModal({
              title: 'Error',
              description: 'Failed to start rematch.',
              icon: <X size={40} color={colors.error} />,
              actions: [{ text: 'OK', onPress: () => hideModal() }]
          });
      }
  }, [gameId, winner, colors, showModal, hideModal]);

  const rejectRematch = useCallback(async () => {
       if (!gameId) return;
       setLoading(true);
       hideModal();
       
       try {
           const { error } = await supabase.from('games').update({ status: 'rematch_rejected' }).eq('id', gameId);
           if (error) throw error;
           if (navigation.canGoBack()) router.back(); else router.replace('/');
           hideModal();
       } catch {
           setLoading(false);
           showModal({
              title: 'Rejected',
              description: 'Rematch is rejected by opponent.',
              icon: <X size={40} color={colors.error} />,
              actions: [{ text: 'OK', onPress: () => hideModal() }]
          });
       }
  }, [gameId, colors, navigation, showModal, hideModal, router]);

  useEffect(() => {
     if (mode !== 'online' || !onlineStatus) return;

     if (onlineStatus.startsWith('rematch_requested_') && onlineStatus !== `rematch_requested_${myMark}`) {
         showModal({
             title: 'Rematch Request',
             description: 'Opponent wants to play again.',
             icon: <RefreshCw size={40} color={colors.accent} />,
             actions: [
                 { text: 'Reject', onPress: rejectRematch, variant: 'secondary' },
                 { text: 'Accept', onPress: acceptRematch, variant: 'primary' }
             ]
         });
     }
     
     if (onlineStatus === 'rematch_rejected') {
         if (loading) setLoading(false);
         showModal({
             title: 'Rematch Declined',
             description: 'Opponent declined the rematch request.',
             icon: <X size={40} color={colors.error} />,
             actions: [{ text: 'Back to Home', onPress: () => {
                if (navigation.canGoBack()) router.back(); else router.replace('/');
                hideModal();
             } }]
         });
     }
     
     // If game restarted (status went back to playing from finished/rematch)
     if (onlineStatus === 'playing') {
         if (loading) setLoading(false);
         hideModal();
     }
  }, [onlineStatus, mode, myMark, loading, acceptRematch, rejectRematch, colors, navigation, showModal, hideModal, router]);

  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setTurn('X');
    setLoading(false);
    hideModal();
  };

  const resetGame = () => {
    if (mode === 'online') {
      requestRematch();
      return;
    }
    resetBoard();
  };

  const handleHome = async () => {
    if (mode === 'online' && gameId && !isLeavingRef.current) {
        confirmLeave(() => {
            if (navigation.canGoBack()) router.back(); else router.replace('/');
        });
        return;
    }
    
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
    hideModal();
  };

  const handleShare = async () => {
    if (gameId) {
      await Share.share({ message: `Join my Tic Tac Toe game! Game ID: ${gameId}` });
    }
  };

  const handleProfilePress = async (profile: GameProfile) => {
      // Optimistically fetch
      // We could show a tiny loader or just wait. It's usually fast.
      try {
          const { data } = await supabase
            .from('profiles')
            .select('wins, losses, draws, is_public')
            .eq('id', profile.id)
            .single();
          
          if (data) {
              setModalProfile({
                  id: profile.id,
                  username: profile.username,
                  avatar_url: profile.avatar_url,
                  wins: data.wins || 0,
                  losses: data.losses || 0,
                  draws: data.draws || 0,
                  is_public: data.is_public
              });
          }
      } catch (e) {
          console.error("Failed to fetch profile stats", e);
      }
  };

  if (loading) {
    return (
      <ThemedView themed safe style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <ThemedText size="lg" weight="bold" colorType="text" style={styles.loadingText}>Joining Game...</ThemedText>
        <Button title='Cancel' variant='secondary' onPress={() => handleHome()} />
      </ThemedView>
    );
  }



  return (
    <ThemedView safe edges={['top', 'left', 'right']} style={styles.container}>
      <GameScreen
        board={board}
        onPress={handleMove}
        winner={winner}
        turn={turn}
        myMark={mode === 'online' ? myMark : (mode === 'solo' ? 'X' : null)}
        isBotGame={mode === 'solo'}
        gameId={mode === 'online' ? gameId : undefined}
        onlineStatus={mode === 'online' ? onlineStatus : undefined}
        onReset={resetGame}
        onHome={handleHome}
        onShare={mode === 'online' ? handleShare : undefined}
        onShowRules={() => setShowRules(true)}
        score={score}
        playerXProfile={playerXProfile}
        playerOProfile={playerOProfile}
        onProfilePress={handleProfilePress}
      />

      <BottomSheet visible={showRules} onClose={() => setShowRules(false)}>
        <ThemedView style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <ThemedText type="defaultSemiBold" size="lg" colorType="text" weight="bold">Game Rules</ThemedText>
          <Button variant="secondary" size='sm' type='icon' onPress={() => setShowRules(false)} icon={<X size={20} color={colors.text} />} />
        </ThemedView>
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

      <ProfileModal 
        visible={!!modalProfile} 
        profile={modalProfile} 
        onClose={() => setModalProfile(null)}
        isMe={modalProfile?.id === user?.id}
      />

      {/* Opponent Disconnected Overlay */}
      {!opponentConnected && (onlineStatus === 'playing' || onlineStatus === 'finished') && !winner && (
          <ThemedView style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 100 }]}>
               <ActivityIndicator size="large" color={colors.accent} style={{ marginBottom: 20 }} />
               <ThemedText type="subtitle" size="xl" colorType="white">Waiting for opponent...</ThemedText>
          <ThemedText type="label" colorType="subtext" size="md">They may have lost connection.</ThemedText>
          <Button title='Back to Home' variant='secondary' size='md' onPress={()=> router.replace("/")}/>
          </ThemedView>
      )}

      {/* Opponent Left Overlay for Finished Games */}
      {!opponentConnected && onlineStatus === 'finished' && winner && (
          <ThemedView style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 110 }]}>
               <UserIcon size={64} color={colors.subtext} style={{ marginBottom: 10 }} />
               <ThemedText type="subtitle" size="xl" colorType="white">Opponent Left</ThemedText>
               <ThemedText type="label" colorType="subtext" size="md" align="center" style={{ paddingHorizontal: 40 }}>
                  Your opponent has left the room. You can go back to the home screen or view the final board.
               </ThemedText>
               <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                  <Button title='Close' variant='secondary' size='md' onPress={()=> setOpponentConnected(true)}/>
                  <Button title='Go Home' variant='primary' size='md' onPress={()=> router.replace("/")}/>
               </View>
          </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  loadingText: {
    marginTop: 16,
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
  sheetContent: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
