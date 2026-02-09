import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Gamepad2, Globe, ScanLine } from 'lucide-react-native';
import { useState } from 'react';
import { Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Tic Tac Toe Reimagined',
    description: 'Experience the classic game with a stunning modern design.',
    icon: <Gamepad2 size={100} color="#3b82f6" />,
  },
  {
    id: '2',
    title: 'Play Online',
    description: 'Challenge friends worldwide or play locally on one device.',
    icon: <Globe size={100} color="#a855f7" />,
  },
  {
    id: '3',
    title: 'Easy Connect',
    description: 'Scan a QR code to instantly join a game.',
    icon: <ScanLine size={100} color="#ef4444" />,
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleFinish = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-background justify-between">
      <FlatList
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 justify-center items-center p-8">
            <Animated.View entering={FadeInDown.delay(200)} className="mb-10 p-10 bg-secondary/30 rounded-full">
              {item.icon}
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(400)}>
              <Text className="text-3xl font-bold text-foreground text-center mb-4">{item.title}</Text>
              <Text className="text-lg text-muted-foreground text-center">{item.description}</Text>
            </Animated.View>
          </View>
        )}
      />

      <View className="px-8 pb-12">
        <View className="flex-row justify-center mb-8 gap-2">
            {slides.map((_, index) => (
                <View 
                    key={index} 
                    className={`h-2 rounded-full ${currentIndex === index ? 'w-8 bg-primary' : 'w-2 bg-muted'}`} 
                />
            ))}
        </View>

        <TouchableOpacity
          onPress={handleFinish}
          className="bg-primary py-4 rounded-xl items-center shadow-lg shadow-primary/30"
        >
          <Text className="text-primary-foreground font-bold text-lg">
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Skip'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
