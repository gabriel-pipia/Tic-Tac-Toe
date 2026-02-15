
import BottomSheet from '@/components/BottomSheet';
import CustomModal, { ModalAction } from '@/components/Modal';
import Toast, { ToastConfig } from '@/components/Toast';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModalConfig {
  visible: boolean;
  title?: string;
  description?: string;
  actions?: ModalAction[];
  icon?: React.ReactNode;
  content?: React.ReactNode; // For custom children
  onClose?: () => void; // Optional override
  onDismiss?: () => void; // Callback when modal is dismissed
}

interface BottomSheetConfig {
  visible: boolean;
  content?: React.ReactNode;
  height?: number | string;
  onClose?: () => void;
}

interface UIContextType {
  modal: ModalConfig;
  showModal: (config: Omit<ModalConfig, 'visible'>) => void;
  hideModal: () => void;
  
  bottomSheet: BottomSheetConfig;
  showBottomSheet: (content: React.ReactNode, height?: number | string) => void;
  hideBottomSheet: () => void;

  showToast: (config: Omit<ToastConfig, 'id'>) => void;
  hideToast: (id: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [modal, setModal] = useState<ModalConfig>({ visible: false });
  const [bottomSheet, setBottomSheet] = useState<BottomSheetConfig>({ visible: false });
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  const showModal = (config: Omit<ModalConfig, 'visible'>) => {
    setModal({ ...config, visible: true });
  };

  const hideModal = () => {
    setModal((prev) => ({ ...prev, visible: false }));
  };

  const showBottomSheet = (content: React.ReactNode, height: number | string = 'auto') => {
    setBottomSheet({ visible: true, content, height });
  };
  
  const hideBottomSheet = () => {
    setBottomSheet((prev) => ({ ...prev, visible: false, onClose() {}, }));
  };

  const showToast = useCallback((config: Omit<ToastConfig, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts(prev => {
          const newToasts = [...prev, { ...config, id }];
          if (newToasts.length > 3) {
              return newToasts.slice(newToasts.length - 3);
          }
          return newToasts;
      });
  }, []);

  const hideToast = useCallback((id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <UIContext.Provider value={{ modal, showModal, hideModal, bottomSheet, showBottomSheet, hideBottomSheet, showToast, hideToast }}>
      {children}
      <View style={[styles.toastContainer, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
          {toasts.map(toast => (
              <Toast key={toast.id} config={toast} onDismiss={hideToast} />
          ))}
      </View>
      <CustomModal 
        visible={modal.visible}
        title={modal.title}
        description={modal.description}
        actions={modal.actions}
        icon={modal.icon}
        onClose={() => {
            if (modal.onClose) modal.onClose();
            if (modal.onDismiss) modal.onDismiss();
            hideModal();
        }}
      >
        {modal.content}
      </CustomModal>

      <BottomSheet
        visible={bottomSheet.visible}
        onClose={() => {
           if (bottomSheet.onClose) bottomSheet.onClose();
           hideBottomSheet();
        }}
        height={bottomSheet.height}
      >
        {bottomSheet.content || <View />} 
      </BottomSheet>
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999, // Above modal
        alignItems: 'center',
    }
});
