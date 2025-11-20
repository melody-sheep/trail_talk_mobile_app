import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { colors } from '../styles/colors';
import { fonts } from '../styles/fonts';  
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import useComments from '../hooks/useComments';
import { UserContext } from '../contexts/UserContext';

const PostCard = ({ post, userRole = 'student', onInteraction, onCommentUpdate }) => {
  const { user } = useContext(UserContext);
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(post?.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post?.comments_count || 0);
  const [repostsCount, setRepostsCount] = useState(post?.reposts_count || 0);
  const [bookmarksCount, setBookmarksCount] = useState(post?.bookmarks_count || 0);
  const [authorAvatar, setAuthorAvatar] = useState(null);
  const [authorRole, setAuthorRole] = useState(null);
  const navigation = useNavigation();
  
  // Track if user has commented
  const { hasCommented, fetchComments } = useComments(post?.id, user?.id);

  // REAL-TIME COMMENT COUNT UPDATES - IMPROVED
  useEffect(() => {
    setCommentsCount(post?.comments_count || 0);
  }, [post?.comments_count]);

  // REAL-TIME SUBSCRIPTION FOR POST UPDATES
  useEffect(() => {
    if (!post?.id) return;

    const subscription = supabase
      .channel(`post-${post.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${post.id}`
        },
        (payload) => {
          console.log('Real-time post update - comments_count:', payload.new.comments_count);
          // Update local state with new counts
          if (payload.new.comments_count !== undefined) {
            setCommentsCount(payload.new.comments_count);
          }
          if (payload.new.likes_count !== undefined) {
            setLikesCount(payload.new.likes_count);
          }
          if (payload.new.reposts_count !== undefined) {
            setRepostsCount(payload.new.reposts_count);
          }
          if (payload.new.bookmarks_count !== undefined) {
            setBookmarksCount(payload.new.bookmarks_count);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [post?.id]);

  // Refresh comment status when component mounts or user changes
  useEffect(() => {
    if (user && post?.id) {
      console.log('Refreshing comments for user:', user.id, 'post:', post.id);
      fetchComments();
    }
  }, [user, post?.id]);

  // Check user's interaction status and fetch author profile when component mounts
  useEffect(() => {
    if (user && post?.id) {
      checkUserInteractions();
    }
    if (post?.author_id) {
      fetchAuthorProfile();
    }
  }, [user, post?.id, post?.author_id]);

  // Fetch authoritative interaction counts for this post on mount/update
  useEffect(() => {
    const fetchCounts = async () => {
      if (!post?.id) return;
      try {
        const [likesRes, commentsRes, repostsRes, bookmarksRes] = await Promise.all([
          supabase.from('post_likes').select('*', { head: true, count: 'exact' }).eq('post_id', post.id),
          supabase.from('comments').select('*', { head: true, count: 'exact' }).eq('post_id', post.id),
          supabase.from('reposts').select('*', { head: true, count: 'exact' }).eq('post_id', post.id),
          supabase.from('bookmarks').select('*', { head: true, count: 'exact' }).eq('post_id', post.id),
        ]);

        const likesCount = Number(likesRes.count) || 0;
        const commentsCount = Number(commentsRes.count) || 0;
        const repostsCount = Number(repostsRes.count) || 0;
        const bookmarksCount = Number(bookmarksRes.count) || 0;

        setLikesCount(likesCount);
        setCommentsCount(commentsCount);
        setRepostsCount(repostsCount);
        setBookmarksCount(bookmarksCount);
      } catch (err) {
        console.log('Error fetching interaction counts for post:', post.id, err);
      }
    };

    fetchCounts();
  }, [post?.id]);

  // Keep local counts in sync when the parent `post` prop is updated
  useEffect(() => {
    if (!post) return;
    setLikesCount(post.likes_count || 0);
    setCommentsCount(post.comments_count || 0);
    setRepostsCount(post.reposts_count || 0);
    setBookmarksCount(post.bookmarks_count || 0);
  }, [post?.likes_count, post?.comments_count, post?.reposts_count, post?.bookmarks_count]);

  // Fetch author profile to get avatar AND role - UPDATED
  const fetchAuthorProfile = async () => {
    try {
      // If post has author data with role, use it
      if (post.author?.user_type) {
        setAuthorRole(post.author.user_type);
        if (post.author.avatar_url) {
          setAuthorAvatar(post.author.avatar_url);
        }
        return;
      }

      // Otherwise fetch author profile from database
      if (post.author_id) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('avatar_url, display_name, username, user_type')
          .eq('id', post.author_id)
          .single();

        if (!error && profileData) {
          setAuthorRole(profileData.user_type || 'student'); // Default to student if null
          if (profileData.avatar_url) {
            setAuthorAvatar(profileData.avatar_url);
          }
        } else {
          // Set default role if profile not found
          setAuthorRole('student');
        }
      }
    } catch (error) {
      console.log('Error fetching author profile:', error);
      setAuthorRole('student'); // Default fallback
    }
  };

  // Get role icon based on AUTHOR'S role, not current viewer's role - UPDATED
  const getRoleIcon = () => {
    // Use the actual author's role from the database
    const role = authorRole || post.author?.user_type || 'student';
    
    if (role === 'faculty') {
      return require('../../assets/post_card_icons/faculty_icon.png');
    } else {
      return require('../../assets/post_card_icons/student_icon.png');
    }
  };

  // Get role text based on AUTHOR'S role, not current viewer's role - UPDATED
  const getRoleText = () => {
    // Use the actual author's role from the database
    const role = authorRole || post.author?.user_type || 'student';
    
    if (role === 'faculty') {
      return 'Faculty';
    } else {
      return 'Student';
    }
  };

  // Check user interactions
  const checkUserInteractions = async () => {
    if (!user || !post?.id) return;
    
    try {
      // Check if user liked this post
      const { data: likeData } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsLiked(!!likeData);

      // Check if user reposted this post
      const { data: repostData } = await supabase
        .from('reposts')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsReposted(!!repostData);

      // Check if user bookmarked this post
      const { data: bookmarkData } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsBookmarked(!!bookmarkData);

    } catch (error) {
      console.log('Error checking interactions:', error);
    }
  };

  // COMMENT FUNCTIONALITY
  const handleCommentPress = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to comment');
      return;
    }
    if (!post?.id) return;
    
    navigation.navigate('CommentScreen', {
      post,
      user,
      onCommentAdded: () => {
        console.log('Comment added callback triggered');
        // Force refresh the comments status
        fetchComments();
        // Update comment count
        setCommentsCount(prev => prev + 1);
        if (onCommentUpdate) {
          onCommentUpdate(post.id); // Notify parent to refresh
        }
      }
    });
  };

  // LIKE FUNCTIONALITY
  const handleLikePress = async () => {
    if (!user || !post?.id) {
      Alert.alert('Sign In Required', 'Please sign in to like posts');
      return;
    }

    try {
      if (isLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (!error) {
          setIsLiked(false);
          setLikesCount(prev => Math.max(0, prev - 1));
          if (onInteraction) onInteraction(post.id, 'likes_count', likesCount - 1);
        }
      } else {
        // Like the post
        const { error } = await supabase
          .from('post_likes')
          .insert([{ post_id: post.id, user_id: user.id }]);

        if (!error) {
          setIsLiked(true);
          setLikesCount(prev => prev + 1);
          if (onInteraction) onInteraction(post.id, 'likes_count', likesCount + 1);
        }
      }
    } catch (error) {
      console.log('Error toggling like:', error);
    }
  };

  // REPOST FUNCTIONALITY
  const handleRepostPress = async () => {
    if (!user || !post?.id) {
      Alert.alert('Sign In Required', 'Please sign in to repost');
      return;
    }

    try {
      if (isReposted) {
        // Remove repost
        const { error } = await supabase
          .from('reposts')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (!error) {
          setIsReposted(false);
          setRepostsCount(prev => Math.max(0, prev - 1));
          if (onInteraction) onInteraction(post.id, 'reposts_count', repostsCount - 1);
        }
      } else {
        // Add repost
        const { error } = await supabase
          .from('reposts')
          .insert([{ post_id: post.id, user_id: user.id }]);

        if (!error) {
          setIsReposted(true);
          setRepostsCount(prev => prev + 1);
          if (onInteraction) onInteraction(post.id, 'reposts_count', repostsCount + 1);
        }
      }
    } catch (error) {
      console.log('Error toggling repost:', error);
    }
  };

  // BOOKMARK FUNCTIONALITY
  const handleBookmarkPress = async () => {
    if (!user || !post?.id) {
      Alert.alert('Sign In Required', 'Please sign in to bookmark posts');
      return;
    }

    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (!error) {
          setIsBookmarked(false);
          setBookmarksCount(prev => Math.max(0, prev - 1));
          if (onInteraction) onInteraction(post.id, 'bookmarks_count', bookmarksCount - 1);
        }
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert([{ post_id: post.id, user_id: user.id }]);

        if (!error) {
          setIsBookmarked(true);
          setBookmarksCount(prev => prev + 1);
          if (onInteraction) onInteraction(post.id, 'bookmarks_count', bookmarksCount + 1);
        }
      }
    } catch (error) {
      console.log('Error toggling bookmark:', error);
    }
  };

  // Get icon source based on interaction state
  const getLikeIcon = () => 
    isLiked 
      ? require('../../assets/post_card_icons/like_icon_fill.png')
      : require('../../assets/post_card_icons/like_icon.png');

  const getCommentIcon = () => 
    hasCommented
      ? require('../../assets/post_card_icons/comment_icon_fill.png')
      : require('../../assets/post_card_icons/comment_icon.png');

  const getRepostIcon = () => 
    isReposted 
      ? require('../../assets/post_card_icons/repost_icon_fill.png')
      : require('../../assets/post_card_icons/repost_icon.png');

  const getBookmarkIcon = () => 
    isBookmarked 
      ? require('../../assets/post_card_icons/book_mark_icon_fill.png')
      : require('../../assets/post_card_icons/book_mark_icon.png');

  // Get text color based on interaction state
  const getLikeTextColor = () => 
    isLiked ? '#FF0066' : 'rgba(255, 255, 255, 0.8)';

  const getCommentTextColor = () => 
    hasCommented ? '#3778FF' : 'rgba(255, 255, 255, 0.8)';

  const getRepostTextColor = () => 
    isReposted ? '#11FF00' : 'rgba(255, 255, 255, 0.8)';

  const getBookmarkTextColor = () => 
    isBookmarked ? '#FFCC00' : 'rgba(255, 255, 255, 0.8)';

  // Get display name for the post - UPDATED WITH NULL CHECKS
  const getDisplayName = () => {
    if (!post) return 'Anonymous';
    
    // If post was created anonymously, show concise 'Anonymous' label
    if (post?.is_anonymous) return 'Anonymous';
    
    // Use author_initials from the post
    if (post.author_initials) {
      return post.author_initials;
    }
    
    // Fallback to author data if available
    if (post.author?.display_name) {
      return post.author.display_name;
    }
    if (post.author?.username) {
      return post.author.username.substring(0, 3).toUpperCase();
    }
    return 'USR'; // Final fallback
  };

  // Get profile image source
  const getProfileImageSource = () => {
    if (!post) {
      return require('../../assets/post_card_icons/anon_profile_icon.png');
    }
    
    // Respect anonymous posts: always show default anonymous avatar
    if (post?.is_anonymous) {
      return require('../../assets/post_card_icons/anon_profile_icon.png');
    }

    if (authorAvatar) {
      return { uri: authorAvatar };
    }

    return require('../../assets/post_card_icons/anon_profile_icon.png');
  };

  // Don't render if post is null/undefined
  if (!post) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Main Content Row */}
      <View style={styles.mainRow}>
        {/* Profile Column */}
        <View style={styles.profileColumn}>
          <Image 
            source={getProfileImageSource()} 
            style={!post?.is_anonymous && authorAvatar ? styles.customAvatar : styles.anonIcon}
            resizeMode="cover"
          />
        </View>

        {/* Content Column */}
        <View style={styles.contentColumn}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.usernameRow}>
                <Text style={styles.username}>{getDisplayName()}</Text>
                
                {/* If post is anonymous, hide role label/icon to compress layout */}
                {!post?.is_anonymous ? (
                  <View style={styles.roleTimeContainer}>
                    <Image 
                      source={getRoleIcon()}
                      style={styles.roleIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.roleText}>{getRoleText()}</Text>
                    
                    <View style={styles.dot} />
                    <Text style={styles.timeText}>{formatTime(post.created_at)}</Text>
                  </View>
                ) : (
                  <View style={styles.roleTimeContainer}>
                    <View style={styles.dot} />
                    <Text style={styles.timeText}>{formatTime(post.created_at)}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <TouchableOpacity style={styles.kebabButton}>
              <Text style={styles.kebabIcon}>⋮</Text>
            </TouchableOpacity>
          </View>

          {/* Category Section */}
          <View style={styles.categorySection}>
            <Image 
              source={getCategoryIcon(post.category)} 
              style={styles.categoryIcon}
              resizeMode="contain"
            />
            <Text style={styles.categoryText}>{post.category || 'General'}</Text>
          </View>

          {/* Content Box */}
          <View style={styles.contentBox}>
            <Text style={styles.contentText}>{post.content || ''}</Text>
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            {/* Like Button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLikePress}
              activeOpacity={0.7}
            >
              <Image 
                source={getLikeIcon()} 
                style={styles.actionIcon}
                resizeMode="contain"
              />
              <Text style={[styles.actionCount, { color: getLikeTextColor() }]}>
                {likesCount}
              </Text>
            </TouchableOpacity>

            {/* Comment Button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleCommentPress}
              activeOpacity={0.7}
            >
              <Image 
                source={getCommentIcon()} 
                style={styles.actionIcon}
                resizeMode="contain"
              />
              <Text style={[styles.actionCount, { color: getCommentTextColor() }]}>
                {commentsCount}
              </Text>
            </TouchableOpacity>

            {/* Repost Button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleRepostPress}
              activeOpacity={0.7}
            >
              <Image 
                source={getRepostIcon()} 
                style={styles.actionIcon}
                resizeMode="contain"
              />
              <Text style={[styles.actionCount, { color: getRepostTextColor() }]}>
                {repostsCount}
              </Text>
            </TouchableOpacity>

            {/* Bookmark Button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleBookmarkPress}
              activeOpacity={0.7}
            >
              <Image 
                source={getBookmarkIcon()} 
                style={styles.actionIcon}
                resizeMode="contain"
              />
              <Text style={[styles.actionCount, { color: getBookmarkTextColor() }]}>
                {bookmarksCount}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

// Add the missing formatTime function
const formatTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  
  const now = new Date();
  const postTime = new Date(timestamp);
  const diffInHours = (now - postTime) / (1000 * 60 * 60);
  
  if (diffInHours < 1) return 'Just now';
  else if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
  else return `${Math.floor(diffInHours / 24)}d ago`;
};

// Add the missing getCategoryIcon function
const getCategoryIcon = (category) => {
  switch(category) {
    case 'Academics': return require('../../assets/post_card_icons/academic_icon.png');
    case 'Rant': return require('../../assets/post_card_icons/rant_icon.png');
    case 'Support': return require('../../assets/post_card_icons/support_icon.png');
    case 'Campus': return require('../../assets/post_card_icons/campus_icon.png');
    case 'General': return require('../../assets/post_card_icons/general_icon.png');
    default: return require('../../assets/post_card_icons/general_icon.png');
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#252428',
    width: '100%',
    borderBottomWidth: 0.5,
    borderBottomColor: '#434343',
    paddingVertical: 16,
  },
  mainRow: {
    flexDirection: 'row',
    width: '100%',
  },
  profileColumn: {
    width: 60,
    alignItems: 'center',
    paddingLeft: 16,
  },
  anonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  customAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  contentColumn: {
    flex: 1,
    paddingRight: 16,
    paddingLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  username: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginRight: 12,
  },
  roleTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  roleText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 12,
  },
  timeText: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  kebabButton: {
    padding: 4,
    marginLeft: 8,
  },
  kebabIcon: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 1)',
    fontWeight: 'bold',
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIcon: {
    width: 15,
    height: 15,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  contentBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginBottom: 16,
  },
  contentText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: colors.white,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  actionCount: {
    fontSize: 13,
    fontFamily: fonts.medium,
    minWidth: 20,
    textAlign: 'center',
  },
});

export default PostCard;
