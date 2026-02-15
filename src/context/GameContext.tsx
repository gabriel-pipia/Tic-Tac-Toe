import { supabase } from '@/utils/supabase';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';

// ─── Types ───
export type LiveGame = {
  id: string;
  player_x: string;
  player_o: string | null;
  status: string;
  winner: string | null;
  turn: string;
  board: (string | null)[];
  created_at: string;
};

type GameContextType = {
  /** All active games involving the current user */
  liveGames: LiveGame[];
  /** Number of games waiting for user to join (invites) */
  pendingInvites: number;
  /** Number of games currently in progress */
  activeGamesCount: number;
  /** Dismiss an invite notification for a specific game */
  dismissInvite: (gameId: string) => void;
};

const GameContext = createContext<GameContextType>({
  liveGames: [],
  pendingInvites: 0,
  activeGamesCount: 0,
  dismissInvite: () => {},
});

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { showToast } = useUI();
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [dismissedInvites, setDismissedInvites] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const previousGamesRef = useRef<Map<string, LiveGame>>(new Map());

  const dismissInvite = useCallback((gameId: string) => {
    setDismissedInvites(prev => new Set(prev).add(gameId));
  }, []);

  // Fetch all current live games on mount/user change
  const fetchLiveGames = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('games')
      .select('*')
      .or(`player_x.eq.${user.id},player_o.eq.${user.id}`)
      .in('status', ['waiting', 'playing', 'rematch_requested_X', 'rematch_requested_O'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLiveGames(data);
      // Build initial map
      const map = new Map<string, LiveGame>();
      data.forEach(g => map.set(g.id, g));
      previousGamesRef.current = map;
    }
  }, [user]);

  useEffect(() => {
    fetchLiveGames();
  }, [fetchLiveGames]);

  // Subscribe to real-time changes for all games involving this user
  useEffect(() => {
    if (!user) return;

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`user_games_${user.id}`)
      // Listen for games where user is player_x
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `player_x=eq.${user.id}`,
      }, (payload) => handleGameChange(payload))
      // Listen for games where user is player_o
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `player_o=eq.${user.id}`,
      }, (payload) => handleGameChange(payload))
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleGameChange = useCallback((payload: any) => {
    const { eventType, new: newGame, old: oldGame } = payload;

    if (eventType === 'INSERT') {
      // New game involving the user
      setLiveGames(prev => {
        if (prev.find(g => g.id === newGame.id)) return prev;
        return [newGame, ...prev];
      });
      previousGamesRef.current.set(newGame.id, newGame);

      // If someone else created a game and added the user as player_o
      if (newGame.player_o === user?.id && newGame.player_x !== user?.id) {
        showToast({
          type: 'info',
          title: 'Game Invite',
          message: 'Someone invited you to a game!',
        });
      }
    } else if (eventType === 'UPDATE') {
      const prevGame = previousGamesRef.current.get(newGame.id);

      setLiveGames(prev =>
        prev.map(g => (g.id === newGame.id ? newGame : g))
          .filter(g => !['abandoned', 'finished'].includes(g.status))
      );
      previousGamesRef.current.set(newGame.id, newGame);

      // Detect: opponent joined your hosted game
      if (prevGame && !prevGame.player_o && newGame.player_o && newGame.player_x === user?.id) {
        showToast({
          type: 'success',
          title: 'Opponent Joined!',
          message: 'Your opponent has connected. Game is starting!',
        });
      }

      // Detect: game became abandoned (opponent left)
      if (prevGame && prevGame.status === 'playing' && newGame.status === 'abandoned') {
        // Remove from live games
        setLiveGames(prev => prev.filter(g => g.id !== newGame.id));
        previousGamesRef.current.delete(newGame.id);
      }

      // Detect: game finished
      if (newGame.status === 'finished') {
        setLiveGames(prev => prev.filter(g => g.id !== newGame.id));
        previousGamesRef.current.delete(newGame.id);
      }

      // Detect: rematch request from opponent
      if (newGame.status?.startsWith('rematch_requested_') && prevGame?.status !== newGame.status) {
        const requestedByMark = newGame.status.replace('rematch_requested_', '');
        const myMark = newGame.player_x === user?.id ? 'X' : 'O';
        if (requestedByMark !== myMark) {
          showToast({
            type: 'info',
            title: 'Rematch Requested',
            message: 'Your opponent wants to play again!',
          });
        }
      }
    } else if (eventType === 'DELETE') {
      setLiveGames(prev => prev.filter(g => g.id !== oldGame.id));
      previousGamesRef.current.delete(oldGame.id);
    }
  }, [user, showToast]);

  // Computed values
  const pendingInvites = liveGames.filter(g =>
    g.status === 'waiting' &&
    g.player_o === user?.id &&
    !dismissedInvites.has(g.id)
  ).length;

  const activeGamesCount = liveGames.filter(g =>
    g.status === 'playing'
  ).length;

  return (
    <GameContext.Provider value={{
      liveGames,
      pendingInvites,
      activeGamesCount,
      dismissInvite,
    }}>
      {children}
    </GameContext.Provider>
  );
};
