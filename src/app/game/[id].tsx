import MiniBoard from '@/components/game/MiniBoard';
import RuleCard from '@/components/game/RuleCard';
import ProfileModal from '@/components/ProfileModal';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import SheetHeader from '@/components/ui/SheetHeader';
import { ThemedText } from '@/components/ui/Text';
import { ThemedView } from '@/components/ui/View';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUI } from '@/context/UIContext';
import { checkWinner, getBestMove, getWinningLine } from '@/lib/game/logic';
import { supabase } from '@/lib/supabase/client';
import GameScreen from '@/screens/GameScreen';
import { BoardState, GameProfile, Player } from '@/types/game';
import { UserProfile } from '@/types/user';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Handshake, RefreshCw, ThumbsDown, Trophy, User as UserIcon, UserX, WifiOff, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, ZoomIn } from 'react-native-reanimated';



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
  const { user, loading: authLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const {showModal, hideModal, showToast} = useUI()

  const { mode, onlineGameId } = resolveMode(id || 'solo');

  // ─── Game State ───
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [showRules, setShowRules] = useState(false);

  // Online-only state
  const gameId = onlineGameId ?? null;
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

  // Reactions
  const [reactionX, setReactionX] = useState<string | null>(null);
  const [reactionO, setReactionO] = useState<string | null>(null);
  const reactionTimeoutXRef = React.useRef<any>(null);
  const reactionTimeoutORef = React.useRef<any>(null);
  
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
  const rematchNotifiedRef = React.useRef<string | null>(null);
  
  const myMarkRef = React.useRef(myMark);
  const userRef = React.useRef(user);

  useEffect(() => {
    myMarkRef.current = myMark;
  }, [myMark]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
      const timer = setTimeout(() => {
          isGracePeriodRef.current = false;
      }, 5000); // 5 seconds grace period for connection stability
      return () => clearTimeout(timer);
  }, []);

  // ─── Auth Guard (online only) ───
  useEffect(() => {
    if (!authLoading && !user && mode === 'online') {
        showToast({ title: 'Authentication Required', message: 'Please log in to play online.', type: 'error' });
        router.replace('/');
    }
  }, [authLoading, user, mode, router, showToast]);

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
        // If Solo/Local, fetch my profile for P1 (or use Guest)
        if (mode === 'solo') {
             if (user) {
                 fetchProfile(user.id).then(p => setPlayerXProfile(p));
             } else {
                 setPlayerXProfile({ username: 'Guest', id: 'guest', avatar_url: null });
             }
             // P2 is Bot
             setPlayerOProfile({ username: 'Bot (AI)', id: 'bot', avatar_url: null });
        } else if (mode === 'local') {
             if (user) {
                 fetchProfile(user.id).then(p => setPlayerXProfile(p));
             } else {
                 setPlayerXProfile({ username: 'Guest', id: 'guest', avatar_url: null });
             }
             setPlayerOProfile({ username: 'Player O', id: 'guest_o', avatar_url: null });
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

  // ─── Polling Fallback & Foreground Refresh ───
  useEffect(() => {
      if (mode !== 'online' || !gameId || !user) return;

      // Poll every 3s if waiting, to fallback if realtime misses the 'playing' event
      // Also poll if 'playing' just to ensure board sync occasionally? No, realtime is usually fine for moves.
      // But for the initial 'waiting' -> 'playing' transition, it's critical.
      const shouldPoll = onlineStatus === 'waiting'; 
      let interval: any = null;

      if (shouldPoll) {
          interval = setInterval(async () => {
              const { data: g, error } = await supabase.from('games').select('status, player_o, player_x').eq('id', gameId).single();
              
              if (error) {
                  console.error('[Polling] Error fetching game:', error);
                  return;
              }

               // Check if we need to update local state
               // 1. Status changed in DB
               // 2. Opponent joined (player_o set) but we barely noticed
               // 3. Status is waiting in DB but player_o is there -> force playing (fix stuck state)
               const dbStatus = g.status;
               const hasOpponent = !!g.player_o;
               
               let newStatus = dbStatus;
               if (dbStatus === 'waiting' && hasOpponent) {
                   console.log('[Polling] Found opponent but status waiting. Forcing playing.');
                   newStatus = 'playing';
                   // Optionally fix DB?
                   supabase.from('games').update({ status: 'playing' }).eq('id', gameId).then();
               }

               if (g && (newStatus !== onlineStatusRef.current || (g.player_o && !playerOProfileRef.current))) {
                   console.log(`[Polling] Detected change. Status: ${newStatus}, Opponent: ${g.player_o}`);
                   setOnlineStatus(newStatus);
                   if (g.player_o) fetchGameProfiles(user.id === g.player_x ? user.id : g.player_x, g.player_o);
               }
          }, 2000);
      }

      // App Foreground listener
      const subscription = AppState.addEventListener('change', async (nextAppState) => {
          if (nextAppState === 'active') {
               console.log('[AppState] App came to foreground, refreshing game...');
               const { data: g } = await supabase.from('games').select('*').eq('id', gameId).single();
               if (g) {
                    setBoard(g.board);
                    setTurn(g.turn);
                    setWinner(g.winner);
                    setOnlineStatus(g.status);
                    setScore({ 
                        player: g.player_x === user.id ? g.score_x : g.score_o, 
                        opponent: g.player_x === user.id ? g.score_o : g.score_x 
                    });
                    
                    // Re-sync comments/reactions logic if needed
                    fetchGameProfiles(g.player_x, g.player_o);
               }
          }
      });

      return () => {
          if (interval) clearInterval(interval);
          subscription.remove();
      };
  }, [mode, gameId, user, onlineStatus, fetchGameProfiles]);

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
        
        // If the game is already finished, allow immediate leave but notify opponent
        if (status === 'finished') {
            isLeavingRef.current = true;
            supabase.from('games').update({ status: 'opponent_left' }).eq('id', gameId).then();
            return;
        }

        const isActive = status === 'playing' || (status && status.startsWith('rematch_'));

        if (!isActive) return;

        e.preventDefault();
        confirmLeave(() => navigation.dispatch(e.data.action));
    });

    return () => removeListener();
  }, [gameId, mode, navigation, confirmLeave]);

  const handlersRef = React.useRef({
      showModal,
      hideModal,
      router,
      navigation,
      colors,
      myMark,
      user,
      confirmLeave,
      fetchProfile
  });

    useEffect(() => {
        handlersRef.current = {
            showModal,
            hideModal,
            router,
            navigation,
            colors,
            myMark,
            user,
            confirmLeave,
            fetchProfile
        };
    }, [showModal, hideModal, router, navigation, colors, myMark, user, confirmLeave, fetchProfile]);

    useEffect(() => {
        if (mode !== 'online' || !gameId) return;

        console.log(`[Realtime] Subscribing to game:${gameId}`);
        
        const channel = supabase.channel(`game:${gameId}`, {
            config: {
                presence: { key: user?.id },
            }
        })
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'games', 
            filter: `id=eq.${gameId}` 
        }, (payload) => {
            const g = payload.new;
            console.log('[Realtime] Received update:', g.status);
            
            // If status became abandoned, leave
            if (g.status === 'abandoned') {
                 handlersRef.current.showModal({
                     title: 'Opponent Left',
                     description: 'Your opponent has left the game.',
                     icon: <UserIcon size={40} color={handlersRef.current.colors.subtext} />,
                      actions: [{ text: 'Go Home', onPress: async () => {
                           handlersRef.current.hideModal();
                           handlersRef.current.router.replace('/');
                      }}],
                      onDismiss: async () => {
                           handlersRef.current.router.replace('/');
                      }
                 });
                 return;
            }

            if (g.status === 'opponent_left') {
                const xScore = g.score_x || 0;
                const oScore = g.score_o || 0;
                
                const curMyMark = myMarkRef.current;
                const myScore = curMyMark === 'X' ? xScore : oScore;
                const oppScore = curMyMark === 'X' ? oScore : xScore;
                
                const isWinner = myScore > oppScore;
                const isDraw = myScore === oppScore;
                
                handlersRef.current.showModal({
                    title: isWinner ? 'Session Victory!' : 'Session Ended',
                    description: isWinner 
                        ? `You won the session ${myScore} - ${oppScore}! Your opponent has left.`
                        : isDraw 
                            ? `The session ended in a draw (${myScore} - ${oppScore}). Your opponent has left.`
                            : `Final session score: ${myScore} - ${oppScore}. Your opponent has left.`,
                    icon: isWinner ? <Trophy size={40} color="#eab308" /> : <UserIcon size={40} color={handlersRef.current.colors.subtext} />,
                    actions: [{ 
                        text: 'Go Home', 
                        variant: 'primary',
                        onPress: () => {
                            handlersRef.current.hideModal();
                            handlersRef.current.router.replace('/');
                        }
                    }],
                    onDismiss: () => handlersRef.current.router.replace('/')
                });
                return;
            }

            setBoard(g.board);
            setTurn(g.turn);
            setWinner(g.winner);
            
            // Force status update if it changed
            if (g.status !== onlineStatusRef.current) {
                console.log(`[Realtime] Status changed from ${onlineStatusRef.current} to ${g.status}`);
                setOnlineStatus(g.status);
            }
            
            // Sync score
            if (userRef.current) {
                setScore({
                   player: g.player_x === userRef.current.id ? g.score_x : g.score_o,
                   opponent: g.player_x === userRef.current.id ? g.score_o : g.score_x
                });
            }
            
            // If P2 joined, fetch their profile
            if (g.player_o && !playerOProfileRef.current) {
                handlersRef.current.fetchProfile(g.player_o).then(setPlayerOProfile);
            }

            // Sync Reactions (Handle legacy x/o columns + new last_reaction)
            if (g.last_reaction) {
                const { mark, emoji, timestamp } = g.last_reaction;
                const isRecent = Date.now() - (timestamp || 0) < 3000;
                
                if (isRecent) {
                    if (mark === 'X') {
                         setReactionX(emoji);
                         if (reactionTimeoutXRef.current) clearTimeout(reactionTimeoutXRef.current);
                         reactionTimeoutXRef.current = setTimeout(() => setReactionX(null), 3000);
                    } else if (mark === 'O') {
                         setReactionO(emoji);
                         if (reactionTimeoutORef.current) clearTimeout(reactionTimeoutORef.current);
                         reactionTimeoutORef.current = setTimeout(() => setReactionO(null), 3000);
                    }
                }
            }
        })
        .on('presence', { event: 'sync' }, () => {
              const state = channel.presenceState();
              const entries = Object.values(state).flat() as any[];
              const uniqueUserIds = new Set(entries.map(e => e.user_id).filter(Boolean));
              const presentUsersCount = uniqueUserIds.size;
              
              const isOpponentPresent = entries.some(e => e.user_id !== userRef.current?.id);

              if (!isOpponentPresent && (onlineStatusRef.current === 'playing' || onlineStatusRef.current === 'finished') && !isGracePeriodRef.current) {
                  if (!disconnectTimeoutRef.current) {
                    disconnectTimeoutRef.current = setTimeout(() => {
                        console.log('[Presence] Opponent confirmed missing');
                        wasMissingOpponentRef.current = true;
                        setOpponentConnected(false);
                        disconnectTimeoutRef.current = null;
                    }, 3000);
                  }
              } else if (isOpponentPresent || presentUsersCount >= 2) {
                  if (disconnectTimeoutRef.current) {
                    clearTimeout(disconnectTimeoutRef.current);
                    disconnectTimeoutRef.current = null;
                  }
                  
                  if (wasMissingOpponentRef.current) {
                      wasMissingOpponentRef.current = false;
                      handlersRef.current.showModal({
                          title: 'Opponent Reconnected',
                          description: 'Your opponent is back. Do you want to continue?',
                          icon: <UserIcon size={40} color={handlersRef.current.colors.accent} />,
                          actions: [
                              { text: 'No', variant: 'secondary', onPress: () => {
                                  supabase.from('games').update({ status: 'abandoned' }).eq('id', gameId);
                                  if (handlersRef.current.navigation.canGoBack()) handlersRef.current.router.back(); else handlersRef.current.router.replace('/');
                                  handlersRef.current.hideModal();
                              }},
                              { text: 'Yes', variant: 'primary', onPress: () => handlersRef.current.hideModal() }
                          ]
                      });
                  }
                  setOpponentConnected(true);
              }
        })
        .subscribe(async (status) => {
            console.log(`[Realtime] Subscription status: ${status}`);
            if (status === 'SUBSCRIBED') {
                await channel.track({ online_at: new Date().toISOString(), user_id: userRef.current?.id });
            } else if (status === 'CHANNEL_ERROR') {
                console.error('[Realtime] Channel error - connection lost');
            }
        });

        return () => {
            console.log(`[Realtime] Cleaning up game:${gameId}`);
            supabase.removeChannel(channel);
            if (disconnectTimeoutRef.current) clearTimeout(disconnectTimeoutRef.current);
        };
    }, [gameId, mode, user?.id]);

  // ─── Opponent Disconnect Timeout ───
  // Removed strict timeout to allow reconnection. 
  // Overlay provides UI for this state.

  // ─── Helpers ───
  // ─── Online: Rematch Logic ───
  const requestRematch = async () => {
      if (!myMark || !gameId) return;
      const newStatus = `rematch_requested_${myMark}`;
      console.log(`[Rematch] Attempting to set status to ${newStatus} for game ${gameId}`);
      
      const { error } = await supabase.from('games').update({ status: newStatus }).eq('id', gameId);
      
      if (error) {
          console.error('[Rematch] Failed to request rematch:', error);
          showToast({
              type: 'error',
              title: 'Request Failed',
              message: 'Could not send rematch request.'
          });
      } else {
          showToast({
              type: 'success',
              title: 'Rematch Requested',
              message: 'Waiting for opponent to accept...'
          });
      }
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

     if (onlineStatus.startsWith('rematch_requested_')) {
         const isMe = onlineStatus === `rematch_requested_${myMark}`;
         
         if (isMe) {
             showModal({
                 title: 'Rematch Offered',
                 description: 'Waiting for your opponent to accept...',
                 icon: <ActivityIndicator size="large" color={colors.accent} />,
                 actions: [
                     { 
                         text: 'Cancel', 
                         variant: 'secondary', 
                         onPress: async () => {
                             await supabase.from('games').update({ status: 'finished' }).eq('id', gameId);
                             hideModal();
                         } 
                     }
                 ],
                 onDismiss: () => {}
             });
         } else if (rematchNotifiedRef.current !== onlineStatus) {
              rematchNotifiedRef.current = onlineStatus;
              showModal({
                  title: 'Rematch Request',
                  description: 'Opponent wants to play again!',
                  icon: <RefreshCw size={40} color={colors.accent} />,
                  actions: [
                      { text: 'Reject', onPress: rejectRematch, variant: 'secondary' },
                      { text: 'Accept', onPress: acceptRematch, variant: 'primary' }
                  ]
              });
         }
     } else {
         rematchNotifiedRef.current = null;
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
  }, [onlineStatus, mode, myMark, loading, acceptRematch, rejectRematch, colors, navigation, showModal, hideModal, router, gameId, showToast]);

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
        if (winnerRef.current) {
            isLeavingRef.current = true;
            // Notify opponent that we're leaving after a finished game
            await supabase.from('games').update({ status: 'opponent_left' }).eq('id', gameId);
            if (navigation.canGoBack()) router.back(); else router.replace('/');
            return;
        }

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

  const handleReaction = async (emoji: string) => {
      if (!gameId || !myMark) return;
      
      // Optimistic update
      if (myMark === 'X') {
          setReactionX(emoji);
          if (reactionTimeoutXRef.current) clearTimeout(reactionTimeoutXRef.current);
          reactionTimeoutXRef.current = setTimeout(() => setReactionX(null), 3000);
      } else {
          setReactionO(emoji);
          if (reactionTimeoutORef.current) clearTimeout(reactionTimeoutORef.current);
          reactionTimeoutORef.current = setTimeout(() => setReactionO(null), 3000);
      }
      
      // Update DB with event
      await supabase.from('games').update({ 
          last_reaction: { mark: myMark, emoji, timestamp: Date.now() } 
      }).eq('id', gameId);
  };

  if (loading || authLoading) {
    return (
      <ThemedView themed safe style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <ThemedText size="lg" weight="bold" colorType="text" style={styles.loadingText}>
            {authLoading ? "Authenticating..." : "Joining Game..."}
        </ThemedText>
        <Button title='Cancel' variant='secondary' onPress={() => handleHome()} />
      </ThemedView>
    );
  }

  if (!user && mode === 'online') {
      // Fallback if the effect hasn't redirected yet or strictly render nothing
      return (
        <ThemedView themed safe style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
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
        reactionX={reactionX}
        reactionO={reactionO}
        onReaction={handleReaction}
      />

      <BottomSheet visible={showRules} onClose={() => setShowRules(false)}>
        <SheetHeader title="Game Rules" onClose={() => setShowRules(false)} />
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
          <ThemedView blur intensity={80} tint={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 100 }]}>
               <Animated.View entering={ZoomIn.duration(400)} exiting={FadeOut} style={{ alignItems: 'center', gap: 20 }}>
                    <View style={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: 40, 
                        backgroundColor: `${colors.accent}22`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: colors.accent
                    }}>
                        <WifiOff size={40} color={colors.accent} />
                    </View>
                    <View style={{ alignItems: 'center', gap: 8 }}>
                        <ThemedText type="subtitle" size="2xl" weight="black" colorType="text">Reconnecting...</ThemedText>
                        <ThemedText type="label" colorType="subtext" size="md" align="center">Opponent is having connection issues.</ThemedText>
                    </View>
                    <ActivityIndicator size="small" color={colors.accent} />
                    <Button title='Back to Home' variant='secondary' size='md' style={{ marginTop: 20 }} onPress={()=> router.replace("/")}/>
               </Animated.View>
          </ThemedView>
      )}

      {/* Opponent Left Overlay for Finished Games */}
      {!opponentConnected && onlineStatus === 'finished' && winner && (
          <ThemedView blur intensity={100} tint={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 110 }]}>
               <Animated.View entering={FadeInDown.springify()} style={[styles.departedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.departedIconContainer, { backgroundColor: `${colors.error}15` }]}>
                         <UserX size={48} color={colors.error} />
                    </View>
                    
                    <ThemedText size="2xl" weight="black" align="center">Opponent Left</ThemedText>
                    
                    <ThemedText colorType="subtext" align="center" style={{ lineHeight: 22 }}>
                        Your opponent has left the room. You can go back home or close this to view the final board.
                    </ThemedText>
                    
                    <View style={styles.departedActions}>
                        <Button 
                            title='View Board' 
                            variant='secondary' 
                            style={{ flex: 1 }}
                            onPress={()=> setOpponentConnected(true)}
                        />
                        <Button 
                            title='Go Home' 
                            variant='primary' 
                            style={{ flex: 1 }}
                            onPress={()=> router.replace("/")}
                        />
                    </View>
               </Animated.View>
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
  departedCard: {
    width: '85%',
    maxWidth: 340,
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  departedIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  departedActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
});



