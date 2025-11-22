import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import useComments from '../../hooks/useComments';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { height: screenHeight } = Dimensions.get('window');

const CommentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { post, user: routeUser, onCommentAdded } = route.params || {};
  const { user } = useContext(UserContext);
  const currentUser = routeUser || user;

  // Hook for comments
  const {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    fetchComments,
    hasCommented,
  } = useComments(post?.id, currentUser?.id);

  const [text, setText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!post) {
      navigation.goBack();
    }
  }, [post]);

  // Keyboard listeners for proper safe area handling
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleSend = async () => {
    if (!currentUser) return;
    if (!text.trim()) return;
    const res = await addComment(text.trim(), false);
    if (res.success) {
      setText('');
      // scroll to bottom (newest comment)
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 250);
      
      // CALL THE CALLBACK TO UPDATE PARENT COMPONENT - ENSURE THIS FIRES
      if (onCommentAdded) {
        console.log('Calling onCommentAdded callback');
        onCommentAdded();
      }
    }
  };

  const renderComment = ({ item, index }) => {
    const isAnonymous = item.is_anonymous;
    const authorName = isAnonymous ? (item.anonymous_name || 'Anonymous') : (item.user?.display_name || 'User');
    
    // FIXED: Use correct image paths
    const avatar = !isAnonymous
      ? (item.user?.avatar_url ? { uri: item.user.avatar_url } : require('../../../assets/profile_page_icons/default_profile_icon.png'))
      : require('../../../assets/profile_page_icons/profile_default_bg.png'); // Using existing profile bg for anonymous

    const isCurrentUserComment = item.user_id === currentUser?.id;

    return (
      <View style={[
        styles.commentRow,
        index === 0 && styles.firstComment,
      ]}>
        <Image source={avatar} style={styles.commentAvatar} />
        <View style={[
          styles.commentContent,
          isCurrentUserComment && styles.currentUserCommentContent
        ]}>
          <View style={styles.commentHeader}>
            <View style={styles.commentAuthorContainer}>
              <Text style={styles.commentAuthor}>{authorName}</Text>
              {isCurrentUserComment && (
                <View style={styles.youBadge}>
                  <Text style={styles.youText}>You</Text>
                </View>
              )}
            </View>
            <Text style={styles.commentTime}>{formatTime(item.created_at)}</Text>
          </View>
          <Text style={styles.commentText}>{item.content}</Text>
        </View>

        {isCurrentUserComment ? (
          <TouchableOpacity
            style={styles.kebabButton}
            onPress={() => {
              Alert.alert('Delete comment', 'Are you sure you want to delete this comment?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    const res = await deleteComment(item.id);
                    if (!res.success) {
                      Alert.alert('Could not delete', res.error?.message || 'Delete failed');
                    }
                  },
                },
              ]);
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Modern Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Comments</Text>
            <Text style={styles.commentCount}>
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>

        {/* Post Preview */}
        <View style={styles.postPreview}>
          <View style={styles.postHeader}>
            <Image
              source={post?.is_anonymous ? 
                require('../../../assets/profile_page_icons/profile_default_bg.png') : // FIXED: Use existing image
                (post?.author?.avatar_url ? 
                  { uri: post.author.avatar_url } : 
                  require('../../../assets/profile_page_icons/default_profile_icon.png')
                )
              }
              style={styles.postAvatar}
            />
            <View style={styles.postInfo}>
              <View style={styles.authorRow}>
                <Text style={styles.authorName}>
                  {post?.is_anonymous ? (post.anonymous_name || 'Anonymous') : (post.author?.display_name || 'User')}
                </Text>
                {!post?.is_anonymous && (
                  <View style={[
                    styles.roleBadge,
                    post?.author?.user_type === 'faculty' ? styles.facultyBadge : styles.studentBadge
                  ]}>
                    <Ionicons 
                      name={post?.author?.user_type === 'faculty' ? 'person-outline' : 'school-outline'} 
                      size={10} 
                      color={colors.white} 
                    />
                    <Text style={styles.roleText}>
                      {post?.author?.user_type === 'faculty' ? 'Faculty' : 'Student'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.postTime}>{formatTime(post?.created_at)}</Text>
            </View>
          </View>
          
          <Text style={styles.postContent} numberOfLines={3}>
            {post?.content}
          </Text>
        </View>

        {/* Comments List */}
        <View style={styles.commentsContainer}>
          {comments.length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={renderComment}
              contentContainerStyle={styles.commentsList}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.commentSeparator} />}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>No comments yet</Text>
              <Text style={styles.emptySubtitle}>Be the first to share your thoughts</Text>
            </View>
          )}
        </View>

        {/* Enhanced Input Section with proper safe area */}
        <View style={[styles.inputSection, { marginBottom: keyboardHeight > 0 ? 30 : 0 }]}>
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Write a comment..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.input}
                multiline
                textAlignVertical="center" // This ensures text is vertically centered
              />
            </View>
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                !text.trim() && styles.sendButtonDisabled
              ]} 
              onPress={handleSend}
              disabled={!text.trim()}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={text.trim() ? colors.white : 'rgba(255,255,255,0.3)'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const t = new Date(timestamp);
  const diff = (now - t) / 1000; // seconds
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  container: {
    flex: 1,
  },
  
  // Header - Modern & Minimal
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: colors.homeBackground,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 2,
  },
  commentCount: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.5)',
  },
  headerRight: {
    width: 32,
  },

  // Post Preview - Minimal
  postPreview: {
    padding: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  postInfo: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    marginRight: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  facultyBadge: {
    backgroundColor: 'rgba(139, 69, 255, 0.2)',
  },
  studentBadge: {
    backgroundColor: 'rgba(55, 120, 255, 0.2)',
  },
  roleText: {
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  postTime: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: fonts.normal,
    fontSize: 12,
  },
  postContent: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: fonts.normal,
    fontSize: 15,
    lineHeight: 20,
  },

  // Comments Container
  commentsContainer: {
    flex: 1,
  },
  commentsList: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  commentRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  firstComment: {
    paddingTop: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  currentUserCommentContent: {
    backgroundColor: 'rgba(55, 120, 255, 0.1)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAuthor: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    marginRight: 6,
  },
  youBadge: {
    backgroundColor: '#3778FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  youText: {
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  commentTime: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: fonts.normal,
    fontSize: 11,
  },
  commentText: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: fonts.normal,
    fontSize: 14,
    lineHeight: 18,
  },
  kebabButton: {
    padding: 8,
    marginLeft: 4,
  },
  commentSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fonts.medium,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: fonts.normal,
    fontSize: 14,
    textAlign: 'center',
  },

  // Enhanced Input Section with proper safe area and centered alignment
  inputSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    backgroundColor: colors.homeBackground,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center', // This ensures both input and button are vertically centered
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 48, // Fixed minimum height for better touch area
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center', // Center the text input content
  },
  input: {
    color: colors.white,
    fontFamily: fonts.normal,
    fontSize: 16,
    padding: 0,
    marginRight: 12,
    // These properties ensure the text is vertically centered
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    textAlignVertical: 'center', // This is key for vertical centering
    minHeight: 20, // Minimum height for single line
    maxHeight: 80, // Maximum height for multiline
    includeFontPadding: false, // Remove extra font padding for better alignment
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3778FF',
    justifyContent: 'center',
    alignItems: 'center',
    // No marginBottom needed since we're using alignItems: 'center' in parent
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

export default CommentScreen;