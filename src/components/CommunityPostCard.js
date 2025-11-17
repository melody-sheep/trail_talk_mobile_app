import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { colors } from '../styles/colors';
import { fonts } from '../styles/fonts';  
import { supabase } from '../lib/supabase';
import { UserContext } from '../contexts/UserContext';

const CommunityPostCard = ({ post, userRole = 'student', onInteraction }) => {
  const { user } = useContext(UserContext);
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // USE EXACT SAME FIELD NAMES AS POSTCARD
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
      // Check if user liked this community post
      const { data: likeData, error: likeError } = await supabase
        .from('community_post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();

      if (!likeError && likeData) setIsLiked(true);

      // Check if user reposted this community post
      const { data: repostData, error: repostError } = await supabase
        .from('community_post_reposts')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();

      if (!repostError && repostData) setIsReposted(true);

      // Check if user bookmarked this community post
      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from('community_post_bookmarks')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();

      if (!bookmarkError && bookmarkData) setIsBookmarked(true);

    } catch (error) {
      console.log('Error checking community post interactions:', error);
    }
  };

  // UPDATE COUNTS - MATCH HOMEPAGE LOGIC
  const updateCommunityPostCounts = async (field, change) => {
    try {
      // Map to database field names
      const fieldMap = {
        'likes_count': 'like_count',
        'comments_count': 'comment_count', 
        'reposts_count': 'repost_count',
        'bookmarks_count': 'bookmark_count'
      };
      
      const dbField = fieldMap[field];
      if (!dbField) {
        console.log('Invalid field:', field);
        return;
      }

      const newCount = Math.max(0, (post[dbField] || 0) + change);
      
      console.log(`Updating community post ${dbField}: ${post[dbField]} -> ${newCount}`);
      
      const { error } = await supabase
        .from('community_posts')
        .update({ [dbField]: newCount })
        .eq('id', post.id);

      if (!error) {
        console.log(`✅ Successfully updated community post ${dbField} to ${newCount}`);
        
        // Update local state
        switch(field) {
          case 'likes_count': setLikesCount(newCount); break;
          case 'comments_count': setCommentsCount(newCount); break;
          case 'reposts_count': setRepostsCount(newCount); break;
          case 'bookmarks_count': setBookmarksCount(newCount); break;
        }
        
        if (onInteraction) {
          onInteraction(post.id, field, newCount);
        }
      } else {
        console.log(`❌ Error updating community post ${dbField}:`, error);
      }
    } catch (error) {
      console.log('Error updating community post counts:', error);
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
        const { error } = await supabase
          .from('community_post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (!error) {
          setIsLiked(false);
          await updateCommunityPostCounts('likes_count', -1);
        }
      } else {
        const { error } = await supabase
          .from('community_post_likes')
          .insert([{ post_id: post.id, user_id: user.id }]);

        if (!error) {
          setIsLiked(true);
          await updateCommunityPostCounts('likes_count', 1);
        }
      }
    } catch (error) {
      console.log('Error toggling community post like:', error);
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
        const { error } = await supabase
          .from('community_post_reposts')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (!error) {
          setIsReposted(false);
          await updateCommunityPostCounts('reposts_count', -1);
        }
      } else {
        const { error } = await supabase
          .from('community_post_reposts')
          .insert([{ post_id: post.id, user_id: user.id }]);

        if (!error) {
          setIsReposted(true);
          await updateCommunityPostCounts('reposts_count', 1);
        }
      }
    } catch (error) {
      console.log('Error toggling community post repost:', error);
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
        const { error } = await supabase
          .from('community_post_bookmarks')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (!error) {
          setIsBookmarked(false);
          await updateCommunityPostCounts('bookmarks_count', -1);
        }
      } else {
        const { error } = await supabase
          .from('community_post_bookmarks')
          .insert([{ post_id: post.id, user_id: user.id }]);

        if (!error) {
          setIsBookmarked(true);
          await updateCommunityPostCounts('bookmarks_count', 1);
        }
      }
    } catch (error) {
      console.log('Error toggling community post bookmark:', error);
    }
  };

  // COMMENT FUNCTIONALITY
  const handleCommentPress = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to comment');
      return;
    }
    console.log('Navigate to comments for community post:', post.id);
  };

  // Get icon source based on interaction state - USE SAME ICONS AS POSTCARD
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

  // Get text color based on interaction state - SAME AS POSTCARD
  const getLikeTextColor = () => 
    isLiked ? '#FF0066' : 'rgba(255, 255, 255, 0.8)';

  const getCommentTextColor = () => 
    'rgba(255, 255, 255, 0.8)';

  const getRepostTextColor = () => 
    isReposted ? '#11FF00' : 'rgba(255, 255, 255, 0.8)';

  const getBookmarkTextColor = () => 
    isBookmarked ? '#FFCC00' : 'rgba(255, 255, 255, 0.8)';

  // Get the display name - use same logic as PostCard
  const getDisplayName = () => {
    return post.anonymous_username || 'Anonymous';
  };

  return (
    <View style={styles.container}>
      {/* Main Content Row - EXACT SAME STRUCTURE AS POSTCARD */}
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
                <Text style={styles.username}>{getDisplayName()}</Text>
                
                <View style={styles.roleTimeContainer}>
                  <Image 
                    source={userRole === 'student' 
                      ? require('../../assets/post_card_icons/student_icon.png')
                      : require('../../assets/post_card_icons/faculty_icon.png')
                    } 
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

// Format time function - SAME AS POSTCARD
const formatTime = (timestamp) => {
  const now = new Date();
  const postTime = new Date(timestamp);
  const diffInHours = (now - postTime) / (1000 * 60 * 60);
  
  if (diffInHours < 1) return 'Just now';
  else if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
  else return `${Math.floor(diffInHours / 24)}d ago`;
};

// Get category icons - SAME AS POSTCARD
const getCategoryIcon = (category) => {
  switch(category) {
    case 'Academics': 
    case 'Academic': 
    case 'Discussion': 
    case 'Question': 
    case 'Announcement': 
      return require('../../assets/post_card_icons/academic_icon.png');
    
    case 'Rant': 
    case 'Resource': 
    case 'General': 
      return require('../../assets/post_card_icons/rant_icon.png');
    
    case 'Support': 
    case 'Help': 
      return require('../../assets/post_card_icons/support_icon.png');
    
    case 'Campus': 
    case 'Event': 
      return require('../../assets/post_card_icons/campus_icon.png');
    
    default: 
      return require('../../assets/post_card_icons/general_icon.png');
  }
};

// Styles - EXACTLY THE SAME AS POSTCARD
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

export default CommunityPostCard;