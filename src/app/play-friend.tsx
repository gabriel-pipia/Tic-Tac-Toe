import BottomSheet from '@/components/BottomSheet';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { ThemedText } from '@/components/Text';
import { ThemedView } from '@/components/View';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUI } from '@/context/UIContext';
import { supabase } from '@/utils/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useRouter } from 'expo-router';
import { ChevronLeft, Copy, Info, QrCode, ScanLine, Share2, X, Zap } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function PlayWithFriendScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showModal, hideModal, showToast } = useUI();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'host' | 'join'>('host');
  const [gameId, setGameId] = useState<string | null>(null);
  const [joinId, setJoinId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTips, setShowTips] = useState(false);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const gameIdRef = useRef<string | null>(null);
  const isJoiningRef = useRef(false);

  useEffect(() => {
      gameIdRef.current = gameId;
  }, [gameId]);

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          const id = gameIdRef.current;
          if (id && !isJoiningRef.current) {
              supabase.from('games').update({ status: 'abandoned' }).eq('id', id).then(({ error }) => {
                  if (error) console.log('Error cleaning up game:', error);
              });
          }
      };
  }, []);

  const navigation = useNavigation();

  // Handle back navigation (Gesture, Hardware, Button)
  useEffect(() => {
    const removeListener = navigation.addListener('beforeRemove', (e: any) => {
        // If no game or already joining, don't intercept
        if (!gameIdRef.current || isJoiningRef.current) {
            return;
        }

        // Prevent default
        e.preventDefault();

        showModal({
            title: 'Leave Game?',
            description: 'You have an active hosted game. Leaving will cancel it and delete the game room.',
            icon: <Info size={40} color={colors.accent} />,
            actions: [
                { 
                    text: 'Stay', 
                    variant: 'secondary', 
                    onPress: hideModal
                },
                { 
                    text: 'Leave', 
                    variant: 'danger', 
                    onPress: async () => {
                        hideModal();
                        const id = gameIdRef.current;
                        gameIdRef.current = null; // Prevent effect cleanup from double firing
                        if (id) await supabase.from('games').update({ status: 'abandoned' }).eq('id', id);
                        navigation.dispatch(e.data.action);
                    }
                }
            ]
        });
    });

    return removeListener;
  }, [colors, navigation, showModal, hideModal]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const isCreatingRef = useRef(false);

  const createGame = useCallback(async () => {
    if (!user || isCreatingRef.current) return;
    isCreatingRef.current = true;
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('games')
            .insert({ 
                player_x: user.id,
                status: 'waiting'
            })
            .select()
            .single();

        if (error) throw error;
        setGameId(data.id);
    } catch (error: any) {
        showToast({ type: 'error', title: 'Error', message: error.message });
        isCreatingRef.current = false;
    } finally {
        setLoading(false);
        isCreatingRef.current = false; 
    }
  }, [user, showToast]);

  // Host Logic: Create Game
  useEffect(() => {
    if (activeTab === 'host' && !gameId && user && !isCreatingRef.current) {
        createGame();
    }
  }, [activeTab, user, gameId, createGame]);

  useEffect(() => {
    if (!gameId) return;

    // Realtime subscription
    const channel = supabase
      .channel(`game_lobby_${gameId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'games', 
        filter: `id=eq.${gameId}` 
      }, (payload) => {
        if (payload.new.player_o || payload.new.status === 'playing') {
            isJoiningRef.current = true;
            router.replace(`/game/${gameId}`);
        }
      })
      .subscribe();

    // Polling fallback (in case realtime fails)
    const interval = setInterval(async () => {
        const { data } = await supabase
            .from('games')
            .select('status, player_o')
            .eq('id', gameId)
            .single();
        
        if (data && (data.status === 'playing' || data.player_o)) {
            isJoiningRef.current = true;
            router.replace(`/game/${gameId}`);
        }
    }, 3000);

    return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
    };
  }, [gameId, router]);

  const handleCopy = async () => {
    if (gameId) {
        await Clipboard.setStringAsync(gameId);
        showToast({ type: 'success', title: 'Copied', message: 'Game ID copied to clipboard.' });
    }
  };

  const handleShare = async () => {
    if (gameId) {
        await Share.share({
            message: `Join my Tic Tac Toe game! Game ID: ${gameId}`,
        });
    }
  };

  const handleJoin = async (id: string) => {
    if (!user || !id) return;
    setLoading(true);
    try {
        const { data: game, error: fetchError } = await supabase
            .from('games')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !game) throw new Error('Game not found');
        if (game.status !== 'waiting') throw new Error('Game is not available to join');
        if (game.player_x === user.id) {
            isJoiningRef.current = true;
            router.replace(`/game/${id}`);
            return;
        }

        const { error: updateError } = await supabase
            .from('games')
            .update({ 
                player_o: user.id,
                status: 'playing' 
            })
            .eq('id', id);

        if (updateError) throw updateError;
        
        isJoiningRef.current = true;
        router.replace(`/game/${id}`);
    } catch (error: any) {
        showToast({ type: 'error', title: 'Connect Failed', message: error.message });
        setScanned(false);
    } finally {
        setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    if (scanned) return;
    setScanned(true);
    handleJoin(data);
  };

  if (!permission) {
    return <View />;
  }

  return (
    <ThemedView safe themed style={styles.container}>
      <ThemedView style={styles.responsiveContainer}>
        {/* Header */}
        <View style={styles.header}>
            <Button variant="secondary" type='icon' size='sm' icon={<ChevronLeft size={20} color={colors.text} />} onPress={handleBack} />
            <ThemedText size="xl" weight="bold">Play with Friend</ThemedText>
            <Button variant="secondary" type='icon' size='sm' icon={<Info size={20} color={colors.text} />} onPress={() => setShowTips(true)} />
        </View>

        <View style={styles.content}>
        {activeTab === 'host' ? (
            <View style={styles.tabContent}>
                <View style={styles.card}>
                    <ThemedText type='subtitle' align='center' style={styles.cardTitle}>Your Game QR Code</ThemedText>
                    
                    <View style={[styles.qrContainer, { borderColor: colors.border }]}>
                        {loading ? (
                            <ActivityIndicator size="large" color={colors.accent} />
                        ) : gameId ? (
                            <QRCode value={gameId} size={200} backgroundColor="white" color="black" />
                        ) : (
                            <ThemedText type='label' colorType='subtext' align='center'>Creating game...</ThemedText>
                        )}
                    </View>

                    {gameId && (
                        <View style={styles.idSection}>
                            <ThemedText type='label' colorType='subtext' align='center' style={{ marginBottom: 8 }}>Game UID</ThemedText>
                            <View style={[styles.idBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <ThemedText style={styles.idText} numberOfLines={1} ellipsizeMode='middle'>{gameId}</ThemedText>
                            </View>
                            
                            <View style={styles.actionButtons}>
                                <Button 
                                    variant="secondary" 
                                    title="Copy" 
                                    icon={<Copy size={18} color={colors.text} />} 
                                    onPress={handleCopy}
                                    style={{ flex: 1 }}
                                />
                                <Button 
                                    variant="primary" 
                                    title="Share" 
                                    icon={<Share2 size={18} color="white" />} 
                                    onPress={handleShare}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </View>
                    )}
                </View>
            </View>
        ) : (
            <View style={styles.tabContent}>
                <View style={[styles.cameraContainer, { borderColor: colors.accent }]}>
                    {permission.granted ? (
                      <View style={styles.scanOverlay}>
                      <CameraView
                          style={StyleSheet.absoluteFillObject}
                          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                          barcodeScannerSettings={{
                              barcodeTypes: ["qr"],
                          }}
                      />
                        <ScanLine size={200} color="rgba(255,255,255,0.5)" strokeWidth={1} />
                    </View>
                    ) : (
                        <View style={styles.permissionContainer}>
                            <ThemedText align='center'>We need your permission to show the camera</ThemedText>
                            <Button onPress={requestPermission} title="grant permission" style={{ marginTop: 16 }} />
                        </View>
                    )}
                </View>

                <View style={styles.inputSection}>
                    <ThemedText align='center' colorType='subtext' style={{ marginBottom: 16 }}>Or enter code manually</ThemedText>
                    <View style={styles.inputRow}>
                        <Input 
                            placeholder="Paste Game ID"
                            value={joinId}
                            onChangeText={setJoinId}
                            containerClassName="flex-1"
                        />
                        <Button 
                            disabled={loading || !joinId}
                            onPress={() => handleJoin(joinId)}
                            title="Join"
                            variant="primary"
                            style={{ height: 56, marginLeft: 12, justifyContent: 'center' }}
                        />
                    </View>
                </View>
            </View>
        )}
        </View>

        {/* Floating Bottom Tabs */}
        <View style={styles.floatingTabsContainer}>
            <View style={[styles.floatingTabs, { backgroundColor: colors.card, borderColor: colors.border}]}>
                <TouchableOpacity onPress={() => {
                    setActiveTab('host');
                }} style={[styles.tabButton, activeTab === 'host' && { backgroundColor: `${colors.accent}20` }]}>
                    <QrCode size={20} color={activeTab === 'host' ? colors.accent : colors.subtext} />
                    <ThemedText weight="bold" colorType={activeTab === 'host' ? 'accent' : 'subtext'}>Host</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                    setActiveTab('join');
                }} style={[styles.tabButton, activeTab === 'join' && { backgroundColor: `${colors.accent}20` }]}>
                    <ScanLine size={20} color={activeTab === 'join' ? colors.accent : colors.subtext} />
                    <ThemedText weight="bold" colorType={activeTab === 'join' ? 'accent' : 'subtext'}>Scan</ThemedText>
                </TouchableOpacity>
            </View>
        </View>
      </ThemedView>

      <BottomSheet visible={showTips} onClose={() => setShowTips(false)}>
        <ThemedView style={[styles.sheetHeader, { borderColor: colors.border }]}>
          <ThemedText type="defaultSemiBold" size="lg" colorType="text" weight="bold">How to Connect</ThemedText>
          <Button variant="secondary" size='sm' type='icon' onPress={() => setShowTips(false)} icon={<X size={20} color={colors.text} />} />
        </ThemedView>
        <ThemedView style={styles.bottomSheetContent}>
          <View style={{ gap: 16 }}>
              <ThemedView style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.tipIcon, { backgroundColor: `${colors.accent}20` }]}>
                      <QrCode size={24} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                      <ThemedText weight='bold'>1. Host Game</ThemedText>
                      <ThemedText colorType='subtext' size='sm'>Tap &apos;Host&apos; to create a new game room. A unique QR code will appear.</ThemedText>
                  </View>
              </ThemedView>

              <ThemedView style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.tipIcon, { backgroundColor: `${colors.accent}20` }]}>
                      <ScanLine size={24} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                      <ThemedText weight='bold'>2. Scan Code</ThemedText>
                      <ThemedText colorType='subtext' size='sm'>Your friend taps &apos;Scan&apos; and points their camera at your screen.</ThemedText>
                  </View>
              </ThemedView>

              <ThemedView style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.tipIcon, { backgroundColor: `${colors.accent}20` }]}>
                      <Zap size={24} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                      <ThemedText weight='bold'>3. Play!</ThemedText>
                      <ThemedText colorType='subtext' size='sm'>The game connects automatically. Make sure you are both online.</ThemedText>
                  </View>
              </ThemedView>
          </View>
        </ThemedView>
      </BottomSheet>


    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomSheetContent: {
    padding: 20,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    alignItems: 'center',
  },
  cardTitle: {
    marginBottom: 24,
  },
  qrContainer: {
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  idSection: {
    width: '100%',
  },
  idBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  idText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 1/1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    marginBottom: 32,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContainer: {
    padding: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputSection: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  floatingTabsContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingTabs: {
    flexDirection: 'row',
    borderRadius: 100,
    padding: 6,
    borderWidth: 1,
    width: 250,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 100,
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      gap: 16,
  },
  tipIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
  }
});
