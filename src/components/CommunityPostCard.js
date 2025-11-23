import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      ? require('../../assets/post_interaction_icons/like_icon_fill.png')
      : require('../../assets/post_interaction_icons/like_icon.png');

  const getCommentIcon = () => 
    require('../../assets/post_interaction_icons/comment_icon.png');

  const getRepostIcon = () => 
    isReposted 
      ? require('../../assets/post_interaction_icons/repost_icon_fill.png')
      : require('../../assets/post_interaction_icons/repost_icon.png');

  const getBookmarkIcon = () => 
    isBookmarked 
      ? require('../../assets/post_interaction_icons/book_mark_icon_fill.png')
      : require('../../assets/post_interaction_icons/book_mark_icon.png');

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
  const [authorProfile, setAuthorProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  
  useEffect(() => {
    if (!post.author && post.author_id) {
      fetchAuthorProfile(post.author_id);
    }
  }, [post.author, post.author_id]);

  const fetchAuthorProfile = async (authorId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, display_name, user_type, avatar_url, nickname')
        .eq('id', authorId)
        .single();
      if (!error && data) {
        setAuthorProfile(data);
        if (data.avatar_url) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.avatar_url);
          if (publicUrlData?.publicUrl) {
            setAvatarUrl(publicUrlData.publicUrl);
          }
        } else {
          setAvatarUrl(null);
        }
      }
    } catch (err) {
      console.log('Error fetching author profile:', err);
    }
  };

  // Display name logic: show nickname unless anonymous posting is toggled
  const getDisplayName = () => {
    if (post.is_anonymous) {
      return post.anonymous_username || 'Anonymous';
    }
    return (
      post.author?.nickname ||
      authorProfile?.nickname ||
      post.author?.display_name ||
      authorProfile?.display_name ||
      post.author?.username ||
      authorProfile?.username ||
      'Anonymous'
    );
  };

  // Use true user role from DB
  const getAuthorRole = () => {
    return post.author?.user_type || authorProfile?.user_type || post.user_type || userRole;
  };

  // Ionicons outline for role - EXACT SAME AS POSTCARD
  const getRoleIconName = (role) => {
    switch((role || '').toLowerCase()) {
      case 'faculty': return 'school-outline';
      case 'student': return 'school-outline';
      case 'admin': return 'shield-checkmark-outline';
      default: return 'person-outline';
    }
  };

  // Ionicons outline for category - EXACT SAME AS POSTCARD
  const getCategoryIconName = (category) => {
    switch((category || '').toString().toLowerCase()) {
      case 'discussion': return 'chatbubble-outline';
      case 'question': return 'help-circle-outline';
      case 'announcement': return 'megaphone-outline';
      case 'event': return 'calendar-outline';
      case 'resource': return 'book-outline';
      default: return 'document-text-outline';
    }
  };

  // Professional Badge Component - FROM SUPPORTSCREEN
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

  return (
    <View style={styles.container}>
      {/* Main Content Row - EXACT SAME STRUCTURE AS POSTCARD */}
      <View style={styles.mainRow}>
        {/* Profile Column */}
        <View style={styles.profileColumn}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.anonIcon}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={require('../../assets/post_interaction_icons/anon_profile_icon.png')}
              style={styles.anonIcon}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Content Column */}
        <View style={styles.contentColumn}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.usernameRow}>
                <Text style={styles.username}>{getDisplayName()}</Text>
                <View style={styles.roleTimeContainer}>
                  <Ionicons name={getRoleIconName(getAuthorRole())} size={14} color="rgba(255,255,255,0.8)" style={{ marginRight: 6 }} />
                  <Text style={styles.roleText}>{getAuthorRole() ? (getAuthorRole().charAt(0).toUpperCase() + getAuthorRole().slice(1)) : (userRole === 'student' ? 'Student' : 'Faculty')}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.timeText}>{formatTime(post.created_at)}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.kebabButton}>
              <Text style={styles.kebabIcon}>⋮</Text>
            </TouchableOpacity>
          </View>

          {/* Category Section with Professional Badge */}
          <View style={styles.categorySection}>
            <Ionicons name={getCategoryIconName(post.category)} size={16} color="rgba(255,255,255,0.9)" style={styles.categoryIcon} />
            <Text style={styles.categoryText}>{post.category}</Text>
            {post.is_official && <ProfessionalBadge type="official" size="small" />}
            {post.is_featured && <ProfessionalBadge type="featured" size="small" />}
          </View>

          {/* Content Box - SUPPORTSCREEN STYLE */}
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

// Styles - EXACTLY THE SAME AS POSTCARD + PROFESSIONAL BADGES
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
    marginRight: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 6,
  },
  badgeText: {
    fontFamily: fonts.semiBold,
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingRight: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginRight: 12,
  },
  actionIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  actionCount: {
    fontSize: 13,
    fontFamily: fonts.medium,
    minWidth: 16,
    textAlign: 'center',
  },
});

export default CommunityPostCard;