import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Image, ScrollView, Animated, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { supabase } from '../../lib/supabase';
import PostCard from '../../components/PostCard';
import { UserContext } from '../../contexts/UserContext';
import { followUser, unfollowUser, getFollowCounts, checkIsFollowing } from '../../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

export default function ViewProfileScreen({ route, navigation }) {
  const { user: currentUser } = useContext(UserContext);
  const viewedUserId = route?.params?.userId;
  const [activeTab, setActiveTab] = useState('Post');
  const tabs = ['Post', 'Communities'];
  const tabWidth = screenWidth / tabs.length;
  const vectorWidth = 80;
  const animation = useRef(new Animated.Value(0)).current;
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [birthday, setBirthday] = useState('Not set');
  const [joinDate, setJoinDate] = useState('');

  // Fetch all data when component mounts or viewedUserId changes
  useEffect(() => {
    if (viewedUserId) {
      fetchProfile();
      fetchPosts();
      fetchCommunities();
      fetchFollowCounts();
      checkFollowingStatus();
    }
  }, [viewedUserId]);

  // Auto-refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (viewedUserId) {
        console.log('ViewProfileScreen focused - refreshing data');
        fetchProfile();
        fetchPosts();
        fetchCommunities();
        fetchFollowCounts();
        checkFollowingStatus();
      }
    }, [viewedUserId])
  );

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('profiles').select('*').eq('id', viewedUserId).single();
      if (data) {
        setProfileData(data);
        
        // Format birthday if exists - MM/DD/YYYY format like ProfileScreen
        if (data.birthday) {
          const birthDate = new Date(data.birthday);
          const formattedBirthday = birthDate.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
          });
          setBirthday(formattedBirthday);
        } else {
          setBirthday('Not set');
        }

        // Format join date
        if (data.created_at) {
          const joinDate = new Date(data.created_at);
          setJoinDate(joinDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }));
        }
      }
    } catch (e) {
      console.log('Error fetching profile', e);
    } finally { 
      setLoading(false); 
    }
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      const { data } = await supabase.from('posts').select('*').eq('author_id', viewedUserId).order('created_at', { ascending: false });
      setUserPosts(data || []);
    } catch (e) {
      console.log('Error fetching user posts', e);
      setUserPosts([]);
    } finally { 
      setPostsLoading(false); 
    }
  };

  const fetchCommunities = async () => {
    try {
      const { data } = await supabase.from('community_members').select('communities(*)').eq('user_id', viewedUserId);
      setUserCommunities((data || []).map(r => r.communities));
    } catch (e) {
      console.log('Error fetching user communities', e);
      setUserCommunities([]);
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const counts = await getFollowCounts(viewedUserId);
      setFollowersCount(counts.followers || 0);
      setFollowingCount(counts.following || 0);
    } catch (e) { 
      console.log('Error fetching follow counts', e);
      setFollowersCount(0);
      setFollowingCount(0);
    }
  };

  const checkFollowingStatus = async () => {
    if (!currentUser) return;
    try {
      const following = await checkIsFollowing(currentUser.id, viewedUserId);
      setIsFollowing(following);
    } catch (e) {
      setIsFollowing(false);
      console.log('Error checking following status', e);
    }
  };

  const onFollowPress = async () => {
    if (!currentUser) return;
    try {
      if (isFollowing) {
        const { error } = await unfollowUser(currentUser.id, viewedUserId);
        if (!error) {
          setIsFollowing(false);
          setFollowersCount(c => Math.max(0, c - 1));
        } else {
          console.log('Unfollow error:', error);
        }
      } else {
        const { error } = await followUser(currentUser.id, viewedUserId);
        if (!error) {
          setIsFollowing(true);
          setFollowersCount(c => c + 1);
        } else {
          console.log('Follow error:', error);
        }
      }
    } catch (e) {
      console.log('Error toggling follow', e);
    }
  };

  const renderPostItem = ({ item }) => (
    <PostCard post={item} userRole="student" />
  );

  const handleTabPress = (tab, index) => {
    setActiveTab(tab);
    Animated.timing(animation, {
      toValue: index,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const translateX = animation.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, index) => (tabWidth * index) + (tabWidth - vectorWidth) / 2),
  });

  if (loading) return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={require('../../../assets/profile_page_icons/back_button.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Details Section */}
        <View style={styles.profileDetails}>
          {/* Cover Image */}
          <Image 
            source={ 
              profileData?.cover_url 
                ? { uri: profileData.cover_url }
                : require('../../../assets/profile_page_icons/profile_default_bg.png')
            } 
            style={styles.coverImage} 
          />
          
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <Image 
              source={ 
                profileData?.avatar_url 
                  ? { uri: profileData.avatar_url }
                  : require('../../../assets/profile_page_icons/default_profile_icon.png')
              } 
              style={styles.profileImage} 
            />
          </View>

          {/* Follow Button Row */}
          {currentUser && currentUser.id !== viewedUserId && (
            <View style={styles.followButtonRow}>
              <TouchableOpacity 
                style={[
                  styles.followButton, 
                  { paddingHorizontal: 20 },
                  isFollowing ? styles.unfollowButton : styles.followButtonStyle
                ]} 
                onPress={onFollowPress}
              >
                <Text style={styles.followButtonText}>
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Name and Role Row */}
          <View style={styles.nameRow}>
            <Text style={styles.userName}>
              {profileData?.display_name || profileData?.username || 'User'}
            </Text>
            <View style={styles.roleFrame}>
              <Image 
                source={
                  profileData?.role === 'faculty' 
                    ? require('../../../assets/post_card_icons/faculty_icon.png')
                    : require('../../../assets/post_card_icons/student_icon.png')
                }
                style={styles.roleIcon}
              />
              <Text style={styles.userRole}>{profileData?.role || 'User'}</Text>
            </View>
          </View>

          {/* Birthday and Join Date Row */}
          <View style={styles.infoRow}>
            <View style={[styles.infoItem, styles.birthdayItem]}>
              <Image 
                source={require('../../../assets/profile_page_icons/birthday_icon.png')}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>{birthday}</Text>
            </View>
            
            <View style={[styles.infoItem, styles.calendarItem]}>
              <Image 
                source={require('../../../assets/profile_page_icons/calendar_icon.png')}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>Joined {joinDate}</Text>
            </View>
          </View>

          {/* Following and Followers Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statItem, styles.followingItem]}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            
            <View style={[styles.statItem, styles.followersItem]}>
              <Text style={styles.statNumber}>{followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>
        </View>

        {/* Sticky Tabs */}
        <View style={styles.stickyTabsWrapper}>
          <View style={styles.tabsContainer}>
            {tabs.map((tab, index) => (
              <TouchableOpacity 
                key={tab} 
                style={styles.tab} 
                onPress={() => handleTabPress(tab, index)}
              >
                <Text style={[
                  styles.tabText, 
                  activeTab === tab ? styles.tabTextActive : styles.tabTextInactive
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}

            <Animated.View style={[styles.horizontalVector, { transform: [{ translateX }] }]}> 
              <Image 
                source={require('../../../assets/profile_page_icons/horizontal_scroll_vector.png')} 
                style={styles.vectorImage} 
              />
            </Animated.View>
          </View>
          <View style={styles.tabsBottomBorder} />
        </View>

        {/* Posts/Communities Content */}
        <View style={styles.postsContent}>
          {activeTab === 'Post' && (
            postsLoading ? (
              <View style={styles.loadingPostsContainer}>
                <Text style={styles.loadingText}>Loading posts...</Text>
              </View>
            ) : userPosts.length > 0 ? (
              <FlatList 
                data={userPosts} 
                renderItem={renderPostItem} 
                keyExtractor={(item) => item.id} 
                scrollEnabled={false} 
              />
            ) : (
              <View style={styles.noPostsContainer}>
                <Text style={styles.noPostsText}>No posts yet</Text>
                <Text style={styles.noPostsSubtext}>This user hasn't posted anything yet</Text>
              </View>
            )
          )}

          {activeTab === 'Communities' && (
            <View style={{ padding: 20 }}>
              {userCommunities.length > 0 ? userCommunities.map(c => (
                <View key={c.id} style={styles.communityRow}>
                  <Text style={styles.communityName}>{c.name}</Text>
                  <Text style={styles.communityMeta}>{c.member_count || 0} members</Text>
                </View>
              )) : (
                <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                  Not a member of any communities
                </Text>
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
    backgroundColor: colors.homeBackground 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    backgroundColor: colors.homeBackground 
  },
  backButton: { 
    padding: 8 
  },
  backIcon: { 
    width: 20, 
    height: 22, 
    resizeMode: 'contain', 
    tintColor: colors.white 
  },
  headerTitle: { 
    fontSize: 18, 
    fontFamily: fonts.semiBold, 
    color: colors.white 
  },
  container: { 
    flex: 1, 
    backgroundColor: colors.homeBackground 
  },
  profileDetails: { 
    marginBottom: 0 
  },
  coverImage: { 
    width: '100%', 
    height: 160, 
    resizeMode: 'cover' 
  },
  profileImageContainer: { 
    position: 'absolute', 
    top: 70, 
    left: 20 
  },
  profileImage: { 
    width: 120, 
    height: 120, 
    borderRadius: 70, 
    borderWidth: 4, 
    borderColor: colors.homeBackground 
  },
  // Follow Button Styles
  followButtonRow: {
    marginTop: 10,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  followButtonStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  unfollowButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  followButtonText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginTop: 0,
    marginBottom: 15,
  },
  userName: {
    fontSize: 25,
    fontFamily: fonts.bold,
    color: colors.white,
    marginRight: 12,
  },
  roleFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  roleIcon: {
    width: 12,
    height: 12,
    resizeMode: 'contain',
    tintColor: '#4CAF50',
    marginRight: 6,
  },
  userRole: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#4CAF50',
    textTransform: 'capitalize',
  },
  // Birthday and Join Date Row
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  birthdayItem: {
    marginLeft: 0,
    marginRight: 'auto',
  },
  calendarItem: {
    marginLeft: 'auto',
    marginRight: 10,
  },
  infoIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
    tintColor: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Following and Followers Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followingItem: {
    marginLeft: 0,
    marginRight: 'auto',
  },
  followersItem: {
    marginLeft: 'auto',
    marginRight: 128,
  },
  statNumber: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginRight: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  stickyTabsWrapper: { 
    backgroundColor: colors.homeBackground, 
    marginBottom: 1 
  },
  tabsContainer: { 
    flexDirection: 'row', 
    position: 'relative' 
  },
  tab: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 12 
  },
  tabText: { 
    fontSize: 16, 
    fontFamily: fonts.semiBold 
  },
  tabTextActive: { 
    color: colors.tabActive 
  },
  tabTextInactive: { 
    color: colors.tabInactive 
  },
  tabsBottomBorder: { 
    height: 0.5, 
    backgroundColor: '#434343', 
    width: '100%' 
  },
  postsContent: { 
    backgroundColor: colors.homeBackground, 
    minHeight: 200 
  },
  loadingPostsContainer: { 
    padding: 40, 
    alignItems: 'center' 
  },
  noPostsContainer: { 
    padding: 40, 
    alignItems: 'center' 
  },
  noPostsText: { 
    fontSize: 16, 
    fontFamily: fonts.medium, 
    color: colors.white,
    marginBottom: 8,
  },
  noPostsSubtext: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  communityRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 12 
  },
  communityName: { 
    fontSize: 16, 
    fontFamily: fonts.medium, 
    color: colors.white 
  },
  communityMeta: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.6)' 
  },
  bottomSpacer: { 
    height: 30 
  },
  horizontalVector: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  vectorImage: {
    width: 80,
    height: 6,
    resizeMode: 'contain',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.homeBackground,
  },
  loadingText: {
    fontSize: 16,
    color: colors.white,
    fontFamily: fonts.normal,
  },
});