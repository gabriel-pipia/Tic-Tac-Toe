import { ThemedText } from '@/components/ui/Text';
import { ThemedView } from '@/components/ui/View';
import { useTheme } from '@/context/ThemeContext';
import { Player } from '@/types/game';
import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import BoardGrid from './BoardGrid';

interface OnlineBoardProps {
  board: (Player | null)[];
  onPress: (index: number) => void;
  disabled?: boolean;
  waiting?: boolean;
  turn: Player;
  myMark?: Player | null;
  winner?: Player | 'DRAW' | null;
}

export default function OnlineBoard({ board, onPress, disabled, waiting, turn, myMark, winner }: OnlineBoardProps) {
  const { colors } = useTheme();

  const rContainerStyle = useAnimatedStyle(() => {
     let targetColor = colors.card;
     if (winner === 'X') targetColor = `${colors.primary}`;
     else if (winner === 'O') targetColor = `${colors.secondary}`;
     else if (turn === 'X') targetColor = `${colors.primary}`;
     else targetColor = `${colors.secondary}`;

     return {
        backgroundColor: withTiming(targetColor, { duration: 500 })
     };
  }, [turn, winner, colors]);

  const getStatusMessage = () => {
      if (waiting) return 'Waiting for Opponent...';
      if (winner) {
          if (winner === 'DRAW') return 'Draw!';
          if (myMark && winner === myMark) return 'You Won!';
          if (myMark && winner !== myMark) return 'You Lost!';
          return `Player ${winner} Wins!`;
      }
      if (myMark) {
          return turn === myMark ? 'Your Turn' : "Opponent's Turn";
      }
      return `Player ${turn}'s Turn`;
  };

  return (
    <Animated.View style={[styles.container, rContainerStyle]}>
       <ThemedView style={styles.header}>
          <ThemedText type="subtitle" colorType='text' weight='bold' size='md'>{getStatusMessage()}</ThemedText>
          {waiting && <ActivityIndicator size="small" color={colors.text} />}
       </ThemedView>
       <BoardGrid board={board} onPress={onPress} disabled={disabled} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 24,
    width: '100%',
  },
});
