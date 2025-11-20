// src/screens/faculty/CommunityFeedScreen.js
import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import { useCommunityPosts } from '../../hooks/useCommunityPosts';
import { joinCommunity, leaveCommunity, getCommunityDetails } from '../../lib/supabase';
import PostCard from '../../components/PostCard';

export default function CommunityFeedScreen({ route, navigation }) {
  const { communityId } = route.params;
  const [community, setCommunity] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState('faculty');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user, refreshTrigger } = useContext(UserContext);
  
  // Use the enhanced hook
  const { posts, loading, error, refreshing, onRefresh, forceRefresh, onRefreshRequested } = useCommunityPosts(communityId);
  
  const scrollY = useRef(new Animated.Value(0)).current;

  // Load community details
  useEffect(() => {
    loadCommunityDetails();
  }, [communityId, user?.id]);

  // Enhanced refresh system
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log('🎯 FACULTY SCREEN FOCUSED - FORCING REFRESH');
      forceRefresh();
      loadCommunityDetails();
    });

    // Register for refresh callbacks
    const unsubscribeRefresh = onRefreshRequested(() => {
      console.log('🔄 REFRESH CALLBACK TRIGGERED IN FACULTY SCREEN');
      forceRefresh();
    });

    return () => {
      unsubscribeFocus();
      unsubscribeRefresh();
    };
  }, [navigation, forceRefresh]);

  // Enhanced refresh trigger
  useEffect(() => {
    console.log('🔄 FacultyCommunityFeedScreen: Refresh trigger detected');
    forceRefresh();
  }, [refreshTrigger]);

  const loadCommunityDetails = async () => {
    try {
      if (!user?.id) return;
      
      const { data: communityData, error } = await getCommunityDetails(communityId, user.id);
      
      if (!error && communityData) {
        setCommunity(communityData);
        setIsMember(communityData.isMember);
        setUserRole(communityData.userRole || 'faculty');
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
        Alert.alert('Success', 'You have joined the faculty community!');
      } else {
        Alert.alert('Error', 'Failed to join faculty community. Please try again.');
      }
    } catch (error) {
      console.error('Error joining faculty community:', error);
      Alert.alert('Error', 'Failed to join faculty community. Please try again.');
    }
  };

  const handleLeaveCommunity = async () => {
    try {
      const { error } = await leaveCommunity(communityId, user.id);
      if (!error) {
        setIsMember(false);
        loadCommunityDetails();
        Alert.alert('Success', 'You have left the faculty community.');
      } else {
        Alert.alert('Error', 'Failed to leave faculty community. Please try again.');
      }
    } catch (error) {
      console.error('Error leaving faculty community:', error);
      Alert.alert('Error', 'Failed to leave faculty community. Please try again.');
    }
  };

  // ULTIMATE POST CREATION WITH MULTIPLE REFRESH STRATEGIES
  const handleCreatePost = () => {
    navigation.navigate('FacultyCreateCommunityPost', { 
      communityId,
      communityName: community?.name,
      onPostCreated: () => {
        console.log('💥 FACULTY NUCLEAR REFRESH: Post created callback triggered');
        
        // Multiple refresh strategies
        setTimeout(() => {
          console.log('💥 FACULTY REFRESH 1: Immediate nuclear refresh');
          forceRefresh();
        }, 100);
        
        setTimeout(() => {
          console.log('💥 FACULTY REFRESH 2: Secondary nuclear refresh');
          forceRefresh();
        }, 500);
        
        setTimeout(() => {
          console.log('💥 FACULTY REFRESH 3: Final nuclear refresh');
          forceRefresh();
        }, 1500);
      }
    });
  };

  const handleSearch = () => {
    console.log('Searching faculty posts for:', searchQuery);
  };

  const handleViewMembers = () => {
    navigation.navigate('FacultyCommunityMembers', { communityId });
  };

  // Animation values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 100],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const collapsedTitleOpacity = scrollY.interpolate({
    inputRange: [0, 80, 100],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const renderPostItem = ({ item }) => (
    <PostCard
      post={item}
      userRole={userRole}
      onInteraction={(postId, field, newCount) => {
        console.log(`Faculty Post ${postId} ${field} updated to ${newCount}`);
      }}
    />
  );

  if (!community) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading faculty community...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.headerTitle}>{community.name}</Text>
            <Text style={styles.headerSubtitle}>{community.description}</Text>
            <View style={styles.communityStats}>
              <Text style={styles.statText}>{community.member_count} faculty members</Text>
              <Text style={styles.statDot}>•</Text>
              <Text style={styles.statText}>{community.category}</Text>
              <Text style={styles.statDot}>•</Text>
              <Text style={styles.statText}>{community.privacy}</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.collapsedHeaderContent, { opacity: collapsedTitleOpacity }]}>
            <Text style={styles.collapsedHeaderTitle}>{community.name}</Text>
            <TouchableOpacity 
              style={styles.createPostButton}
              onPress={handleCreatePost}
            >
              <Ionicons name="create-outline" size={20} color={colors.white} />
            </TouchableOpacity>
          </Animated.View>
        </ImageBackground>
      </Animated.View>

      <View style={styles.actionSection}>
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
              <Text style={styles.joinButtonText}>Join Faculty Community</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.membersButton}
            onPress={handleViewMembers}
          >
            <Ionicons name="people-outline" size={18} color={colors.white} />
            <Text style={styles.membersButtonText}>Members</Text>
          </TouchableOpacity>
        </View>
      </View>

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
          />
        }
        ListHeaderComponent={
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.6)" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search posts in this faculty community..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </View>
            
            {posts.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.emptyStateTitle}>No faculty posts yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  {isMember 
                    ? 'Be the first to start a professional discussion!'
                    : 'Join the faculty community to see posts and participate'
                  }
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>Loading faculty posts...</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// KEEP ALL THE SAME STYLES FROM STUDENT VERSION
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
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
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  communityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  statText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statDot: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 8,
  },
  collapsedHeaderContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  collapsedHeaderTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
    flex: 1,
  },
  createPostButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionSection: {
    backgroundColor: colors.homeBackground,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 200,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  membersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  membersButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  postsList: {
    paddingTop: 16,
    paddingBottom: 30,
    minHeight: '100%',
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
    marginBottom: 20,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingState: {
    padding: 40,
    alignItems: 'center',
  },
});