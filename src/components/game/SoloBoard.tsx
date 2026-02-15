import { useTheme } from '@/context/ThemeContext';
import { Player } from '@/utils/gameLogic';
import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '../Text';
import { ThemedView } from '../View';
import BoardGrid from './BoardGrid';

interface SoloBoardProps {
  board: (Player | null)[];
  onPress: (index: number) => void;
  disabled?: boolean;
  winner?: Player | 'DRAW' | null;
}

export default function SoloBoard({ board, onPress, disabled, winner }: SoloBoardProps) {
  const { colors } = useTheme();
  const isBoardFull = board.every(cell => cell !== null);
  const isBotThinking = disabled && !winner && !isBoardFull;

  // Status message
  const getStatusMessage = () => {
    if (winner === 'X') return '🎉 You Win!';
    if (winner === 'O') return '🤖 Bot Wins!';
    if (winner === 'DRAW') return '🤝 It\'s a Draw!';
    if (isBotThinking) return 'Thinking...';
    return 'Your Turn';
  };

  const statusMessage = getStatusMessage();

  return (
    <ThemedView style={styles.container}>

{/* Status Pill */}
      <ThemedView
        style={[
          styles.statusPill,
          {
            backgroundColor: winner
              ? winner === 'X'
                ? `${colors.success}18`
                : winner === 'O'
                  ? `${colors.error}18`
                  : `${colors.accent}18`
              : colors.inputBg,
            borderColor: winner
              ? winner === 'X'
                ? `${colors.success}40`
                : winner === 'O'
                  ? `${colors.error}40`
                  : `${colors.accent}40`
              : colors.border,
          },
        ]}
      >
        <ThemedText
          type="label"
          style={{
            color: winner
              ? winner === 'X'
                ? colors.success
                : winner === 'O'
                  ? colors.error
                  : colors.accent
              : colors.accent,
          }}
        >
          {statusMessage}
        </ThemedText>
      </ThemedView>

      {/* Board */}
      <BoardGrid board={board} onPress={onPress} disabled={disabled} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  avatarBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarLabel: {
    marginTop: 2,
  },
  vsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  vsLine: {
    height: 1,
    width: 16,
  },
  vsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  statusPill: {
    marginBottom: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
  },
});
