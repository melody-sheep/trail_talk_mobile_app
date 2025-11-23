import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import Toast from 'react-native-toast-message';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useReports from '../../hooks/useReports';
import useBannedWords from '../../hooks/useBannedWords';
import BannedWordModal from '../../components/BannedWordModal';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { supabase } from '../../lib/supabase';

export default function ReportDashboardScreen({ navigation }) {
  const { reports, loading, dismissReport, deletePostForReport, warnUser, fetchReports } = useReports();
  const { checkContent, banned, loading: bannedLoading, refetch: refetchBanned } = useBannedWords();
  const [expandedId, setExpandedId] = useState(null);
  const [bannedModalVisible, setBannedModalVisible] = useState(false);
  const [filter, setFilter] = useState('Pending');

  useEffect(() => {
    // Whenever reports update, optionally take actions
  }, [reports]);

  const ensureNotifyAuthorForBanned = async (report, matches) => {
    if (!report?.post?.author_id || !matches || matches.length === 0) return;
    try {
      // avoid duplicate notification for same post and type
      const { data: exists } = await supabase
        .from('notifications')
        .select('id')
        .eq('post_id', report.post.id)
        .eq('type', 'banned_word_detected')
        .limit(1);
      if (!exists || exists.length === 0) {
        await supabase.from('notifications').insert([{ user_id: report.post.author_id, actor_id: null, type: 'banned_word_detected', post_id: report.post.id, is_read: false }]);
      }
    } catch (err) {
      console.log('notify error', err);
    }
  };

  const renderProfileRow = (profile, label, time) => (
    <View style={styles.profileRow}>
      <Image
        source={ profile?.avatar_url ? { uri: profile.avatar_url } : require('../../../assets/profile_page_icons/default_profile_icon.png') }
        style={styles.avatar}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.profileName}>{profile?.display_name || profile?.username || label}</Text>
        <Text style={styles.profileMeta}>{profile?.user_type || profile?.role || ''} • {time || ''}</Text>
      </View>
    </View>
  );

  const highlightMatches = (text, matches) => {
    if (!matches || matches.length === 0) return <Text style={styles.content}>{text}</Text>;
    // simple highlight by splitting on matched words (case-insensitive)
    let lowered = text;
    const parts = [];
    let cursor = 0;
    // build regex for all words
    const words = matches.map(m => m.word).filter(Boolean);
    if (words.length === 0) return <Text style={styles.content}>{text}</Text>;
    const re = new RegExp('(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
    let lastIndex = 0;
    let match;
    const elements = [];
    while ((match = re.exec(text)) !== null) {
      const idx = match.index;
      if (idx > lastIndex) {
        elements.push(<Text key={lastIndex}>{text.substring(lastIndex, idx)}</Text>);
      }
      elements.push(<Text key={idx} style={styles.highlight}>{match[0]}</Text>);
      lastIndex = idx + match[0].length;
    }
    if (lastIndex < text.length) elements.push(<Text key={lastIndex}>{text.substring(lastIndex)}</Text>);
    return <Text style={styles.content}>{elements}</Text>;
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return '#FFA500';
      case 'dismissed': return '#6B7280';
      case 'deleted': return '#EF4444';
      case 'warned': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'schedule';
      case 'dismissed': return 'check-circle';
      case 'deleted': return 'delete';
      case 'warned': return 'warning';
      default: return 'help';
    }
  };

  const renderItem = ({ item }) => {
    const post = item.post || {};
    const matches = checkContent(post.content || '');
    // auto-notify author if banned words present
    if (matches && matches.length > 0) {
      ensureNotifyAuthorForBanned(item, matches);
    }

    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);

    return (
      <TouchableOpacity 
        onPress={() => setExpandedId(expandedId === item.id ? null : item.id)} 
        style={styles.card} 
        activeOpacity={0.9}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Image 
              source={ item.post_author?.avatar_url ? { uri: item.post_author.avatar_url } : require('../../../assets/profile_page_icons/default_profile_icon.png') } 
              style={styles.avatarSmall} 
            />
            <View style={styles.headerInfo}>
              <View style={styles.categoryRow}>
                <Text style={styles.category}>{item.category}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <MaterialIcons name={statusIcon} size={12} color="#FFF" />
                  <Text style={styles.statusText}>{(item.status || 'Pending').toString()}</Text>
                </View>
              </View>
              <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
            </View>
          </View>
          <MaterialIcons 
            name={expandedId === item.id ? 'expand-less' : 'expand-more'} 
            size={22} 
            color="rgba(255,255,255,0.6)" 
          />
        </View>

        {/* Post Content Preview */}
        <View style={styles.contentPreview}>
          {highlightMatches(post.content || '—', matches)}
        </View>

        {/* Banned Words Indicator */}
        {matches && matches.length > 0 && (
          <View style={styles.bannedIndicator}>
            <MaterialIcons name="flag" size={14} color="#FFCC00" />
            <Text style={styles.bannedText}>
              Contains flagged words: {matches.map(m => m.word).join(', ')}
            </Text>
          </View>
        )}

        {/* Expanded Details */}
        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            {/* Reported User Section */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Reported User</Text>
              {renderProfileRow(item.post_author, 'Author', formatRelativeTime(item.post?.created_at))}
            </View>

            {/* Reporter Section */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Reported By</Text>
              {renderProfileRow(item.reporter, 'Reporter', formatRelativeTime(item.created_at))}
            </View>

            {/* Report Reason */}
            {item.description && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Report Reason</Text>
                <Text style={styles.reason}>{item.description}</Text>
              </View>
            )}

            {/* Action Buttons - TEXT ONLY, NO ICONS */}
            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.dismissBtn]} 
                onPress={async () => {
                  try {
                    await dismissReport(item.id);
                    Toast.show({ type: 'success', text1: 'Report dismissed' });
                  } catch (err) {
                    Toast.show({ type: 'error', text1: 'Failed to dismiss report' });
                  }
                }}
              >
                <Text style={styles.actionText}>Dismiss Report</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, styles.deleteBtn]} 
                onPress={() => {
                  Alert.alert('Delete Post', 'Are you sure you want to delete this post? This action cannot be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive', 
                      onPress: async () => {
                        try {
                          await deletePostForReport(item.id, item.post.id);
                          Toast.show({ type: 'success', text1: 'Post deleted' });
                        } catch (err) {
                          Toast.show({ type: 'error', text1: 'Failed to delete post' });
                        }
                      } 
                    }
                  ]);
                }}
              >
                <Text style={styles.actionText}>Delete Post</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, styles.warnBtn]} 
                onPress={async () => {
                  try {
                    await warnUser(item.id);
                    Toast.show({ type: 'success', text1: 'User warned' });
                  } catch (err) {
                    Toast.show({ type: 'error', text1: 'Failed to warn user' });
                  }
                }}
              >
                <Text style={[styles.actionText, styles.warnText]}>Warn User</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  function formatRelativeTime(value) {
    if (!value) return '';
    const then = new Date(value);
    const now = new Date();
    const diff = Math.floor((now - then) / 1000); // seconds
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s`;
    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    const months = Math.floor(days / 30);
    return `${months}mo`;
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Reports</Text>
        </View>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => setBannedModalVisible(true)}
        >
          <MaterialIcons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterContainer}
        >
          {['Pending', 'Dismissed', 'Deleted', 'Warned', 'Banned Words'].map(f => {
            let iconName = getStatusIcon(f);
            const isActive = filter === f;

            // override icon for Banned Words chip
            if (f === 'Banned Words') iconName = 'block';

            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterChip,
                  isActive && (f === 'Banned Words' ? styles.filterChipBannedActive : styles.filterChipActive)
                ]}
              >
                <MaterialIcons 
                  name={iconName} 
                  size={16} 
                  color={isActive ? colors.white : 'rgba(255,255,255,0.7)'} 
                  style={styles.chipIcon} 
                />
                <Text style={[
                  styles.filterText,
                  isActive && styles.filterTextActive
                ]}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Reports List */}
      {filter === 'Banned Words' ? (
        <FlatList
          data={banned}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.bannedRow}>
              <View style={styles.bannedLeft}>
                <Text style={styles.bannedWord}>{item.word}</Text>
                {item.category ? <View style={styles.bannedCategory}><Text style={styles.bannedCategoryText}>{item.category}</Text></View> : null}
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <MaterialIcons name="block" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>No banned words</Text>
              <Text style={styles.emptySubtitle}>
                The banned words list is currently empty.
              </Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={reports.filter(r => {
            const s = (r.status || '').toString().toLowerCase();
            if (!filter) return true;
            if (filter === 'Pending') return (!s || s === 'pending' || s === 'open');
            return s === filter.toLowerCase();
          })}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>No reports found</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'Pending' 
                  ? 'All clear! No pending reports to review.'
                  : `No ${filter.toLowerCase()} reports at this time.`
                }
              </Text>
            </View>
          )}
        />
      )}

      <BannedWordModal 
        visible={bannedModalVisible} 
        onClose={() => { setBannedModalVisible(false); fetchReports(); refetchBanned && refetchBanned(); }} 
        onAdded={() => { fetchReports(); refetchBanned && refetchBanned(); }} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: colors.homeBackground 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 16,
  },
  title: { 
    color: colors.white, 
    fontFamily: fonts.bold, 
    fontSize: 24 
  },
  addBtn: { 
    backgroundColor: '#EF4444',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipBannedActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  bannedRow: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)'
  },
  bannedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  bannedWord: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  bannedCategory: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  bannedCategoryText: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  filterSection: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  filterText: { 
    color: 'rgba(255,255,255,0.7)', 
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  filterTextActive: { 
    color: colors.white,
  },
  chipIcon: { 
    marginRight: 6 
  },
  listContainer: { 
    padding: 16 
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarSmall: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  category: { 
    color: 'rgba(255,255,255,0.95)', 
    fontFamily: fonts.semiBold, 
    fontSize: 16,
    marginRight: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { 
    color: '#FFF', 
    fontFamily: fonts.medium, 
    fontSize: 11,
    marginLeft: 4,
  },
  time: { 
    color: 'rgba(255,255,255,0.5)', 
    fontFamily: fonts.normal, 
    fontSize: 13 
  },
  contentPreview: {
    marginBottom: 8,
  },
  content: { 
    color: 'rgba(255,255,255,0.9)', 
    fontFamily: fonts.normal, 
    lineHeight: 20,
    fontSize: 15,
  },
  bannedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,204,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  bannedText: { 
    color: '#FFCC00', 
    fontFamily: fonts.medium, 
    fontSize: 13,
    marginLeft: 6,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  detailSection: {
    marginBottom: 16,
  },
  sectionTitle: { 
    color: 'rgba(255,255,255,0.8)', 
    fontFamily: fonts.semiBold, 
    marginBottom: 8,
    fontSize: 14,
  },
  reason: { 
    color: 'rgba(255,255,255,0.9)', 
    fontFamily: fonts.normal,
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 8,
  },
  // UPDATED ACTION BUTTONS - TEXT ONLY
  actionsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    minHeight: 44,
  },
  actionText: {
    color: '#FFF',
    fontFamily: fonts.semiBold,
    fontSize: 14,
    textAlign: 'center',
  },
  dismissBtn: {
    backgroundColor: '#6B7280',
  },
  deleteBtn: {
    backgroundColor: '#EF4444',
  },
  warnBtn: {
    backgroundColor: '#FFCC00',
  },
  warnText: {
    color: '#1A1A1A',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.06)', 
    marginRight: 12 
  },
  profileName: { 
    color: colors.white, 
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
  profileMeta: { 
    color: 'rgba(255,255,255,0.6)', 
    fontFamily: fonts.normal, 
    fontSize: 13,
    marginTop: 2,
  },
  highlight: { 
    color: '#FFCC00', 
    fontFamily: fonts.bold,
    backgroundColor: 'rgba(255,204,0,0.1)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
});