import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/lib/constants/Layout';
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Button from './Button';
import { ThemedText } from './Text';
import { ThemedView } from './View';

import { ModalAction } from '@/types/ui';

interface ModalProps {
  visible: boolean;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  actions?: ModalAction[];
  onClose?: () => void;
  icon?: React.ReactNode;
}

export default function CustomModal({ visible, title, description, actions, onClose, children, icon }: ModalProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Pressable style={styles.overlay} onPress={onClose}/>
        <ThemedView style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          
          {title && (
              <ThemedText type="subtitle" align="center" style={styles.title}>{title}</ThemedText>
          )}
          
          {description && (
              <ThemedText colorType="subtext" align="center" weight='medium' style={styles.description}>{description}</ThemedText>
          )}
          
          {children}

          {actions && actions.length > 0 && (
              <View style={styles.actions}>
                  {actions.map((action, index) => (
                      <Button 
                          key={index}
                          title={action.text}
                          onPress={action.onPress}
                          variant={action.variant || 'primary'}
                          style={actions.length > 1 ? { flex: 1 } : { width: '100%' }}
                          size='md'
                      />
                  ))}
              </View>
          )}
      </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    alignItems: 'center',
    width: Layout.CONTAINER_WIDTH_PERCENT,
    maxWidth: Layout.MAX_CONTENT_WIDTH,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  iconContainer: {
    marginBottom: 20,
    transform: [{ scale: 1.2 }]
  },
  title: {
    marginBottom: 12,
    fontSize: 22,
  },
  description: {
    marginBottom: 32,
    lineHeight: 24,
    fontSize: 16,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  }
});
