import { useTheme } from '@/context/ThemeContext';
import { Player } from '@/types/game';
import { Circle, X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type MiniBoardProps = {
    board: (Player | null)[];
    winLine?: number[];
};

const MiniBoard = ({ board, winLine }: MiniBoardProps) => {
    const { colors } = useTheme();
    const renderCell = (i: number) => {
        const cell = board[i];
        const isWin = winLine?.includes(i);
        const isX = cell === 'X';
        const isO = cell === 'O';
        const bgColor = isWin ? (isX ? `${colors.accent}25` : `${colors.secondary}25`) : undefined;
        return (
            <View key={i} style={[styles.miniCell, bgColor ? { backgroundColor: bgColor } : undefined]}>
                 {isX && <X size={10} color={colors.accent} strokeWidth={isWin ? 4 : 2.5} />}
                 {isO && <Circle size={8} color={colors.secondary} strokeWidth={isWin ? 4 : 2.5} />}
            </View>
        );
    };
    return (
        <View style={[styles.miniBoard, { backgroundColor: colors.background }]}>
            <View style={styles.miniRow}>{renderCell(0)}{renderCell(1)}{renderCell(2)}</View>
            <View style={styles.miniRow}>{renderCell(3)}{renderCell(4)}{renderCell(5)}</View>
            <View style={styles.miniRow}>{renderCell(6)}{renderCell(7)}{renderCell(8)}</View>
        </View>
    );
};

export default MiniBoard;

const styles = StyleSheet.create({
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
});
