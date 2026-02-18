import { ThemedView } from '@/components/ui/View';
import { useTheme } from '@/context/ThemeContext';
import { getWinningLine } from '@/lib/game/logic';
import { Player } from '@/types/game';
import { Circle, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

interface BoardGridProps {
  board: (Player | null)[];
  onPress: (index: number) => void;
  disabled?: boolean;
}

export default function BoardGrid({ board, onPress, disabled }: BoardGridProps) {
  const { colors } = useTheme();
  const [boardWidth, setBoardWidth] = useState(0);
  
  const winLine = useMemo(() => getWinningLine(board as any), [board]);

  const onLayout = (event: LayoutChangeEvent) => {
    setBoardWidth(event.nativeEvent.layout.width);
  };

  // Calculate approximate cell width for icon scaling
  // We use this just for the icon size, avoiding direct pixel manipulation on style
  // Assuming padding 12*2=24, and gaps are handled by padding inside rows/cols
  // We'll use a gap of 8px
  const approximateCellWidth = boardWidth > 0 ? (boardWidth - 24 - 16) / 3 : 0;
  const iconSizeX = approximateCellWidth * 0.55;
  const iconSizeO = approximateCellWidth * 0.48;

  // Render a single cell
  const renderCell = (index: number) => {
      const cell = board[index];
      const isWinCell = winLine?.includes(index);
      const winPlayer = isWinCell ? board[winLine![0]] : null;
      
      return (
        <TouchableOpacity
          key={index}
          activeOpacity={0.6}
          onPress={() => onPress(index)}
          disabled={disabled || !!cell}
          style={[
            styles.cell,
            {
              backgroundColor: isWinCell 
                ? (winPlayer === 'X' ? `${colors.accent}15` : `${colors.secondary}15`)
                : cell ? 'transparent' : colors.inputBg,
              borderColor: isWinCell
                ? (winPlayer === 'X' ? `${colors.accent}50` : `${colors.secondary}50`)
                : colors.border,
            },
          ]}
        >
          {cell === 'X' && (
            <Animated.View entering={ZoomIn.springify()}>
              <X 
                size={iconSizeX > 0 ? iconSizeX : 40} 
                color={isWinCell ? colors.accent : colors.accent} 
                strokeWidth={isWinCell ? 5 : 3.5} 
              />
            </Animated.View>
          )}
          {cell === 'O' && (
            <Animated.View entering={ZoomIn.springify()}>
              <Circle 
                size={iconSizeO > 0 ? iconSizeO : 36} 
                color={isWinCell ? colors.secondary : colors.secondary} 
                strokeWidth={isWinCell ? 5 : 3.5} 
              />
            </Animated.View>
          )}
          {!cell && !disabled && (
            <Animated.View entering={FadeIn.delay(index * 30)} style={styles.emptyHint}>
              <View style={[styles.emptyDot, { backgroundColor: colors.border }]} />
            </Animated.View>
          )}
        </TouchableOpacity>
      );
  };

  return (
    <ThemedView 
        onLayout={onLayout}
        style={[styles.board, { backgroundColor: colors.background, borderColor: colors.border }]}
    >
      <View style={styles.row}>
          {renderCell(0)}
          {renderCell(1)}
          {renderCell(2)}
      </View>
      <View style={styles.row}>
          {renderCell(3)}
          {renderCell(4)}
          {renderCell(5)}
      </View>
      <View style={styles.row}>
          {renderCell(6)}
          {renderCell(7)}
          {renderCell(8)}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  board: {
    width: '100%',
    maxWidth: 440,
    aspectRatio: 1, // Keep board square
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    gap: 8, // Gap between rows
    justifyContent: 'center',
  },
  row: {
      flex: 1, // Fill height equally
      flexDirection: 'row',
      width: '100%',
      gap: 8, // Gap between cols
  },
  cell: {
    flex: 1, // Fill width equally
    aspectRatio: 1, // Ensure square cells
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    height: '100%', // Ensure it fills the row height
  },
  emptyHint: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.4,
  },
});
