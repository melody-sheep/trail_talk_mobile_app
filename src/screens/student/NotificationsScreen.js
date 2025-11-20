// src/screens/student/NotificationsScreen.js
import React, { useState, useContext, useRef } from 'react';
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
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';

export default function NotificationsScreen({ navigation }) {
  const { user } = useContext(UserContext);
  
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'like',
      description: 'Liked your post about campus events',
      time: '2 mins ago',
      timestamp: new Date(),
      isRead: false,
      displayName: 'Alex Johnson',
      initials: 'AJ',
    },
    {
      id: '2',
      type: 'comment',
      description: 'Commented on your academic post',
      time: '15 mins ago',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      isRead: false,
      displayName: 'Sarah Chen',
      initials: 'SC',
    },
    {
      id: '3',
      type: 'follow',
      description: 'Started following you',
      time: '1 hour ago',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      isRead: true,
      displayName: 'Mike Rodriguez',
      initials: 'MR',
    },
    {
      id: '4',
      type: 'community',
      description: 'Joined your Computer Science Club',
      time: '3 hours ago',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      isRead: true,
      displayName: 'Emily Davis',
      initials: 'ED',
    },
    {
      id: '5',
      type: 'system',
      description: 'Library will close early tomorrow for maintenance',
      time: '5 hours ago',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isRead: true,
      displayName: 'Campus Admin',
      initials: 'CA',
    },
    {
      id: '6',
      type: 'mention',
      description: 'Mentioned you in a faculty announcement',
      time: '1 day ago',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isRead: true,
      displayName: 'Dr. Wilson',
      initials: 'DW',
    },
    {
      id: '7',
      type: 'repost',
      description: 'Reposted your event announcement',
      time: '1 day ago',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isRead: true,
      displayName: 'Campus News',
      initials: 'CN',
    },
    {
      id: '8',
      type: 'achievement',
      description: 'You earned the "Active Contributor" badge',
      time: '2 days ago',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isRead: true,
      displayName: 'System',
      initials: 'SYS',
    }
  ]);

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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleDeleteNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

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

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.notificationCard,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleMarkAsRead(item.id)}
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
              onPress={handleMarkAllAsRead}
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
});