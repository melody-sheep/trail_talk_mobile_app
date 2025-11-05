import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { colors } from '../styles/colors';
import { fonts } from '../styles/fonts';
import { supabase } from '../lib/supabase';
import { UserContext } from '../contexts/UserContext';

const PostCard = ({ post, userRole = 'student', onInteraction }) => {
  const { user } = useContext(UserContext);
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [repostsCount, setRepostsCount] = useState(post.reposts_count || 0);
  const [bookmarksCount, setBookmarksCount] = useState(post.bookmarks_count || 0);

  // Check user's interaction status when component mounts
  useEffect(() => {
    if (user) {
      checkUserInteractions();
    }
  }, [user, post.id]);

  const checkUserInteractions = async () => {
    if (!user) return;
    
    try {
      // Check if user liked this post
      const { data: likeData } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();

      setIsLiked(!!likeData);

      // Check if user reposted this post
      const { data: repostData } = await supabase
        .from('reposts')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();

      setIsReposted(!!repostData);

      // Check if user bookmarked this post
      const { data: bookmarkData } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();

      setIsBookmarked(!!bookmarkData);
    } catch (error) {
      console.log('Error checking interactions:', error);
    }
  };

  // UPDATE POST COUNTS IN DATABASE - IMPROVED VERSION
  const updatePostCounts = async (field, change) => {
    try {
      // Get current count directly from database
      const { data: currentPost } = await supabase
        .from('posts')
        .select(field)
        .eq('id', post.id)
        .single();

      if (currentPost) {
        const currentCount = currentPost[field] || 0;
        const newCount = Math.max(0, currentCount + change);
        
        console.log(`Updating ${field}: ${currentCount} -> ${newCount}`);
        
        const { error } = await supabase
          .from('posts')
          .update({ [field]: newCount })
          .eq('id', post.id);

        if (!error) {
          console.log(`Successfully updated ${field} to ${newCount}`);
          // Notify parent component about the interaction
          if (onInteraction) {
            onInteraction(post.id, field, newCount);
          }
        } else {
          console.log(`Error updating ${field}:`, error);
        }
      }
    } catch (error) {
      console.log('Error updating post counts:', error);
    }
  };

  // LIKE FUNCTIONALITY
  const handleLikePress = async () => {
    if (!user) {
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
          await updatePostCounts('likes_count', -1);
        }
      } else {
        // Like the post
        const { error } = await supabase
          .from('post_likes')
          .insert([{ post_id: post.id, user_id: user.id }]);

        if (!error) {
          setIsLiked(true);
          setLikesCount(prev => prev + 1);
          await updatePostCounts('likes_count', 1);
        }
      }
    } catch (error) {
      console.log('Error toggling like:', error);
    }
  };

  // REPOST FUNCTIONALITY
  const handleRepostPress = async () => {
    if (!user) {
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
          await updatePostCounts('reposts_count', -1);
        }
      } else {
        // Add repost
        const { error } = await supabase
          .from('reposts')
          .insert([{ post_id: post.id, user_id: user.id }]);

        if (!error) {
          setIsReposted(true);
          setRepostsCount(prev => prev + 1);
          await updatePostCounts('reposts_count', 1);
        }
      }
    } catch (error) {
      console.log('Error toggling repost:', error);
    }
  };

  // BOOKMARK FUNCTIONALITY
  const handleBookmarkPress = async () => {
    if (!user) {
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
          await updatePostCounts('bookmarks_count', -1);
        }
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert([{ post_id: post.id, user_id: user.id }]);

        if (!error) {
          setIsBookmarked(true);
          setBookmarksCount(prev => prev + 1);
          await updatePostCounts('bookmarks_count', 1);
        }
      }
    } catch (error) {
      console.log('Error toggling bookmark:', error);
    }
  };

  // COMMENT FUNCTIONALITY (Placeholder)
  const handleCommentPress = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to comment');
      return;
    }
    console.log('Navigate to comments for post:', post.id);
  };

  // Get icon source based on interaction state
  const getLikeIcon = () => 
    isLiked 
      ? require('../../assets/post_card_icons/like_icon_fill.png')
      : require('../../assets/post_card_icons/like_icon.png');

  const getCommentIcon = () => 
    require('../../assets/post_card_icons/comment_icon.png');

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
    'rgba(255, 255, 255, 0.8)';

  const getRepostTextColor = () => 
    isReposted ? '#11FF00' : 'rgba(255, 255, 255, 0.8)';

  const getBookmarkTextColor = () => 
    isBookmarked ? '#FFCC00' : 'rgba(255, 255, 255, 0.8)';

  return (
    <View style={styles.container}>
      {/* Main Content Row */}
      <View style={styles.mainRow}>
        {/* Profile Column */}
        <View style={styles.profileColumn}>
          <Image 
            source={require('../../assets/post_card_icons/anon_profile_icon.png')} 
            style={styles.anonIcon}
            resizeMode="contain"
          />
        </View>

        {/* Content Column */}
        <View style={styles.contentColumn}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.usernameRow}>
                <Text style={styles.username}>{post.anonymous_username || 'Anonymous'}</Text>
                
                <View style={styles.roleTimeContainer}>
                  <Image 
                    source={require('../../assets/post_card_icons/student_icon.png')} 
                    style={styles.roleIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.roleText}>{userRole === 'student' ? 'Student' : 'Faculty'}</Text>
                  
                  <View style={styles.dot} />
                  <Text style={styles.timeText}>{formatTime(post.created_at)}</Text>
                </View>
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
            <Text style={styles.categoryText}>{post.category}</Text>
          </View>

          {/* Content Box */}
          <View style={styles.contentBox}>
            <Text style={styles.contentText}>{post.content}</Text>
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