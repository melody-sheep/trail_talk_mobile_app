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
  SafeAreaView,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from 'react-native';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import useComments from '../../hooks/useComments';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

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
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!post) {
      navigation.goBack();
    }
  }, [post]);

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
    const avatar = !isAnonymous
      ? (item.user?.avatar_url ? { uri: item.user.avatar_url } : require('../../../assets/profile_page_icons/default_profile_icon.png'))
      : require('../../../assets/profile_page_icons/profile_default_bg.png');

    const isCurrentUserComment = item.user_id === currentUser?.id;

    return (
      <View style={[
        styles.commentRow,
        index === 0 && styles.firstComment,
        isCurrentUserComment && styles.currentUserComment
      ]}>
        <Image source={avatar} style={styles.commentAvatar} />
        <View style={styles.commentContent}>
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
            <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <KeyboardAvoidingView
          style={styles.wrapper}
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
              <Ionicons name="chevron-back" size={28} color={colors.white} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.title}>Comments</Text>
              <Text style={styles.subtitle}>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</Text>
            </View>
            <View style={styles.headerRight} />
          </View>

          {/* Enhanced Post Preview */}
          <View style={styles.postPreview}>
            <View style={styles.postHeader}>
              <Image
                source={post?.is_anonymous ? require('../../../assets/profile_page_icons/profile_default_bg.png') : (post?.author?.avatar_url ? { uri: post.author.avatar_url } : require('../../../assets/profile_page_icons/default_profile_icon.png'))}
                style={styles.postAvatar}
              />
              <View style={styles.postMeta}>
                <View style={styles.postAuthorRow}>
                  <Text style={styles.postAuthor}>
                    {post?.is_anonymous ? (post.anonymous_name || 'Anonymous') : (post.author?.display_name || 'User')}
                  </Text>
                  {!post?.is_anonymous && (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>
                        {post?.author?.user_type === 'faculty' ? 'Faculty' : 'Student'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.postTime}>{formatTime(post?.created_at)}</Text>
              </View>
            </View>
            <View style={styles.postContentBox}>
              <Text style={styles.postContent} numberOfLines={3}>
                {post?.content}
              </Text>
            </View>
          </View>

          {/* Comments List with Enhanced UI */}
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
                <Ionicons name="chatbubble-outline" size={64} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyTitle}>No comments yet</Text>
                <Text style={styles.emptySubtitle}>Be the first to share your thoughts!</Text>
              </View>
            )}
          </View>

          {/* Enhanced Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Write your comment..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.input}
                multiline
                maxLength={500}
              />
              <View style={styles.inputActions}>
                <Text style={styles.charCount}>
                  {text.length}/500
                </Text>
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
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
  safe: { 
    flex: 1, 
    backgroundColor: colors.background || '#0A0A0A' 
  },
  wrapper: { 
    flex: 1 
  },
  
  // Modern Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(30,30,32,0.95)',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  title: { 
    fontSize: 18, 
    fontFamily: fonts.bold, 
    color: colors.white,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.5)',
  },
  headerRight: {
    width: 40,
  },

  // Enhanced Post Preview
  postPreview: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postMeta: {
    flex: 1,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  postAuthor: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    marginRight: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(55, 120, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleText: {
    color: '#3778FF',
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  postTime: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: fonts.normal,
    fontSize: 12,
  },
  postContentBox: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 12,
  },
  postContent: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: fonts.normal,
    fontSize: 14,
    lineHeight: 20,
  },

  // Comments Section
  commentsContainer: {
    flex: 1,
  },
  commentsList: {
    paddingHorizontal: 16,
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
  currentUserComment: {
    backgroundColor: 'rgba(55, 120, 255, 0.05)',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
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
    fontSize: 15,
    marginRight: 8,
  },
  youBadge: {
    backgroundColor: '#3778FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  youText: {
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  commentTime: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: fonts.normal,
    fontSize: 12,
  },
  commentText: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: fonts.normal,
    fontSize: 15,
    lineHeight: 20,
  },
  kebabButton: {
    padding: 8,
    marginLeft: 8,
  },
  commentSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 4,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.semiBold,
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: fonts.normal,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Enhanced Input Section
  inputSection: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: 'rgba(30,30,32,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24,
    padding: 12,
    paddingHorizontal: 16,
  },
  input: {
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: 'transparent',
    color: colors.white,
    fontFamily: fonts.normal,
    fontSize: 16,
    padding: 0,
    marginBottom: 8,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    color: 'rgba(255,255,255,0.3)',
    fontFamily: fonts.normal,
    fontSize: 12,
  },
  sendButton: {
    backgroundColor: '#3778FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

export default CommentScreen;