import AuthModal from '@/components/AuthModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ThemedText } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUI } from '@/context/UIContext';
import { supabase } from '@/lib/supabase/client';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { setStatusBarHidden } from 'expo-status-bar';
import { ClipboardIcon, Hash, LogIn, ScanLine } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/ui/View';
import { Layout } from '@/lib/constants/Layout';

export default function ScanScreen() {
  const { colors, setOverrideTheme } = useTheme();
  const { user } = useAuth();
  const { showToast } = useUI();
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [manualId, setManualId] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
        if (!user) return; // Don't override theme if not signed in
        setOverrideTheme('dark');
        setStatusBarHidden(true, 'fade');
        return () => {
            setOverrideTheme(null);
            setStatusBarHidden(false, 'fade');
        };
    }, [setOverrideTheme, user])
  );

  // Auth guard - show sign in screen if not authenticated
  if (!user) {
    return (
      <ThemedView themed style={[styles.permissionContainer]}>
        <LogIn size={48} color={colors.accent} style={{ marginBottom: 16 }} />
        <ThemedText type="title" size="2xl" weight="bold" colorType="text" align="center" style={{ marginBottom: 8 }}>Sign In Required</ThemedText>
        <ThemedText type="default" colorType="subtext" align="center" style={{ marginBottom: 24 }}>You need to sign in to scan QR codes and join online games.</ThemedText>
        <Button 
            title="Sign In" 
            onPress={() => setShowAuthModal(true)} 
            style={{ width: '100%', marginBottom: 12 }}
        />
        <Button 
            title="Go Back" 
            variant="secondary"
            onPress={() => router.back()} 
            style={{ width: '100%' }}
        />
        <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </ThemedView>
    );
  }

  if (!permission) {
    return (
      <ThemedView themed style={[styles.permissionContainer]}>
        <ThemedText type="title" size="3xl" weight="bold" colorType="text" align="center" style={[styles.permissionText]}>Please wait, loading camera...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView themed style={[styles.permissionContainer]}>
        <ThemedText type="title" size="3xl" weight="bold" colorType="text" align="center" style={[styles.permissionText]}>We need your permission to show the camera</ThemedText>
        <Button 
            title="Grant Permission" 
            onPress={requestPermission} 
            style={styles.grantButton}
        />
      </ThemedView>
    );
  }

  const parseGameId = (data: string) => {
    let gameId = data.trim();
    if (data.includes('gameId=')) {
        gameId = data.split('gameId=')[1].split('&')[0];
    } else if (data.includes('/game/')) {
        gameId = data.split('/game/')[1].split('?')[0];
    }
    return gameId;
  };

  const handleJoin = async (id: string) => {
    const gameId = parseGameId(id);
    if (!gameId || !user) return;

    try {
      // Check if this is the user's own game
      const { data: game, error } = await supabase
        .from('games')
        .select('player_x')
        .eq('id', gameId)
        .single();

      if (error || !game) {
        setScanned(true);
        router.replace(`/game/${gameId}`);
        return;
      }

      if (game.player_x === user.id) {
        showToast({ 
          type: 'error', 
          title: 'Same Account', 
          message: 'You cannot join your own game. Please use a different account.' 
        });
        setScanned(false);
        return;
      }
    } catch {
      // If check fails, just proceed normally and let game screen handle it
    }

    setScanned(true);
    router.replace(`/game/${gameId}`);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    handleJoin(data);
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setManualId(text);
      // Optional: Auto-join if it looks like a valid ID
      if (text.length > 5) {
        handleJoin(text);
      }
    }
  };

  return (
    <ThemedView themed style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
            barcodeTypes: ["qr"],
        }}
      >
        <ThemedView 
          contentContainerStyle={[styles.scrollContent, { minHeight: '100%' }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardAvoiding
          scroll
        >
             <ThemedText style={styles.titleText}>Join Game</ThemedText>
             
             <View style={[styles.scanFrame]}>
                {/* Corner Markers */}
                <View style={[styles.cornerTL, { borderColor: colors.accent }]} />
                <View style={[styles.cornerTR, { borderColor: colors.accent }]} />
                <View style={[styles.cornerBL, { borderColor: colors.accent }]} />
                <View style={[styles.cornerBR, { borderColor: colors.accent }]} />
                
                <ScanLine size={120} color={colors.accent} style={styles.scanIcon} strokeWidth={1} />
             </View>
             
             <View style={[styles.manualInputSection, {backgroundColor: colors.background}]}>
                <ThemedText size="sm" weight="bold" align="center" colorType="subtext">Scan QR or Paste Game ID</ThemedText>
                <Input 
                   placeholder="Enter Game ID"
                   value={manualId}
                   onChangeText={setManualId}
                   autoCapitalize="none"
                   leftIcon={<Hash size={20} />}
                   rightIcon={
                    <Button 
                       type="icon"
                       variant="secondary"
                       size="sm"
                       onPress={() => handlePaste()}
                       icon={<ClipboardIcon size={20} color={colors.accent} />}
                    />
                   }
                />
                    <Button 
                        title="Join"
                        variant="primary"
                        size="md"
                        onPress={() => handleJoin(manualId)}
                        disabled={!manualId.trim()}
                    />
             </View>
        </ThemedView>
      </CameraView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: "auto",
        padding: Layout.spacing.lg,
        width: Layout.CONTAINER_WIDTH_PERCENT,
        maxWidth: Layout.MAX_CONTENT_WIDTH,
    },
    permissionText: {
        textAlign: 'center',
        marginBottom: Layout.spacing.xxl,
    },
    grantButton: {
        width: '100%',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center', // Changed from space-evenly to allow scroll when compressed
        alignItems: 'center',
        width: Layout.CONTAINER_WIDTH_PERCENT,
        maxWidth: Layout.MAX_CONTENT_WIDTH,
        alignSelf: 'center',
        gap: Layout.isSmallDevice ? 16 : 24, // Increased gap
        paddingTop: Layout.isSmallDevice ? 20 : 40,
        paddingBottom: Layout.isSmallDevice ? 20 : 40
    },
    titleText: {
        color: 'white',
        fontSize: Layout.isSmallDevice ? 24 : 32,
        fontWeight: 'bold',
        marginBottom: Layout.isSmallDevice ? 10 : 20,
        letterSpacing: 1.5,
    },
    scanFrame: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        aspectRatio: 1 / 1,
        width: "90%",
    },
    cornerTL: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: Layout.components.iconSize.xl,
        height: Layout.components.iconSize.xl,
        borderTopWidth: 6,
        borderLeftWidth: 6,
        borderTopLeftRadius: Layout.borderRadius.xl,
        opacity: 0.8,
    },
    cornerTR: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: Layout.components.iconSize.xl,
        height: Layout.components.iconSize.xl,
        borderTopWidth: 6,
        borderRightWidth: 6,
        borderTopRightRadius: Layout.borderRadius.xl,
        opacity: 0.8,
    },
    cornerBL: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: Layout.components.iconSize.xl,
        height: Layout.components.iconSize.xl,
        borderBottomWidth: 6,
        borderLeftWidth: 6,
        borderBottomLeftRadius: Layout.borderRadius.xl,
        opacity: 0.8,
    },
    cornerBR: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: Layout.components.iconSize.xl,
        height: Layout.components.iconSize.xl,
        borderBottomWidth: 6,
        borderRightWidth: 6,
        borderBottomRightRadius: Layout.borderRadius.xl,
        opacity: 0.8,
    },
    scanIcon: {
        opacity: 0.9,
    },
    manualInputSection: {
        gap: Layout.isSmallDevice ? 8 : 12,
        padding: Layout.isSmallDevice ? 16 : 24,
        width: '100%',
        borderRadius: 24,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    buttonContainer: {
        marginTop: 80,
    },
});
