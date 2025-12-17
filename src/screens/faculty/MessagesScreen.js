// src/screens/student/MessagesScreen.js
import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  RefreshControl,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabase';

export default function MessagesScreen({ navigation }) {
  const { user } = useContext(UserContext);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Header animations
  const headerHeight = scrollY.interpolate({ 
    inputRange: [0, 100], 
    outputRange: [160, 80], 
    extrapolate: 'clamp' 
  });
  
  const headerTitleOpacity = scrollY.interpolate({ 
    inputRange: [0, 60], 
    outputRange: [1, 0], 
    extrapolate: 'clamp' 
  });
  
  const collapsedTitleOpacity = scrollY.interpolate({ 
    inputRange: [0, 60, 100], 
    outputRange: [0, 0, 1], 
    extrapolate: 'clamp' 
  });

  const stickySectionTop = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [160, 80],
    extrapolate: 'clamp',
  });

  // Message categories
  const categories = [
    { id: 'all', label: 'All', icon: 'chatbubbles-outline' },
    { id: 'unread', label: 'Unread', icon: 'mail-unread-outline' },
    { id: 'followers', label: 'Followers', icon: 'person-add-outline' },
    { id: 'following', label: 'Following', icon: 'person-outline' },
  ];

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch conversations from database
  const fetchConversations = useCallback(async (searchQuery = '') => {
    if (!user?.id) return;
    try {
      setLoading(true);
      // Get users that current user follows
      let includeLastActive = true;
      const selectWithLast = `following_user_id, profiles:following_user_id ( id, display_name, username, avatar_url, role, student_id, school_email, last_active_at )`;
      let { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select(selectWithLast)
        .eq('follower_user_id', user.id);

      if (followingError && followingError.code === '42703' && /last_active_at/.test(followingError.message || '')) {
        includeLastActive = false;
        const selectNoLast = `following_user_id, profiles:following_user_id ( id, display_name, username, avatar_url, role, student_id, school_email )`;
        const retry = await supabase.from('follows').select(selectNoLast).eq('follower_user_id', user.id);
        followingData = retry.data;
        followingError = retry.error;
      }
      if (followingError) {
        console.error('Error fetching following:', followingError);
        return;
      }
      // Get users that follow current user
      const selectWithLastFollowers = `follower_user_id, profiles:follower_user_id ( id, display_name, username, avatar_url, role, student_id, school_email${includeLastActive ? ', last_active_at' : ''} )`;
      let { data: followersData, error: followersError } = await supabase
        .from('follows')
        .select(selectWithLastFollowers)
        .eq('following_user_id', user.id);

      if (followersError && followersError.code === '42703' && /last_active_at/.test(followersError.message || '')) {
        const selectNoLastFollowers = `follower_user_id, profiles:follower_user_id ( id, display_name, username, avatar_url, role, student_id, school_email )`;
        const retryF = await supabase.from('follows').select(selectNoLastFollowers).eq('following_user_id', user.id);
        followersData = retryF.data;
        followersError = retryF.error;
      }
      if (followersError) {
        console.error('Error fetching followers:', followersError);
        return;
      }
      // Combine and deduplicate users
      const contactUsers = new Map();
      // Add users that current user follows
      followingData?.forEach(follow => {
        if (follow.following_user_id !== user.id && follow.profiles) {
          const userData = follow.profiles;
          const lastActive = userData.last_active_at;
          const isOnline = lastActive ? (Date.now() - new Date(lastActive).getTime() < 2 * 60 * 1000) : false;
          contactUsers.set(userData.id, {
            user_id: userData.id,
            display_name: userData.display_name,
            username: userData.username,
            avatar_url: userData.avatar_url,
            role: userData.role,
            student_id: userData.student_id,
            school_email: userData.school_email,
            conversation_id: null,
            unread_count: 0,
            last_message: 'Start a conversation...',
            last_message_at: null,
            is_read: false,
            last_message_sender_id: null,
            last_active_at: lastActive,
            is_online: isOnline,
          });
        }
      });
      // Add users that follow current user
      followersData?.forEach(follow => {
        if (follow.follower_user_id !== user.id && follow.profiles) {
          const userData = follow.profiles;
          const lastActive = userData.last_active_at;
          const isOnline = lastActive ? (Date.now() - new Date(lastActive).getTime() < 2 * 60 * 1000) : false;
          contactUsers.set(userData.id, {
            user_id: userData.id,
            display_name: userData.display_name,
            username: userData.username,
            avatar_url: userData.avatar_url,
            role: userData.role,
            student_id: userData.student_id,
            school_email: userData.school_email,
            conversation_id: null,
            unread_count: 0,
            last_message: 'Start a conversation...',
            last_message_at: null,
            is_read: false,
            last_message_sender_id: null,
            last_active_at: lastActive,
            is_online: isOnline,
          });
        }
      });
      let conversationsList = Array.from(contactUsers.values());
      // Fetch last message for each contact
      for (let i = 0; i < conversationsList.length; i++) {
        const contact = conversationsList[i];
        // Get or create conversation id
        const { data: convIdData, error: convIdError } = await supabase
          .rpc('get_or_create_conversation', {
            user1_id: user.id,
            user2_id: contact.user_id
          });
        if (!convIdError && convIdData) {
          contact.conversation_id = convIdData;
          // Get last message
          const { data: lastMsgData, error: lastMsgError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convIdData)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!lastMsgError && lastMsgData) {
            contact.last_message = lastMsgData.content;
            contact.last_message_at = lastMsgData.created_at;
            contact.last_message_sender_id = lastMsgData.sender_id;
            // Unread logic: if last message is not sent by me and not read
            contact.is_read = lastMsgData.read_by?.includes(user.id) || lastMsgData.sender_id === user.id;
            contact.unread_count = (!contact.is_read && lastMsgData.sender_id !== user.id) ? 1 : 0;
          }
        }
      }
      // Filter by search query
      if (searchQuery.length > 0) {
        conversationsList = conversationsList.filter(conv => 
          conv.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.student_id?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      // Filter by active category
      if (activeCategory === 'unread') {
        conversationsList = conversationsList.filter(conv => conv.unread_count > 0);
      } else if (activeCategory === 'followers') {
        conversationsList = conversationsList.filter(conv => followersData?.some(f => f.profiles?.id === conv.user_id));
      } else if (activeCategory === 'following') {
        conversationsList = conversationsList.filter(conv => followingData?.some(f => f.profiles?.id === conv.user_id));
      }
      // Sort conversations so the most recently active chats appear first
      conversationsList.sort((a, b) => {
        const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return tb - ta;
      });

      setConversations(conversationsList);
    } catch (error) {
      console.error('Error in fetchConversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeCategory]);

  // Initial load and refetch on focus
  useEffect(() => {
    fetchConversations(debouncedQuery);
    const unsubscribe = navigation.addListener('focus', () => {
      fetchConversations(debouncedQuery);
    });
    return unsubscribe;
  }, [debouncedQuery, activeCategory, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations(debouncedQuery);
    setRefreshing(false);
  };

  const buildInitials = (displayName) => {
    if (!displayName) return 'USR';
    return displayName.split(' ').slice(0,2).map(s => s[0]).join('').toUpperCase().slice(0,3);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const messageDate = new Date(timestamp);
    
    if (now.toDateString() === messageDate.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (now.getTime() - messageDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message, maxLength = 40) => {
    if (!message) return 'Start a conversation...';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const handleConversationPress = async (conversation) => {
    if (!user?.id) return;

    try {
      navigation.navigate('Chat', { 
        recipient: {
          id: conversation.user_id,
          display_name: conversation.display_name,
          username: conversation.username,
          avatar_url: conversation.avatar_url,
          role: conversation.role,
          is_online: !!conversation.is_online,
        }
      });
    } catch (error) {
      console.error('Error in handleConversationPress:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // Render category chips
  const renderCategoryChip = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        activeCategory === item.id && styles.categoryChipSelected
      ]}
      onPress={() => setActiveCategory(item.id)}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={item.icon} 
        size={16} 
        color={activeCategory === item.id ? colors.homeBackground : colors.white} 
        style={styles.categoryIcon}
      />
      <Text style={[
        styles.categoryChipText,
        activeCategory === item.id && styles.categoryChipTextSelected
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  // Conversation Item - UPDATED: show last message, sender, check icon, high contrast unread
  const renderConversationItem = ({ item }) => {
    const initials = buildInitials(item.display_name);
    const isUnread = item.unread_count > 0;
    const isSentByMe = item.last_message_sender_id === user?.id;
    const isOnline = !!item.is_online;
    return (
      <TouchableOpacity 
        style={styles.conversationCard}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.profileLeft}>
          <View style={styles.avatarContainer}>
            {item.avatar_url ? (
              <Image 
                source={{ uri: item.avatar_url }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            {isUnread && <View style={styles.unreadDot} />}
            {isOnline && <View style={styles.onlineDot} />}
          </View>
          <View style={styles.conversationInfo}>
            <View style={styles.nameRow}>
              <Text style={[
                styles.profileName,
                isUnread && styles.unreadName
              ]} numberOfLines={1}>
                {item.display_name || 'Anonymous User'}
              </Text>
              <Text style={styles.timestamp}>
                {formatTimestamp(item.last_message_at)}
              </Text>
            </View>
            <View style={styles.messageRow}>
              <Text 
                style={[
                  styles.lastMessage,
                  isUnread ? styles.unreadMessage : styles.readMessage
                ]}
                numberOfLines={1}
              >
                {isSentByMe ? 'You: ' : ''}{truncateMessage(item.last_message)}
              </Text>
              {/* Sent check icon for my messages */}
              {isSentByMe && (
                <Ionicons name="checkmark-done" size={16} color="#fff" style={{ marginLeft: 4, opacity: 0.7 }} />
              )}
              {isUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread_count}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />

      {/* Animated Header */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <ImageBackground 
          source={require('../../../assets/create_post_screen_icons/createpost_header_bg.png')} 
          style={styles.headerBackground} 
          resizeMode="cover"
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>Connect with your followers and following</Text>
          </View>
        </ImageBackground>
      </Animated.View>

      {/* Sticky Search & Categories Section */}
      <Animated.View style={[styles.stickySection, { top: stickySectionTop }]}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={renderCategoryChip}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      </Animated.View>

      {/* Conversations List */}
      <View style={styles.resultsContainer}>
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.user_id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={colors.white} 
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={loading ? "refresh-outline" : "people-outline"} 
                size={64} 
                color="rgba(255,255,255,0.3)" 
              />
              <Text style={styles.emptyText}>
                {loading ? 'Loading contacts...' : 
                 debouncedQuery ? 'No contacts found' : 
                 'No contacts yet'}
              </Text>
              {!debouncedQuery && !loading && (
                <Text style={styles.emptySubtext}>
                  Follow other users to start conversations
                </Text>
              )}
            </View>
          )}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: colors.homeBackground 
  },
  headerContainer: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 10, 
    overflow: 'hidden' 
  },
  headerBackground: { 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerContent: { 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  headerTitle: { 
    fontSize: 28, 
    fontFamily: fonts.bold, 
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerSubtitle: { 
    fontSize: 16, 
    fontFamily: fonts.normal, 
    color: 'rgba(255,255,255,0.8)', 
    marginTop: 8,
    textAlign: 'center',
  },
  stickySection: { 
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20, 
    backgroundColor: colors.homeBackground, 
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  resultsContainer: {
    flex: 1,
    marginTop: 200,
  },
  searchContainer: { 
    paddingHorizontal: 20, 
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    minHeight: 44,
  },
  searchIcon: { 
    marginRight: 8 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16,
    fontFamily: fonts.normal, 
    color: colors.white,
    padding: 0,
    margin: 0,
  },
  categoriesSection: { 
    paddingTop: 6,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 90,
  },
  categoryChipSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.9)',
  },
  categoryChipTextSelected: {
    color: colors.homeBackground,
    fontFamily: fonts.semiBold,
  },
  listContent: { 
    paddingTop: 85,
    paddingBottom: 60,
    flexGrow: 1,
  },
  conversationCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minHeight: 80,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: { 
    width: 52, 
    height: 52, 
    borderRadius: 26,
  },
  avatarPlaceholder: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  avatarInitials: { 
    color: colors.white, 
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
    borderWidth: 2,
    borderColor: colors.homeBackground,
  },
  conversationInfo: { 
    flex: 1, 
    flexShrink: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  profileName: { 
    fontSize: 16, 
    fontFamily: fonts.medium, 
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
    marginRight: 8,
  },
  unreadName: {
    color: '#fff',
    fontFamily: fonts.semiBold,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: '#fff',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: fonts.normal,
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: '#fff',
    fontFamily: fonts.medium,
    fontWeight: 'bold',
  },
  readMessage: {
    color: 'rgba(255,255,255,0.6)',
  },
  unreadBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  emptyContainer: { 
    padding: 40, 
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyText: { 
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: colors.homeBackground,
  },
});