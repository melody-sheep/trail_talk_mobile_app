// src/screens/student/CommunityScreen.js
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
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import { 
  getCommunitiesWithUserStatus, 
  joinCommunity, 
  leaveCommunity, 
  canUserCreateCommunity 
} from '../../lib/supabase';

export default function CommunityScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState({});
  const [showFeatured, setShowFeatured] = useState(true);
  const [communities, setCommunities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userCommunityStats, setUserCommunityStats] = useState({
    createdCommunities: 0,
    maxFreeCommunities: 3,
    subscription: 'free',
    isVerifiedCreator: false
  });
  
  const { user, refreshCommunities } = useContext(UserContext);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

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

  // Categories - MATCHING SUPPORTSCREEN STYLE
  const categories = [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'academic', label: 'Academic', icon: 'school-outline' },
    { id: 'social', label: 'Social', icon: 'people-outline' },
    { id: 'support', label: 'Support', icon: 'heart-outline' },
    { id: 'hobbies', label: 'Hobbies', icon: 'game-controller-outline' },
    { id: 'sports', label: 'Sports', icon: 'basketball-outline' }
  ];

  // Quick action buttons - MATCHING SUPPORTSCREEN STYLE
  const quickActions = [
    { 
      id: 'explore', 
      label: 'Explore', 
      icon: 'compass-outline', 
      color: '#4ECDC4',
      action: () => navigation.navigate('CommunityExplore')
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
    }
  }, [activeCategory, user?.id, refreshCommunities]);

  const loadCommunities = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await getCommunitiesWithUserStatus(user.id, activeCategory === 'my' ? 'all' : activeCategory);
      if (!error && data) {
        setCommunities(data);
      } else {
        console.error('Error loading communities:', error);
      }
    } catch (error) {
      console.error('Error in loadCommunities:', error);
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

  const handleCreateCommunity = async () => {
    const { canCreate } = await canUserCreateCommunity(user.id);
    if (!canCreate) {
      alert('You have reached the free community limit (3 communities). Upgrade to premium for unlimited communities.');
      return;
    }
    navigation.navigate('CreateCommunity');
  };

  const handleEditCommunities = () => {
    navigation.navigate('ManageCommunities');
  };

  // REAL JOIN/LEAVE FUNCTIONALITY
  const handleJoinCommunity = async (communityId) => {
    try {
      const { error } = await joinCommunity(communityId, user.id);
      if (!error) {
        loadCommunities();
        loadUserCommunityStats();
      } else {
        console.error('Error joining community:', error);
        alert('Failed to join community. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleJoinCommunity:', error);
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    try {
      const { error } = await leaveCommunity(communityId, user.id);
      if (!error) {
        loadCommunities();
        loadUserCommunityStats();
      } else {
        console.error('Error leaving community:', error);
        alert('Failed to leave community. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleLeaveCommunity:', error);
    }
  };

  // Enhanced permission checking
  const canEditCommunities = user?.role === 'faculty' || user?.organization_role === 'president' || user?.organization_role === 'officer';

  // Professional Badge Component - EXACT COPY FROM SUPPORTSCREEN
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

  // ENHANCED CommunityCreationSection - EXACT COPY FROM SUPPORTSCREEN PATTERN
  const CommunityCreationSection = () => (
    <View style={styles.featuredSection}>
      {/* SINGLE FRAME HEADER with Title + Featured Label + Dropdown */}
      <TouchableOpacity 
        style={styles.featuredHeader}
        onPress={() => setShowFeatured(!showFeatured)}
        activeOpacity={0.7}
      >
        {/* LEFT: Title Text */}
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Membership Plans</Text>
        </View>
        
        {/* RIGHT: Featured Label + Dropdown Icon */}
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

      {/* CONTENT that shows/hides with dropdown */}
      {showFeatured && (
        <View style={styles.featuredContent}>
          {/* Student Free/Basic Plan Card */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleContainer}>
                <Text style={styles.planName}>Free Plan</Text>
                <Text style={styles.planDescription}>
                  Perfect for student clubs and study groups
                </Text>
              </View>
              <View style={[
                styles.communityCount,
                userCommunityStats.createdCommunities >= userCommunityStats.maxFreeCommunities && styles.communityCountFull
              ]}>
                <Text style={styles.countText}>
                  {userCommunityStats.createdCommunities}/{userCommunityStats.maxFreeCommunities}
                </Text>
              </View>
            </View>
            
            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureItem}>Create up to 3 communities</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureItem}>Basic community features</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.planButton,
                userCommunityStats.createdCommunities >= userCommunityStats.maxFreeCommunities && styles.disabledButton
              ]}
              onPress={() => navigation.navigate('CreateCommunity', { tier: 'free' })}
              disabled={userCommunityStats.createdCommunities >= userCommunityStats.maxFreeCommunities}
            >
              <Text style={styles.planButtonText}>
                {userCommunityStats.createdCommunities >= userCommunityStats.maxFreeCommunities ? 'Free Limit Reached' : 'Create Free Community'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Student Premium / Department Plan Card */}
          <View style={[styles.planCard, styles.premiumCard]}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleContainer}>
                <Text style={styles.premiumPlanName}>Premium Plan</Text>
                <Text style={styles.planDescription}>
                  Advanced tools for serious community builders
                </Text>
              </View>
              <ProfessionalBadge type="verified" size="small" />
            </View>
            
            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Unlimited communities</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Verified creator badge</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Priority support</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.premiumButton}
              onPress={() => navigation.navigate('PremiumSubscription')}
            >
              <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
              <Text style={styles.premiumButtonSubtext}>₱99/month or ₱999/year</Text>
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
    const isMember = item.is_member;
    const isAdmin = item.role === 'admin';
    const canJoin = !isMember && item.privacy === 'public';
    
    return (
      <TouchableOpacity 
        style={styles.communityCard}
        onPress={() => navigation.navigate('CommunityDetail', { communityId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconContainer, { backgroundColor: `${item.icon_color || '#4ECDC4'}20` }]}>
            <Ionicons name={item.icon || 'people-outline'} size={20} color={item.icon_color || '#4ECDC4'} />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {/* BADGE HIERARCHY - Single badge per card */}
              {item.is_official && <ProfessionalBadge type="official" size="small" />}
              {!item.is_official && item.is_featured && <ProfessionalBadge type="featured" size="small" />}
              {!item.is_official && !item.is_featured && item.member_count > 50 && <ProfessionalBadge type="popular" size="small" />}
            </View>
            <Text style={styles.cardDescription}>{item.description}</Text>
            <View style={styles.communityMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="people" size={14} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.metaText}>{item.member_count} members</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="lock-closed" size={14} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.metaText}>{item.privacy === 'private' ? 'Private' : 'Public'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.cardActions}>
            {isMember ? (
              <TouchableOpacity 
                style={[styles.joinButton, styles.leaveButton]}
                onPress={() => handleLeaveCommunity(item.id)}
              >
                <Ionicons name="checkmark" size={16} color={colors.white} />
                <Text style={styles.leaveButtonText}>Joined</Text>
              </TouchableOpacity>
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
            <Text style={styles.headerTitle}>Communities</Text>
            <Text style={styles.headerSubtitle}>Connect with like-minded students</Text>
          </Animated.View>

          <Animated.View style={[styles.collapsedHeaderContent, { opacity: collapsedTitleOpacity }]}>
            <Text style={styles.collapsedHeaderTitle}>Communities</Text>
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
              placeholder="Search communities..."
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

        {/* Communities List */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderContent}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  {activeCategory === 'all' && 'All Communities'}
                  {activeCategory === 'academic' && 'Academic Communities'}
                  {activeCategory === 'social' && 'Social Communities'}
                  {activeCategory === 'support' && 'Support Communities'}
                  {activeCategory === 'hobbies' && 'Hobby Communities'}
                  {activeCategory === 'sports' && 'Sports Communities'}
                  {activeCategory === 'my' && 'My Communities'}
                </Text>
                {canEditCommunities && <ProfessionalBadge type="verified" size="small" />}
              </View>
              <Text style={styles.sectionSubtitle}>
                {communities.length} {communities.length === 1 ? 'community' : 'communities'} available
              </Text>
            </View>
          </View>
          
          {communities.length > 0 ? (
            <FlatList
              data={communities}
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
  leaveButtonText: {
    fontSize: 13, // Increased
    fontFamily: fonts.medium,
    color: '#FF6B6B',
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