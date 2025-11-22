import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Image, ScrollView, Animated, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { supabase } from '../../lib/supabase';
import PostCard from '../../components/PostCard';
import { UserContext } from '../../contexts/UserContext';
import { followUser, unfollowUser, getFollowCounts } from '../../utils/followingUtils';

const { width: screenWidth } = Dimensions.get('window');

export default function ViewProfileScreen({ route, navigation }) {
  const { user: currentUser } = useContext(UserContext);
  const viewedUserId = route?.params?.userId;
  const [activeTab, setActiveTab] = useState('Posts');
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    if (viewedUserId) {
      fetchProfile();
      fetchPosts();
      fetchCommunities();
      fetchFollowCounts();
      checkFollowingStatus();
    }
  }, [viewedUserId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('profiles').select('*').eq('id', viewedUserId).single();
      if (data) setProfileData(data);
    } catch (e) {
      console.log('Error fetching profile', e);
    } finally { setLoading(false); }
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      const { data } = await supabase.from('posts').select('*').eq('author_id', viewedUserId).order('created_at', { ascending: false });
      setUserPosts(data || []);
    } catch (e) {
      console.log('Error fetching user posts', e);
      setUserPosts([]);
    } finally { setPostsLoading(false); }
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
    } catch (e) { console.log('Error fetching follow counts', e); }
  };

  const checkFollowingStatus = async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.from('follows').select('*').eq('follower_user_id', currentUser.id).eq('following_user_id', viewedUserId).single();
      setIsFollowing(!!data);
    } catch (e) {
      setIsFollowing(false);
      console.log('Error checking following status', e);
    }
  };

  const onFollowPress = async () => {
    if (!currentUser) return;
    try {
      if (isFollowing) {
        await unfollowUser(currentUser.id, viewedUserId);
        setIsFollowing(false);
        setFollowersCount(c => Math.max(0, c - 1));
      } else {
        await followUser(currentUser.id, viewedUserId);
        setIsFollowing(true);
        setFollowersCount(c => c + 1);
      }
    } catch (e) {
      console.log('Error toggling follow', e);
    }
  };

  const renderPostItem = ({ item }) => (
    <PostCard post={item} userRole="student" />
  );

  if (loading) return (
    <SafeAreaView style={styles.safeArea}><View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading profile...</Text></View></SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={require('../../../assets/profile_page_icons/back_button.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileDetails}>
          <Image source={ profileData?.cover_url ? { uri: profileData.cover_url } : require('../../../assets/profile_page_icons/profile_default_bg.png') } style={styles.coverImage} />
          <View style={styles.profileImageContainer}>
            <Image source={ profileData?.avatar_url ? { uri: profileData.avatar_url } : require('../../../assets/profile_page_icons/default_profile_icon.png') } style={styles.profileImage} />
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.userName}>{profileData?.display_name || profileData?.username || 'User'}</Text>
            <View style={styles.roleFrame}><Text style={styles.userRole}>{profileData?.role || 'User'}</Text></View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}><Text style={styles.statNumber}>{followingCount}</Text><Text style={styles.statLabel}>Following</Text></View>
            <View style={styles.statItem}><Text style={styles.statNumber}>{followersCount}</Text><Text style={styles.statLabel}>Followers</Text></View>
          </View>

          <View style={styles.editButtonRow}>
            <TouchableOpacity style={[styles.editProfileButton, { paddingHorizontal: 20 }]} onPress={onFollowPress}>
              <Text style={styles.editProfileText}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stickyTabsWrapper}>
          <View style={styles.tabsContainer}>
            {['Posts','Communities'].map((tab, index) => (
              <TouchableOpacity key={tab} style={styles.tab} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : styles.tabTextInactive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.tabsBottomBorder} />
        </View>

        <View style={styles.postsContent}>
          {activeTab === 'Posts' && (
            postsLoading ? <View style={styles.loadingPostsContainer}><Text style={styles.loadingText}>Loading posts...</Text></View> : (
              userPosts.length > 0 ? <FlatList data={userPosts} renderItem={renderPostItem} keyExtractor={(i) => i.id} scrollEnabled={false} /> : <View style={styles.noPostsContainer}><Text style={styles.noPostsText}>No posts yet</Text></View>
            )
          )}

          {activeTab === 'Communities' && (
            <View style={{ padding: 20 }}>
              {userCommunities.length > 0 ? userCommunities.map(c => (
                <View key={c.id} style={styles.communityRow}><Text style={styles.profileName}>{c.name}</Text><Text style={styles.communityMeta}>{c.member_count || 0} members</Text></View>
              )) : <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Not a member of any communities</Text>}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.homeBackground },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.homeBackground },
  backButton: { padding: 8 },
  backIcon: { width: 20, height: 22, resizeMode: 'contain', tintColor: colors.white },
  headerTitle: { fontSize: 18, fontFamily: fonts.semiBold, color: colors.white },
  container: { flex: 1, backgroundColor: colors.homeBackground },
  profileDetails: { marginBottom: 0 },
  coverImage: { width: '100%', height: 140, resizeMode: 'cover' },
  profileImageContainer: { position: 'absolute', top: 60, left: 20 },
  profileImage: { width: 100, height: 100, borderRadius: 60, borderWidth: 4, borderColor: colors.homeBackground },
  nameRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, marginTop: 50, marginBottom: 10 },
  userName: { fontSize: 22, fontFamily: fonts.bold, color: colors.white },
  roleFrame: { marginLeft: 10, backgroundColor: 'rgba(76,175,80,0.15)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12 },
  userRole: { fontSize: 12, fontFamily: fonts.medium, color: '#4CAF50' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 22, marginBottom: 10 },
  statItem: { marginRight: 20 },
  statNumber: { fontSize: 16, fontFamily: fonts.bold, color: colors.white },
  statLabel: { fontSize: 12, fontFamily: fonts.normal, color: 'rgba(255,255,255,0.6)' },
  editButtonRow: { marginTop: 8, paddingHorizontal: 22, alignItems: 'flex-end' },
  editProfileButton: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  editProfileText: { fontSize: 14, fontFamily: fonts.medium, color: colors.white },
  stickyTabsWrapper: { backgroundColor: colors.homeBackground, marginBottom: 1 },
  tabsContainer: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 16, fontFamily: fonts.semiBold },
  tabTextActive: { color: colors.tabActive },
  tabTextInactive: { color: colors.tabInactive },
  tabsBottomBorder: { height: 0.5, backgroundColor: '#434343', width: '100%' },
  postsContent: { backgroundColor: colors.homeBackground, minHeight: 200 },
  loadingPostsContainer: { padding: 40, alignItems: 'center' },
  noPostsContainer: { padding: 40, alignItems: 'center' },
  noPostsText: { fontSize: 16, fontFamily: fonts.medium, color: colors.white },
  communityRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  communityMeta: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  bottomSpacer: { height: 30 }
});
