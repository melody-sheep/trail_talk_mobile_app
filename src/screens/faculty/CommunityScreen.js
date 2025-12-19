// src/screens/faculty/CommunityScreen.js
import React, { useState, useContext, useRef, useEffect } from 'react';
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
  Animated,
  RefreshControl,
  findNodeHandle,
  UIManager,
} from 'react-native';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import { 
  getCommunitiesWithUserStatus, 
  joinCommunity, 
  leaveCommunity, 
  canUserCreateCommunity, 
  supabase
} from '../../lib/supabase';
import { getUserCommunityInvitations, acceptCommunityInvitation, declineCommunityInvitation } from '../../lib/supabase';

export default function CommunityScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState({});
  const [showFeatured, setShowFeatured] = useState(true);
  const [communities, setCommunities] = useState([]);
  const [membersCountMap, setMembersCountMap] = useState({});
  const [userCommunities, setUserCommunities] = useState([]);
  const [otherCommunities, setOtherCommunities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [invProcessing, setInvProcessing] = useState(false);
  const [userCommunityStats, setUserCommunityStats] = useState({
    createdCommunities: 0,
    maxFreeCommunities: 5, // Faculty get more communities
    subscription: 'free',
    isVerifiedCreator: false
  });
  
  const { user, refreshCommunities } = useContext(UserContext);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const allCommunitiesRef = useRef(null);

  // Animation values - ALL ELEMENTS SCROLL UP TOGETHER
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [160, 80],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const collapsedTitleOpacity = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  // ALL sticky elements scroll up together with buffer
  const stickySectionTranslateY = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [0, -40, -40], // All elements move up together
    extrapolate: 'clamp',
  });

  const stickySectionOpacity = scrollY.interpolate({
    inputRange: [0, 60, 80],
    outputRange: [1, 0.8, 0.8], // Slight fade but remain visible
    extrapolate: 'clamp',
  });

  // Categories - FACULTY SPECIFIC
  const categories = [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'academic', label: 'Academic', icon: 'school-outline' },
    { id: 'department', label: 'Department', icon: 'business-outline' },
    { id: 'research', label: 'Research', icon: 'flask-outline' },
    { id: 'faculty', label: 'Faculty', icon: 'people-circle-outline' },
    { id: 'professional', label: 'Professional', icon: 'briefcase-outline' }
  ];

  // Quick action buttons - FACULTY SPECIFIC
  const quickActions = [
    { 
      id: 'explore', 
      label: 'Explore', 
      icon: 'compass-outline', 
      color: '#4ECDC4',
      action: () => scrollToAllCommunities()
    },
    { 
      id: 'create', 
      label: 'Create', 
      icon: 'add-circle-outline', 
      color: '#FFA726',
      action: () => handleCreateCommunity()
    },
    { 
      id: 'my-communities', 
      label: 'My Groups', 
      icon: 'people-circle-outline', 
      color: '#45B7D1',
      action: () => setActiveCategory('my')
    },
    { 
      id: 'featured', 
      label: 'Featured', 
      icon: 'star-outline', 
      color: '#FFD700',
      action: () => scrollToFeatured()
    }
  ];

  // Load communities from database
  useEffect(() => {
    if (user?.id) {
      loadCommunities();
      loadUserCommunityStats();
      loadInvitations();

      // --- Supabase real-time subscription for community_members table ---
      const channel = supabase.channel('community-members-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'community_members',
          },
          (payload) => {
            // Determine affected community id (insert uses new, delete uses old)
            const communityId = payload.new?.community_id || payload.old?.community_id;
            // Wait a short moment to allow RPC to update member_count, then refresh
            setTimeout(() => {
              if (communityId) fetchMemberCount(communityId);
              loadCommunities();
              loadUserCommunityStats();
            }, 350);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeCategory, user?.id, refreshCommunities]);

  const loadInvitations = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await getUserCommunityInvitations(user.id);
      if (!error && data) setInvitations(data);
    } catch (e) {
      console.error('Error loading invitations', e);
    }
  };

  const handleAcceptInvitation = async (invId) => {
    if (!user?.id) return;
    try {
      setInvProcessing(true);
      const { data, error } = await acceptCommunityInvitation(invId, user.id);
      if (error) {
        // If PostgREST returned PGRST116 (no rows) or other error, show a helpful message
        console.error('Accept invitation error', error);
        Alert.alert('Error', 'Failed to accept invitation');
        return;
      }

      // Refresh invitations, communities, and user stats so UI reflects the new membership and member count
      await Promise.all([
        loadInvitations(),
        loadCommunities(),
        loadUserCommunityStats()
      ]);
      Alert.alert('Joined', 'You have joined the community');
    } catch (e) {
      console.error('Accept invitation error', e);
      Alert.alert('Error', 'Failed to accept invitation');
    } finally {
      setInvProcessing(false);
    }
  };

  const handleDeclineInvitation = async (invId) => {
    try {
      setInvProcessing(true);
      const { data, error } = await declineCommunityInvitation(invId);
      if (error) throw error;
      await loadInvitations();
    } catch (e) {
      console.error('Decline invitation error', e);
      Alert.alert('Error', 'Failed to decline invitation');
    } finally {
      setInvProcessing(false);
    }
  };

  const loadCommunities = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await getCommunitiesWithUserStatus(user.id, activeCategory === 'my' ? 'all' : activeCategory);
      if (!error && data) {
        // Normalize flags (backwards compatibility)
        const normalized = data.map(c => ({
          ...c,
          isJoined: c.isJoined || c.is_joined || c.is_member || false
        }));

        if (activeCategory === 'my') {
          const mine = normalized.filter(c => c.isJoined || c.created_by === user.id);
          setUserCommunities(mine);
          setOtherCommunities([]);
          setCommunities(mine);
        } else if (activeCategory === 'all') {
          const mine = normalized.filter(c => c.isJoined || c.created_by === user.id);
          const others = normalized.filter(c => !(c.isJoined || c.created_by === user.id));
          setUserCommunities(mine);
          setOtherCommunities(others);
          setCommunities(normalized);
        } else {
          setUserCommunities([]);
          setOtherCommunities([]);
          setCommunities(normalized);
        }
      } else {
        console.error('Error loading communities:', error);
      }
        // After loading communities, fetch accurate member counts for displayed communities
        try {
          const ids = (data || []).map(c => c.id).filter(Boolean);
          // fetch counts in parallel (limit to first 50 to avoid huge requests)
          const limited = ids.slice(0, 50);
          await Promise.all(limited.map(id => fetchMemberCount(id)));
        } catch (e) {
          console.error('Error fetching member counts after loadCommunities', e);
        }
    } catch (error) {
      console.error('Error in loadCommunities:', error);
    }
  };

  const fetchMemberCount = async (communityId) => {
    try {
      const res = await supabase
        .from('community_members')
        .select('id', { count: 'exact', head: true })
        .eq('community_id', communityId);

      const count = res.count || 0;
      setMembersCountMap(prev => ({ ...prev, [communityId]: count }));
      return count;
    } catch (e) {
      console.error('Error fetching member count for', communityId, e);
      return null;
    }
  };

  const loadUserCommunityStats = async () => {
    if (!user?.id) return;
    
    try {
      const { canCreate, createdCount } = await canUserCreateCommunity(user.id);
      setUserCommunityStats(prev => ({
        ...prev,
        createdCommunities: createdCount,
        canCreate
      }));
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunities();
    await loadUserCommunityStats();
    setRefreshing(false);
  };

  const handleSearch = () => {
    console.log('Searching communities for:', searchQuery);
  };

  const scrollToFeatured = () => {
    scrollViewRef.current?.scrollTo({ y: 300, animated: true });
  };

  const scrollToAllCommunities = () => {
    try {
      const target = allCommunitiesRef.current;
      const scroll = scrollViewRef.current;
      if (!target || !scroll) {
        scrollViewRef.current?.scrollTo({ y: 600, animated: true });
        return;
      }

      const targetHandle = findNodeHandle(target);
      const scrollHandle = findNodeHandle(scroll);

      if (targetHandle && scrollHandle && UIManager && UIManager.measureLayout) {
        UIManager.measureLayout(
          targetHandle,
          scrollHandle,
          (err) => {
            console.warn('measureLayout error:', err);
            scrollViewRef.current?.scrollTo({ y: 600, animated: true });
          },
          (left, top, width, height) => {
            const offset = Math.max(0, top - 90);
            scrollViewRef.current.scrollTo({ y: offset, animated: true });
          }
        );
      } else {
        scrollViewRef.current?.scrollTo({ y: 600, animated: true });
      }
    } catch (e) {
      console.warn('scrollToAllCommunities error', e);
      scrollViewRef.current?.scrollTo({ y: 600, animated: true });
    }
  };

  const handleCreateCommunity = async () => {
    const { canCreate } = await canUserCreateCommunity(user.id);
    if (!canCreate) {
      alert('You have reached the faculty community limit (5 communities). To request more, contact support.');
      return;
    }
    navigation.navigate('FacultyCreateCommunity');
  };

  const handleEditCommunities = () => {
    navigation.navigate('ManageCommunities');
  };

  // REAL JOIN/LEAVE FUNCTIONALITY
  const handleJoinCommunity = async (communityId) => {
    try {
      const { error } = await joinCommunity(communityId, user.id);
      if (!error) {
        await loadCommunities();
        await loadUserCommunityStats();
        return;
      }

      if (error.code === '23505' || (error.message && error.message.toLowerCase().includes('already'))) {
        // Already joined - refresh and proceed
        console.log('User already member of community', communityId);
        await loadCommunities();
        await loadUserCommunityStats();
        return;
      }

      console.error('Error joining community:', error);
      alert('Failed to join community. Please try again.');
    } catch (error) {
      console.error('Error in handleJoinCommunity:', error);
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    try {
      const { error } = await leaveCommunity(communityId, user.id);
      if (!error) {
        await loadCommunities();
        await loadUserCommunityStats();
      } else {
        console.error('Error leaving community:', error);
        alert('Failed to leave community. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleLeaveCommunity:', error);
    }
  };

  // Enhanced permission checking for faculty
  const canEditCommunities = user?.role === 'faculty' || user?.user_type === 'faculty';

  // Professional Badge Component - EXACT COPY FROM STUDENT VERSION WITH FACULTY ADDITION
  const ProfessionalBadge = ({ type, size = 'medium' }) => {
    const badgeConfig = {
      verified: {
        icon: 'shield-checkmark',
        color: '#1877F2',
        label: 'Verified',
        bgColor: 'rgba(24, 119, 242, 0.1)',
        borderColor: '#1877F2'
      },
      official: {
        icon: 'shield-checkmark',
        color: '#4CAF50',
        label: 'Official',
        bgColor: 'rgba(76, 175, 80, 0.1)',
        borderColor: '#4CAF50'
      },
      featured: {
        icon: 'star',
        color: '#FFD700',
        label: 'Featured',
        bgColor: 'rgba(255, 215, 0, 0.1)',
        borderColor: '#FFD700'
      },
      popular: {
        icon: 'trending-up',
        color: '#FF6B6B',
        label: 'Popular',
        bgColor: 'rgba(255, 107, 107, 0.1)',
        borderColor: '#FF6B6B'
      },
      faculty: {
        icon: 'school',
        color: '#9C27B0',
        label: 'Faculty',
        bgColor: 'rgba(156, 39, 176, 0.1)',
        borderColor: '#9C27B0'
      }
    };

    const config = badgeConfig[type];
    const isSmall = size === 'small';
    const iconSize = isSmall ? 14 : 16;
    const fontSize = isSmall ? 10 : 12;
    const padding = isSmall ? 6 : 8;

    return (
      <View style={[
        styles.badgeContainer,
        { 
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          paddingHorizontal: padding,
          paddingVertical: padding - 2,
          borderRadius: 8
        }
      ]}>
        <Ionicons name={config.icon} size={iconSize} color={config.color} />
        <Text style={[
          styles.badgeText, 
          { 
            color: config.color, 
            fontSize: fontSize,
            marginLeft: 4
          }
        ]}>
          {config.label}
        </Text>
      </View>
    );
  };

  // CommunityCreationSection: use student-style Community Options + donation card
  const CommunityCreationSection = () => (
    <View style={styles.featuredSection}>
      <TouchableOpacity 
        style={styles.featuredHeader}
        onPress={() => setShowFeatured(!showFeatured)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Community Options</Text>
        </View>
        <View style={styles.headerRight}>
          <ProfessionalBadge type="featured" size="small" />
          <Ionicons 
            name={showFeatured ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="rgba(255, 255, 255, 0.6)" 
            style={styles.dropdownIcon}
          />
        </View>
      </TouchableOpacity>

      {showFeatured && (
        <View style={styles.featuredContent}>
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleContainer}>
                <Text style={styles.planName}>Make your own Community</Text>
                <Text style={styles.planDescription}>
                  Create and manage communities — unlimited for everyone.
                </Text>
              </View>
            </View>
            
            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureItem}>Create unlimited communities</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureItem}>Essential community management tools</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.planButton}
              onPress={() => navigation.navigate('FacultyCreateCommunity')}
            >
              <Text style={styles.planButtonText}>Create Community</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.planCard, styles.donationCard]}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleContainer}>
                <Text style={styles.premiumPlanName}>Support the Platform & Community</Text>
                <Text style={styles.planDescription}>
                  Help keep the platform running and uplift our community.
                </Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <Ionicons name="heart" size={16} color="#FF6B6B" />
                <Text style={styles.premiumFeatureItem}>One-time or recurring donations</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="receipt" size={16} color="#4ECDC4" />
                <Text style={styles.premiumFeatureItem}>Funds support platform and community programs</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.premiumButton}
              onPress={() => navigation.navigate('DonationSelection')}
            >
              <Text style={styles.premiumButtonText}>Make a Donation</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

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

  const renderQuickAction = ({ item }) => (
    <TouchableOpacity 
      style={[styles.quickActionButton, { backgroundColor: item.color }]}
      onPress={() => item.action()}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={item.icon} 
        size={24} 
        color={colors.white} 
        style={styles.actionIcon}
      />
      <Text style={styles.actionLabel}>{item.label}</Text>
    </TouchableOpacity>
  );

  // ENHANCED Community Card with SupportScreen styling
  const renderCommunityCard = ({ item }) => {
    // prefer explicit icon_color from item, otherwise fall back to canonical category color
    const getCategoryColor = (category) => {
      const map = {
        academic: '#4ECDC4',
        department: '#9C27B0',
        research: '#2196F3',
        faculty: '#FF9800',
        professional: '#607D8B',
        social: '#FFA726',
        support: '#FF6B6B',
        hobbies: '#45B7D1',
        sports: '#FFD700'
      };
      return map[category] || '#4ECDC4';
    };

    const baseColor = item.icon_color || getCategoryColor(item.category);
    const isMember = !!(item.isJoined || item.is_member || item.is_joined || item.isJoined);
    const isAdmin = item.role === 'admin';
    const canJoin = !isMember && item.privacy === 'public';
    
    return (
      <TouchableOpacity 
        style={styles.communityCard}
        onPress={() => navigation.navigate('FacultyCommunityDetail', { communityId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconContainer, { backgroundColor: `${baseColor}20` }]}>
            <Ionicons name={item.icon || 'people-outline'} size={20} color={baseColor} />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {/* BADGE HIERARCHY - Single badge per card */}
              {item.is_official && <ProfessionalBadge type="official" size="small" />}
              {!item.is_official && item.is_featured && <ProfessionalBadge type="featured" size="small" />}
              {!item.is_official && !item.is_featured && item.category === 'faculty' && <ProfessionalBadge type="faculty" size="small" />}
              {!item.is_official && !item.is_featured && item.category !== 'faculty' && item.member_count > 50 && <ProfessionalBadge type="popular" size="small" />}
            </View>
            <Text style={styles.cardDescription}>{item.description}</Text>
            <View style={styles.communityMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="people" size={14} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.metaText}>{(membersCountMap[item.id] ?? item.member_count) || 0} members</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="lock-closed" size={14} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.metaText}>{item.privacy === 'private' ? 'Private' : 'Public'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.cardActions}>
            {isMember ? (
              <View style={{ alignItems: 'flex-end' }}>
                <TouchableOpacity style={styles.joinedButton} disabled>
                  <Ionicons name="checkmark" size={14} color="#00FF00" />
                  <Text style={styles.joinedLabelText}>Joined</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.leaveActionButton]}
                  onPress={() => handleLeaveCommunity(item.id)}
                >
                  <Text style={styles.leaveButtonText}>Leave</Text>
                </TouchableOpacity>
              </View>
            ) : canJoin ? (
              <TouchableOpacity 
                style={styles.joinButton}
                onPress={() => handleJoinCommunity(item.id)}
              >
                <Ionicons name="person-add" size={16} color={colors.white} />
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.joinButton, styles.disabledButton]}
                disabled
              >
                <Ionicons name="lock-closed" size={16} color="rgba(255, 255, 255, 0.5)" />
                <Text style={styles.disabledButtonText}>Private</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      {/* Animated Header Background */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <ImageBackground 
          source={require('../../../assets/create_post_screen_icons/createpost_header_bg.png')}
          style={styles.headerBackground}
          resizeMode="cover"
        >
          <Animated.View style={[styles.headerContent, { opacity: headerTitleOpacity }]}>
            <Text style={styles.headerTitle}>Faculty Communities</Text>
            <Text style={styles.headerSubtitle}>Connect with colleagues and departments</Text>
          </Animated.View>

          <Animated.View style={[styles.collapsedHeaderContent, { opacity: collapsedTitleOpacity }]}>
            <Text style={styles.collapsedHeaderTitle}>Faculty Communities</Text>
            {canEditCommunities && (
              <TouchableOpacity style={styles.editHeaderButton} onPress={handleEditCommunities}>
                <Ionicons name="create-outline" size={16} color={colors.white} />
              </TouchableOpacity>
            )}
          </Animated.View>
        </ImageBackground>
      </Animated.View>

      {/* ALL Sticky Elements Scroll Up Together */}
      <Animated.View style={[
        styles.stickySection, 
        { 
          transform: [{ translateY: stickySectionTranslateY }],
        }
      ]}>
        {/* Search Field */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.6)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search faculty communities, departments..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {canEditCommunities && (
              <TouchableOpacity style={styles.quickEditButton} onPress={handleCreateCommunity}>
                <Ionicons name="add-circle-outline" size={22} color="#4ECDC4" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <FlatList
            data={quickActions}
            renderItem={renderQuickAction}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsList}
          />
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <FlatList
            data={categories}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.white}
            colors={[colors.white]}
          />
        }
      >
        {/* Community Creation Section with Dropdown */}
        <CommunityCreationSection />

        {/* Invitations block follows */}

        {/* Invitations Section */}
        {invitations && invitations.length > 0 && (
          <View style={{ marginHorizontal: 16, marginTop: 8 }}>
            <Text style={{ color: colors.white, fontFamily: fonts.bold, fontSize: 17, marginBottom: 2 }}>Invitations</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 10 }}>{invitations.length} pending</Text>
            {invitations.map(inv => {
              const iconColor = inv.community?.icon_color || '#4ECDC4';
              return (
                <View key={inv.id} style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  padding: 10,
                  marginBottom: 10,
                  minHeight: 0,
                  alignItems: 'stretch',
                  justifyContent: 'flex-start',
                }}>
                  {/* Row: Icon + Name */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: iconColor + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <Ionicons name={inv.community?.icon || 'people-outline'} size={18} color={iconColor} />
                    </View>
                    <Text style={{ color: colors.white, fontFamily: fonts.semiBold, fontSize: 14 }}>{inv.community?.name}</Text>
                  </View>
                  {/* Description */}
                  {inv.community?.description ? (
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 2, marginLeft: 2 }}>{inv.community.description}</Text>
                  ) : null}
                  {/* Invited by */}
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 6, marginLeft: 2 }}>
                    {inv.invited_by_user?.display_name || inv.invited_by_user?.username} invited you
                  </Text>
                  {/* Actions */}
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                    <TouchableOpacity 
                      style={{
                        backgroundColor: '#4CAF50',
                        borderRadius: 8,
                        minWidth: 70,
                        paddingVertical: 6,
                        paddingHorizontal: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 2
                      }}
                      onPress={() => handleAcceptInvitation(inv.id)} 
                      disabled={invProcessing}
                    >
                      <Text style={{ color: colors.white, fontFamily: fonts.bold, fontSize: 13, textAlign: 'center' }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={{
                        backgroundColor: '#FF6B6B',
                        borderRadius: 8,
                        minWidth: 70,
                        paddingVertical: 6,
                        paddingHorizontal: 14,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onPress={() => handleDeclineInvitation(inv.id)} 
                      disabled={invProcessing}
                    >
                      <Text style={{ color: colors.white, fontFamily: fonts.bold, fontSize: 13, textAlign: 'center' }}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        
        {/* Communities List */} 
        <View style={styles.contentSection}>
          {/* My Communities (when applicable) */}
          { (activeCategory === 'all' || activeCategory === 'my') && (
            <View>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>{activeCategory === 'my' ? 'My Communities' : 'My Communities'}</Text>
                    {canEditCommunities && <ProfessionalBadge type="faculty" size="small" />}
                  </View>
                  <Text style={styles.sectionSubtitle}>
                    {userCommunities.length} {userCommunities.length === 1 ? 'community' : 'communities'}
                  </Text>
                </View>
              </View>

              {userCommunities.length > 0 ? (
                <FlatList
                  data={userCommunities}
                  renderItem={renderCommunityCard}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : activeCategory === 'my' ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
                  <Text style={styles.emptyStateTitle}>No communities found</Text>
                  <Text style={styles.emptyStateText}>You haven't joined or created any communities yet.</Text>
                  <TouchableOpacity 
                    style={styles.emptyStateButton}
                    onPress={() => setActiveCategory('all')}
                  >
                    <Text style={styles.emptyStateButtonText}>Browse All Communities</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}

          {/* All / Other Communities */}
          { (activeCategory === 'all' || activeCategory !== 'my') && (
            <View ref={allCommunitiesRef}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>
                      {activeCategory === 'all' ? 'All Communities' : (
                        activeCategory === 'academic' && 'Academic Communities' ||
                        activeCategory === 'department' && 'Department Communities' ||
                        activeCategory === 'research' && 'Research Communities' ||
                        activeCategory === 'faculty' && 'Faculty Communities' ||
                        activeCategory === 'professional' && 'Professional Communities' ||
                        'Communities'
                      )}
                    </Text>
                    {canEditCommunities && <ProfessionalBadge type="faculty" size="small" />}
                  </View>
                  <Text style={styles.sectionSubtitle}>
                    { (activeCategory === 'all' ? (otherCommunities.length + userCommunities.length) : communities.length) } {(activeCategory === 'all' ? (otherCommunities.length + userCommunities.length) : communities.length) === 1 ? 'community' : 'communities'} available
                  </Text>
                </View>
              </View>

              { (activeCategory === 'all' ? otherCommunities : communities).length > 0 ? (
                <FlatList
                  data={activeCategory === 'all' ? otherCommunities : communities}
                  renderItem={renderCommunityCard}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
                  <Text style={styles.emptyStateTitle}>No communities found</Text>
                  <Text style={styles.emptyStateText}>
                    {activeCategory === 'my' 
                      ? "You haven't joined any communities yet."
                      : "No communities match your search criteria."
                    }
                  </Text>
                  <TouchableOpacity 
                    style={styles.emptyStateButton}
                    onPress={() => setActiveCategory('all')}
                  >
                    <Text style={styles.emptyStateButtonText}>Browse All Communities</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    color: colors.white,
    textAlign: 'center',
  },
  editHeaderButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // ALL STICKY ELEMENTS TOGETHER
  stickySection: {
    position: 'absolute',
    top: 140, // Reduced from 160 - closer to header
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.homeBackground,
    paddingBottom: 8,
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
    marginTop: 180, // Reduced to account for smaller sticky section
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 100, // Reduced to account for scrolling sticky section
    paddingBottom: 20,
  },
  // ENHANCED Badge Styles
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    letterSpacing: 0.3,
    fontSize: 11,
  },
  // LARGER Search Field
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 4, // Reduced top margin
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10, // Increased padding
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    minHeight: 46, // Increased height
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15, // Slightly larger
    fontFamily: fonts.normal,
    color: colors.white,
    padding: 0,
    includeFontPadding: false,
  },
  quickEditButton: {
    padding: 4,
    marginLeft: 8,
  },
  // LARGER Quick Actions
  quickActionsSection: {
    marginBottom: 10,
  },
  quickActionsList: {
    paddingHorizontal: 16,
    gap: 10, // Increased gap
  },
  quickActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12, // Increased
    paddingHorizontal: 14, // Increased
    borderRadius: 12,
    minWidth: 95, // Increased
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionIcon: {
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 13, // Larger
    fontFamily: fonts.medium,
    color: colors.white,
    textAlign: 'center',
  },
  // LARGER Categories
  categoriesSection: {
    paddingTop: 4,
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  categoriesList: {
    gap: 8, // Increased gap
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16, // Increased
    paddingVertical: 8, // Increased
    minWidth: 95, // Increased
  },
  categoryChipSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 13, // Larger
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.9)',
  },
  categoryChipTextSelected: {
    color: colors.homeBackground,
    fontFamily: fonts.semiBold,
  },
  // Featured Section
  featuredSection: {
    marginHorizontal: 16,
    marginTop: 60,
    marginBottom: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16, // Slightly increased
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17, // Slightly larger
    fontFamily: fonts.bold,
    color: colors.white,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownIcon: {
    marginLeft: 4,
  },
  featuredContent: {
    paddingHorizontal: 16, // Slightly increased
    paddingBottom: 16,
    paddingTop: 12,
  },
  // LARGER Plan Cards
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16, // Increased
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12, // Increased
  },
  premiumCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  donationCard: {
    backgroundColor: 'rgba(78, 205, 196, 0.06)',
    borderColor: 'rgba(78, 205, 196, 0.12)'
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12, // Increased
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 16, // Increased
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  premiumPlanName: {
    fontSize: 16, // Increased
    fontFamily: fonts.bold,
    color: '#FFD700',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 13, // Increased
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18, // Increased
  },
  communityCount: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 10, // Increased
    paddingVertical: 6, // Increased
    borderRadius: 10,
  },
  communityCountFull: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  countText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#4CAF50',
  },
  featuresList: {
    marginBottom: 14, // Increased
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Increased
  },
  featureItem: {
    fontSize: 13, // Increased
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8, // Increased
    lineHeight: 18, // Increased
  },
  premiumFeatureItem: {
    fontSize: 13, // Increased
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8, // Increased
    lineHeight: 18, // Increased
  },
  planButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 12, // Increased
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  planButtonText: {
    fontSize: 14, // Increased
    fontFamily: fonts.bold,
    color: colors.white,
  },
  premiumButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12, // Increased
    borderRadius: 10,
    alignItems: 'center',
  },
  premiumButtonText: {
    fontSize: 14, // Increased
    fontFamily: fonts.bold,
    color: '#000',
  },
  premiumButtonSubtext: {
    fontSize: 12, // Increased
    fontFamily: fonts.normal,
    color: 'rgba(0, 0, 0, 0.7)',
    marginTop: 2,
  },
  // Content Section
  contentSection: {
    marginBottom: 18,
    marginTop: 4, // Reduced margin top
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderContent: {
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 8, // Reduced
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'left',
    marginLeft: 0,
    marginTop: 2, // Reduced margin top
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  // LARGER Community Cards
  communityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: 16,
    marginBottom: 10, // Increased
    padding: 14, // Increased
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    minHeight: 80, // Increased
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIconContainer: {
    width: 40, // Increased
    height: 40, // Increased
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12, // Increased
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6, // Increased
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 15, // Increased
    fontFamily: fonts.bold,
    color: colors.white,
  },
  cardDescription: {
    fontSize: 13, // Increased
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18, // Increased
    marginBottom: 6, // Increased
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
    fontSize: 12, // Increased
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  cardActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  // LARGER Join Buttons
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14, // Increased
    paddingVertical: 10, // Increased
    borderRadius: 10,
    gap: 6,
    minWidth: 70, // Increased
    justifyContent: 'center',
  },
  joinedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    minWidth: 70,
    justifyContent: 'center',
    marginBottom: 8,
  },
  leaveActionButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF6B6B'
  },
  leaveButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  joinButtonText: {
    fontSize: 13, // Increased
    fontFamily: fonts.medium,
    color: colors.white,
  },
  joinedLabelText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#00FF00',
  },
  leaveButtonText: {
    fontSize: 13, // Increased
    fontFamily: fonts.medium,
    color: colors.white,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  disabledButtonText: {
    fontSize: 13, // Increased
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptyStateButtonText: {
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  bottomSpacer: {
    height: 18,
  },
});