import GameBoard from '@/components/GameBoard';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase';
import * as Linking from 'expo-linking';
import { RefreshCw, Share2, Users, Wifi } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Share, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type GameMode = 'local' | 'online' | null;

export default function GameScreen() {
  const { user } = useAuth();
  const [mode, setMode] = useState<GameMode>(null);
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [onlineStatus, setOnlineStatus] = useState<string>('waiting'); // waiting, playing, finished
  const [loading, setLoading] = useState(false);
  const [myMark, setMyMark] = useState<'X' | 'O' | null>(null);

  
  const joinGame = useCallback(async (id: string) => {
    if (!user) return;
    setLoading(true);
    
    // First check if game exists and is waiting
    const { data: game, error: fetchError } = await supabase.from('games').select('*').eq('id', id).single();
    if (fetchError || !game) {
        Alert.alert('Error', 'Game not found');
        setLoading(false);
        return;
    }

    if (game.player_o && game.player_o !== user.id) {
         // Assuming player can support re-joining if they are already player_o?
         // user.id === game.player_o
         if (game.player_x !== user.id) {
            Alert.alert('Error', 'Game is full');
            setLoading(false);
            return;
         }
    }

    // If I am player X rejoining?
    if (game.player_x === user.id) {
        setMode('online');
        setGameId(id);
        setMyMark('X');
        setBoard(game.board);
        setTurn(game.turn);
        setWinner(game.winner);
        setOnlineStatus(game.status);
        setLoading(false);
        return;
    }

    // Join as O
    const { error } = await supabase
      .from('games')
      .update({ player_o: user.id, status: 'playing' })
      .eq('id', id);

    if (error) {
       Alert.alert('Error', error.message);
    } else {
       setMode('online');
       setGameId(id);
       setMyMark('O');
       setBoard(game.board); // Use fetched board in case X moved (unlikely if waiting)
       setOnlineStatus('playing');
    }
    setLoading(false);
  }, [user]);

  // Check for deep link or navigation param to join game
  useEffect(() => {
    const handleUrl = (url: string) => {
      const { queryParams } = Linking.parse(url);
      if (queryParams?.gameId) {
        joinGame(queryParams.gameId as string);
      }
    };
    
    Linking.getInitialURL().then((url) => {
       if (url) handleUrl(url);
    });

    // Also check if we just scanned something (simple way: check global store or just wait for scan screen to push)
    // Actually, scan screen will likely push to this screen or update context. 
    // For now, assume Scan screen handles the join logic by calling a function or we handle it via router params if navigation stack passed it.
    // Since we are in Tabs, we don't receive params easily from Scan tab unless we use a global store or reset the stack.
    // We'll trust Scan logic triggers the join maybe.
  }, [joinGame]);

  // Subscribe to changes if online
  useEffect(() => {
    if (!gameId) return;

    const channel = supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, (payload) => {
        const newGame = payload.new;
        setBoard(newGame.board);
        setTurn(newGame.turn);
        setWinner(newGame.winner);
        setOnlineStatus(newGame.status);
        // Check if player O just joined (status changed from waiting to playing)
        if (newGame.player_o && newGame.status === 'waiting') {
            setOnlineStatus('playing');
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gameId]);

  const checkWinner = (currentBoard: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return currentBoard[a];
      }
    }
    if (!currentBoard.includes(null)) return 'DRAW';
    return null;
  };

  const handlePress = async (index: number) => {
    if (board[index] || winner) return;

    if (mode === 'local') {
      const newBoard = [...board];
      newBoard[index] = turn;
      const result = checkWinner(newBoard);
      
      setBoard(newBoard);
      if (result) {
        setWinner(result);
      } else {
        setTurn(turn === 'X' ? 'O' : 'X');
      }
    } else if (mode === 'online' && gameId) {
        if (turn !== myMark) return; // Not my turn

        const newBoard = [...board];
        newBoard[index] = myMark;
        const result = checkWinner(newBoard);
        const nextTurn = myMark === 'X' ? 'O' : 'X';
        
        // Optimistic update
        setBoard(newBoard); 

        const updates: any = {
            board: newBoard,
            turn: result ? turn : nextTurn, // If game over, turn doesn't matter much but keep it or freeze
            winner: result,
            status: result ? 'finished' : 'playing'
        };

        const { error } = await supabase.from('games').update(updates).eq('id', gameId);
        if (error) Alert.alert('Error', error.message);
    }
  };

  const createGame = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('games')
      .insert({ player_x: user.id })
      .select()
      .single();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setMode('online');
      setGameId(data.id);
      setMyMark('X');
      setOnlineStatus('waiting');
      resetLocalState();
    }
    setLoading(false);
  };



  const resetLocalState = () => {
      setBoard(Array(9).fill(null));
      setWinner(null);
      setTurn('X');
  };

  const resetGame = () => {
      setMode(null);
      setGameId(null);
      setOnlineStatus('waiting');
      resetLocalState();
  };

  const shareGame = async () => {
      if (!gameId) return;
      await Share.share({
          message: `Join my Tic Tac Toe game! Game ID: ${gameId}`,
      });
  };

  if (!mode) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center p-6 space-y-6">
        <Text className="text-4xl font-bold text-foreground mb-8">Choose Mode</Text>
        
        <TouchableOpacity 
            onPress={() => { setMode('local'); resetLocalState(); }}
            className="w-full bg-secondary/50 p-6 rounded-3xl flex-row items-center border border-border"
        >
            <Users size={40} className="text-primary mr-4" color="#3b82f6" />
            <View>
                <Text className="text-2xl font-bold text-foreground">Pass & Play</Text>
                <Text className="text-muted-foreground">Play closely with a friend</Text>
            </View>
        </TouchableOpacity>

        <TouchableOpacity 
            onPress={createGame}
            disabled={loading}
            className="w-full bg-secondary/50 p-6 rounded-3xl flex-row items-center border border-border"
        >
            <Wifi size={40} className="text-primary mr-4" color="#a855f7" />
            <View>
                <Text className="text-2xl font-bold text-foreground">Online Multiplayer</Text>
                <Text className="text-muted-foreground">Play with anyone, anywhere</Text>
            </View>
        </TouchableOpacity>
        {loading && <ActivityIndicator size="large" />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background items-center pt-8 pb-20">
      <View className="w-full px-6 flex-row justify-between items-center mb-8">
        <TouchableOpacity onPress={resetGame} className="p-2 bg-secondary/50 rounded-full">
            <RefreshCw size={24} className="text-foreground" color="gray" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">
            {mode === 'local' ? 'Pass & Play' : onlineStatus === 'waiting' ? 'Waiting for opponent...' : 'Online Match'}
        </Text>
        {mode === 'online' ? (
             <TouchableOpacity onPress={shareGame} className="p-2 bg-secondary/50 rounded-full">
                <Share2 size={24} className="text-foreground" color="gray" />
            </TouchableOpacity>
        ) : <View className="w-10" />}
      </View>

      {mode === 'online' && onlineStatus === 'waiting' && (
          <View className="items-center mb-10 p-6 bg-secondary/30 rounded-3xl">
              <Text className="text-muted-foreground mb-2">Share this Game ID or QR Code</Text>
              <Text className="text-2xl font-bold text-primary mb-4 selectable">{gameId}</Text>
              <ActivityIndicator />
          </View>
      )}

      <View className="mb-8">
        <Text className="text-3xl font-light text-foreground text-center">
            {winner ? (winner === 'DRAW' ? 'Draw!' : `${winner} Wins!`) : `Turn: ${turn}`}
        </Text>
        {mode === 'online' && (
             <Text className="text-center text-muted-foreground mt-2">You are: {myMark}</Text>
        )}
      </View>

      <GameBoard 
        board={board} 
        onPress={handlePress} 
        disabled={!!winner || (mode === 'online' && (onlineStatus === 'waiting' || turn !== myMark))} 
      />

      {winner && (
        <TouchableOpacity 
            onPress={() => {
                if (mode === 'local') resetLocalState();
                else resetGame(); // Online rematch not implemented yet, just reset
            }}
            className="mt-10 bg-primary px-8 py-4 rounded-full shadow-lg shadow-primary/40"
        >
            <Text className="text-white font-bold text-xl">Play Again</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
