import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Gamepad2, ScanLine, User } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 80, // Taller for floating effect
        },
        tabBarShowLabel: false,
        tabBarBackground: () => (
            <View style={StyleSheet.absoluteFill} className="rounded-3xl overflow-hidden">
             <BlurView
                intensity={90}
                style={StyleSheet.absoluteFill}
                tint={isDark ? 'dark' : 'light'}
              />
            </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center p-2 rounded-full ${focused ? 'bg-primary/20' : ''}`}>
              <Gamepad2 size={28} color={focused ? '#3b82f6' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center -mt-8 p-4 bg-primary rounded-full shadow-lg shadow-primary/50`}>
              <ScanLine size={32} color="white" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center p-2 rounded-full ${focused ? 'bg-primary/20' : ''}`}>
              <User size={28} color={focused ? '#3b82f6' : color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
