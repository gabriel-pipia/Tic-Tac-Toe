import Button from '@/components/Button';
import { ThemedText } from '@/components/Text';
import { ThemedView } from '@/components/View';
import { Layout } from '@/constants/Layout';
import { useTheme } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Gamepad2, Globe, ScanLine } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
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

type Slide = {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
};

const SlideItem = ({ item, index, width, scrollX }: { item: Slide, index: number, width: number, scrollX: SharedValue<number> }) => {
    const { colors } = useTheme();
    const animatedStyle = useAnimatedStyle(() => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];

        const opacity = interpolate(
          scrollX.value,
          inputRange,
          [0, 1, 0],
          Extrapolation.CLAMP
        );
        
        const scale = interpolate(
           scrollX.value,
           inputRange,
           [0.5, 1, 0.5],
           Extrapolation.CLAMP
        );
        
        const translateY = interpolate(
          scrollX.value,
          inputRange,
          [100, 0, 100],
          Extrapolation.CLAMP
        );

        return {
          opacity,
          transform: [{ translateY }, { scale }],
        };
    });

    return (
        <View style={[styles.slideContainer, { width }]}>
            <Animated.View style={[styles.slideContent, animatedStyle]}>
                <View style={[styles.iconContainer, { backgroundColor: colors.border }]}>
                    {item.icon}
                </View>
                <View style={styles.textContainer}>
                    <ThemedText size='xl' weight='bold' colorType='text' align='center' style={styles.title}>{item.title}</ThemedText>
                    <ThemedText size='md' weight='medium' colorType='subtext' align='center' style={styles.description}>{item.description}</ThemedText>
                </View>
            </Animated.View>
        </View>
    );
};

export default function Onboarding() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const { colors } = useTheme();
  
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, Layout.MAX_CONTENT_WIDTH);

  const slides: Slide[] = [
    {
      id: '1',
      title: 'Tic Tac Toe Reimagined',
      description: 'Experience the classic game with a stunning modern design.',
      icon: <Gamepad2 size={100} color={colors.accent} />,
    },
    {
      id: '2',
      title: 'Play Online',
      description: 'Challenge friends worldwide or play locally on one device.',
      icon: <Globe size={100} color={colors.accent} />,
    },
    {
      id: '3',
      title: 'Easy Connect',
      description: 'Scan a QR code to instantly join a game.',
      icon: <ScanLine size={100} color={colors.accent} />,
    },
  ];

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleFinish = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.push('/(auth)/login');
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      await handleFinish();
    }
  };

  const handleSkip = async () => {
    await handleFinish();
  };

  return (
    <ThemedView safe themed style={styles.safeArea}>
      <Animated.FlatList
        ref={flatListRef as any}
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
        renderItem={({ item, index }) => <SlideItem item={item} index={index} width={width} scrollX={scrollX} />}
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
            {currentIndex < slides.length - 1 && (
                <Animated.View 
                    entering={FadeIn}
                    exiting={FadeOut}
                    layout={LinearTransition}
                    style={styles.buttonWrapper}
                >
                    <Button
                        onPress={handleSkip}
                        title="Skip"
                        variant="secondary"
                        style={{ width: '100%' }}
                        textStyle={{ color: 'rgba(255,255,255,0.6)' }}
                    />
                </Animated.View>
            )}
            
            <Animated.View 
                layout={LinearTransition} 
                style={styles.buttonWrapper}
            >
                <Button
                    onPress={handleNext}
                    title={currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                    style={{ width: '100%' }}
                    variant="primary"
                />
            </Animated.View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    slideContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    slideContent: {
      flex: 1,
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
    description: {
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: 32,
        paddingBottom: 48,
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
    },
});
