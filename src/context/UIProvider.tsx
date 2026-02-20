import AuthModal from '@/components/AuthModal';
import AvatarViewer from '@/components/AvatarViewer';
import IntroductionModal from '@/components/IntroductionModal';
import ProfileModal from '@/components/ProfileModal';
import BottomSheet from '@/components/ui/BottomSheet';
import CustomModal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import { BottomSheetConfig, ModalConfig, ProfileModalConfig, ToastConfig } from '@/types/ui';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UIContext } from './UIContext';

export function UIProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [modal, setModal] = useState<ModalConfig>({ visible: false });
  const [bottomSheet, setBottomSheet] = useState<BottomSheetConfig>({ visible: false });
  const [toasts, setToasts] = useState<ToastConfig[]>([]);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [introductionModalVisible, setIntroductionModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileModalConfig, setProfileModalConfig] = useState<ProfileModalConfig | null>(null);
  const [avatarViewerVisible, setAvatarViewerVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const showAuthModal = useCallback((mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode);
    setAuthModalVisible(true);
  }, []);
  const hideAuthModal = useCallback(() => setAuthModalVisible(false), []);

  const showIntroductionModal = useCallback(() => setIntroductionModalVisible(true), []);
  const hideIntroductionModal = useCallback(() => setIntroductionModalVisible(false), []);

  const showAvatarViewer = useCallback((url: string) => {
    setAvatarUrl(url);
    setAvatarViewerVisible(true);
  }, []);
  const hideAvatarViewer = useCallback(() => setAvatarViewerVisible(false), []);

  const showProfileModal = useCallback((config: ProfileModalConfig) => {
    setProfileModalConfig(config);
    setProfileModalVisible(true);
  }, []);
  const hideProfileModal = useCallback(() => setProfileModalVisible(false), []);

  const showModal = useCallback((config: Omit<ModalConfig, 'visible'>) => setModal({ ...config, visible: true }), []);
  const hideModal = useCallback(() => setModal((prev) => ({ ...prev, visible: false })), []);

  const showBottomSheet = useCallback((content: React.ReactNode, height: number | string = 'auto') => setBottomSheet({ visible: true, content, height }), []);
  const hideBottomSheet = useCallback(() => setBottomSheet((prev) => ({ ...prev, visible: false, onClose() {}, })), []);

  const showToast = useCallback((config: Omit<ToastConfig, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts(prev => {
          const newToasts = [...prev, { ...config, id }];
          return newToasts.slice(-3);
      });
  }, []);
  const hideToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const hasToasts = toasts.length > 0;
  const toastOverlay = hasToasts ? (
    <View style={[styles.toastContainer, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
        {toasts.map(toast => <Toast key={toast.id} config={toast} onDismiss={hideToast} />)}
    </View>
  ) : null;

  const isAnyModalOpen = modal.visible || bottomSheet.visible;

  return (
    <UIContext.Provider value={{ 
      modal, showModal, hideModal, bottomSheet, showBottomSheet, hideBottomSheet, showToast, hideToast, 
      authModalVisible, authMode, showAuthModal, hideAuthModal,
      introductionModalVisible, showIntroductionModal, hideIntroductionModal,
      avatarViewerVisible, avatarUrl, showAvatarViewer, hideAvatarViewer,
      profileModalVisible, profileModalConfig, showProfileModal, hideProfileModal
    }}>
      {children}
      {!isAnyModalOpen && toastOverlay}
      <CustomModal 
        visible={modal.visible} title={modal.title} description={modal.description} actions={modal.actions} icon={modal.icon}
        onClose={() => { modal.onClose?.(); modal.onDismiss?.(); hideModal(); }}
      >{modal.content}</CustomModal>
      <BottomSheet visible={bottomSheet.visible} onClose={() => { bottomSheet.onClose?.(); hideBottomSheet(); }} height={bottomSheet.height} overlay={toastOverlay}>
        {bottomSheet.content || <View />} 
      </BottomSheet>
      <AuthModal visible={authModalVisible} defaultMode={authMode} onClose={hideAuthModal} />
      <IntroductionModal visible={introductionModalVisible} onClose={hideIntroductionModal} />
      <AvatarViewer visible={avatarViewerVisible} url={avatarUrl} onClose={hideAvatarViewer} />
      <ProfileModal 
        visible={profileModalVisible} profile={profileModalConfig?.profile || null} 
        rank={profileModalConfig?.rank} periodWins={profileModalConfig?.periodWins} 
        isMe={profileModalConfig?.isMe} onClose={hideProfileModal} 
      />
    </UIContext.Provider>
  );
}

const styles = StyleSheet.create({
    toastContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, alignItems: 'center' }
});
