import { useTheme } from '@/context/ThemeContext';
import { X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import Button from './Button';
import { ThemedText } from './Text';
import { ThemedView } from './View';

interface SheetHeaderProps {
  title: string;
  onClose: () => void;
}

export default function SheetHeader({ title, onClose }: SheetHeaderProps) {
  const { colors } = useTheme();

  return (
    <ThemedView style={[styles.container, { borderBottomColor: colors.border }]}>
      <ThemedText size="lg" weight="bold">{title}</ThemedText>
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
});
