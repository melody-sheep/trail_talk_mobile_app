// src/screens/student/NotificationsScreen.js
import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { UserContext } from '../../contexts/UserContext';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  SectionList,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import useNotifications from '../../hooks/useNotifications';

export default function NotificationsScreen({ navigation }) {
  const { user } = useContext(UserContext);
  const [showRaw, setShowRaw] = useState(false);
  
  const {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useNotifications(user?.id);

  // Ensure we fetch when the signed-in user becomes available (avoid race conditions)
  useEffect(() => {
    if (user?.id) {
      console.log('NotificationsScreen: signed-in user id=', user.id);
      fetchNotifications();
    }
  }, [user?.id]);

  // Debug: log notification count when notifications update
  useEffect(() => {
    console.log('NotificationsScreen: notifications.length=', notifications.length);
  }, [notifications.length]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

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
    outputRange: [0, 0, -40], // Sticks until header collapses, then moves up
    extrapolate: 'clamp',
  });

  // Group notifications by Today and Earlier
  const groupNotificationsByTime = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayNotifications = notifications.filter(notification => 
      new Date(notification.timestamp) >= today
    );

    const earlierNotifications = notifications.filter(notification => 
      new Date(notification.timestamp) < today
    );

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

  

  // useNotifications hook provides fetchNotifications/mark handlers and state
  // destructured above

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'like': return 'heart';
      case 'comment': return 'chatbubble';
      case 'follow': return 'person-add';
      case 'community': return 'people';
      case 'system': return 'megaphone';
      case 'mention': return 'at';
      case 'repost': return 'repeat';
      case 'achievement': return 'trophy';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'like': return '#FF6B6B';
      case 'comment': return '#4ECDC4';
      case 'follow': return '#45B7D1';
      case 'community': return '#96CEB4';
      case 'system': return '#FFD166';
      case 'mention': return '#A882DD';
      case 'repost': return '#6A8EAE';
      case 'achievement': return '#FF9F1C';
      default: return '#8A8A8A';
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const renderNotificationItem = ({ item }) => {
    console.log('Rendering notification item:', item.id, 'isRead=', item.isRead);
    return (
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
          <Text style={styles.avatarInitials}>{item.initials}</Text>
          {/* Notification Icon */}
          <View style={styles.notificationIcon}>
            <Ionicons 
              name={getNotificationIcon(item.type)} 
              size={12} 
              color={colors.white} 
            />
          </View>
        </View>
        {/* Unread Indicator - Top Left */}
        {!item.isRead && <View style={styles.unreadIndicator} />}
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Header Row: Display Name & Timestamp */}
        <View style={styles.headerRow}>
          <Text style={styles.displayName}>{item.displayName}</Text>
          <Text style={styles.timestamp}>{item.time}</Text>
        </View>
        
        {/* Simple Description */}
        <Text style={styles.notificationDescription}>{item.description}</Text>
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
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
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
              top: 160 // Position below the header
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
        ref={scrollViewRef}
        style={[
          styles.container,
          { marginTop: unreadCount > 0 ? 210 : 160 } // Adjust based on sticky section
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
            <Text style={styles.emptyText}>You're all caught up — no notifications.</Text>
          </View>
        )}
        {/* Notifications List with Today/Earlier Sections */}
        <SectionList
          sections={notificationSections}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          renderSectionHeader={renderSectionHeader}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sectionListContent}
        />

        {/* Debug Controls: Refresh and raw JSON toggle */}
        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={[styles.markAllButton, { flex: 1 }]}
              onPress={() => {
                console.log('Debug: manual refresh requested');
                fetchNotifications();
              }}
            >
              <Text style={styles.markAllText}>Refresh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.markAllButton, { flex: 1 }]}
              onPress={() => setShowRaw(v => !v)}
            >
              <Text style={styles.markAllText}>{showRaw ? 'Hide Raw' : 'Show Raw'}</Text>
            </TouchableOpacity>
          </View>

          {showRaw && (
            <ScrollView style={{ maxHeight: 260, marginTop: 12, backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 }}>
              <Text style={{ color: 'white', fontFamily: fonts.normal, fontSize: 12 }}>
                {JSON.stringify(notifications, null, 2)}
              </Text>
            </ScrollView>
          )}
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
  // MAIN HEADER BACKGROUND
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
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
  // STICKY SECTION - SEPARATE FROM HEADER
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
    marginTop: 10,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    marginRight: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    position: 'relative',
  },
  avatarInitials: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  notificationIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1.5,
    borderColor: colors.homeBackground,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.white,
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 8,
  },
  notificationDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  kebabButton: {
    padding: 4,
    alignSelf: 'flex-start',
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
  }
});