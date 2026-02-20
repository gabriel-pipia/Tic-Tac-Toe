import { useTheme } from '@/context/ThemeContext';
import { X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Button from './Button';
import { ThemedText } from './Text';
import { ThemedView } from './View';

interface SheetHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export default function SheetHeader({ title, subtitle, onClose }: SheetHeaderProps) {
  const { colors } = useTheme();

  return (
    <ThemedView style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.textContainer}>
        <ThemedText size="lg" weight="bold">{title}</ThemedText>
        {subtitle && (
          <ThemedText size="sm" colorType="subtext" style={styles.subtitle}>{subtitle}</ThemedText>
        )}
      </View>
      <Button 
        variant="secondary" 
        size='sm' 
        type='icon' 
        onPress={onClose} 
        icon={<X size={20} color={colors.text} />} 
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    width: '100%',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  subtitle: {
    marginTop: 4,
  },
});
