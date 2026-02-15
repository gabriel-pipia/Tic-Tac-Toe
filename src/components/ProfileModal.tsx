
import AvatarViewer from '@/components/AvatarViewer';
import BottomSheet from '@/components/BottomSheet';
import Button from '@/components/Button';
import { ThemedText } from '@/components/Text';
import { ThemedView } from '@/components/View';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/utils/supabase';
import { Image } from 'expo-image';
import { LockKeyhole as LockIcon, User as UserIcon, X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

export type UserProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  wins: number;
  losses: number;
  draws: number;
  total_wins?: number; // For when we have period wins vs total wins
  is_public?: boolean;
};

type ProfileModalProps = {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  rank?: number; // Optional rank to show
  periodWins?: number;
  isMe?: boolean;
};

export default function ProfileModal({ visible, profile, onClose, rank, periodWins, isMe }: ProfileModalProps) {
  const { colors } = useTheme();
  const [showAvatar, setShowAvatar] = React.useState(false);
  const [localProfile, setLocalProfile] = React.useState<UserProfile | null>(profile);

  React.useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  React.useEffect(() => {
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
              // We don't expect username/avatar to change often enough to warrant complex merge, but we can:
              username: newProfile.username,
              avatar_url: newProfile.avatar_url,
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

  // Calculate total games and win rate
  const wins = localProfile.total_wins ?? localProfile.wins;
  const totalGames = wins + localProfile.losses + localProfile.draws;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose}>
        <ThemedView style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <ThemedText type="defaultSemiBold" size="lg" colorType="text" weight="bold">
            {localProfile.is_public === false ? "Profile" : "Profile Details"}
          </ThemedText>
          <Button variant="secondary" size='sm' type='icon' onPress={onClose} icon={<X size={20} color={colors.text} />} />
        </ThemedView>
        
        <ThemedView style={styles.sheetContent}>
           {/* Common Header (Avatar + Name) */}
          <ThemedView style={styles.sheetProfileHeader}>
              <TouchableOpacity onPress={() => localProfile.avatar_url && setShowAvatar(true)} activeOpacity={0.8} disabled={!localProfile.avatar_url}>
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
                           <ThemedText size="xs" colorType="subtext">Private Mode</ThemedText>
                        </ThemedView>
                      )}
              </ThemedView>
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
                  
                  {/* Period Wins (Optional) */}
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

      <AvatarViewer 
        visible={showAvatar} 
        url={localProfile?.avatar_url || null} 
        onClose={() => setShowAvatar(false)} 
      />
    </>
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
  }
});
