import Button from '@/components/Button';
import Input from '@/components/Input';
import { ThemedText } from '@/components/Text';
import { useTheme } from '@/context/ThemeContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Clipboard as ClipboardIcon, Hash, ScanLine } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedView } from '@/components/View';
import { Layout } from '@/constants/Layout';

export default function ScanScreen() {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [manualId, setManualId] = useState('');

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <ThemedText style={[styles.permissionText, { color: colors.text }]}>We need your permission to show the camera</ThemedText>
        <Button 
            title="Grant Permission" 
            onPress={requestPermission} 
            style={styles.grantButton}
        />
      </View>
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

  const handleJoin = (id: string) => {
    const gameId = parseGameId(id);
    if (!gameId) return;
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
           <View style={styles.content}>
             <ThemedText style={styles.titleText}>Join Game</ThemedText>
             
             <View style={[styles.scanFrame, {width: Layout.components.scanFrameSize as any, height: "auto"}]}>
                {/* Corner Markers */}
                <View style={[styles.cornerTL, { borderColor: colors.accent }]} />
                <View style={[styles.cornerTR, { borderColor: colors.accent }]} />
                <View style={[styles.cornerBL, { borderColor: colors.accent }]} />
                <View style={[styles.cornerBR, { borderColor: colors.accent }]} />
                
                <ScanLine size={120} color={colors.accent} style={styles.scanIcon} strokeWidth={1} />
             </View>
             
             <View style={[styles.manualInputSection, {backgroundColor: colors.background}]}>
                <ThemedText size="sm" weight="bold" align="center" colorType="subtext">SCAN QR PASTE CODE</ThemedText>
                <Input 
                   placeholder="Enter Game ID"
                   value={manualId}
                   onChangeText={setManualId}
                   autoCapitalize="none"
                   leftIcon={<Hash size={20} />}
                   rightIcon={
                    <TouchableOpacity onPress={handlePaste}>
                      <ClipboardIcon size={20} color={colors.accent} />
                    </TouchableOpacity>
                   }
                />
                
                <View style={styles.actionButtons}>
                    <Button 
                        title="Cancel"
                        variant="secondary"
                        size="sm"
                        onPress={() => router.back()}
                        style={{ flex: 1 }}
                    />
                    <Button 
                        title="Join"
                        variant="primary"
                        size="sm"
                        onPress={() => handleJoin(manualId)}
                        disabled={!manualId.trim()}
                        style={{ flex: 2 }}
                    />
                </View>
             </View>
           </View>
        </KeyboardAvoidingView>
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
        padding: Layout.spacing.lg,
        width: Layout.CONTAINER_WIDTH_PERCENT,
        maxWidth: Layout.MAX_CONTENT_WIDTH,
    },
    permissionText: {
        textAlign: 'center',
        marginBottom: Layout.spacing.md,
        fontSize: 20,
        fontWeight: 'bold',
    },
    grantButton: {
        width: '100%',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        width: Layout.CONTAINER_WIDTH_PERCENT,
        maxWidth: Layout.MAX_CONTENT_WIDTH,
        gap: Layout.isSmallDevice ? 8 : 12,
        paddingTop: Layout.isSmallDevice ? 40 : 80,
        paddingBottom: Layout.isSmallDevice ? 60 : 80
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
        width: '100%',
        padding: Layout.isSmallDevice ? 16 : 24,
        borderRadius: 24,
        borderWidth: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    buttonContainer: {
        marginTop: 80,
    },
});
