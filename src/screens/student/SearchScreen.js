// src/screens/student/SearchScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';

export default function SearchScreen({ navigation }) {
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { user } = useContext(UserContext);

  // Categories for filtering
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'students', label: 'Students' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'communities', label: 'Communities' }
  ];

  // Mock data for suggested accounts - Replace with real database fetch later
  const suggestedAccounts = [
    {
      id: '1',
      name: 'Alex Johnson',
      username: 'alexj',
      role: 'student',
      avatar: require('../../../assets/profile_page_icons/default_profile_icon.png')
    },
    {
      id: '2',
      name: 'Dr. Sarah Wilson',
      username: 'drwilson',
      role: 'faculty',
      avatar: require('../../../assets/profile_page_icons/default_profile_icon.png')
    },
    {
      id: '3',
      name: 'Mike Chen',
      username: 'mikec',
      role: 'student',
      avatar: require('../../../assets/profile_page_icons/default_profile_icon.png')
    },
    {
      id: '4',
      name: 'Prof. James Brown',
      username: 'profjbrown',
      role: 'faculty',
      avatar: require('../../../assets/profile_page_icons/default_profile_icon.png')
    },
    {
      id: '5',
      name: 'Campus Coding Club',
      username: 'coding_club',
      role: 'community',
      avatar: require('../../../assets/profile_page_icons/default_profile_icon.png')
    }
  ];

  // Filter suggested accounts based on active category and search query
  const filteredAccounts = suggestedAccounts.filter(account => {
    // Check category match
    const categoryMatch =
      activeCategory === 'all' ||
      (activeCategory === 'students' && account.role === 'student') ||
      (activeCategory === 'faculty' && account.role === 'faculty') ||
      (activeCategory === 'communities' && account.role === 'community');

    // Check search match
    const searchMatch =
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.username.toLowerCase().includes(searchQuery.toLowerCase());

    // Include account only if it matches category and search query
    return categoryMatch && (searchQuery.trim() === '' || searchMatch);
  });

  // Handle search button (optional if you want explicit submit)
  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
    // Backend search integration can go here
  };

  // Render a single category chip
  const renderCategoryChip = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        activeCategory === item.id && styles.categoryChipSelected
      ]}
      onPress={() => setActiveCategory(item.id)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.categoryChipText,
          activeCategory === item.id && styles.categoryChipTextSelected
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  // Render a single account card
  const renderAccountCard = ({ item }) => (
    <TouchableOpacity style={styles.accountCard} activeOpacity={0.7}>
      <View style={styles.accountInfo}>
        <Image source={item.avatar} style={styles.avatar} />
        <View style={styles.accountDetails}>
          <Text style={styles.accountName}>{item.name}</Text>
          <Text style={styles.accountUsername}>@{item.username}</Text>
          <View
            style={[
              styles.roleBadge,
              item.role === 'student' && styles.studentBadge,
              item.role === 'faculty' && styles.facultyBadge,
              item.role === 'community' && styles.communityBadge
            ]}
          >
            <Text style={styles.roleText}>
              {item.role === 'student'
                ? 'Student'
                : item.role === 'faculty'
                ? 'Faculty'
                : 'Community'}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.followButton} activeOpacity={0.7}>
        <Text style={styles.followButtonText}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Status Bar */}
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.homeBackground}
      />

      {/* Header Background */}
      <ImageBackground
        source={require('../../../assets/create_post_screen_icons/createpost_header_bg.png')}
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Search</Text>
        </View>
      </ImageBackground>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Image
              source={require('../../../assets/bottom_navigation_icons/search_icon_fill.png')}
              style={styles.searchIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for people, posts, or communities..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery} // live search
              onSubmitEditing={handleSearch} // optional
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Category Chips Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <FlatList
            data={categories}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Suggested Accounts Section */}
        <View style={styles.accountsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggested Accounts</Text>
            <Text style={styles.sectionSubtitle}>
              {activeCategory === 'all' && 'Students & Faculty'}
              {activeCategory === 'students' && 'Student Profiles'}
              {activeCategory === 'faculty' && 'Faculty Profiles'}
              {activeCategory === 'communities' && 'Campus Communities'}
            </Text>
          </View>

          {/* Render accounts or placeholder */}
          {filteredAccounts.length === 0 ? (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>
                {searchQuery.trim() === ''
                  ? 'Type something to search...'
                  : 'No results found.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredAccounts}
              renderItem={renderAccountCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground
  },
  headerBackground: {
    width: '100%',
    height: 140,
    justifyContent: 'center'
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: fonts.medium,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 1.5
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: 'rgba(255, 255, 255, 0.6)'
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
    padding: 0
  },
  categoriesSection: {
    marginTop: 10,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 12,
    paddingHorizontal: 20
  },
  categoriesList: {
    paddingHorizontal: 20
  },
  categoryChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoryChipSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center'
  },
  categoryChipTextSelected: {
    color: colors.homeBackground,
    fontFamily: fonts.semiBold
  },
  accountsSection: {
    marginTop: 10
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)'
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12
  },
  accountDetails: {
    flex: 1
  },
  accountName: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 2
  },
  accountUsername: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 6
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  studentBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.5)'
  },
  facultyBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.5)'
  },
  communityBadge: {
    backgroundColor: 'rgba(156, 39, 176, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.5)'
  },
  roleText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.white
  },
  followButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  followButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white
  },
  placeholder: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center'
  },
  bottomSpacer: {
    height: 20
  }
});
