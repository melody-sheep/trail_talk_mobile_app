// src/screens/student/SearchScreen.js
import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  SectionList,
  Animated,
  RefreshControl,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import { checkIfFollowing, followUser, unfollowUser } from '../../utils/followingUtils';
import { supabase } from '../../lib/supabase';

export default function SearchScreen({ navigation }) {
  const { user } = useContext(UserContext);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('student');
  const [profiles, setProfiles] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [removedIds, setRemovedIds] = useState(new Set());
  const [followMap, setFollowMap] = useState({});
  const [communityMembershipMap, setCommunityMembershipMap] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Header animations
  const headerHeight = scrollY.interpolate({ 
    inputRange: [0, 100], 
    outputRange: [160, 80], 
    extrapolate: 'clamp' 
  });
  
  const headerTitleOpacity = scrollY.interpolate({ 
    inputRange: [0, 60], 
    outputRange: [1, 0], 
    extrapolate: 'clamp' 
  });
  
  const collapsedTitleOpacity = scrollY.interpolate({ 
    inputRange: [0, 60, 100], 
    outputRange: [0, 0, 1], 
    extrapolate: 'clamp' 
  });

  // FIXED: Adjusted collapsed title position to be lower
  const collapsedTitleTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 0], // Keep collapsed title vertically centered
    extrapolate: 'clamp',
  });

  // FIXED: Added missing stickySectionTop animation
  const stickySectionTop = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [160, 80],
    extrapolate: 'clamp',
  });

  // Header text centering animation
  const headerTextTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  // Category icons: swapped student and faculty per request
  const categories = [
    { id: 'student', label: 'Student', icon: 'school-outline' },
    { id: 'faculty', label: 'Faculty', icon: 'person-outline' },
    { id: 'communities', label: 'Communities', icon: 'people-outline' }
  ];

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const buildInitials = (displayName) => {
    if (!displayName) return 'USR';
    return displayName.split(' ').slice(0,2).map(s => s[0]).join('').toUpperCase().slice(0,3);
  };

  const fetchProfiles = useCallback(async (q) => {
    try {
      setLoading(true);
      setError(null);
      const like = `%${q}%`;
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, display_name, username, role, avatar_url, user_type')
        .ilike('display_name', like)
        .order('display_name', { ascending: true })
        .limit(100);

      if (err) {
        setError(err);
        setProfiles([]);
      } else {
        if (data && q.length > 0) {
          const { data: unameData } = await supabase.from('profiles').select('id, display_name, username, role, avatar_url, user_type').ilike('username', like).limit(100);
          const combined = [...(data||[]), ...(unameData||[])];
          const unique = Object.values(combined.reduce((acc, p) => { acc[p.id] = p; return acc; }, {}));
          setProfiles(unique.filter(p => {
            if (activeCategory === 'student') return p.user_type === 'student' || p.role === 'student';
            if (activeCategory === 'faculty') return p.user_type === 'faculty' || p.role === 'faculty';
            return true;
          }));
        } else {
          setProfiles((data||[]).filter(p => {
            if (activeCategory === 'student') return p.user_type === 'student' || p.role === 'student';
            if (activeCategory === 'faculty') return p.user_type === 'faculty' || p.role === 'faculty';
            return true;
          }));
        }
      }
    } catch (e) {
      setError(e);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  const fetchCommunities = useCallback(async (q) => {
    try {
      setLoading(true);
      setError(null);
      const like = `%${q}%`;
      const orClause = `name.ilike.${like},description.ilike.${like}`;
      const { data, error: err } = await supabase
        .from('communities')
        .select('id, name, description, member_count, category, privacy, icon, is_featured, is_official')
        .or(orClause)
        .order('member_count', { ascending: false })
        .limit(100);

      if (err) {
        setError(err);
        setCommunities([]);
      } else {
        setCommunities(data || []);
      }
    } catch (e) {
      setError(e);
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery.length === 0) {
      fetchProfiles('');
      fetchCommunities('');
      return;
    }

    if (activeCategory === 'communities') fetchCommunities(debouncedQuery);
    else fetchProfiles(debouncedQuery);
  }, [debouncedQuery, activeCategory, fetchProfiles, fetchCommunities]);

  // initial fetch when screen mounts
  useEffect(() => {
    fetchProfiles('');
    fetchCommunities('');
    const fetchFollows = async () => {
      if (!user) return;
      try {
        const { data } = await supabase.from('follows').select('following_user_id').eq('follower_user_id', user.id).limit(1000);
        const map = {};
        (data||[]).forEach(r => { map[r.following_user_id] = true; });
        setFollowMap(map);
        const { data: cm } = await supabase.from('community_members').select('community_id').eq('user_id', user.id).limit(1000);
        const cmap = {};
        (cm||[]).forEach(c => { cmap[c.community_id] = true; });
        setCommunityMembershipMap(cmap);
      } catch (e) {
        console.log('Error fetching follow/community maps', e);
      }
    };
    fetchFollows();
  }, []);

  const onFollowToggle = async (profileId) => {
    if (!user) return;
    const isFollowing = !!followMap[profileId];
    setFollowMap(prev => ({ ...prev, [profileId]: !prev[profileId] }));
    try {
      if (isFollowing) {
        await unfollowUser(user.id, profileId);
      } else {
        await followUser(user.id, profileId);
      }
    } catch (e) {
      console.error('Follow toggle error', e);
      setFollowMap(prev => ({ ...prev, [profileId]: isFollowing }));
    }
  };

  const onJoinToggle = async (communityId) => {
    if (!user) return;
    const isMember = !!communityMembershipMap[communityId];
    setCommunityMembershipMap(prev => ({ ...prev, [communityId]: !prev[communityId] }));
    try {
      if (isMember) {
        await supabase.from('community_members').delete().match({ user_id: user.id, community_id: communityId });
      } else {
        await supabase.from('community_members').insert({ user_id: user.id, community_id: communityId });
      }
      fetchCommunities(debouncedQuery || '');
    } catch (e) {
      console.error('Join toggle error', e);
      setCommunityMembershipMap(prev => ({ ...prev, [communityId]: isMember }));
    }
  };

  const onRemoveProfile = (profileId) => {
    setRemovedIds(prev => new Set([...Array.from(prev), profileId]));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setRemovedIds(new Set());
    setFollowMap({});
    await Promise.all([fetchProfiles(debouncedQuery || ''), fetchCommunities(debouncedQuery || '')]);
    setRefreshing(false);
  };

  // User Card
  const renderProfile = ({ item }) => {
    if (removedIds.has(item.id)) return null;
    const displayName = item.display_name || (item.username || '').replace(/^@/, '') || 'User';
    const initials = buildInitials(displayName);
    const isFollowing = !!followMap[item.id];
    const userRole = item.user_type || item.role || 'student';

    return (
      <View style={styles.resultCard}>
        <TouchableOpacity 
          style={styles.profileLeft}
          activeOpacity={0.8} 
          onPress={() => navigation.navigate('ViewProfile', { userId: item.id })}
        >
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
            <View style={styles.roleBadge}>
                <Ionicons 
                  // swapped icons: faculty shows person, student shows school
                  name={userRole === 'faculty' ? 'person-outline' : 'school-outline'} 
                  size={12} 
                  color="rgba(255,255,255,0.7)" 
                />
              <Text style={styles.roleText}>
                {userRole === 'faculty' ? 'Faculty' : 'Student'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.resultActions}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              isFollowing ? styles.removeButton : styles.followButton
            ]}
            onPress={() => onFollowToggle(item.id)}
          >
            <Text style={[
              styles.actionButtonText,
              isFollowing ? styles.removeButtonText : styles.followButtonText
            ]}>
              {isFollowing ? 'Remove' : 'Follow'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.hideButton]}
            onPress={() => onRemoveProfile(item.id)}
          >
            <Text style={styles.hideButtonText}>Hide</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Community Card
  const renderCommunity = ({ item }) => {
    const isMember = !!communityMembershipMap[item.id];
    
    return (
      <View style={styles.resultCard}>
        <View style={styles.profileLeft}>
          <View style={[styles.communityAvatar, { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
            <Ionicons 
              name={item.icon || "people-outline"} 
              size={20} 
              color={colors.white} 
            />
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.communityHeader}>
              <Text style={styles.profileName} numberOfLines={1}>{item.name}</Text>
              {item.is_official && (
                <View style={styles.officialBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#4CAF50" />
                </View>
              )}
            </View>
            <Text style={styles.communityDescription} numberOfLines={2}>
              {item.description || 'No description available'}
            </Text>
            <View style={styles.communityMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="people" size={12} color="rgba(255,255,255,0.6)" />
                <Text style={styles.metaText}>{item.member_count || 0} members</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="pricetag" size={12} color="rgba(255,255,255,0.6)" />
                <Text style={styles.metaText}>{item.category || 'General'}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.resultActions}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              isMember ? styles.leaveButton : styles.joinButton
            ]}
            onPress={() => onJoinToggle(item.id)}
          >
            <Text style={[
              styles.actionButtonText,
              isMember ? styles.leaveButtonText : styles.joinButtonText
            ]}>
              {isMember ? 'Leave' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // when activeCategory changes, clear removed/follow temporary states
  useEffect(() => {
    setRemovedIds(new Set());
    setFollowMap({});
  }, [activeCategory]);

  const combinedSections = [];
  if (activeCategory === 'communities') {
    // Include both communities and profile (people) results when Communities is active
    combinedSections.push({ key: 'communities', title: 'Communities', data: communities });
    combinedSections.push({ key: 'people', title: 'People', data: profiles });
  } else {
    const sectionTitle = activeCategory === 'faculty' ? 'Faculty Members' : 'Students';
    combinedSections.push({ key: 'people', title: sectionTitle, data: profiles });
  }

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // Render category chips
  const renderCategoryChip = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        activeCategory === item.id && styles.categoryChipSelected
      ]}
      onPress={() => setActiveCategory(item.id)}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={item.icon} 
        size={16} 
        color={activeCategory === item.id ? colors.homeBackground : colors.white} 
        style={styles.categoryIcon}
      />
      <Text style={[
        styles.categoryChipText,
        activeCategory === item.id && styles.categoryChipTextSelected
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />

      {/* Animated Header */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <ImageBackground 
          source={require('../../../assets/create_post_screen_icons/createpost_header_bg.png')} 
          style={styles.headerBackground} 
          resizeMode="cover"
        >
          <Animated.View style={[
            styles.headerContent, 
            { 
              opacity: headerTitleOpacity,
              transform: [{ translateY: headerTextTranslateY }]
            }
          ]}>
            <Text style={styles.headerTitle}>Search</Text>
            <Text style={styles.headerSubtitle}>Find students, faculty, and communities</Text>
          </Animated.View>

          {/* FIXED: Added transform to move collapsed title lower */}
          <Animated.View style={[
            styles.collapsedHeaderContent, 
            { 
              opacity: collapsedTitleOpacity,
              transform: [{ translateY: collapsedTitleTranslateY }]
            }
          ]}>
            <Text style={styles.collapsedHeaderTitle}>Search</Text>
          </Animated.View>
        </ImageBackground>
      </Animated.View>

      {/* Sticky Search & Categories Section - FIXED: Now uses stickySectionTop */}
      <Animated.View style={[
        styles.stickySection, 
        { top: stickySectionTop }
      ]}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users or communities"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={renderCategoryChip}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      </Animated.View>

      {/* Results List */}
      <View style={styles.resultsContainer}>
        <SectionList
          sections={combinedSections}
          keyExtractor={(item) => item.id}
          renderItem={({ item, section }) => {
            // If this section is communities render community card, otherwise render profile
            if (section && section.key === 'communities') return renderCommunity({ item });
            return renderProfile({ item });
          }}
          renderSectionHeader={({ section: s }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              <Text style={styles.sectionCount}>{s.data.length} results</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>
                {loading ? 'Searching...' : debouncedQuery ? 'No results found' : 'Search for users or communities'}
              </Text>
              {!debouncedQuery && (
                <Text style={styles.emptySubtext}>
                  Try searching by name, username, or community
                </Text>
              )}
            </View>
          )}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          stickySectionHeadersEnabled={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: colors.homeBackground 
  },
  headerContainer: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 10, 
    overflow: 'hidden' 
  },
  headerBackground: { 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerContent: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0 
  },
  headerTitle: { 
    fontSize: 28, 
    fontFamily: fonts.bold, 
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerSubtitle: { 
    fontSize: 16, 
    fontFamily: fonts.normal, 
    color: 'rgba(255,255,255,0.8)', 
    marginTop: 8,
    textAlign: 'center',
  },
  collapsedHeaderContent: { 
    position: 'absolute', 
    top: 0,
    left: 0, 
    right: 0, 
    bottom: 0,
    alignItems: 'center', 
    justifyContent: 'center',
  },
  collapsedHeaderTitle: { 
    fontSize: 20, 
    fontFamily: fonts.bold, 
    color: colors.white 
  },
  stickySection: { 
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20, 
    backgroundColor: colors.homeBackground, 
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  resultsContainer: {
    flex: 1,
    marginTop: 200,
  },
  searchContainer: { 
    paddingHorizontal: 20, 
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    minHeight: 44,
  },
  searchIcon: { 
    marginRight: 8 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16,
    fontFamily: fonts.normal, 
    color: colors.white,
    padding: 0,
    margin: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  categoriesSection: { 
    paddingTop: 6,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 90,
  },
  categoryChipSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.9)',
  },
  categoryChipTextSelected: {
    color: colors.homeBackground,
    fontFamily: fonts.semiBold,
  },
  listContent: { 
    paddingTop: 70,
    paddingBottom: 60,
    flexGrow: 1,
  },
  sectionHeader: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingVertical: 16,
    backgroundColor: colors.homeBackground,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: { 
    fontSize: 18, 
    fontFamily: fonts.bold, 
    color: colors.white 
  },
  sectionCount: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.6)',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minHeight: 80,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    marginRight: 12 
  },
  avatarPlaceholder: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12 
  },
  avatarInitials: { 
    color: colors.white, 
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  profileInfo: { 
    flex: 1, 
    flexShrink: 1, 
    paddingRight: 8 
  },
  profileName: { 
    fontSize: 16, 
    fontFamily: fonts.semiBold, 
    color: colors.white,
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  officialBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  communityDescription: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 6,
    lineHeight: 16,
  },
  communityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.6)',
  },
  communityAvatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12 
  },
  resultActions: { 
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
    minWidth: 80,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    height: 34,
    borderWidth: 1.5,
  },
  followButton: {
    backgroundColor: '#FFA500',
    borderColor: '#FFA500',
  },
  joinButton: {
    backgroundColor: '#FFA500',
    borderColor: '#FFA500',
  },
  removeButton: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  leaveButton: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  hideButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.2)',
    height: 34,
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 13,
  },
  followButtonText: {
    color: colors.white,
  },
  removeButtonText: {
    color: colors.white,
  },
  joinButtonText: {
    color: colors.white,
  },
  leaveButtonText: {
    color: colors.white,
  },
  hideButtonText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 13,
  },
  emptyContainer: { 
    padding: 40, 
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyText: { 
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
});