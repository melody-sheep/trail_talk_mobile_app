import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Image, ScrollView, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Post');
  const animation = useRef(new Animated.Value(0)).current;

  const tabs = ['Post', 'Replies', 'BookMarks', 'Like'];
  const tabWidth = screenWidth / tabs.length;
  const vectorWidth = 80;

  const handleTabPress = (tab, index) => {
    setActiveTab(tab);
    
    Animated.timing(animation, {
      toValue: index,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const translateX = animation.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: tabs.map((_, index) => 
      (tabWidth * index) + (tabWidth - vectorWidth) / 2
    ),
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image 
            source={require('../../../assets/profile_page_icons/back_button.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Profile</Text>
        
        <TouchableOpacity style={styles.searchButton}>
          <Image 
            source={require('../../../assets/profile_page_icons/search_icon.png')}
            style={styles.searchIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.coverSection}>
          <Image 
            source={require('../../../assets/profile_page_icons/profile_default_bg.png')}
            style={styles.coverImage}
          />
          
          <View style={styles.profileImageContainer}>
            <Image 
              source={require('../../../assets/profile_page_icons/default_profile_icon.png')}
              style={styles.profileImage}
            />
          </View>
          
          <View style={styles.editButtonRow}>
            <TouchableOpacity style={styles.editProfileButton}>
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.nameRow}>
            <Text style={styles.userName}>John Doe</Text>
            <View style={styles.roleFrame}>
              <Image 
                source={require('../../../assets/post_card_icons/student_icon.png')}
                style={styles.lockIcon}
              />
              <Text style={styles.userRole}>Student</Text>
            </View>
          </View>

          {/* Row 4: Birthday and Join Date with adjustable margins */}
          <View style={styles.infoRow}>
            <View style={[styles.infoItem, styles.birthdayItem]}>
              <Image 
                source={require('../../../assets/profile_page_icons/birthday_icon.png')}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>Not set</Text>
            </View>
            
            <View style={[styles.infoItem, styles.calendarItem]}>
              <Image 
                source={require('../../../assets/profile_page_icons/calendar_icon.png')}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>Joined August 20, 2025</Text>
            </View>
          </View>

          {/* Row 5: Following and Followers with adjustable margins */}
          <View style={styles.statsRow}>
            <View style={[styles.statItem, styles.followingItem]}>
              <Text style={styles.statNumber}>20</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            
            <View style={[styles.statItem, styles.followersItem]}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>

          <View style={styles.tabsWrapper}>
            <View style={styles.tabsContainer}>
              {tabs.map((tab, index) => (
                <TouchableOpacity 
                  key={tab}
                  style={styles.tab}
                  onPress={() => handleTabPress(tab, index)}
                >
                  <Text style={[
                    styles.tabText,
                    activeTab === tab ? styles.tabTextActive : styles.tabTextInactive
                  ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}

              <Animated.View 
                style={[
                  styles.horizontalVector,
                  { transform: [{ translateX }] }
                ]}
              >
                <Image 
                  source={require('../../../assets/profile_page_icons/horizontal_scroll_vector.png')} 
                  style={styles.vectorImage}
                />
              </Animated.View>
            </View>
            
            <View style={styles.tabsBottomBorder} />
          </View>
        </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.homeBackground,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 20,
    height: 22,
    resizeMode: 'contain',
    tintColor: colors.white,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  searchButton: {
    padding: 8,
  },
  searchIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    tintColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  coverSection: {
    marginBottom: 20,
  },
  coverImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  profileImageContainer: {
    position: 'absolute',
    top: 70,
    left: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: colors.homeBackground,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  editButtonRow: {
    marginTop: 10,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  editProfileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editProfileText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginTop: 0,
    marginBottom: 15,
  },
  userName: {
    fontSize: 25,
    fontFamily: fonts.bold,
    color: colors.white,
    marginRight: 12,
  },
  roleFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  lockIcon: {
    width: 12,
    height: 12,
    resizeMode: 'contain',
    tintColor: '#4CAF50',
    marginRight: 6,
  },
  userRole: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#4CAF50',
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // ADJUSTABLE MARGINS - Edit these values:
  birthdayItem: {
    marginLeft: 0,    // ← Adjust birthday left position
    marginRight: 'auto', // Pushes calendar to the right
  },
  calendarItem: {
    marginLeft: 'auto', // Pushes calendar to the right
    marginRight: 18,    // ← Adjust calendar right position
  },
  infoIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
    tintColor: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // ADJUSTABLE MARGINS - Edit these values:
  followingItem: {
    marginLeft: 0,    // ← Adjust following left position
    marginRight: 'auto', // Pushes followers to the right
  },
  followersItem: {
    marginLeft: 'auto', // Pushes followers to the right
    marginRight: 125,    // ← Adjust followers right position
  },
  statNumber: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginRight: 6,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tabsWrapper: {
    marginBottom: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    position: 'relative',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
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
    bottom: 0,
    alignItems: 'center',
  },
  vectorImage: {
    width: 80,
    height: 6,
    resizeMode: 'contain',
  },
  tabsBottomBorder: {
    height: 0.5,
    backgroundColor: '#434343',
    width: '100%',
  },
  bottomSpacer: {
    height: 30,
  },
});