// src/screens/student/NotificationsScreen.js
import React, { useState, useContext, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserContext } from '../../contexts/UserContext';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  SectionList,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import useNotifications from '../../hooks/useNotifications';

export default function NotificationsScreen({ navigation }) {
  const { user } = useContext(UserContext);
  
  const {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useNotifications(user?.id);

  // Ensure we fetch when the signed-in user becomes available
  useEffect(() => {
    if (user?.id) {
      console.log('NotificationsScreen: signed-in user id=', user.id);
      fetchNotifications();
    }
  }, [user?.id]);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Animation values for header background
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [160, 100],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const collapsedTitleOpacity = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  // Sticky section behavior
  const stickySectionTranslateY = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [0, 0, -40],
    extrapolate: 'clamp',
  });

  // Group notifications by Today and Earlier with limits
  const groupNotificationsByTime = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayNotifications = notifications
      .filter(notification => new Date(notification.timestamp) >= today)
      .slice(0, 5); // Limit to 5 today notifications

    const earlierNotifications = notifications
      .filter(notification => new Date(notification.timestamp) < today)
      .slice(0, 7); // Limit to 7 earlier notifications

    return [
      {
        title: 'Today',
        data: todayNotifications
      },
      {
        title: 'Earlier',
        data: earlierNotifications
      }
    ];
  };

  const notificationSections = groupNotificationsByTime();

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'like': 
      case 'post_like': return 'heart';
      case 'comment': return 'chatbubble';
      case 'follow': return 'person-add';
      case 'community': 
      case 'community_post': return 'people';
      case 'system': return 'megaphone';
      case 'mention': return 'at';
      case 'repost': return 'repeat';
      case 'achievement': return 'trophy';
      case 'bookmark': return 'bookmark';
      case 'post_created': return 'create';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'like': 
      case 'post_like': return '#FF6B6B';
      case 'comment': return '#4ECDC4';
      case 'follow': return '#45B7D1';
      case 'community': 
      case 'community_post': return '#96CEB4';
      case 'system': return '#FFD166';
      case 'mention': return '#A882DD';
      case 'repost': return '#6A8EAE';
      case 'achievement': return '#FF9F1C';
      case 'bookmark': return '#118AB2';
      case 'post_created': return '#06D6A0';
      default: return '#8A8A8A';
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);
              
              if (error) {
                console.error('Error deleting notification:', error);
                Alert.alert('Error', 'Failed to delete notification');
              } else {
                // Refresh the list after deletion
                fetchNotifications();
              }
            } catch (err) {
              console.error('Error deleting notification:', err);
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.notificationCard,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.7}
    >
      {/* Avatar with Unread Indicator */}
      <View style={styles.avatarContainer}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: getNotificationColor(item.type) }]}>
          <Ionicons 
            name={getNotificationIcon(item.type)} 
            size={20} 
            color={colors.white} 
          />
        </View>
        {/* Unread Indicator - Top Left */}
        {!item.isRead && <View style={styles.unreadIndicator} />}
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <Text style={styles.notificationDescription}>{item.description}</Text>
        <Text style={styles.timestamp}>{item.time}</Text>
      </View>

      {/* Kebab Menu */}
      <TouchableOpacity 
        style={styles.kebabButton}
        onPress={() => handleDeleteNotification(item.id)}
      >
        <Ionicons name="ellipsis-vertical" size={16} color="rgba(255, 255, 255, 0.6)" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>({section.data.length})</Text>
      <View style={styles.sectionLine} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      {/* MAIN HEADER BACKGROUND */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <ImageBackground 
          source={require('../../../assets/create_post_screen_icons/createpost_header_bg.png')}
          style={styles.headerBackground}
          resizeMode="cover"
        >
          {/* Expanded Header Content */}
          <Animated.View style={[styles.headerContent, { opacity: headerTitleOpacity }]}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>Stay updated with campus activities</Text>
          </Animated.View>

          {/* Collapsed Header Content */}
          <Animated.View style={[styles.collapsedHeaderContent, { opacity: collapsedTitleOpacity }]}>
            <Text style={styles.collapsedHeaderTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.collapsedBadge}>
                <Text style={styles.collapsedBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </Animated.View>
        </ImageBackground>
      </Animated.View>

      {/* STICKY MARK ALL AS READ SECTION - BELOW HEADER */}
      {unreadCount > 0 && (
        <Animated.View 
          style={[
            styles.stickySection,
            { 
              transform: [{ translateY: stickySectionTranslateY }],
              top: 160
            }
          ]}
        >
          <View style={styles.stickySectionContent}>
            <TouchableOpacity 
              style={styles.markAllButton}
              onPress={markAllAsRead}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-done-outline" size={16} color={colors.white} />
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* SCROLL CONTENT */}
      <ScrollView 
        style={[
          styles.container,
          { marginTop: unreadCount > 0 ? 210 : 160 }
        ]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Loading / Error / Empty states */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.white} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to load notifications</Text>
            <Text style={styles.errorMessage}>{error.message || String(error)}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && notifications.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>You're all caught up — no notifications.</Text>
          </View>
        )}

        {/* Notifications List with Today/Earlier Sections */}
        {!loading && !error && notifications.length > 0 && (
          <SectionList
            sections={notificationSections}
            keyExtractor={(item) => item.id}
            renderItem={renderNotificationItem}
            renderSectionHeader={renderSectionHeader}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sectionListContent}
          />
        )}

        {/* Simple Refresh Button */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <TouchableOpacity
            style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
            onPress={fetchNotifications}
            disabled={loading}
          >
            <Ionicons name="refresh" size={16} color={colors.white} />
            <Text style={styles.refreshText}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
    refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  refreshText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
    marginLeft: 8,
  },
  headerBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  collapsedHeaderContent: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  collapsedHeaderTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  collapsedBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedBadgeText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  stickySection: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 15,
    backgroundColor: colors.homeBackground,
  },
  stickySectionContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  markAllText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
    marginLeft: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  refreshText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
    marginLeft: 8,
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  sectionListContent: {
    paddingBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    marginRight: 8,
  },
  sectionCount: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  unreadNotification: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadIndicator: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
    borderWidth: 2,
    borderColor: colors.homeBackground,
  },
  contentSection: {
    flex: 1,
    marginRight: 12,
  },
  notificationDescription: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
    lineHeight: 18,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  kebabButton: {
    padding: 4,
  },
  bottomSpacer: {
    height: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: fonts.medium,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: colors.white,
    fontFamily: fonts.bold,
    marginBottom: 8,
  },
  errorMessage: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  retryText: {
    color: colors.white,
    fontFamily: fonts.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.medium,
    marginTop: 12,
    textAlign: 'center',
  }
});




