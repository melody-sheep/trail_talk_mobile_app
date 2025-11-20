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
    maxFreeCommunities: 5, // Faculty get more communities
    subscription: 'free',
    isVerifiedCreator: false
  });
  
  const { user, refreshCommunities } = useContext(UserContext);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  // Animation values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [160, 80],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const collapsedTitleOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const searchSectionTranslateY = scrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });

  const categories = [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'academic', label: 'Academic', icon: 'school-outline' },
    { id: 'department', label: 'Department', icon: 'business-outline' },
    { id: 'research', label: 'Research', icon: 'flask-outline' },
    { id: 'faculty', label: 'Faculty', icon: 'people-circle-outline' },
    { id: 'professional', label: 'Professional', icon: 'briefcase-outline' }
  ];

  // Quick action buttons - Faculty specific
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
      alert('You have reached the faculty community limit (5 communities).');
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

  // Enhanced permission checking for faculty
  const canEditCommunities = user?.role === 'faculty' || user?.user_type === 'faculty';

  // Professional Badge Component
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

  // ENHANCED CommunityCreationSection with SINGLE FRAME LAYOUT
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
          <Text style={styles.headerTitle}>Faculty Community Plans</Text>
        </View>
        
        {/* RIGHT: Featured Label + Dropdown Icon */}
        <View style={styles.headerRight}>
          <ProfessionalBadge type="faculty" size="medium" />
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
          {/* Faculty Plan Card */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleContainer}>
                <Text style={styles.planName}>Faculty Plan</Text>
                <Text style={styles.planDescription}>
                  Enhanced tools for faculty collaboration and department groups
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
                <Text style={styles.featureItem}>Create up to 5 communities</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureItem}>Faculty verification badge</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureItem}>Up to 200 members each</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureItem}>Advanced moderation tools</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureItem}>Department collaboration features</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.planButton,
                userCommunityStats.createdCommunities >= userCommunityStats.maxFreeCommunities && styles.disabledButton
              ]}
              onPress={() => navigation.navigate('FacultyCreateCommunity', { tier: 'faculty' })}
              disabled={userCommunityStats.createdCommunities >= userCommunityStats.maxFreeCommunities}
            >
              <Text style={styles.planButtonText}>
                {userCommunityStats.createdCommunities >= userCommunityStats.maxFreeCommunities ? 'Faculty Limit Reached' : 'Create Faculty Community'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Premium Plan Card */}
          <View style={[styles.planCard, styles.premiumCard]}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleContainer}>
                <Text style={styles.premiumPlanName}>Premium Plan</Text>
                <Text style={styles.planDescription}>
                  Advanced tools for institutional community builders
                </Text>
              </View>
              <ProfessionalBadge type="verified" size="medium" />
            </View>
            
            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Unlimited communities</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Verified faculty badge</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Advanced analytics</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Priority support</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Custom branding</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Unlimited members</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.premiumButton}
              onPress={() => navigation.navigate('PremiumSubscription')}
            >
              <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
              <Text style={styles.premiumButtonSubtext}>₱199/month or ₱1999/year</Text>
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

  // Community Card with REAL DATA
  const renderCommunityCard = ({ item }) => {
    const isExpanded = expandedItems[item.id];
    const isJoined = item.isJoined;
    
    const categoryConfig = {
      academic: { icon: 'school-outline', color: '#4ECDC4' },
      department: { icon: 'business-outline', color: '#9C27B0' },
      research: { icon: 'flask-outline', color: '#2196F3' },
      faculty: { icon: 'people-circle-outline', color: '#FF9800' },
      professional: { icon: 'briefcase-outline', color: '#607D8B' },
      social: { icon: 'people-outline', color: '#FFA726' },
      support: { icon: 'heart-outline', color: '#FF6B6B' },
      hobbies: { icon: 'game-controller-outline', color: '#45B7D1' },
      sports: { icon: 'basketball-outline', color: '#FFD700' }
    };
    
    const config = categoryConfig[item.category] || { icon: 'people-outline', color: '#4ECDC4' };

    return (
      <TouchableOpacity 
        style={styles.communityCard}
        onPress={() => toggleExpand(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconContainer, { backgroundColor: `${config.color}20` }]}>
            <Ionicons name={config.icon} size={20} color={config.color} />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.is_featured && <ProfessionalBadge type="featured" size="small" />}
              {item.is_official && <ProfessionalBadge type="official" size="small" />}
              {item.category === 'faculty' && <ProfessionalBadge type="faculty" size="small" />}
            </View>
            <Text style={styles.cardDescription}>{item.description}</Text>
            <View style={styles.communityStats}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={14} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.statText}>{item.member_count} members</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={14} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.statText}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.cardActions}>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="rgba(255, 255, 255, 0.6)" 
            />
            <TouchableOpacity 
              style={[
                styles.joinButton,
                isJoined && styles.joinedButton
              ]}
              onPress={(e) => {
                e.stopPropagation();
                if (isJoined) {
                  handleLeaveCommunity(item.id);
                } else {
                  handleJoinCommunity(item.id);
                }
              }}
            >
              <Text style={[
                styles.joinButtonText,
                isJoined && styles.joinedButtonText
              ]}>
                {isJoined ? 'Joined' : 'Join'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.expandedDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="business-outline" size={16} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.detailText}>Category: {item.category}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="lock-closed-outline" size={16} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.detailText}>Privacy: {item.privacy}</Text>
              </View>
              {item.rules && (
                <View style={styles.detailRow}>
                  <Ionicons name="document-text-outline" size={16} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={styles.detailText}>Rules: {item.rules}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.viewCommunityButton}
              onPress={() => navigation.navigate('FacultyCommunityDetail', { communityId: item.id })}
            >
              <Text style={styles.viewCommunityText}>View Community</Text>
              <Ionicons name="arrow-forward" size={16} color="#4ECDC4" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // Filter communities based on active category
  const filteredCommunities = communities.filter(community => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'my') return community.isJoined;
    return community.category === activeCategory;
  });

  const featuredCommunities = communities.filter(community => community.is_featured);
  const myCommunities = communities.filter(community => community.isJoined);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
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

      <Animated.View style={[styles.stickySection, { transform: [{ translateY: searchSectionTranslateY }] }]}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.6)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for faculty communities, departments..."
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
        {/* Community Creation Section with Enhanced Single Frame Layout */}
        <CommunityCreationSection />

        <View style={styles.quickActionsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            {canEditCommunities && (
              <TouchableOpacity style={styles.manageButton} onPress={handleEditCommunities}>
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={quickActions}
            renderItem={renderQuickAction}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsList}
          />
        </View>

        {myCommunities.length > 0 && (
          <View style={styles.contentSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderContent}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>My Faculty Communities</Text>
                  <ProfessionalBadge type="faculty" size="small" />
                </View>
                <Text style={styles.sectionSubtitle}>
                  {myCommunities.length} communities you've joined
                </Text>
              </View>
            </View>
            
            <FlatList
              data={myCommunities}
              renderItem={renderCommunityCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {featuredCommunities.length > 0 && (
          <View style={styles.contentSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderContent}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Featured Faculty Communities</Text>
                  <ProfessionalBadge type="featured" size="small" />
                </View>
                <Text style={styles.sectionSubtitle}>
                  Popular and recommended faculty communities
                </Text>
              </View>
            </View>
            
            <FlatList
              data={featuredCommunities}
              renderItem={renderCommunityCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderContent}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  {activeCategory === 'all' && 'All Faculty Communities'}
                  {activeCategory === 'academic' && 'Academic Communities'}
                  {activeCategory === 'department' && 'Department Communities'}
                  {activeCategory === 'research' && 'Research Communities'}
                  {activeCategory === 'faculty' && 'Faculty Communities'}
                  {activeCategory === 'professional' && 'Professional Communities'}
                  {activeCategory === 'my' && 'My Communities'}
                </Text>
                <Text style={styles.sectionCount}>
                  {filteredCommunities.length} communities
                </Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                {activeCategory === 'my' 
                  ? 'Communities you are a member of' 
                  : 'Browse all available faculty communities'
                }
              </Text>
            </View>
          </View>
          
          {filteredCommunities.length > 0 ? (
            <FlatList
              data={filteredCommunities}
              renderItem={renderCommunityCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.emptyStateText}>
              {activeCategory === 'my' 
                ? "You haven't joined any faculty communities yet. Explore and join some!"
                : 'No faculty communities found in this category.'
              }
            </Text>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ... KEEP ALL THE SAME STYLES FROM STUDENT VERSION ...
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
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  collapsedHeaderContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  collapsedHeaderTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  editHeaderButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stickySection: {
    position: 'absolute',
    top: 160,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.homeBackground,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
    marginTop: 160,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 140,
    paddingBottom: 30,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    letterSpacing: 0.3,
  },
  // NEW: Enhanced Featured Section Styles
  featuredSection: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownIcon: {
    marginLeft: 4,
  },
  featuredContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  premiumCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 6,
  },
  premiumPlanName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#FFD700',
    marginBottom: 6,
  },
  planDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  communityCount: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  communityCountFull: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  countText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#4CAF50',
  },
  featuresList: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureItem: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    lineHeight: 18,
  },
  premiumFeatureItem: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
    lineHeight: 18,
  },
  planButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  planButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  premiumButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  premiumButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#000',
  },
  premiumButtonSubtext: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(0, 0, 0, 0.7)',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
    padding: 0,
  },
  quickEditButton: {
    padding: 4,
    marginLeft: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  manageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  manageButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#4ECDC4',
  },
  quickActionsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  sectionCount: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  quickActionsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
    textAlign: 'center',
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  categoriesList: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
  },
  categoryChipSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  categoryChipTextSelected: {
    color: colors.homeBackground,
    fontFamily: fonts.semiBold,
  },
  contentSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionHeaderContent: {
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    fontStyle: 'italic',
  },
  communityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
    marginBottom: 8,
  },
  communityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  cardActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  joinButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 70,
    alignItems: 'center',
  },
  joinedButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  joinButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  joinedButtonText: {
    color: colors.white,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  expandedDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  viewCommunityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  viewCommunityText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#4ECDC4',
  },
  bottomSpacer: {
    height: 30,
  },
});