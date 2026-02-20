import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import SheetHeader from '@/components/ui/SheetHeader';
import { ThemedText } from '@/components/ui/Text';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/lib/constants/Layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Grid3X3, ScanLine, Swords, Trophy } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  LinearTransition,
  SharedValue,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

// IntroductionModal Component slide item
const IntroductionSlideItem = ({ item, index, width, scrollX }: { item: any, index: number, width: number, scrollX: SharedValue<number> }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        
        const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
        const scale = interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], Extrapolation.CLAMP);
        const translateY = interpolate(scrollX.value, inputRange, [100, 0, 100], Extrapolation.CLAMP);

        return {
            opacity,
            transform: [{ translateY }, { scale }],
        };
    });

    const { colors } = useTheme();

    return (
        <View style={[styles.slideContainer, { width }]}>
            <Animated.View style={[styles.slideContent, animatedStyle]}>
                <View style={[styles.iconContainer, { backgroundColor: colors.border }]}>
                    {item.icon}
                </View>
                <View style={styles.textContainer}>
                    <ThemedText size='xl' weight='bold' align='center' style={styles.title}>{item.title}</ThemedText>
                    <ThemedText size='md' weight='medium' colorType='subtext' align='center'>
                        {item.description}
                    </ThemedText>
                </View>
            </Animated.View>
        </View>
    );
};

export default function IntroductionModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<Animated.FlatList<any>>(null);
  const scrollX = useSharedValue(0);
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  
  // Cap the width to Layout.MAX_CONTENT_WIDTH for better tablet support
  const width = Math.min(windowWidth, Layout.MAX_CONTENT_WIDTH);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      scrollX.value = 0;
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [visible, scrollX]);

  const slides = [
    {
      id: '1',
      title: 'Welcome to Tic Tac Toe',
      description: 'The classic strategy game, reimagined with a stunning modern design. Master the board, outsmart your opponents, and climb the ranks!',
      icon: <Logo variant="icon" size={100} />,
    },
    {
      id: '2',
      title: 'How to Play',
      description: 'Players take turns placing X or O on a 3×3 grid. The first to get three in a row - horizontally, vertically, or diagonally - wins the game. If the board fills up with no winner, it\'s a draw!',
      icon: <Grid3X3 size={100} color={colors.accent} />,
    },
    {
      id: '3',
      title: 'Game Modes',
      description: 'Play against AI with adjustable difficulty, challenge friends in local multiplayer on one device, or go online and compete with players from around the world in real-time.',
      icon: <Swords size={100} color={colors.accent} />,
    },
    {
      id: '4',
      title: 'Easy Connect',
      description: 'Start a game instantly by scanning a QR code or sharing a link. No complicated setup just scan, connect, and play with anyone nearby or far away.',
      icon: <ScanLine size={100} color={colors.accent} />,
    },
    {
      id: '5',
      title: 'Leaderboards & Stats',
      description: 'Track your wins, losses, and streaks. Climb the global leaderboard and see how you rank against players worldwide. Every match counts towards your ranking!',
      icon: <Trophy size={100} color={colors.accent} />,
    },
  ];

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });
  
  const handleFinish = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    onClose();
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      await handleFinish();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} height={windowWidth > 450 ? "auto" : "90%"}>
        <SheetHeader title="Introduction & Rules" onClose={onClose} />
        
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Animated.FlatList
                ref={flatListRef}
                data={slides}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={Platform.OS !== 'web'}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                style={{ width, flex: 1 }}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <IntroductionSlideItem item={item} index={index} width={width} scrollX={scrollX} />
                )}
            />

            <View style={[styles.footer, { width }]}>
                <View style={styles.paginationContainer}>
                    {slides.map((_, index) => (
                        <View 
                            key={index} 
                            style={[
                                styles.dot, 
                                { 
                                    backgroundColor: currentIndex === index ? colors.accent : colors.border,
                                    width: currentIndex === index ? 24 : 8 
                                }
                            ]} 
                        />
                    ))}
                </View>

                <View style={styles.buttonContainer}>
                    {currentIndex > 0 && (
                        <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition} style={styles.buttonWrapper}>
                            <Button
                                onPress={handleBack}
                                title="Back"
                                variant="secondary"
                            />
                        </Animated.View>
                    )}
                    <Animated.View layout={LinearTransition} style={styles.buttonWrapper}>
                        <Button
                            onPress={handleNext}
                            title={currentIndex === slides.length - 1 ? 'Play' : 'Next'}
                            variant="primary"
                        />
                    </Animated.View>
                </View>
            </View>
        </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    slideContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    slideContent: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    iconContainer: {
        marginBottom: 40,
        padding: 48,
        borderRadius: 9999,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        marginBottom: 16,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        width: '100%',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 32,
        gap: 8,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    buttonWrapper: {
        flex: 1,
    }
});
