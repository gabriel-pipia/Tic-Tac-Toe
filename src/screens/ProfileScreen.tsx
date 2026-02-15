import AvatarViewer from '@/components/AvatarViewer';
import BottomSheet from '@/components/BottomSheet';
import Button from '@/components/Button';
import Input from '@/components/Input';
import RefreshControl from '@/components/RefreshControl';
import { ThemedText } from '@/components/Text';
import { ThemedView } from '@/components/View';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUI } from '@/context/UIContext';
import { supabase } from '@/utils/supabase';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Camera,
  ChevronRight,
  Clock,
  LogOutIcon,
  Moon,
  Pencil,
  ShieldCheck,
  Sun,
  Trophy,
  User,
  UserCircle,
  UserX,
  X
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { isDark, setTheme, colors } = useTheme();
  const { showToast, showModal, hideModal } = useUI();
  const router = useRouter();
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [combinations, setCombinations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Edit Profile State
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [username, setUsername] = useState(user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || null);
  const [isPublic, setIsPublic] = useState(user?.user_metadata?.is_public ?? true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);

  const totalGames = stats.wins + stats.losses + stats.draws;
  const winRate = totalGames > 0 ? (stats.wins / totalGames) * 100 : 0;

  useEffect(() => {
      isMounted.current = true;
      return () => { isMounted.current = false; };
  }, []);

  const fetchStats = useCallback(async () => {
      if (!user) return;
      try {
        if (!refreshing && loading) setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('wins, losses, draws, is_public, game_combinations')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (isMounted.current && data) {
          setStats({
            wins: data.wins || 0,
            losses: data.losses || 0,
            draws: data.draws || 0,
          });
          setCombinations(data.game_combinations || {});
          
          if (user.user_metadata?.full_name) setUsername(user.user_metadata.full_name);
          if (user.user_metadata?.avatar_url) setAvatarUrl(user.user_metadata.avatar_url);
          // Prefer database value for is_public, fallback to metadata or default true
          if (data.is_public !== undefined && data.is_public !== null) {
              setIsPublic(data.is_public);
          } else if (user.user_metadata?.is_public !== undefined) {
              setIsPublic(user.user_metadata.is_public);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted.current) {
            setLoading(false);
            setRefreshing(false);
        }
      }
  }, [user, refreshing, loading]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error(error);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    // Update auth metadata (optional but good for caching)
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: username,
        is_public: isPublic,
        avatar_url: avatarUrl
      }
    });

    // Update profiles table (CRITICAL: this is what GlobalRank checks)
    const { error: profileError } = await supabase.from('profiles').update({
        username: username,
        avatar_url: avatarUrl,
        updated_at: new Date(),
        is_public: isPublic, 
    }).eq('id', user?.id);

    if (error || profileError) {
      showToast({ type: 'error', title: 'Update Failed', message: error?.message || profileError?.message || 'Unknown error' });
    } else {
      setShowEditSheet(false);
      showToast({ type: 'success', title: 'Profile Updated', message: 'Your changes have been saved.' });
    }
    setSaving(false);
  };

  const handleTogglePrivacy = async (newValue: boolean) => {
    const previousValue = isPublic;
    setIsPublic(newValue);
    
    try {
        const { error } = await supabase.from('profiles').update({ is_public: newValue }).eq('id', user?.id);
        
        if (error) throw error;
        
        // Update metadata to keep sync
        await supabase.auth.updateUser({ data: { is_public: newValue } });

        showToast({
            type: 'success',
            title: newValue ? 'Profile is Visible!' : 'Profile is Hidden!',
            message: newValue ? 'Your stats are now visible on the leaderboard.' : 'Your stats are hidden from the leaderboard.'
        });
    } catch (error: any) {
        setIsPublic(previousValue);
        showToast({
            type: 'error',
            title: 'Update Failed!',
            message: error.message
        });
    }
  };

  const handleDeleteAccount = () => {
    showModal({
      title: "Delete Account",
      description: "Are you sure you want to delete your account? This action is permanent and all your game data will be lost.",
      icon: <UserX size={40} color={colors.error} />,
      actions: [
        { text: "Cancel", variant: 'secondary', onPress: hideModal },
        { 
          text: "Delete", 
          variant: 'danger', 
          onPress: async () => {
            hideModal();
            try {
              setLoading(true);
              await supabase.auth.signOut();
              showToast({ type: 'info', title: 'Account Deleted', message: 'Your account has been scheduled for deletion.' });
            } catch (error: any) {
              showToast({ type: 'error', title: 'Deletion Failed', message: error.message });
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    });
  };

  const pickImage = async () => {
    try {
      setUploadingAvatar(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileExt = asset.uri.split('.').pop()?.toLowerCase() || 'jpeg';
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        const formData = new FormData();
        formData.append('file', { uri: asset.uri, name: fileName, type: asset.mimeType || `image/${fileExt}` } as any);

        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, formData, { contentType: asset.mimeType || `image/${fileExt}`, upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        setAvatarUrl(urlData.publicUrl);
      }
    } catch (error: any) {
      showToast({ type: 'error', title: 'Upload Failed', message: error.message });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const SummaryItem = ({ label, value, color }: { label: string; value: number | string; color: string }) => (
    <View style={localStyles.summaryItem}>
      <ThemedText style={[localStyles.summaryValue, { color }]}>{value}</ThemedText>
      <ThemedText style={[localStyles.summaryLabel, { color: colors.subtext }]}>{label}</ThemedText>
    </View>
  );

  const PatternItem = ({ combo, count }: { combo: string; count: number }) => {
    const indices = combo.split('-').map(Number);
    return (
        <View style={[localStyles.patternItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={localStyles.miniGrid}>
                {Array(9).fill(null).map((_, i) => (
                    <View 
                        key={i} 
                        style={[
                            localStyles.miniCell, 
                            { backgroundColor: indices.includes(i) ? colors.accent : colors.separator + '40' }
                        ]} 
                    />
                ))}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText size="sm" weight="bold">Win Line: {combo.replace(/-/g, ', ')}</ThemedText>
                <ThemedText size="xs" colorType="subtext">{count} Successful Victories</ThemedText>
            </View>
            <View style={[localStyles.countBadge, { backgroundColor: colors.accent + '15' }]}>
                <ThemedText size="xs" weight="bold" style={{ color: colors.accent }}>{count}x</ThemedText>
            </View>
        </View>
    );
  };

  const SettingRow = ({ icon, label, sublabel, action, value, isSwitch, isDestructive, textColor, isLast }: any) => (
    <TouchableOpacity 
      disabled={isSwitch} 
      activeOpacity={0.7}
      onPress={action}
      style={[localStyles.settingRow as any, isDestructive && { borderBottomWidth: 0 }, { borderBottomColor: colors.separator }, isLast && { borderBottomWidth: 0 }]}
    >
      <View style={localStyles.settingRowLeft}>
        <View style={[localStyles.settingIconContainer as any, { backgroundColor: colors.iconBg }, isDestructive && { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={[localStyles.settingLabel as any, { color: textColor || colors.text }, isDestructive && { color: '#EF4444' }]}>{label}</ThemedText>
          {sublabel && <ThemedText style={[localStyles.settingSublabel, { color: colors.subtext }]}>{sublabel}</ThemedText>}
        </View>
      </View>
      {isSwitch ? (
        <Switch 
          value={value} 
          onValueChange={action} 
          trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: colors.accent }}
          thumbColor="#fff"
        />
      ) : (
        <ChevronRight size={18} color={isDestructive ? "#EF4444" : (textColor || colors.subtext)} />
      )}
    </TouchableOpacity>
  );

  return (
    <ThemedView themed safe edges={['top', 'left', 'bottom', 'right']} style={[localStyles.container]}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={localStyles.scrollContent}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        
        {/* Profile Header */}
        <Animated.View entering={FadeInDown.duration(800).springify()} style={localStyles.header}>
          <View style={localStyles.avatarContainer}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => avatarUrl && setShowAvatar(true)}>
            <LinearGradient
              colors={colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={localStyles.avatarGradient}
            >
              <View style={[localStyles.avatarInner, { backgroundColor: colors.sheetBg, borderColor: colors.background }]}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={localStyles.avatarImage} />
                ) : (
                  <ThemedText style={localStyles.avatarPlaceholderText}>
                    {username?.charAt(0).toUpperCase() || '?'}
                  </ThemedText>
                )}
              </View>
            </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowEditSheet(true)}
              style={[localStyles.editAvatarButton, { borderColor: colors.background }]}
              activeOpacity={0.8}
            >
              <Pencil size={16} color="white" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ThemedText style={[localStyles.usernameText, { color: colors.text }]}>{username || 'Player'}</ThemedText>
          <ThemedText style={[localStyles.emailText, { color: colors.subtext }]}>{user?.email}</ThemedText>

          {/* Quick Stats Bar */}
          <View style={[localStyles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {loading ? (
              <ActivityIndicator color={colors.accent} style={{ paddingVertical: 16 }} />
            ) : (
              <>
                <SummaryItem label="Draws" value={stats.draws} color={colors.info} />
                <View style={[localStyles.statsDivider, { backgroundColor: colors.separator }]} />
                <SummaryItem label="Wins" value={stats.wins} color={colors.success} />
                <View style={[localStyles.statsDivider, { backgroundColor: colors.separator }]} />
                <SummaryItem label="Losses" value={stats.losses} color={colors.error} />
                <View style={[localStyles.statsDivider, { backgroundColor: colors.separator }]} />
                <SummaryItem label="Games" value={totalGames} color={colors.subtext} />
              </>
            )}
          </View>

          {/* Win Rate Progress Bar */}
          {!loading && (
            <View style={localStyles.winRateContainer}>
              <View style={localStyles.winRateHeader}>
                <ThemedText size="sm" weight="bold" colorType="subtext">Performance</ThemedText>
                <ThemedText size="sm" weight="black" colorType="accent">{Math.round(winRate)}% Win Rate</ThemedText>
              </View>
              <View style={[localStyles.progressBarBackground, { backgroundColor: colors.border }]}>
                <Animated.View 
                  entering={FadeInDown.delay(1000).duration(800).springify()}
                  style={[
                    localStyles.progressBarFill, 
                    { 
                      width: `${winRate}%`, 
                      backgroundColor: colors.accent 
                    }
                  ]} 
                />
              </View>
            </View>
          )}
        </Animated.View>

        {/* Settings Area */}
        <View style={localStyles.settingsArea}>
        
           <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginLeft: 4 }}>
                <Trophy size={14} color={colors.accent} />
                <ThemedText style={[localStyles.sectionTitle, { marginBottom: 0, marginLeft: 0, color: colors.subtext }]}>Strategic Insights</ThemedText>
            </View>
            <View style={localStyles.combinationsList}>
                {Object.entries(combinations).length > 0 ? (
                    Object.entries(combinations)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([combo, count]) => (
                            <PatternItem key={combo} combo={combo} count={count} />
                        ))
                ) : (
                    <View style={[localStyles.emptyPatterns, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <ThemedText size="sm" colorType="subtext">Play & win more to see your patterns!</ThemedText>
                    </View>
                )}
            </View>
          </View>

          <View style={{ marginTop: 32 }}>
            <ThemedText style={[localStyles.sectionTitle, { color: colors.subtext }]}>Activity</ThemedText>
            <View style={[localStyles.settingsGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingRow 
                icon={<Clock size={20} color={colors.accent} />} 
                label="Game History"
                sublabel="View past matches"
                action={() => router.push('/history')}
                isLast
              />
            </View>
          </View>

          <View>
            <ThemedText style={[localStyles.sectionTitle, { color: colors.subtext }]}>Account & Privacy</ThemedText>
            <View style={[localStyles.settingsGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingRow 
                icon={<UserCircle size={20} color={colors.info} />} 
                label="Edit Profile"
                sublabel="Display name and avatar"
                action={() => setShowEditSheet(true)}
              />
              <SettingRow 
                icon={<ShieldCheck size={20} color={colors.success} />} 
                label="Public Presence"
                sublabel="Show stats to other players"
                isSwitch
                value={isPublic}
                action={handleTogglePrivacy}
              />
              <SettingRow 
                icon={<UserX size={20} color={colors.error} />} 
                label="Delete Account"
                sublabel="Permanently remove your data"
                isDestructive
                action={handleDeleteAccount}
              />
            </View>
          </View>

          <View>
            <ThemedText style={[localStyles.sectionTitle, { color: colors.subtext }]}>App Settings</ThemedText>
            <View style={[localStyles.settingsGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingRow 
                icon={isDark ? <Moon size={20} color={colors.info} /> : <Sun size={20} color={colors.warning} />} 
                label="Dark Appearance"
                isSwitch
                value={isDark}
                action={(val: boolean) => setTheme(val ? 'dark' : 'light')}
              />
              <SettingRow 
                icon={<LogOutIcon size={20} color={colors.error} />} 
                label="Sign out"
                isDestructive
                action={handleSignOut}
              />
            </View>
          </View>

          <ThemedText style={[localStyles.versionText, { color: colors.subtext }]}>
            Version 1.0.4 • Build 2026
          </ThemedText>
        </View>
      </ScrollView>

      {/* Polish Edit Sheet */}
      <BottomSheet visible={showEditSheet} onClose={() => setShowEditSheet(false)}>
          <View style={[localStyles.sheetHeader, { borderColor: colors.border }]}>
          <ThemedText type="defaultSemiBold" size="lg" colorType="text" weight="bold">Update Profile</ThemedText>
          <Button variant="secondary" size='sm' type='icon' onPress={() => setShowEditSheet(false)} icon={<X size={20} color={colors.text} />} />
          </View>

          <View style={localStyles.sheetContent}>
          {/* Avatar Edit */}
          <View style={localStyles.avatarEditContainer}>
            <TouchableOpacity 
              onPress={pickImage} 
              disabled={uploadingAvatar}
              activeOpacity={0.8}
            >
              <View style={[localStyles.avatarEditPlaceholder, { backgroundColor: colors.iconBg, borderColor: colors.border }]}>
                {uploadingAvatar ? (
                  <ActivityIndicator color={colors.primary} />
                ) : avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={localStyles.avatarImage} />
                ) : (
                  <Camera size={28} color={colors.subtext} />
                )}
              </View>
              <View style={[localStyles.avatarEditButton, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                <Pencil size={12} color="white" />
              </View>
            </TouchableOpacity>
            <ThemedText colorType='subtext' size="sm" weight="semibold" style={localStyles.avatarEditHint}>Tap to upload new photo</ThemedText>
          </View>

          {/* Form */}
            <View style={localStyles.form}>
              <Input
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                leftIcon={<User size={24} color={colors.subtext} />}
                label='Display Name'
              />
            </View>

          <Button 
            title={saving ? "Syncing..." : "Update Profile"}
            onPress={handleSaveProfile}
            disabled={saving}
            variant="primary"
            textStyle={{ color: colors.white }}
            style={localStyles.saveButton}
        />
          </View>
        </BottomSheet>

        <AvatarViewer visible={showAvatar} url={avatarUrl} onClose={() => setShowAvatar(false)} />
      </ThemedView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
    width: Layout.CONTAINER_WIDTH_PERCENT,
    maxWidth: Layout.MAX_CONTENT_WIDTH,
    alignSelf: 'center'
  },
  header: {
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  avatarGradient: {
    width: 128,
    height: 128,
    borderRadius: 64,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    backgroundColor: '#6366F1',
    padding: 10,
    borderRadius: 20,
    borderWidth: 3,
  },
  usernameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Layout.spacing.md,
  },
  statsBar: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: Layout.borderRadius.xl,
    borderWidth: 1,
    padding: Layout.spacing.lg,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  statsDivider: {
    width: 1,
    height: 32,
  },
  settingsArea: {
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginLeft: 4,
  },
  settingsGroup: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    overflow: 'hidden',
    marginBottom: 32,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingSublabel: {
    fontSize: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  signOutIconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    marginRight: 16,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 16,
  },
  sheetContent: {
    width: '100%',
    padding: 20,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarEditContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  avatarEditPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    padding: 10,
    borderRadius: 20,
    borderWidth: 3,
  },
  avatarEditHint: {
    marginTop: 16,
  },
  form: {
    gap: 16,
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  toggleRow: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    width: '100%',
  },
   statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  combinationsList: {
    gap: 12,
    marginBottom: 8,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  miniGrid: {
    width: 36,
    height: 36,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  miniCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emptyPatterns: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  winRateContainer: {
    width: '100%',
    marginTop: 24,
  },
  winRateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBarBackground: {
    height: 8,
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
