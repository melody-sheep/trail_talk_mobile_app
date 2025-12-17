import React, { useState, useRef, useContext, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Image, ScrollView, Animated, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabase';
import PostCard from '../../components/PostCard';
import { getFollowCounts } from '../../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Post');
  const [username, setUsername] = useState('User');
  const [displayName, setDisplayName] = useState('User');
  const [birthday, setBirthday] = useState(null);
  const [joinDate, setJoinDate] = useState(null);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [userPosts, setUserPosts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [repliedPosts, setRepliedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const { user, profile, updateProfile } = useContext(UserContext);
  const animation = useRef(new Animated.Value(0)).current;

  const tabs = ['Post', 'Replies', 'BookMarks', 'Like'];
  const tabWidth = screenWidth / tabs.length;
  const vectorWidth = 80;

  useEffect(() => {
    if (user) {
      fetchUserProfileData();
      fetchUserPosts();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setProfileData(profile);
      setUsername(profile.username || 'User');
      setDisplayName(profile.display_name || profile.username || 'User');
      
      if (profile.birthday) {
        const birthDate = new Date(profile.birthday);
        const formattedBirthday = birthDate.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });
        setBirthday(formattedBirthday);
      } else {
        setBirthday('Not set');
      }

      if (profile.created_at) {
        const joinDate = new Date(profile.created_at);
        setJoinDate(joinDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }));
      } else if (user.created_at) {
        const joinDate = new Date(user.created_at);
        setJoinDate(joinDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }));
      }
    }
  }, [profile]);

  const fetchUserProfileData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileError && profileData) {
        setProfileData(profileData);
        setUsername(profileData.username || 'User');
        setDisplayName(profileData.display_name || profileData.username || 'User');
        
        if (profileData.birthday) {
          const birthDate = new Date(profileData.birthday);
          const formattedBirthday = birthDate.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
          });
          setBirthday(formattedBirthday);
        } else {
          setBirthday('Not set');
        }

        if (profileData.created_at) {
          const joinDate = new Date(profileData.created_at);
          setJoinDate(joinDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }));
        } else if (user.created_at) {
          const joinDate = new Date(user.created_at);
          setJoinDate(joinDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }));
        }
      }

      try {
        const counts = await getFollowCounts(user.id);
        setFollowersCount(counts.followers || 0);
        setFollowingCount(counts.following || 0);
      } catch (followError) {
        console.log('Error fetching follow counts:', followError);
        await fetchFollowCountsFallback();
      }

      const { count: postCount, error: postError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id);

      if (!postError) {
        setPostCount(postCount || 0);
      }

    } catch (error) {
      console.log('Error fetching profile data:', error);
      setBirthday('Not set');
      if (user?.created_at) {
        const joinDate = new Date(user.created_at);
        setJoinDate(joinDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowCountsFallback = async () => {
    try {
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_user_id', user.id);

      if (!followersError) {
        setFollowersCount(followersCount || 0);
      }

      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_user_id', user.id);

      if (!followingError) {
        setFollowingCount(followingCount || 0);
      }
    } catch (error) {
      console.log('Error in fetchFollowCountsFallback:', error);
    }
  };

  const fetchUserPosts = async () => {
    if (!user) {
      console.log('No user found');
      return;
    }
    
    try {
      setPostsLoading(true);
      console.log('Fetching posts for user:', user.id);
      
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Posts fetch result:', { posts, error });
      
      if (!error && posts) {
        console.log(`Found ${posts.length} posts`);
        setUserPosts(posts);
      } else {
        console.log('Error fetching posts:', error);
        setUserPosts([]);
      }
    } catch (error) {
      console.log('Exception fetching user posts:', error);
      setUserPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchBookmarkedPosts = async () => {
    if (!user) return;
    try {
      setBookmarksLoading(true);
      const { data: bookmarks, error: bmError } = await supabase
        .from('bookmarks')
        .select('post_id')
        .eq('user_id', user.id);

      if (!bmError && bookmarks) {
        const postIds = bookmarks.map(b => b.post_id).filter(Boolean);
        if (postIds.length === 0) {
          setBookmarkedPosts([]);
          return;
        }

        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .in('id', postIds)
          .order('created_at', { ascending: false });

        if (!postsError && posts) setBookmarkedPosts(posts);
        else setBookmarkedPosts([]);
      } else {
        setBookmarkedPosts([]);
      }
    } catch (error) {
      console.log('Error fetching bookmarked posts:', error);
      setBookmarkedPosts([]);
    } finally {
      setBookmarksLoading(false);
    }
  };

  const fetchLikedPosts = async () => {
    if (!user) return;
    try {
      setLikesLoading(true);
      const { data: likes, error: likesError } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);

      if (!likesError && likes) {
        const postIds = likes.map(l => l.post_id).filter(Boolean);
        if (postIds.length === 0) {
          setLikedPosts([]);
          return;
        }

        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .in('id', postIds)
          .order('created_at', { ascending: false });

        if (!postsError && posts) setLikedPosts(posts);
        else setLikedPosts([]);
      } else {
        setLikedPosts([]);
      }
    } catch (error) {
      console.log('Error fetching liked posts:', error);
      setLikedPosts([]);
    } finally {
      setLikesLoading(false);
    }
  };

  const fetchRepliedPosts = async () => {
    if (!user) return;
    try {
      setRepliesLoading(true);
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('id, post_id, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!commentsError && comments) {
        const latestMap = new Map();
        for (const c of comments) {
          if (!c.post_id) continue;
          if (!latestMap.has(c.post_id)) {
            latestMap.set(c.post_id, c);
          }
        }

        const postIds = Array.from(latestMap.keys()).filter(Boolean);
        if (postIds.length === 0) {
          setRepliedPosts([]);
          return;
        }

        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .in('id', postIds)
          .order('created_at', { ascending: false });

        if (!postsError && posts) {
          const items = posts.map(p => ({ post: p, comment: latestMap.get(p.id) })).sort((a, b) => new Date(b.comment.created_at) - new Date(a.comment.created_at));
          setRepliedPosts(items);
        } else {
          setRepliedPosts([]);
        }
      } else {
        setRepliedPosts([]);
      }
    } catch (error) {
      console.log('Error fetching replied posts:', error);
      setRepliedPosts([]);
    } finally {
      setRepliesLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('Profile screen focused - refreshing posts and profile');
      fetchUserProfileData();
      fetchUserPosts();
      fetchBookmarkedPosts();
      fetchLikedPosts();
      fetchRepliedPosts();
      if (user) {
        updateProfile(user.id);
      }
    }, [user])
  );

  useEffect(() => {
    console.log('Setting up real-time subscriptions for ProfileScreen interactions...');

    const postsUpdateChannel = supabase
      .channel('profile_posts_update_channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          console.log('Post updated in ProfileScreen real-time:', payload);
          setUserPosts(currentPosts => 
            currentPosts.map(post => 
              post.id === payload.new.id ? { ...post, ...payload.new } : post
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('Profile posts update subscription status:', status);
      });

    const likesChannel = supabase
      .channel('profile_likes_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes',
        },
        async (payload) => {
          console.log('Like interaction detected in ProfileScreen:', payload);
          const { data: updatedPost } = await supabase
            .from('posts')
            .select('*')
            .eq('id', payload.new?.post_id || payload.old?.post_id)
            .single();
          
          if (updatedPost) {
            setUserPosts(currentPosts => 
              currentPosts.map(post => 
                post.id === updatedPost.id ? updatedPost : post
              )
            );
            // refresh liked posts list when likes change
            fetchLikedPosts();
          }
        }
      )
      .subscribe((status) => {
        console.log('Profile likes subscription status:', status);
      });

    const repostsChannel = supabase
      .channel('profile_reposts_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reposts',
        },
        async (payload) => {
          console.log('Repost interaction detected in ProfileScreen:', payload);
          const { data: updatedPost } = await supabase
            .from('posts')
            .select('*')
            .eq('id', payload.new?.post_id || payload.old?.post_id)
            .single();
          
          if (updatedPost) {
            setUserPosts(currentPosts => 
              currentPosts.map(post => 
                post.id === updatedPost.id ? updatedPost : post
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Profile reposts subscription status:', status);
      });

    const bookmarksChannel = supabase
      .channel('profile_bookmarks_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
        },
        async (payload) => {
          console.log('Bookmark interaction detected in ProfileScreen:', payload);
          const { data: updatedPost } = await supabase
            .from('posts')
            .select('*')
            .eq('id', payload.new?.post_id || payload.old?.post_id)
            .single();
          
          if (updatedPost) {
            setUserPosts(currentPosts => 
              currentPosts.map(post => 
                post.id === updatedPost.id ? updatedPost : post
              )
            );
            // refresh bookmarks list when bookmarks change
            fetchBookmarkedPosts();
          }
        }
      )
      .subscribe((status) => {
        console.log('Profile bookmarks subscription status:', status);
      });

    const commentsChannel = supabase
      .channel('profile_comments_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        async (payload) => {
          console.log('Comment interaction detected in ProfileScreen:', payload);
          // refresh the replies list when comments change
          fetchRepliedPosts();
        }
      )
      .subscribe((status) => {
        console.log('Profile comments subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from ProfileScreen real-time channels');
      supabase.removeChannel(postsUpdateChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(repostsChannel);
      supabase.removeChannel(bookmarksChannel);
        supabase.removeChannel(commentsChannel);
    };
  }, []);

  const handleTabPress = (tab, index) => {
    setActiveTab(tab);
    
    Animated.timing(animation, {
      toValue: index,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const translateX = animation.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: tabs.map((_, index) => 
      (tabWidth * index) + (tabWidth - vectorWidth) / 2
    ),
  });

  const renderPostItem = ({ item }) => (
    <PostCard post={item} userRole="student" 
    onInteraction={() => {
      setTimeout(() => fetchUserPosts(), 500);
    }}    
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image 
            source={require('../../../assets/profile_page_icons/back_button.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Profile</Text>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('StudentSettings')}
        >
          <Ionicons name="settings-outline" size={22} color={colors.white} />
        </TouchableOpacity>
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
          
          <View style={styles.editButtonRow}>
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{displayName}</Text>
            <View style={styles.roleFrame}>
              <Image 
                source={require('../../../assets/post_card_icons/student_icon.png')}
                style={styles.lockIcon}
              />
              <Text style={styles.userRole}>Student</Text>
            </View>
          </View>

          {/* Row 4: Birthday and Join Date with adjustable margins */}
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

          {/* Row 5: Following and Followers with adjustable margins */}
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

        {/* Sticky Tabs - AT THE BOTTOM OF PROFILE DETAILS */}
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

            <Animated.View 
              style={[
                styles.horizontalVector,
                { transform: [{ translateX }] }
              ]}
            >
              <Image 
                source={require('../../../assets/profile_page_icons/horizontal_scroll_vector.png')} 
                style={styles.vectorImage}
              />
            </Animated.View>
          </View>
          
          <View style={styles.tabsBottomBorder} />
        </View>

        {/* Posts Content Area */}
        <View style={styles.postsContent}>
          {activeTab === 'Post' && (
            <>
              {postsLoading ? (
                <View style={styles.loadingPostsContainer}>
                  <Text style={styles.loadingText}>Loading posts...</Text>
                </View>
              ) : userPosts.length > 0 ? (
                <FlatList
                  data={userPosts}
                  renderItem={renderPostItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.noPostsContainer}>
                  <Text style={styles.noPostsText}>No posts yet</Text>
                  <Text style={styles.noPostsSubtext}>Start sharing your thoughts!</Text>
                </View>
              )}
            </>
          )}

          {activeTab === 'Replies' && (
            <>
              {repliesLoading ? (
                <View style={styles.loadingPostsContainer}>
                  <Text style={styles.loadingText}>Loading replies...</Text>
                </View>
              ) : repliedPosts.length > 0 ? (
                <FlatList
                  data={repliedPosts}
                  renderItem={({ item }) => (
                    <View>
                      <PostCard post={item.post} userRole="student" onInteraction={() => {
                        setTimeout(() => fetchUserPosts(), 500);
                      }} onCommentUpdate={() => fetchRepliedPosts()} />

                      <View style={styles.replyBox}>
                        <Text style={styles.replyLabel}>Your reply</Text>
                        <Text style={styles.replyText}>{item.comment?.content}</Text>
                      </View>
                    </View>
                  )}
                  keyExtractor={(item) => item.post.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.noPostsContainer}>
                  <Text style={styles.noPostsText}>No replies yet</Text>
                  <Text style={styles.noPostsSubtext}>Reply to posts to see them here.</Text>
                </View>
              )}
            </>
          )}

          {activeTab === 'BookMarks' && (
            <>
              {bookmarksLoading ? (
                <View style={styles.loadingPostsContainer}>
                  <Text style={styles.loadingText}>Loading bookmarks...</Text>
                </View>
              ) : bookmarkedPosts.length > 0 ? (
                <FlatList
                  data={bookmarkedPosts}
                  renderItem={({ item }) => (
                    <PostCard post={item} userRole="student" onInteraction={() => {
                      setTimeout(() => {
                        fetchBookmarkedPosts();
                        fetchUserPosts();
                      }, 500);
                    }} />
                  )}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.noPostsContainer}>
                  <Text style={styles.noPostsText}>No bookmarks yet</Text>
                  <Text style={styles.noPostsSubtext}>Tap the bookmark icon on a post to save it here.</Text>
                </View>
              )}
            </>
          )}

          {activeTab === 'Like' && (
            <>
              {likesLoading ? (
                <View style={styles.loadingPostsContainer}>
                  <Text style={styles.loadingText}>Loading likes...</Text>
                </View>
              ) : likedPosts.length > 0 ? (
                <FlatList
                  data={likedPosts}
                  renderItem={({ item }) => (
                    <PostCard post={item} userRole="student" onInteraction={() => {
                      setTimeout(() => {
                        fetchLikedPosts();
                        fetchUserPosts();
                      }, 500);
                    }} />
                  )}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.noPostsContainer}>
                  <Text style={styles.noPostsText}>No liked posts yet</Text>
                  <Text style={styles.noPostsSubtext}>Tap the heart on a post to add it here.</Text>
                </View>
              )}
            </>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.homeBackground,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 20,
    height: 22,
    resizeMode: 'contain',
    tintColor: colors.white,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  settingsButton: {
    padding: 8,
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  profileDetails: {
    marginBottom: 0,
  },
  coverImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  profileImageContainer: {
    position: 'absolute',
    top: 70,
    left: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: colors.homeBackground,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  editButtonRow: {
    marginTop: 10,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  editProfileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editProfileText: {
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
  lockIcon: {
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
  },
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
    marginBottom: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    position: 'relative',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: colors.tabActive,
  },
  tabTextInactive: {
    color: colors.tabInactive,
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
  tabsBottomBorder: {
    height: 0.5,
    backgroundColor: '#434343',
    width: '100%',
  },
  postsContent: {
    backgroundColor: colors.homeBackground,
    minHeight: 200,
  },
  loadingPostsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noPostsContainer: {
    padding: 40,
    alignItems: 'center',
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
  replyBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 10,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  replyLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  replyText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.9)'
  },
  comingSoonContainer: {
    padding: 40,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  bottomSpacer: {
    height: 30,
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