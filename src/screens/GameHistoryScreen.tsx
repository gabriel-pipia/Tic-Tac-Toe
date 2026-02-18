import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import RefreshControl from '@/components/ui/RefreshControl';
import { ThemedText } from '@/components/ui/Text';
import { ThemedView } from '@/components/ui/View';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUI } from '@/context/UIContext';
import { Layout } from '@/lib/constants/Layout';
import { supabase } from '@/lib/supabase/client';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Calendar, Check, CheckCheck, ChevronLeft, Circle, Clock, Filter, Gamepad2, Handshake, RefreshCw, ThumbsDown, Trash2, Trophy, User as UserIcon, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type GameHistoryItem = {
  id: string;
  created_at: string;
  player_x: string;
  player_o: string | null;
  winner: 'X' | 'O' | 'DRAW' | null;
  status: string;
  opponent?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  winning_line?: number[] | null;
  score_x: number;
  score_o: number;
};

type ResultFilter = 'all' | 'wins' | 'losses' | 'draws' | 'abandoned' | 'in_progress';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';
type RoleFilter = 'all' | 'hosted' | 'joined';

const DATE_OPTIONS: { label: string; value: DateFilter }[] = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];

const RESULT_OPTIONS: { label: string; value: ResultFilter }[] = [
  { label: 'All Results', value: 'all' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Victories', value: 'wins' },
  { label: 'Defeats', value: 'losses' },
  { label: 'Draws', value: 'draws' },
  { label: 'Abandoned', value: 'abandoned' },
];

const ROLE_OPTIONS: { label: string; value: RoleFilter }[] = [
  { label: 'All Games', value: 'all' },
  { label: 'Hosted', value: 'hosted' },
  { label: 'Joined', value: 'joined' },
];

export default function GameHistoryScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showModal, hideModal, showToast } = useUI();
  const router = useRouter();
  const [games, setGames] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  // Temp filter state (applied on "Apply")
  const [tempResult, setTempResult] = useState<ResultFilter>('all');
  const [tempDate, setTempDate] = useState<DateFilter>('all');
  const [tempRole, setTempRole] = useState<RoleFilter>('all');

  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const activeFilterCount = (resultFilter !== 'all' ? 1 : 0) + (dateFilter !== 'all' ? 1 : 0) + (roleFilter !== 'all' ? 1 : 0);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      if (!refreshing) setLoading(true);

      const { data: gamesData, error } = await supabase
        .from('games')
        .select('*')
        .or(`player_x.eq.${user.id},player_o.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!gamesData || gamesData.length === 0) {
        setGames([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const opponentIds = new Set<string>();
      gamesData.forEach(g => {
        if (g.player_x !== user.id && g.player_x) opponentIds.add(g.player_x);
        if (g.player_o !== user.id && g.player_o) opponentIds.add(g.player_o);
      });

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', Array.from(opponentIds));

      const mergedGames = gamesData.map(g => {
        const isX = g.player_x === user.id;
        const opponentId = isX ? g.player_o : g.player_x;
        const opponentProfile = profilesData?.find(p => p.id === opponentId);
        
        return {
          ...g,
          opponent: opponentProfile ? {
            id: opponentProfile.id,
            username: opponentProfile.username,
            avatar_url: opponentProfile.avatar_url
          } : opponentId ? { id: opponentId, username: 'Unknown', avatar_url: null } : undefined
        };
      });

      setGames(mergedGames);
    } catch (err) {
      console.error('Error fetching game history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, refreshing]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
  };

  // Filtering logic
  const filteredGames = useMemo(() => {
    let filtered = [...games];

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let cutoff: Date;
      switch (dateFilter) {
        case 'today':
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          cutoff = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          cutoff = new Date(0);
      }
      filtered = filtered.filter(g => new Date(g.created_at) >= cutoff);
    }

    // Result filter
    if (resultFilter !== 'all' && user) {
      filtered = filtered.filter(g => {
        const isX = g.player_x === user.id;
        const myScore = isX ? (g.score_x || 0) : (g.score_o || 0);
        const oppScore = isX ? (g.score_o || 0) : (g.score_x || 0);
        
        const isTerminal = g.status === 'finished' || g.status === 'abandoned' || g.status === 'opponent_left';
        const isWin = isTerminal && myScore > oppScore;
        const isDraw = isTerminal && myScore === oppScore;
        const isLoss = isTerminal && myScore < oppScore;

        switch (resultFilter) {
          case 'in_progress': return g.status === 'playing' || g.status === 'waiting' || g.status.startsWith('rematch_');
          case 'wins': return isWin;
          case 'losses': return isLoss;
          case 'draws': return isDraw;
          case 'abandoned': return g.status === 'abandoned';
          default: return true;
        }
      });
    }

    // Role filter
    if (roleFilter !== 'all' && user) {
      filtered = filtered.filter(g => {
        if (roleFilter === 'hosted') return g.player_x === user.id;
        if (roleFilter === 'joined') return g.player_o === user.id;
        return true;
      });
    }

    return filtered;
  }, [games, dateFilter, resultFilter, roleFilter, user]);

  const openFilterSheet = () => {
    setTempResult(resultFilter);
    setTempDate(dateFilter);
    setTempRole(roleFilter);
    setShowFilterSheet(true);
  };

  const applyFilters = () => {
    setResultFilter(tempResult);
    setDateFilter(tempDate);
    setRoleFilter(tempRole);
    setShowFilterSheet(false);
  };

  const resetFilters = () => {
    setTempResult('all');
    setTempDate('all');
    setTempRole('all');
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    if (newSelected.size === 0) setIsSelectionMode(false);
  };

  const startSelection = (id: string) => {
    setIsSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const selectAll = () => {
    if (selectedIds.size === filteredGames.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredGames.map(g => g.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    showModal({
      title: 'Delete History',
      description: `Are you sure you want to delete ${selectedIds.size} game(s) from your history?`,
      icon: <Trash2 size={40} color={colors.error} />,
      actions: [
        { text: 'Cancel', variant: 'secondary', onPress: () => hideModal() },
        { 
          text: 'Delete', 
          variant: 'danger',
          onPress: async () => {
             hideModal();
             setIsDeleting(true);
             try {
                const idsToDelete = Array.from(selectedIds);
                const { error } = await supabase
                  .from('games')
                  .delete()
                  .in('id', idsToDelete);

                if (error) throw error;

                setGames(prev => prev.filter(g => !selectedIds.has(g.id)));
                cancelSelection();
             } catch (err) {
                console.error('Error deleting games:', err);
                showModal({
                  title: 'Error',
                  description: 'Failed to delete selected games.',
                  icon: <X size={40} color={colors.error} />,
                  actions: [{ text: 'OK', variant: 'primary', onPress: () => hideModal() }]
                });
             } finally {
                setIsDeleting(false);
             }
          }
        },
      ]
    });
  };

  const MiniBoardPreview = ({ winningLine }: { winningLine?: number[] | null }) => {
    if (!winningLine) return null;
    return (
        <View style={styles.previewGrid}>
            {Array(9).fill(null).map((_, i) => (
                <View 
                    key={i} 
                    style={[
                        styles.previewCell, 
                        { backgroundColor: winningLine.includes(i) ? colors.accent : colors.separator + '40' }
                    ]} 
                />
            ))}
        </View>
    );
  };

  const [rematchLoadingId, setRematchLoadingId] = useState<string | null>(null);

  const handleRematch = async (item: GameHistoryItem) => {
      if (!user) return;
      
      setRematchLoadingId(item.id);
      try {
          const isX = item.player_x === user.id;
          const myMark = isX ? 'X' : 'O';
          const newStatus = `rematch_requested_${myMark}`;
          
          const { error } = await supabase.from('games').update({ status: newStatus }).eq('id', item.id);
          
          if (error) throw error;
          
          showToast({
              type: 'success',
              title: 'Rematch Requested',
              message: 'Your opponent was invited to join!'
          });
          
          router.push(`/game/${item.id}`);
      } catch (err) {
          console.error("Failed to start rematch from history:", err);
          showToast({
              type: 'error',
              title: 'Rematch Failed',
              message: 'Could not send rematch request.'
          });
      } finally {
          setRematchLoadingId(null);
      }
  };

  const renderItem = ({ item, index }: { item: GameHistoryItem, index: number }) => {
    const isX = item.player_x === user?.id;
    const isFinished = item.status === 'finished' || item.status === 'opponent_left';
    const isAbandoned = item.status === 'abandoned';
    const isInProgress = item.status === 'playing' || item.status === 'waiting' || item.status.startsWith('rematch_');
    
    // Calculate result based on scores for terminal states
    const myScore = isX ? (item.score_x || 0) : (item.score_o || 0);
    const oppScore = isX ? (item.score_o || 0) : (item.score_x || 0);
    const scoreWin = myScore > oppScore;
    const scoreDraw = myScore === oppScore;

    let statusText = 'Unknown';
    let statusColor = colors.subtext;
    let Icon = Clock;
    let statusBg = colors.border + '40';
    
    if (isInProgress) {
        statusText = item.status === 'waiting' ? 'Waiting' : 'In Progress';
        statusColor = colors.accent;
        Icon = item.status === 'waiting' ? UserIcon : Gamepad2;
        statusBg = colors.accent + '15';
    } else if (isFinished || isAbandoned) {
        if (scoreWin) { 
            statusText = 'Victory'; 
            statusColor = colors.success; 
            Icon = Trophy;
            statusBg = colors.success + '15';
        } else if (scoreDraw) { 
            statusText = 'Draw'; 
            statusColor = colors.subtext; 
            Icon = Handshake;
            statusBg = colors.subtext + '15';
        } else { 
            statusText = 'Defeat'; 
            statusColor = colors.error; 
            Icon = ThumbsDown;
            statusBg = colors.error + '15';
        }
        
        // Custom badge for abandoned
        if (isAbandoned) {
            statusText += ' (Abnd)';
        } else if (item.status === 'opponent_left') {
            statusText += ' (Left)';
        }
    }

    const date = new Date(item.created_at);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const isSelected = selectedIds.has(item.id);

    const handlePress = () => {
      if (isSelectionMode) {
        toggleSelection(item.id);
      } else {
        router.push(`/game/${item.id}`);
      }
    };

    const handleLongPress = () => {
      if (!isSelectionMode) {
        startSelection(item.id);
      }
    };

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={handlePress}
          onLongPress={handleLongPress}
          style={styles.cardWrapper}
        >
          <ThemedView style={[
              styles.card, 
              { 
                backgroundColor: colors.card, 
                borderColor: isSelected ? colors.accent : (isInProgress ? colors.accent : colors.border),
                borderWidth: isSelected ? 2 : 1.5
              }
          ]}>
              {/* Selection Checkbox */}
              {isSelectionMode && (
                  <View style={[styles.selectionOverlay, { backgroundColor: isSelected ? colors.accent + '10' : 'transparent' }]}>
                      <View style={[styles.checkbox, { borderColor: isSelected ? colors.accent : colors.border, backgroundColor: isSelected ? colors.accent : colors.background }]}>
                          {isSelected && <Check size={20} color="white" />}
                      </View>
                  </View>
              )}

              {/* Header: Status & Date */}
              <View style={styles.cardHeaderSmall}>
                  <View style={[styles.statusBadgeLarge, { backgroundColor: statusBg }]}>
                      <Icon size={16} color={statusColor} />
                      <ThemedText weight="bold" size="sm" style={{ color: statusColor }}>{statusText.toUpperCase()}</ThemedText>
                  </View>
                  <View style={styles.dateTimeRow}>
                      <Clock size={14} color={colors.subtext} />
                      <ThemedText size="xs" colorType="subtext">{dateStr} • {timeStr}</ThemedText>
                  </View>
              </View>

              {/* Main Content: Players & Score */}
              <View style={styles.cardMainSection}>
                  <View style={styles.playerInfoColumn}>
                      <View style={[styles.avatarContainerLarge, { borderColor: isX ? colors.primary : colors.border }]}>
                          <View style={[styles.avatarCircle, { backgroundColor: colors.background }]}>
                              <UserIcon size={32} color={colors.subtext} />
                          </View>
                          <View style={[styles.markBadgeLarge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                               <X size={16} strokeWidth={4} color={colors.white} />
                          </View>
                      </View>
                      <ThemedText weight="bold" size="sm" numberOfLines={1} style={styles.playerName}>
                          {isX ? (user?.user_metadata?.username || 'You') : (item.opponent?.username || (item.player_x ? 'Opponent' : 'Open Room'))}
                      </ThemedText>
                  </View>

                  <View style={styles.scoreContainerBig}>
                      <ThemedText weight="black" size="3xl" style={styles.scoreText}>
                          {item.score_x} — {item.score_o}
                      </ThemedText>
                      {item.winning_line && (
                          <MiniBoardPreview winningLine={item.winning_line} />
                      )}
                  </View>

                  <View style={styles.playerInfoColumn}>
                      <View style={[styles.avatarContainerLarge, { borderColor: !isX ? colors.secondary : colors.border }]}>
                          <View style={[styles.avatarCircle, { backgroundColor: colors.background }]}>
                              {item.opponent?.avatar_url ? (
                                  <Image source={{ uri: item.opponent.avatar_url }} style={styles.avatarImageLarge} />
                              ) : (
                                  <View style={[styles.avatarCircle, { backgroundColor: colors.background }]}>
                                      {item.status === 'waiting' ? <ActivityIndicator size="small" color={colors.subtext} /> : <UserIcon size={32} color={colors.subtext} />}
                                  </View>
                              )}
                          </View>
                          <View style={[styles.markBadgeLarge, { backgroundColor: colors.secondary, borderColor: colors.background }]}>
                               <Circle size={16} strokeWidth={4} color={colors.white} />
                          </View>
                      </View>
                      <ThemedText weight="bold" size="sm" numberOfLines={1} style={styles.playerName}>
                          {!isX ? (user?.user_metadata?.username || 'You') : (item.opponent?.username || (item.player_o ? 'Opponent' : 'Waiting...'))}
                      </ThemedText>
                  </View>
              </View>

              {/* Footer: Game ID & Link */}
              <View style={[styles.cardFooter, { borderTopColor: colors.border + '40' }]}>
                  <ThemedText size="xs" colorType="subtext" style={{ flex: 1 }}>ID: {item.id}</ThemedText>
                  
                  {isInProgress ? (
                      <ThemedText weight="bold" size="xs" colorType="accent">CONTINUE MATCH →</ThemedText>
                  ) : (item.status === 'finished' || item.status === 'opponent_left' || item.status === 'abandoned') && (
                      <TouchableOpacity 
                        onPress={(e) => {
                            e.stopPropagation();
                            handleRematch(item);
                        }}
                        disabled={!!rematchLoadingId}
                        style={[styles.rematchBtn, { backgroundColor: colors.accent + '20' }]}
                      >
                         {rematchLoadingId === item.id ? (
                             <ActivityIndicator size="small" color={colors.accent} />
                         ) : (
                             <>
                                <RefreshCw size={12} color={colors.accent} />
                                <ThemedText weight="bold" size="xs" colorType="accent">REMATCH</ThemedText>
                             </>
                         )}
                      </TouchableOpacity>
                  )}
              </View>
          </ThemedView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  // Chip component for filter options
  const FilterChip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.filterChip,
        { 
          backgroundColor: selected ? colors.accent + '20' : colors.card,
          borderColor: selected ? colors.accent : colors.border,
        }
      ]}
    >
      <ThemedText 
        size="sm" 
        weight={selected ? 'bold' : 'medium'}
        style={{ color: selected ? colors.accent : colors.text }}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView safe themed style={styles.container}>
      <ThemedView style={styles.responsiveContainer}>
        {/* Header */}
        <View style={styles.header}>
            {isSelectionMode ? (
                <View style={[styles.selectionHeader]}>
                    <Button
                      variant="secondary"
                      type='icon'
                      size='sm'
                      icon={<X size={20} color={colors.text} />}
                      onPress={cancelSelection}
                    />
                    <ThemedText size="lg" weight="bold">{selectedIds.size} Selected</ThemedText>
                    <Button
                      variant={selectedIds.size === filteredGames.length ? "secondary" : "primary"}
                      size='sm'
                      icon={selectedIds.size === filteredGames.length ? <X size={20} color={colors.text} /> : <CheckCheck size={20} color={colors.text} />}
                      title={selectedIds.size === filteredGames.length ? 'None' : 'All'}
                      onPress={selectAll}
                    />
                </View>
            ) : (
                <>
                    <Button variant="secondary" type='icon' size='sm' icon={<ChevronLeft size={20} color={colors.text} />} onPress={handleBack} />
                    <ThemedText size="xl" weight="bold">Game History</ThemedText>
                    <View>
                        <Button variant="secondary" type='icon' size='sm' icon={<Filter size={20} color={colors.text} />} onPress={openFilterSheet} />
                        {activeFilterCount > 0 && (
                            <View style={[styles.filterBadge, { backgroundColor: colors.accent }]}>
                                <ThemedText size="xs" weight="bold" style={{ color: '#FFFFFF', fontSize: 10 }}>{activeFilterCount}</ThemedText>
                            </View>
                        )}
                    </View>
                </>
            )}
        </View>

        {/* Active Filter Tags */}
        {activeFilterCount > 0 && (
          <View style={styles.activeFiltersRow}>
            {dateFilter !== 'all' && (
              <TouchableOpacity 
                activeOpacity={0.7}
                style={[styles.activeFilterTag, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}
                onPress={() => setDateFilter('all')}
              >
                <Calendar size={12} color={colors.accent} />
                <ThemedText size="xs" weight="bold" style={{ color: colors.accent }}>
                  {DATE_OPTIONS.find(o => o.value === dateFilter)?.label}
                </ThemedText>
                <X size={12} color={colors.accent} />
              </TouchableOpacity>
            )}
            {resultFilter !== 'all' && (
              <TouchableOpacity 
                activeOpacity={0.7}
                style={[styles.activeFilterTag, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}
                onPress={() => setResultFilter('all')}
              >
                <Trophy size={12} color={colors.accent} />
                <ThemedText size="xs" weight="bold" style={{ color: colors.accent }}>
                  {RESULT_OPTIONS.find(o => o.value === resultFilter)?.label}
                </ThemedText>
                <X size={12} color={colors.accent} />
              </TouchableOpacity>
            )}
            {roleFilter !== 'all' && (
              <TouchableOpacity 
                activeOpacity={0.7}
                style={[styles.activeFilterTag, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}
                onPress={() => setRoleFilter('all')}
              >
                <Gamepad2 size={12} color={colors.accent} />
                <ThemedText size="xs" weight="bold" style={{ color: colors.accent }}>
                  {ROLE_OPTIONS.find(o => o.value === roleFilter)?.label}
                </ThemedText>
                <X size={12} color={colors.accent} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {loading && !refreshing ? (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        ) : (
            <FlatList
              data={filteredGames}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                      <Clock size={48} color={colors.subtext} />
                      <ThemedText colorType="subtext" size="md" style={{ marginTop: 16 }}>
                        {activeFilterCount > 0 ? 'No games match your filters.' : 'No games played yet.'}
                      </ThemedText>
                      {activeFilterCount > 0 && (
                        <Button 
                          variant="primary"
                          size='sm'
                          title='Clear Filters'
                          onPress={() => { setResultFilter('all'); setDateFilter('all'); setRoleFilter('all'); }}
                        />
                      )}
                  </View>
              }
            />
        )}

        {/* Delete Toolbar */}
        {isSelectionMode && (
            <Animated.View entering={FadeInDown} style={[styles.deleteToolbar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <View style={styles.toolbarContent}>
                    <ThemedText size="md" weight="bold" colorType="subtext">
                        {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
                    </ThemedText>
                    <Button 
                        title={isDeleting ? "Deleting..." : "Delete"}
                        variant="primary"
                        size="sm"
                        disabled={selectedIds.size === 0 || isDeleting}
                        onPress={handleDeleteSelected}
                        icon={isDeleting ? <ActivityIndicator size="small" color="white" /> : <Trash2 size={20} color="white" />}
                        style={{ backgroundColor: colors.error }}
                    />
                </View>
            </Animated.View>
        )}
      </ThemedView>

      {/* Filter Bottom Sheet */}
      <BottomSheet visible={showFilterSheet} onClose={() => setShowFilterSheet(false)}>
        <View style={styles.sheetContent}>
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <ThemedText size="lg" weight="bold">Filter Games</ThemedText>
            <Button 
              title="Reset"
              variant="secondary"
              size="sm"
              onPress={resetFilters}
            />
          </View>

          {/* Date Filter Section */}
          <View style={styles.filterSection}>
            <View style={styles.filterSectionHeader}>
              <Calendar size={18} color={colors.accent} />
              <ThemedText size="md" weight="bold">Date</ThemedText>
            </View>
            <View style={styles.chipRow}>
              {DATE_OPTIONS.map(option => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  selected={tempDate === option.value}
                  onPress={() => setTempDate(option.value)}
                />
              ))}
            </View>
          </View>

          {/* Result Filter Section */}
          <View style={styles.filterSection}>
            <View style={styles.filterSectionHeader}>
              <Trophy size={18} color={colors.accent} />
              <ThemedText size="md" weight="bold">Result</ThemedText>
            </View>
            <View style={styles.chipRow}>
              {RESULT_OPTIONS.map(option => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  selected={tempResult === option.value}
                  onPress={() => setTempResult(option.value)}
                />
              ))}
            </View>
          </View>

          {/* Role Filter Section */}
          <View style={styles.filterSection}>
            <View style={styles.filterSectionHeader}>
              <Gamepad2 size={18} color={colors.accent} />
              <ThemedText size="md" weight="bold">Role</ThemedText>
            </View>
            <View style={styles.chipRow}>
              {ROLE_OPTIONS.map(option => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  selected={tempRole === option.value}
                  onPress={() => setTempRole(option.value)}
                />
              ))}
            </View>
          </View>

          {/* Apply Button */}
          <Button 
            title="Apply Filters"
            variant="primary"
            size="md"
            onPress={applyFilters}
            style={{ marginTop: 8 }}
          />
        </View>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 20,
    borderRadius: 24,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: 20,
    position: 'relative',
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    padding: 12,
    alignItems: 'flex-end',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMainSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  playerInfoColumn: {
    alignItems: 'center',
    width: '28%',
    gap: 10,
  },
  avatarContainerLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    padding: 3,
    position: 'relative',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImageLarge: {
    width: '100%',
    height: '100%',
  },
  markBadgeLarge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  playerName: {
    textAlign: 'center',
    width: '100%',
  },
  scoreContainerBig: {
    alignItems: 'center',
    gap: 8,
  },
  scoreText: {
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  rematchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  previewGrid: {
    width: 32,
    height: 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  previewCell: {
    width: 9,
    height: 9,
    borderRadius: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 16,
  },
  // Filter Badge
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Active filter tags
  activeFiltersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectionHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  selectionCancel: {
    padding: 4,
  },
  deleteToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Bottom Sheet Content
  sheetContent: {
    padding: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
});
