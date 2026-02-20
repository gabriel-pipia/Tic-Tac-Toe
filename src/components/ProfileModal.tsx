import BottomSheet from '@/components/ui/BottomSheet';
import SheetHeader from '@/components/ui/SheetHeader';
import { ThemedText } from '@/components/ui/Text';
import { ThemedView } from '@/components/ui/View';
import { useTheme } from '@/context/ThemeContext';
import { useUI } from '@/context/UIContext';
import { supabase } from '@/lib/supabase/client';
import { UserProfile } from '@/types/user';
import { Image } from 'expo-image';
import { Calendar, LockKeyhole as LockIcon, User as UserIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface ProfileModalProps {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  rank?: number;
  periodWins?: number;
  isMe?: boolean;
}

export default function ProfileModal({ 
  visible, 
  profile, 
  onClose, 
  rank, 
  periodWins,
  isMe 
}: ProfileModalProps) {
  const { colors } = useTheme();
  const { showAvatarViewer } = useUI();
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(profile);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  // Handle real-time updates for public profiles
  useEffect(() => {
    if (!visible || !profile?.id) return;

    const channel = supabase
      .channel(`profile:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`,
        },
        (payload: any) => {
          const newProfile = payload.new;
          if (newProfile) {
            setLocalProfile((prev) => 
               prev ? {
                ...prev,
                wins: newProfile.wins,
                losses: newProfile.losses,
                draws: newProfile.draws,
                is_public: newProfile.is_public,
                username: newProfile.username,
                avatar_url: newProfile.avatar_url,
                created_at: newProfile.created_at
              } : null
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [visible, profile?.id]);

  if (!localProfile) return null;

  const wins = localProfile.total_wins ?? localProfile.wins;
  const totalGames = wins + localProfile.losses + localProfile.draws;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  return (
    <BottomSheet
        visible={visible}
        onClose={onClose}
    >
        <SheetHeader 
            title={localProfile.is_public === false && !isMe ? "Profile" : "Profile Details"} 
            onClose={onClose} 
        />
        <ThemedView style={styles.sheetContent}>
          <ThemedView style={styles.sheetProfileHeader}>
              <ThemedView style={[styles.sheetAvatar, { borderColor: colors.border }]}>
                  <TouchableOpacity 
                    onPress={() => localProfile.avatar_url && showAvatarViewer(localProfile.avatar_url)}
                    disabled={!localProfile.avatar_url}
                    style={{ width: '100%', height: '100%' }}
                  >
                      {localProfile.avatar_url ? (
                          <Image source={{ uri: localProfile.avatar_url }} style={styles.avatar} contentFit="cover" transition={200} />
                      ) : (
                          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                              <UserIcon size={40} color={colors.subtext} />
                          </View>
                      )}
                  </TouchableOpacity>
              </ThemedView>
              
              <ThemedView style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
                      <ThemedText size="2xl" weight="bold">{localProfile.username || 'Anonymous'}</ThemedText>
                      {rank !== undefined && rank > 0 && (
                          <ThemedView style={[styles.rankBadgeLarge, { backgroundColor: colors.accent }]}>
                              <ThemedText colorType='white' weight='bold'>Rank #{rank}</ThemedText>
                          </ThemedView>
                      )}
              </ThemedView>

              {localProfile.created_at && (
                  <ThemedView style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.7, marginTop: 4 }}>
                      <Calendar size={16} color={colors.subtext} />
                      <ThemedText size="sm" colorType="subtext">
                          Joined {new Date(localProfile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </ThemedText>
                  </ThemedView>
              )}
          </ThemedView>

          {localProfile.is_public === false && !isMe ? (
                <ThemedView style={{ alignItems: 'center', paddingTop: 20, width: '100%' }}>
                    <ThemedView style={[styles.lockIconContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                       <LockIcon size={40} color={colors.subtext} />
                    </ThemedView>
                    <ThemedText size="xl" weight="bold" style={{ marginBottom: 12 }}>Profile is Private</ThemedText>
                    <ThemedText align='center' colorType='subtext' style={{ paddingHorizontal: 32 }}>
                        This player has chosen to keep their detailed statistics private.
                    </ThemedText>
                </ThemedView>
          ) : (
              <>
                  <ThemedView style={[styles.statsGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.statBox}>
                          <ThemedText size="3xl" weight="black" colorType='success'>{wins}</ThemedText>
                          <ThemedText colorType='subtext'>Total Wins</ThemedText>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statBox}>
                          <ThemedText size="3xl" weight="black" colorType='error'>{localProfile.losses}</ThemedText>
                          <ThemedText colorType='subtext'>Losses</ThemedText>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statBox}>
                          <ThemedText size="3xl" weight="black" colorType='subtext'>{localProfile.draws}</ThemedText>
                          <ThemedText colorType='subtext'>Draws</ThemedText>
                      </View>
                  </ThemedView>

                  <ThemedView style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
                      <ThemedText colorType='subtext' size='sm'>Total Games: {totalGames}</ThemedText>
                      <ThemedText colorType='subtext' size='sm'>Win Rate: {winRate}%</ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={[styles.winRateBar, { backgroundColor: colors.border }]}>
                      <ThemedView style={[styles.winRateFill, { width: `${winRate}%`, backgroundColor: colors.accent }]} />
                  </ThemedView>
              </>
          )}
        </ThemedView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  sheetProfileHeader: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 24,
    },
  sheetAvatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      marginBottom: 16,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  rankBadgeLarge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginTop: 8,
  },
  statsGrid: {
      flexDirection: 'row',
      width: '100%',
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      justifyContent: 'space-between',
      marginBottom: 24,
  },
  statBox: {
      alignItems: 'center',
      flex: 1,
  },
  statDivider: {
      width: 1,
      height: '100%',
      backgroundColor: 'rgba(150,150,150,0.2)',
  },
  winRateBar: {
      width: '100%',
      height: 30,
      borderRadius: 8,
      overflow: 'hidden',
  },
  winRateFill: {
      height: '100%',
      borderRadius: 4,
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
  }
});
