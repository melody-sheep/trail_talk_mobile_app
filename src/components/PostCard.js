import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '../styles/colors';
import { fonts } from '../styles/fonts';

const PostCard = ({ post, userRole = 'student' }) => {
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

  const formatTime = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInHours = (now - postTime) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    else if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    else return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <View style={styles.container}>
      {/* Main Content Row */}
      <View style={styles.mainRow}>
        {/* Profile Column - Only contains the anonymous profile */}
        <View style={styles.profileColumn}>
          <Image 
            source={require('../../assets/post_card_icons/anon_profile_icon.png')} 
            style={styles.anonIcon}
            resizeMode="contain"
          />
        </View>

        {/* Content Column */}
        <View style={styles.contentColumn}>
          {/* Header Row - Username, role, time, kebab */}
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
                  <Text style={styles.roleText}>Student</Text>
                  
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
            <TouchableOpacity style={styles.actionButton}>
              <Image 
                source={require('../../assets/post_card_icons/like_icon.png')} 
                style={styles.actionIcon}
                resizeMode="contain"
              />
              <Text style={styles.actionCount}>{post.likes_count || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Image 
                source={require('../../assets/post_card_icons/comment_icon.png')} 
                style={styles.actionIcon}
                resizeMode="contain"
              />
              <Text style={styles.actionCount}>{post.comments_count || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Image 
                source={require('../../assets/post_card_icons/repost_icon.png')} 
                style={styles.actionIcon}
                resizeMode="contain"
              />
              <Text style={styles.actionCount}>{post.reposts_count || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Image 
                source={require('../../assets/post_card_icons/book_mark_icon.png')} 
                style={styles.actionIcon}
                resizeMode="contain"
              />
              <Text style={styles.actionCount}>{post.bookmarks_count || 0}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
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
    fontSize: 16, // Kept the same increased size
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginRight: 12, // Added margin to separate from role/time
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
    fontSize: 13, // Slightly increased from 12
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 12, // Increased margin for better spacing
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 12, // Increased margin for better spacing
  },
  timeText: {
    fontSize: 13, // Slightly increased from 12
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
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default PostCard;