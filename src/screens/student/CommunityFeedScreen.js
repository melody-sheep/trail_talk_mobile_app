import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  RefreshControl,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import { useCommunityPosts } from '../../hooks/useCommunityPosts';
import { joinCommunity, leaveCommunity, getCommunityDetails } from '../../lib/supabase';
import PostCard from '../../components/PostCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CommunityFeedScreen({ route, navigation }) {
  const { communityId } = route.params;
  const [community, setCommunity] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState('student');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const { user, refreshTrigger } = useContext(UserContext);
  
  const { posts, loading, error, refreshing, onRefresh, forceRefresh, onRefreshRequested } = useCommunityPosts(communityId);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchAnimation = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;

  // Load community details
  useEffect(() => {
    loadCommunityDetails();
  }, [communityId, user?.id]);

  // Enhanced refresh system
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log('🎯 SCREEN FOCUSED - FORCING REFRESH');
      forceRefresh();
      loadCommunityDetails();
    });

    const unsubscribeRefresh = onRefreshRequested(() => {
      console.log('🔄 REFRESH CALLBACK TRIGGERED IN SCREEN');
      forceRefresh();
    });

    return () => {
      unsubscribeFocus();
      unsubscribeRefresh();
    };
  }, [navigation, forceRefresh]);

  // Enhanced refresh trigger
  useEffect(() => {
    console.log('🔄 CommunityFeedScreen: Refresh trigger detected');
    forceRefresh();
  }, [refreshTrigger]);

  const loadCommunityDetails = async () => {
    try {
      if (!user?.id) return;
      
      const { data: communityData, error } = await getCommunityDetails(communityId, user.id);
      
      if (!error && communityData) {
        setCommunity(communityData);
        setIsMember(communityData.isMember);
        setUserRole(communityData.userRole || 'student');
      } else {
        console.error('Error loading community details:', error);
      }
    } catch (error) {
      console.error('Error in loadCommunityDetails:', error);
    }
  };

  const handleJoinCommunity = async () => {
    try {
      const { error } = await joinCommunity(communityId, user.id);
      if (!error) {
        setIsMember(true);
        loadCommunityDetails();
        Alert.alert('Success', 'You have joined the community!');
      } else {
        Alert.alert('Error', 'Failed to join community. Please try again.');
      }
    } catch (error) {
      console.error('Error joining community:', error);
      Alert.alert('Error', 'Failed to join community. Please try again.');
    }
  };

  const handleLeaveCommunity = async () => {
    Alert.alert(
      'Leave Community',
      `Are you sure you want to leave ${community?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await leaveCommunity(communityId, user.id);
              if (!error) {
                setIsMember(false);
                loadCommunityDetails();
                Alert.alert('Success', 'You have left the community.');
              } else {
                Alert.alert('Error', 'Failed to leave community. Please try again.');
              }
            } catch (error) {
              console.error('Error leaving community:', error);
              Alert.alert('Error', 'Failed to leave community. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleCreatePost = () => {
    navigation.navigate('CreateCommunityPost', { 
      communityId,
      communityName: community?.name,
      onPostCreated: () => {
        console.log('💥 NUCLEAR REFRESH: Post created callback triggered');
        setTimeout(() => forceRefresh(), 100);
        setTimeout(() => forceRefresh(), 500);
      }
    });
  };

  const handleSearch = () => {
    console.log('Searching posts for:', searchQuery);
  };

  const handleViewMembers = () => {
    navigation.navigate('CommunityMembers', { communityId });
  };

  const toggleSearch = () => {
    Animated.spring(searchAnimation, {
      toValue: showSearch ? 0 : 1,
      useNativeDriver: false,
    }).start();
    setShowSearch(!showSearch);
  };

  // Enhanced animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [220, 100],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const collapsedTitleOpacity = scrollY.interpolate({
    inputRange: [0, 100, 150],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const searchBarTranslateY = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 0],
  });

  const searchBarOpacity = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const renderPostItem = ({ item, index }) => (
    <Animated.View
      style={{
        opacity: scrollY.interpolate({
          inputRange: [
            (index - 1) * 200,
            index * 200,
            (index + 1) * 200
          ],
          outputRange: [0.5, 1, 0.5],
          extrapolate: 'clamp',
        }),
        transform: [
          {
            scale: scrollY.interpolate({
              inputRange: [
                (index - 1) * 200,
                index * 200,
                (index + 1) * 200
              ],
              outputRange: [0.95, 1, 0.95],
              extrapolate: 'clamp',
            }),
          },
        ],
      }}
    >
      <PostCard
        post={item}
        userRole={userRole}
        onInteraction={(postId, field, newCount) => {
          console.log(`Post ${postId} ${field} updated to ${newCount}`);
        }}
      />
    </Animated.View>
  );

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

  if (!community) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
        <View style={styles.loadingContainer}>
          <Animated.View style={styles.loadingAnimation}>
            <Ionicons name="people" size={48} color="#4ECDC4" />
          </Animated.View>
          <Text style={styles.loadingText}>Loading community...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      {/* Animated Search Bar */}
      <Animated.View 
        style={[
          styles.searchBarContainer,
          {
            transform: [{ translateY: searchBarTranslateY }],
            opacity: searchBarOpacity
          }
        ]}
      >
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.6)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts in this community..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus={true}
          />
          <TouchableOpacity onPress={toggleSearch} style={styles.closeSearchButton}>
            <Ionicons name="close" size={22} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Animated Header */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <Animated.View 
          style={[
            styles.headerBackground,
            { opacity: headerBackgroundOpacity }
          ]}
        >
          <ImageBackground 
            source={require('../../../assets/create_post_screen_icons/createpost_header_bg.png')}
            style={styles.headerImageBackground}
            resizeMode="cover"
          >
            <Animated.View style={[styles.headerContent, { opacity: headerTitleOpacity }]}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle}>{community.name}</Text>
                {community.is_featured && <ProfessionalBadge type="featured" size="small" />}
                {community.is_official && <ProfessionalBadge type="official" size="small" />}
              </View>
              <Text style={styles.headerSubtitle}>{community.description}</Text>
              <View style={styles.communityStats}>
                <View style={styles.statItem}>
                  <Ionicons name="people" size={16} color="rgba(255, 255, 255, 0.7)" />
                  <Text style={styles.statText}>{community.member_count} members</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="grid" size={16} color="rgba(255, 255, 255, 0.7)" />
                  <Text style={styles.statText}>{community.category}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name={community.privacy === 'public' ? 'globe' : 'lock-closed'} size={16} color="rgba(255, 255, 255, 0.7)" />
                  <Text style={styles.statText}>{community.privacy}</Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View style={[styles.collapsedHeaderContent, { opacity: collapsedTitleOpacity }]}>
              <View style={styles.collapsedTitleRow}>
                <Text style={styles.collapsedHeaderTitle}>{community.name}</Text>
                <View style={styles.collapsedHeaderActions}>
                  <TouchableOpacity 
                    style={styles.headerActionButton}
                    onPress={toggleSearch}
                  >
                    <Ionicons name="search" size={20} color={colors.white} />
                  </TouchableOpacity>
                  {isMember && (
                    <TouchableOpacity 
                      style={styles.headerActionButton}
                      onPress={handleCreatePost}
                    >
                      <Ionicons name="create-outline" size={20} color={colors.white} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Animated.View>
          </ImageBackground>
        </Animated.View>
      </Animated.View>

      {/* Action Section */}
      <Animated.View 
        style={[
          styles.actionSection,
          {
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [0, 150],
                outputRange: [0, -50],
                extrapolate: 'clamp',
              })
            }]
          }
        ]}
      >
        <View style={styles.actionButtons}>
          {isMember ? (
            <>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleCreatePost}
              >
                <Ionicons name="create-outline" size={20} color={colors.white} />
                <Text style={styles.primaryButtonText}>Create Post</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleLeaveCommunity}
              >
                <Ionicons name="exit-outline" size={18} color="#FF6B6B" />
                <Text style={styles.leaveButtonText}>Leave</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={handleJoinCommunity}
            >
              <Ionicons name="person-add-outline" size={20} color={colors.white} />
              <Text style={styles.joinButtonText}>Join Community</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.membersButton}
            onPress={handleViewMembers}
          >
            <Ionicons name="people-outline" size={18} color={colors.white} />
            <Text style={styles.membersButtonText}>Members</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.searchButton}
            onPress={toggleSearch}
          >
            <Ionicons name="search" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Posts List */}
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.postsList}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.white}
            colors={[colors.white]}
            progressBackgroundColor={colors.homeBackground}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {!showSearch && (
              <View style={styles.quickStats}>
                <View style={styles.quickStatItem}>
                  <Ionicons name="chatbubble" size={16} color="#4ECDC4" />
                  <Text style={styles.quickStatText}>{posts.length} posts</Text>
                </View>
                <View style={styles.quickStatItem}>
                  <Ionicons name="time" size={16} color="#4ECDC4" />
                  <Text style={styles.quickStatText}>
                    {posts.length > 0 ? 'Active now' : 'No activity'}
                  </Text>
                </View>
              </View>
            )}
            
            {posts.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={80} color="rgba(255, 255, 255, 0.2)" />
                <Text style={styles.emptyStateTitle}>No posts yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  {isMember 
                    ? 'Be the first to start a conversation!'
                    : 'Join the community to see posts and participate'
                  }
                </Text>
                {isMember && (
                  <TouchableOpacity 
                    style={styles.emptyStateButton}
                    onPress={handleCreatePost}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.white} />
                    <Text style={styles.emptyStateButtonText}>Create First Post</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingState}>
              <Animated.View style={styles.loadingDot} />
              <Animated.View style={[styles.loadingDot, { animationDelay: '0.2s' }]} />
              <Animated.View style={[styles.loadingDot, { animationDelay: '0.4s' }]} />
              <Text style={styles.loadingText}>Loading posts...</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          posts.length > 0 ? (
            <View style={styles.listFooter}>
              <Text style={styles.listFooterText}>
                {posts.length === 1 ? '1 post' : `${posts.length} posts`} in this community
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.homeBackground,
  },
  loadingAnimation: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  searchBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
    backgroundColor: colors.homeBackground,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  closeSearchButton: {
    padding: 4,
    marginLeft: 8,
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
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerImageBackground: {
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
    paddingHorizontal: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
    marginRight: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  communityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  collapsedHeaderContent: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  collapsedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsedHeaderTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
    flex: 1,
  },
  collapsedHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    letterSpacing: 0.3,
  },
  actionSection: {
    backgroundColor: colors.homeBackground,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 220,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  leaveButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#FF6B6B',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  joinButtonText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  membersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  membersButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  searchButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  postsList: {
    paddingTop: 16,
    paddingBottom: 30,
    minHeight: '100%',
  },
  listHeader: {
    paddingHorizontal: 20,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickStatText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 15,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ECDC4',
    opacity: 0.6,
  },
  listFooter: {
    padding: 20,
    alignItems: 'center',
  },
  listFooterText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
});