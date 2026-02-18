import BottomSheet from '@/components/ui/BottomSheet';
import { ThemedText } from '@/components/ui/Text';
import { ThemedView } from '@/components/ui/View';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { UserProfile } from '@/types/user';
import { Image } from 'expo-image';
import { Calendar, LockKeyhole as LockIcon, User as UserIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import SheetHeader from './ui/SheetHeader';

type ProfileModalProps = {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  rank?: number;
  periodWins?: number;
  isMe?: boolean;
  onAvatarPress?: (url: string) => void;
};

export default function ProfileModal({ visible, profile, onClose, rank, periodWins, isMe, onAvatarPress }: ProfileModalProps) {
  const { colors } = useTheme();
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(profile);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (!visible || !profile?.id) return;

    const channel = supabase.channel(`profile:${profile.id}`)
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
            setLocalProfile((prev) => prev ? ({
              ...prev,
              wins: newProfile.wins,
              losses: newProfile.losses,
              draws: newProfile.draws,
              is_public: newProfile.is_public,
              username: newProfile.username,
              avatar_url: newProfile.avatar_url,
              created_at: newProfile.created_at,
            }) : null);
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
    <BottomSheet visible={visible} onClose={onClose}>
        <SheetHeader
            title={localProfile.is_public === false ? "Profile" : "Profile Details"}
            onClose={onClose}
        />
        
        <ThemedView style={styles.sheetContent}>
           {/* Common Header (Avatar + Name) */}
          <ThemedView style={styles.sheetProfileHeader}>
              <TouchableOpacity onPress={() => localProfile.avatar_url && onAvatarPress?.(localProfile.avatar_url)} activeOpacity={0.8} disabled={!localProfile.avatar_url}>
                  <ThemedView style={[styles.sheetAvatar, { borderColor: colors.border }]}>
                      {localProfile.avatar_url ? (
                          <Image source={{ uri: localProfile.avatar_url }} style={styles.avatar} />
                      ) : (
                          <UserIcon size={40} color={colors.subtext} />
                      )}
                  </ThemedView>
              </TouchableOpacity>
              <ThemedView style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
                      <ThemedText size="2xl" weight="bold">{localProfile.username || 'Anonymous'}</ThemedText>
                      {rank !== undefined && rank > 0 && (
                          <ThemedView style={[styles.rankBadgeLarge, { backgroundColor: colors.accent }]}>
                              <ThemedText colorType='white' weight='bold'>Rank #{rank}</ThemedText>
                          </ThemedView>
                      )}
                      {localProfile.is_public === false && isMe && (
                        <ThemedView style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                           <ThemedText size="sm" colorType="subtext">Private Mode</ThemedText>
                        </ThemedView>
                      )}
              </ThemedView>
              {localProfile.created_at && (
                  <ThemedView style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.7, marginTop: 4 }}>
                      <Calendar size={16} color={colors.subtext} />
                      <ThemedText size="sm" colorType="subtext">Joined {new Date(localProfile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</ThemedText>
                  </ThemedView>
              )}
          </ThemedView>

          {/* Check Privacy */}
          {localProfile.is_public === false && !isMe ? (
               <ThemedView style={{ alignItems: 'center', paddingTop: 20, width: '100%' }}>
                   <ThemedView style={{ 
                       width: 80, 
                       height: 80, 
                       borderRadius: 40, 
                       backgroundColor: colors.card, 
                       alignItems: 'center', 
                       justifyContent: 'center', 
                       marginBottom: 24,
                       borderWidth: 1,
                       borderColor: colors.border
                   }}>
                      <LockIcon size={40} color={colors.subtext} />
                   </ThemedView>
                   <ThemedText size="xl" weight="bold" colorType='text' style={{ marginBottom: 12 }}>Profile is Private</ThemedText>
                   <ThemedText align='center' colorType='subtext' style={{ paddingHorizontal: 32 }}>
                       This player has chosen to keep their detailed statistics private.
                   </ThemedText>
               </ThemedView>
          ) : (
              <>
                  <ThemedView style={[styles.statsGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <ThemedView style={styles.statBox}>
                          <ThemedText size="3xl" weight="black" colorType='success'>{wins}</ThemedText>
                          <ThemedText colorType='subtext'>Total Wins</ThemedText>
                      </ThemedView>
                      
                      <ThemedView style={styles.statDivider} />
                      <ThemedView style={styles.statBox}>
                          <ThemedText size="3xl" weight="black" colorType='error'>{localProfile.losses}</ThemedText>
                          <ThemedText colorType='subtext'>Losses</ThemedText>
                      </ThemedView>
                      <ThemedView style={styles.statDivider} />
                      <ThemedView style={styles.statBox}>
                          <ThemedText size="3xl" weight="black" colorType='subtext'>{localProfile.draws}</ThemedText>
                          <ThemedText colorType='subtext'>Draws</ThemedText>
                      </ThemedView>
                  </ThemedView>
                  
                  {/* Period Wins */}
                  {rank !== undefined && periodWins !== undefined && (
                      <ThemedText colorType='accent' size='sm' style={{ marginBottom: 16 }}>
                          Period Wins: {periodWins}
                      </ThemedText>
                  )}

                  <ThemedView style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
                      <ThemedText colorType='subtext' size='sm'>
                          Total Games: {totalGames}
                      </ThemedText>
                      <ThemedText colorType='subtext' size='sm'>
                          Win Rate: {winRate}%
                      </ThemedText>
                  </ThemedView>
                  <ThemedView style={[styles.winRateBar, { backgroundColor: colors.border }]}>
                      <ThemedView 
                          style={[
                              styles.winRateFill, 
                              { 
                                  width: `${winRate}%`,
                                  backgroundColor: colors.accent 
                              }
                          ]} 
                      />
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
  sheetHeader: {
        paddingBottom: 8,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
});