import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../styles/colors';
import { fonts } from '../styles/fonts';

const { width: screenWidth } = Dimensions.get('window');

export default function HeaderWithTabs({ userRole = 'student', onFilterPress, navigation, activeTab, onTabChange }) {
  const animation = useRef(new Animated.Value(activeTab === 'forYou' ? 0 : 1)).current;

  const profileIcon = userRole === 'student' 
    ? require('../../assets/std_fcty_homescreen_icons/student_profile.png')
    : require('../../assets/std_fcty_homescreen_icons/faculty_profile.png');

  const tabWidth = screenWidth / 2;
  const vectorWidth = 80; // Match your vector image width

  // PROFILE PRESS HANDLER - NAVIGATES TO PROFILE SCREEN
  const handleProfilePress = () => {
    console.log('Profile pressed - navigating to profile screen');
    if (userRole === 'student') {
      navigation.navigate('StudentProfile');
    } else {
      navigation.navigate('FacultyProfile');
    }
  };

  const handleTabPress = (tab) => {
    onTabChange(tab);
    
    const position = tab === 'forYou' ? 0 : 1;
    Animated.timing(animation, {
      toValue: position,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Calculate the center position for each tab
  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      (tabWidth - vectorWidth) / 2, // Center of first tab
      tabWidth + (tabWidth - vectorWidth) / 2 // Center of second tab
    ],
  });

  return (
    <View style={styles.headerContainer}>
      {/* Top Row: Profile Icon - Logo - Filter Icon */}
      <View style={styles.topRow}>
        {/* PROFILE ICON WITH NAVIGATION */}
        <TouchableOpacity style={styles.iconButton} onPress={handleProfilePress}>
          <Image source={profileIcon} style={styles.profileIcon} />
        </TouchableOpacity>
        
        <Image 
          source={require('../../assets/std_fcty_homescreen_icons/dashboard_applogo.png')} 
          style={styles.logo}
        />
        
        <TouchableOpacity style={styles.iconButton} onPress={onFilterPress}>
          <Image 
            source={require('../../assets/std_fcty_homescreen_icons/filter_icon.png')} 
            style={styles.filterIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs Container with Bottom Border */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={styles.tab}
            onPress={() => handleTabPress('forYou')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'forYou' ? styles.tabTextActive : styles.tabTextInactive
            ]}>
              For you
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tab}
            onPress={() => handleTabPress('following')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'following' ? styles.tabTextActive : styles.tabTextInactive
            ]}>
              Following
            </Text>
          </TouchableOpacity>

          {/* Animated Horizontal Vector */}
          <Animated.View 
            style={[
              styles.horizontalVector,
              { transform: [{ translateX }] }
            ]}
          >
            <Image 
              source={require('../../assets/std_fcty_homescreen_icons/horizontal_vector.png')} 
              style={styles.vectorImage}
            />
          </Animated.View>
        </View>
        
        {/* Full width bottom border */}
        <View style={styles.bottomBorder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.homeBackground,
    paddingTop: 15,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  iconButton: {
    padding: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  filterIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.tabBorder,
    position: 'relative',
  },
  tabsContainer: {
    flexDirection: 'row',
    position: 'relative',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12, // Increased padding for better touch area
    position: 'relative',
  },
  tabText: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: colors.tabActive,
  },
  tabTextInactive: {
    color: colors.tabInactive,
  },
  horizontalVector: {
    position: 'absolute',
    bottom: 0, // Position right at the bottom
    alignItems: 'center',
  },
  vectorImage: {
    width: 80,
    height: 6,
    resizeMode: 'contain',
  },
  bottomBorder: {
    height: 1,
    backgroundColor: colors.tabBorder,
    width: '100%',
  },
});