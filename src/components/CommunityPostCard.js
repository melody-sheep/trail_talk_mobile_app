import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useComments from '../hooks/useComments';
import ReportModal from './ReportModal';
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
  const [likesCount, setLikesCount] = useState(post.likes_count ?? post.like_count ?? 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count ?? post.comment_count ?? 0);
  const [repostsCount, setRepostsCount] = useState(post.reposts_count ?? post.repost_count ?? 0);
  const [bookmarksCount, setBookmarksCount] = useState(post.bookmarks_count ?? post.bookmark_count ?? 0);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const navigation = useNavigation();

  // Check user's interaction status when component mounts
  useEffect(() => {
    if (user) {
      checkUserInteractions();
    }
  }, [user, post.id]);

  useEffect(() => {
    // Always attempt to fetch a fresh profile/avatar when we have an author_id
    if (post.author_id) {
      fetchAuthorProfile(post.author_id);
    }
  }, [post.author_id]);

  // Hook for comments (used to detect if current user has commented)
  const { hasCommented, fetchComments } = useComments(post?.id, user?.id, {
    commentsTable: 'community_comments',
    postTable: 'community_posts',
    commentCountField: 'comment_count'
  });

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

  const fetchAuthorProfile = async (authorId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, display_name, user_type, avatar_url, nickname, created_at')
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

      // Use local state counts as the source of truth for calculating the new value
      const localFieldMap = {
        'likes_count': likesCount,
        'comments_count': commentsCount,
        'reposts_count': repostsCount,
        'bookmarks_count': bookmarksCount
      };

      const currentLocal = localFieldMap[field] || 0;
      const newCount = Math.max(0, currentLocal + change);

      console.log(`Updating community post ${dbField}: ${currentLocal} -> ${newCount}`);

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

    navigation.navigate('CommentScreen', {
      post,
      user,
      commentsTable: 'community_comments',
      postTable: 'community_posts',
      commentCountField: 'comment_count',
      postIdField: 'community_post_id',
      onCommentAdded: () => {
        // Refresh comments and increment local count
        fetchComments();
        setCommentsCount(prev => prev + 1);
        if (onInteraction) onInteraction(post.id, 'comments_count', commentsCount + 1);
      }
    });
  };

  // Get Ionicons for interactions
  const getLikeIcon = () => isLiked ? 'heart' : 'heart-outline';
  const getCommentIcon = () => hasCommented ? 'chatbubble' : 'chatbubble-outline';
  const getRepostIcon = () => isReposted ? 'repeat' : 'repeat-outline';
  const getBookmarkIcon = () => isBookmarked ? 'bookmark' : 'bookmark-outline';

  // Get text color based on interaction state
  const getLikeTextColor = () => isLiked ? '#FF0066' : 'rgba(255, 255, 255, 0.8)';
  const getCommentTextColor = () => hasCommented ? '#00DDFF' : 'rgba(255, 255, 255, 0.8)';
  const getRepostTextColor = () => isReposted ? '#11FF00' : 'rgba(255, 255, 255, 0.8)';
  const getBookmarkTextColor = () => isBookmarked ? '#FFCC00' : 'rgba(255, 255, 255, 0.8)';

  // Display name logic: show nickname unless anonymous posting is toggled
  const getDisplayName = () => {
    if (post.is_anonymous) {
      return post.anonymous_name || 'Anonymous';
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

  // Ionicons outline for role
  const getRoleIconName = (role) => {
    switch((role || '').toLowerCase()) {
      case 'faculty': return 'school-outline';
      case 'student': return 'school-outline';
      case 'admin': return 'shield-checkmark-outline';
      default: return 'person-outline';
    }
  };

  // Ionicons outline for category
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

  // Enhanced time format function
  const formatTime = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - postTime) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return 'Just now';
    else if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    else if (diffInHours < 24) return `${diffInHours}h ago`;
    else if (diffInDays < 7) return `${diffInDays}d ago`;
    else return `${Math.floor(diffInDays / 7)}w ago`;
  };

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

  return (
    <View style={styles.container}>
      {/* Main Content Row */}
      <View style={styles.mainRow}>
        {/* Profile Column */}
        <View style={styles.profileColumn}>
          {avatarUrl ? (
            <TouchableOpacity onPress={() => navigation.navigate('ViewProfile', { userId: post.author_id })}>
              <Image
                source={{ uri: avatarUrl }}
                style={styles.anonIcon}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('ViewProfile', { userId: post.author_id })}>
              <View style={styles.anonIconPlaceholder}>
                <Ionicons name="person" size={20} color="rgba(255,255,255,0.6)" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Content Column */}
        <View style={styles.contentColumn}>
          {/* Header Row - UPDATED LAYOUT */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              {/* Name and Role on same line */}
              <View style={styles.nameRoleRow}>
                <TouchableOpacity onPress={() => navigation.navigate('ViewProfile', { userId: post.author_id })}>
                  <Text style={styles.username}>{getDisplayName()}</Text>
                </TouchableOpacity>
                <View style={styles.roleContainer}>
                  <Ionicons name={getRoleIconName(getAuthorRole())} size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.roleText}>
                    {getAuthorRole() ? (getAuthorRole().charAt(0).toUpperCase() + getAuthorRole().slice(1)) : (userRole === 'student' ? 'Student' : 'Faculty')}
                  </Text>
                </View>
              </View>
              
              {/* Time stamp below name/role */}
              <Text style={styles.timeText}>{formatTime(post.created_at)}</Text>
            </View>
            
            {/* Kebab button with 0 left margin */}
            <TouchableOpacity style={styles.kebabButton} onPress={() => setShowOptionsModal(true)}>
              <Ionicons name="ellipsis-vertical" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Category Section with Professional Badge */}
          <View style={[styles.categorySection, styles.categoryNoWrap]}>
            <Ionicons name={getCategoryIconName(post.category)} size={16} color="rgba(255,255,255,0.9)" style={styles.categoryIcon} />
            <Text style={styles.categoryText}>{post.category}</Text>
            {post.is_official && <ProfessionalBadge type="official" size="small" />}
            {post.is_featured && <ProfessionalBadge type="featured" size="small" />}
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
              <Ionicons 
                name={getLikeIcon()} 
                size={18} 
                color={getLikeTextColor()}
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
              <Ionicons 
                name={getCommentIcon()} 
                size={18} 
                color={getCommentTextColor()}
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
              <Ionicons 
                name={getRepostIcon()} 
                size={18} 
                color={getRepostTextColor()}
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
              <Ionicons 
                name={getBookmarkIcon()} 
                size={18} 
                color={getBookmarkTextColor()}
              />
              <Text style={[styles.actionCount, { color: getBookmarkTextColor() }]}>
                {bookmarksCount}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Options Modal copied from PostCard (report/delete) */}
      {showOptionsModal && (
        <View style={styles.optionsBackdrop}>
          <View style={styles.optionsSheet}>
            <View style={styles.optionsHeader}>
              <Text style={styles.optionsTitle}>Post Options</Text>
            </View>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsModal(false);
                setReportModalVisible(true);
              }}
            >
              <MaterialIcons name="flag" size={20} color="#FF3B30" />
              <Text style={[styles.optionText, styles.reportOption]}>Report Post</Text>
            </TouchableOpacity>

            {user && post.author_id === user.id && (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={async () => {
                  Alert.alert(
                    'Delete Post',
                    'Are you sure you want to delete this post? This action cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            setShowOptionsModal(false);
                            const { error } = await supabase
                              .from('community_posts')
                              .delete()
                              .eq('id', post.id);

                            if (error) {
                              console.log('Error deleting community post:', error);
                              Alert.alert('Error', 'Failed to delete post.');
                              return;
                            }

                            Alert.alert('Deleted', 'Post has been deleted.');
                            if (onInteraction) onInteraction(post.id, 'deleted', true);
                          } catch (err) {
                            console.log('Delete community post error:', err);
                            Alert.alert('Error', 'Failed to delete post.');
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <MaterialIcons name="delete" size={20} color="#FF4444" />
                <Text style={[styles.optionText, { color: '#FF4444' }]}>Delete Post</Text>
              </TouchableOpacity>
            )}

            <View style={styles.optionsDivider} />

            <TouchableOpacity style={styles.optionItem} onPress={() => setShowOptionsModal(false)}>
              <Text style={styles.optionCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        postId={post?.id}
        onSubmitted={() => console.log('Report submitted for community post', post?.id)}
      />
    </View>
  );
};

// Styles
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
  anonIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
  nameRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginRight: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timeText: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  kebabButton: {
    padding: 4,
    marginLeft: 0, // Changed from 8 to 0
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIcon: {
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
  actionCount: {
    fontSize: 13,
    fontFamily: fonts.medium,
    minWidth: 16,
    textAlign: 'center',
    marginLeft: 6,
  },
  // ensure category and badges stay on single row
  categoryNoWrap: {
    flexWrap: 'nowrap',
  },
  optionsBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  optionsSheet: {
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  optionsHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  optionsTitle: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 18,
    textAlign: 'center',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionText: {
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 16,
    marginLeft: 12,
  },
  reportOption: {
    color: '#FF3B30',
  },
  optionCancel: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: fonts.medium,
    fontSize: 16,
    textAlign: 'center',
    width: '100%',
  },
  optionsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
});

export default CommunityPostCard;