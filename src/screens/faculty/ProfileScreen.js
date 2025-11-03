import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';

export default function FacultyProfileScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      {/* Header */}
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

      {/* Profile Content */}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header Section */}
        <View style={styles.profileHeader}>
          <Image 
            source={require('../../../assets/profile_page_icons/profile_default_bg.png')}
            style={styles.coverImage}
          />
          
          <View style={styles.profileInfo}>
            <Image 
              source={require('../../../assets/profile_page_icons/default_profile_icon.png')}
              style={styles.profileImage}
            />
            <Text style={styles.userName}>Dr. Jane Smith</Text>
            <Text style={styles.userRole}>Faculty</Text>
            <Text style={styles.userBio}>Computer Science Department</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>18</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>203</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>45</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.welcomeText}>This is faculty profile screen</Text>
          
          {/* Additional profile information can go here */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Image 
                source={require('../../../assets/profile_page_icons/birthday_icon.png')}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>Professor since 2018</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Image 
                source={require('../../../assets/profile_page_icons/calendar_icon.png')}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>Joined January 2024</Text>
            </View>
          </View>
        </View>
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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.tabBorder,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
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
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  coverImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: -50,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.homeBackground,
  },
  userName: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.white,
    marginTop: 10,
  },
  userRole: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.tabActive,
    marginTop: 4,
  },
  userBio: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 30,
  },
  infoSection: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 12,
  },
  infoText: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
  },
});