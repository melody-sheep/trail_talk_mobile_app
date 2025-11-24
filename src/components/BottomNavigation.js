// src/components/BottomNavigation.js
import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../styles/colors';

export default function BottomNavigation({ userRole, state }) {
  const navigation = useNavigation();
  const route = useRoute();

  const getActiveTab = () => {
    if (!state) return 'Home';
    
    const currentRoute = state.routes[state.index].name;
    
    if (currentRoute === 'StudentHome' || currentRoute === 'FacultyHome') return 'Home';
    if (currentRoute === 'StudentSearch' || currentRoute === 'FacultySearch') return 'Search';
    if (currentRoute === 'StudentSupport' || currentRoute === 'FacultySupport') return 'Support';
    if (currentRoute === 'StudentCommunity' || currentRoute === 'FacultyCommunity') return 'Community';
    if (currentRoute === 'StudentNotifications' || currentRoute === 'FacultyNotifications') return 'Notifications';
    if (currentRoute === 'StudentMessages' || currentRoute === 'FacultyMessages') return 'Messages';
    return 'Home';
  };

  const activeTab = getActiveTab();

  const tabs = [
    { 
      id: 'Home', 
      icon: require('../../assets/bottom_navigation_icons/home_icon_no_fill.png'), 
      activeIcon: require('../../assets/bottom_navigation_icons/home_icon_fill.png'),
      screenName: userRole === 'student' ? 'StudentHome' : 'FacultyHome'
    },
    { 
      id: 'Search', 
      icon: require('../../assets/bottom_navigation_icons/search_icon_no_fill.png'), 
      activeIcon: require('../../assets/bottom_navigation_icons/search_icon_fill.png'),
      screenName: userRole === 'student' ? 'StudentSearch' : 'FacultySearch'
    },
    { 
      id: 'Support', 
      icon: require('../../assets/bottom_navigation_icons/heart_icon_no_fill.png'), 
      activeIcon: require('../../assets/bottom_navigation_icons/heart_icon_fill.png'),
      screenName: userRole === 'student' ? 'StudentSupport' : 'FacultySupport'
    },
    { 
      id: 'Community', 
      icon: require('../../assets/bottom_navigation_icons/community_icon_no_fill.png'), 
      activeIcon: require('../../assets/bottom_navigation_icons/community_icon_fill.png'),
      screenName: userRole === 'student' ? 'StudentCommunity' : 'FacultyCommunity'
    },
    { 
      id: 'Notifications', 
      icon: require('../../assets/bottom_navigation_icons/bell_icon_no_fill.png'), 
      activeIcon: require('../../assets/bottom_navigation_icons/bell_icon_fill.png'),
      screenName: userRole === 'student' ? 'StudentNotifications' : 'FacultyNotifications'
    },
    { 
      id: 'Messages', 
      icon: require('../../assets/bottom_navigation_icons/message_icon_no_fill.png'), 
      activeIcon: require('../../assets/bottom_navigation_icons/message_icon_fill.png'),
      screenName: userRole === 'student' ? 'StudentMessages' : 'FacultyMessages'
    },
  ];

  const handleTabPress = (tab) => {
    navigation.navigate(tab.screenName);
  };

  const handleFABPress = () => {
    console.log('FAB button pressed - Navigating to Create Post');
    
    try {
      if (userRole === 'student') {
        navigation.navigate('StudentCreatePost');
      } else if (userRole === 'faculty') {
        navigation.navigate('FacultyCreatePost');
      }
    } catch (error) {
      console.log('Navigation error:', error);
    }
  };

  const handleReportPress = () => {
    try {
      navigation.navigate('ReportDashboard');
    } catch (err) {
      console.log('Report navigation error', err);
    }
  };

  const renderTabIcon = (tab) => {
    const isActive = activeTab === tab.id;
    const iconSource = isActive ? tab.activeIcon : tab.icon;

    return (
      <View style={styles.iconWrapper}>
        <Image 
          source={iconSource} 
          style={[
            styles.icon, 
            isActive && styles.activeIcon,
            isActive && styles.glowEffect
          ]}
          resizeMode="contain"
        />
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      {/* FAB Button */}
      <View style={styles.fabContainer}>
        {/* Report FAB - Faculty only */}
        {userRole === 'faculty' && (
          <TouchableOpacity
            style={styles.reportFabButton}
            onPress={handleReportPress}
            activeOpacity={0.8}
          >
            <MaterialIcons name="flag" size={20} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Create Post FAB */}
        <TouchableOpacity
          style={[styles.fabButton, styles.createFabPosition]}
          onPress={handleFABPress}
          activeOpacity={0.7}
        >
          <Image 
            source={require('../../assets/bottom_navigation_icons/fab_icon.png')} 
            style={[styles.fabIcon, styles.fabGlowEffect]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.container}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => handleTabPress(tab)}
            activeOpacity={0.7}
          >
            {renderTabIcon(tab)}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: colors.homeBackground,
    position: 'relative',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: colors.homeBackground,
    borderTopWidth: 0.5,
    borderTopColor: '#434343',
    paddingHorizontal: 8,
    paddingVertical: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    flex: 1,
  },
  iconWrapper: {},
  icon: {
    width: 25,
    height: 25,
  },
  activeIcon: {
    transform: [{ scale: 1.2 }],
  },
  glowEffect: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  fabContainer: {
    position: 'absolute',
    right: 10,
    top: -90,
    zIndex: 10,
  },
  fabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  createFabPosition: {
    position: 'absolute',
    right: 0,
    bottom: -80,
    zIndex: 10,
  },
  reportFabButton: {
    position: 'absolute',
    right: 15,
    bottom: 0,
    backgroundColor: '#EF4444',
    width: 40,
    height: 40,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 12,
    elevation: 12,
  },
  fabIcon: {
    width: 56,
    height: 56,
  },
  fabGlowEffect: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
});