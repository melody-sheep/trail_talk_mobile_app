// src/screens/student/ChatScreen.js
import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabase';

export default function ChatScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useContext(UserContext);
  const { recipient } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  
  const flatListRef = useRef();

  // Set custom header
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerProfile}>
            <View style={{ position: 'relative' }}>
              {recipient.avatar_url ? (
                <Image 
                  source={{ uri: recipient.avatar_url }} 
                  style={styles.headerAvatar} 
                />
              ) : (
                <View style={styles.headerAvatarPlaceholder}>
                  <Text style={styles.headerAvatarInitials}>
                    {buildInitials(recipient.display_name)}
                  </Text>
                </View>
              )}
              {recipient.is_online && <View style={styles.onlineDotSmall} />}
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerName} numberOfLines={1}>
                {recipient.display_name || 'Unknown User'}
              </Text>
              <Text style={styles.headerRole}>
                {recipient.role === 'faculty' ? 'Faculty' : 'Student'}
              </Text>
            </View>
          </View>
        </View>
      ),
      headerStyle: {
        backgroundColor: colors.homeBackground,
      },
      headerTintColor: colors.white,
      headerBackTitleVisible: false,
    });
  }, [navigation, recipient]);

  const buildInitials = (displayName) => {
    if (!displayName) return 'USR';
    return displayName.split(' ').slice(0,2).map(s => s[0]).join('').toUpperCase().slice(0,3);
  };

  // Get or create conversation
  const getOrCreateConversation = async () => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: user.id,
          user2_id: recipient.id
        });

      if (error) {
        console.error('Error getting conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      return null;
    }
  };

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id || sending) return;

    try {
      setSending(true);
      
      let targetConversationId = conversationId;
      
      // Get conversation if we don't have one
      if (!targetConversationId) {
        targetConversationId = await getOrCreateConversation();
        if (!targetConversationId) {
          Alert.alert('Error', 'Failed to create conversation');
          return;
        }
        setConversationId(targetConversationId);
      }

      // Send message
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: targetConversationId,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (msgError) {
        console.error('Error sending message:', msgError);
        Alert.alert('Error', 'Failed to send message');
        return;
      }

      setNewMessage('');
      
    } catch (error) {
      console.error('Error in sendMessage:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const targetConversationId = await getOrCreateConversation();
      if (!targetConversationId) {
        setMessages([]);
        setConversationId(null);
        return;
      }

      setConversationId(targetConversationId);

      // Get messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', targetConversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error fetching messages:', error);
      if (!error.message.includes('infinite recursion')) {
        Alert.alert('Error', 'Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    if (!conversationId) return;

    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    fetchMessages();
  }, [user?.id, recipient.id]);

  // Render message item with improved visual hierarchy
  const renderMessageItem = ({ item }) => {
    const isMyMessage = item.sender_id === user.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.theirMessage
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.content}
          </Text>
        </View>
        <Text style={[
          styles.messageTime,
          isMyMessage ? styles.myMessageTime : styles.theirMessageTime
        ]}>
          {new Date(item.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : insets.bottom + 80}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
        {/* Messages List */}
        <View style={styles.messagesContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Send a message to start the conversation</Text>
              </View>
            )}
          />
        </View>
        {/* Message Input - Fixed safe area */}
        <View style={[styles.inputContainer, { paddingBottom: (insets.bottom > 0 ? insets.bottom : 16) + 24 }]}> 
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Message..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={!newMessage.trim() ? "rgba(255,255,255,0.3)" : colors.white}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  container: {
    flex: 1,
  },
  // Header Styles
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerAvatarInitials: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  headerRole: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  onlineDotSmall: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: colors.homeBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.white,
    fontFamily: fonts.normal,
    marginTop: 16,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesList: {
    paddingVertical: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  myMessage: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 6,
  },
  theirMessage: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    fontFamily: fonts.normal,
    lineHeight: 20,
  },
  myMessageText: {
    color: colors.white,
  },
  theirMessageText: {
    color: colors.white,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: fonts.normal,
    marginHorizontal: 12,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'left',
  },
  inputContainer: {
    backgroundColor: colors.homeBackground,
    paddingHorizontal: 16,
    paddingTop: 12,
    // paddingBottom is now set dynamically using insets.bottom
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
    maxHeight: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 0 : 2,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
});

//