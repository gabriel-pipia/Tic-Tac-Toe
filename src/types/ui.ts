import React from 'react';
import { UserProfile } from './user';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onPress: () => void;
    };
    onPress?: () => void;
}

export interface ModalAction {
  text: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
}

export interface ProfileModalConfig {
  profile: UserProfile | null;
  rank?: number;
  periodWins?: number;
  isMe?: boolean;
}

export interface ModalConfig {
  visible: boolean;
  title?: string;
  description?: string;
  actions?: ModalAction[];
  icon?: React.ReactNode;
  content?: React.ReactNode; 
  onClose?: () => void;
  onDismiss?: () => void;
}

export interface BottomSheetConfig {
  visible: boolean;
  content?: React.ReactNode;
  height?: number | string;
  onClose?: () => void;
  overlay?: React.ReactNode;
}

export interface UIContextType {
  modal: ModalConfig;
  showModal: (config: Omit<ModalConfig, 'visible'>) => void;
  hideModal: () => void;
  
  bottomSheet: BottomSheetConfig;
  showBottomSheet: (content: React.ReactNode, height?: number | string) => void;
  hideBottomSheet: () => void;

  showToast: (config: Omit<ToastConfig, 'id'>) => void;
  hideToast: (id: string) => void;

  authModalVisible: boolean;
  authMode: 'login' | 'signup';
  showAuthModal: (mode?: 'login' | 'signup') => void;
  hideAuthModal: () => void;

  introductionModalVisible: boolean;
  showIntroductionModal: () => void;
  hideIntroductionModal: () => void;

  avatarViewerVisible: boolean;
  avatarUrl: string | null;
  showAvatarViewer: (url: string) => void;
  hideAvatarViewer: () => void;

  profileModalVisible: boolean;
  profileModalConfig: ProfileModalConfig | null;
  showProfileModal: (config: ProfileModalConfig) => void;
  hideProfileModal: () => void;
}
