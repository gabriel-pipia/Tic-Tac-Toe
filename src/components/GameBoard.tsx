import { BlurView } from 'expo-blur';
import { Circle, X } from 'lucide-react-native';
import { Dimensions, TouchableOpacity, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const BOARD_SIZE = width - 40;
const CELL_SIZE = (BOARD_SIZE - 20) / 3;

interface GameBoardProps {
  board: (string | null)[];
  onPress: (index: number) => void;
  disabled?: boolean;
}

export default function GameBoard({ board, onPress, disabled }: GameBoardProps) {
  return (
    <View style={{ width: BOARD_SIZE, height: BOARD_SIZE }} className="rounded-3xl overflow-hidden bg-secondary/10 relative">
      <BlurView intensity={30} className="flex-1">
        <View className="flex-1 flex-row flex-wrap p-2 gap-2 justify-center content-center">
          {board.map((cell, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() => onPress(index)}
              disabled={disabled || !!cell}
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
              className={`bg-background/40 rounded-xl items-center justify-center ${cell ? '' : 'active:bg-background/60'}`}
            >
              {cell === 'X' && (
                <Animated.View entering={ZoomIn}>
                  <X size={50} color="#3b82f6" strokeWidth={3} />
                </Animated.View>
              )}
              {cell === 'O' && (
                <Animated.View entering={ZoomIn}>
                  <Circle size={45} color="#ef4444" strokeWidth={3} />
                </Animated.View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BlurView>
    </View>
  );
}
