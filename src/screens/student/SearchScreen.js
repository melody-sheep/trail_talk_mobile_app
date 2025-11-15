// src/screens/student/SearchScreen.js
import React from 'react';
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
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { useSearch } from '../../hooks/useSearch';

export default function SearchScreen({ navigation }) {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    suggestedAccounts,
    isLoading,
    error,
    activeCategory,
    setActiveCategory,
    followUser,
    unfollowUser,
    clearSearch,
    loadSuggestedContent
  } = useSearch();

  const [refreshing, setRefreshing] = React.useState(false);
  const [hiddenUsers, setHiddenUsers] = React.useState(new Set());
  
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const scrollViewRef = React.useRef(null);

  // Animation values for header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [160, 80],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const collapsedTitleOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const searchSectionTranslateY = scrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });

  // Categories including Communities
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'students', label: 'Students' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'communities', label: 'Communities' }
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    setHiddenUsers(new Set()); // Clear hidden users on refresh
    await loadSuggestedContent();
    setRefreshing(false);
  };

  // Filter out hidden users from results
  const filteredSearchResults = searchResults.filter(user => !hiddenUsers.has(user.id));
  const filteredSuggestedAccounts = suggestedAccounts.filter(user => !hiddenUsers.has(user.id));

  const handleDeleteUser = (userId) => {
    setHiddenUsers(prev => new Set(prev).add(userId));
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const renderCategoryChip = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        activeCategory === item.id && styles.categoryChipSelected
      ]}
      onPress={() => setActiveCategory(item.id)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.categoryChipText,
        activeCategory === item.id && styles.categoryChipTextSelected
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderUserCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userIdentity}>
          <View style={styles.avatarContainer}>
            <Image 
              source={require('../../../assets/profile_page_icons/default_profile_icon.png')} 
              style={styles.avatar} 
            />
            <View style={[
              styles.initialsBadge,
              item.user_type === 'student' ? styles.studentBadge : styles.facultyBadge
            ]}>
              <Text style={styles.initialsText}>{item.initials}</Text>
            </View>
          </View>
          <View style={styles.userMainInfo}>
            <Text style={styles.userName}>{item.displayName}</Text>
            <View style={[
              styles.roleBadge,
              item.user_type === 'student' ? styles.studentRoleBadge : styles.facultyRoleBadge
            ]}>
              <Text style={styles.roleText}>
                {item.user_type === 'student' ? 'Student' : 'Faculty'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.userStats}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{item.postCount || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{item.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[
            styles.followButton,
            item.isFollowing && styles.followingButton
          ]}
          onPress={() => item.isFollowing ? unfollowUser(item.id) : followUser(item.id)}
        >
          <Text style={[
            styles.followButtonText,
            item.isFollowing && styles.followingButtonText
          ]}>
            {item.isFollowing ? '✓ Following' : '+ Follow'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteUser(item.id)}
        >
          <Text style={styles.deleteButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const hasSearchResults = filteredSearchResults.length > 0;
  const hasSuggestedContent = filteredSuggestedAccounts.length > 0;
  const showSuggestedContent = !searchQuery.trim() && !hasSearchResults;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      {/* Animated Header Background */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <ImageBackground 
          source={require('../../../assets/create_post_screen_icons/createpost_header_bg.png')}
          style={styles.headerBackground}
          resizeMode="cover"
        >
          <Animated.View style={[styles.headerContent, { opacity: headerTitleOpacity }]}>
            <Text style={styles.headerTitle}>Discover People</Text>
            <Text style={styles.headerSubtitle}>Connect with students and faculty</Text>
          </Animated.View>

          <Animated.View style={[styles.collapsedHeaderContent, { opacity: collapsedTitleOpacity }]}>
            <Text style={styles.collapsedHeaderTitle}>Search</Text>
          </Animated.View>
        </ImageBackground>
      </Animated.View>

      {/* Sticky Search & Categories Section */}
      <Animated.View style={[styles.stickySection, { transform: [{ translateY: searchSectionTranslateY }] }]}>
        {/* Search Field */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Image 
              source={require('../../../assets/bottom_navigation_icons/search_icon_fill.png')}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search people..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            <View style={styles.searchRightContent}>
              {searchQuery ? (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              ) : (
                isLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.white} />
                  </View>
                )
              )}
            </View>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Category Chips */}
        <View style={styles.categoriesSection}>
          <FlatList
            data={categories}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      </Animated.View>

      {/* Scrollable Content Section */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.white}
            colors={[colors.white]}
          />
        }
      >
        {/* Search Results */}
        {hasSearchResults && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {filteredSearchResults.length} {filteredSearchResults.length === 1 ? 'person' : 'people'} found
            </Text>
          </View>
        )}

        <FlatList
          data={showSuggestedContent ? filteredSuggestedAccounts : filteredSearchResults}
          renderItem={renderUserCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !isLoading && searchQuery ? (
              <View style={styles.emptyState}>
                <Image 
                  source={require('../../../assets/bottom_navigation_icons/search_icon_fill.png')}
                  style={styles.emptyStateIcon}
                />
                <Text style={styles.emptyStateTitle}>No results found</Text>
                <Text style={styles.emptyStateText}>
                  No results for "{searchQuery}"
                </Text>
              </View>
            ) : !searchQuery && !hasSuggestedContent && !isLoading ? (
              <View style={styles.welcomeState}>
                <Image 
                  source={require('../../../assets/bottom_navigation_icons/search_icon_fill.png')}
                  style={styles.welcomeIcon}
                />
                <Text style={styles.welcomeTitle}>Find Students & Faculty</Text>
                <Text style={styles.welcomeText}>
                  Search by name or student ID to connect with others
                </Text>
              </View>
            ) : null
          }
        />

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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  stickySection: {
    position: 'absolute',
    top: 160,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.homeBackground,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
    marginTop: 160,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 140,
    paddingBottom: 30,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: 'rgba(255, 255, 255, 0.6)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
    padding: 0,
  },
  searchRightContent: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    padding: 2,
  },
  clearButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  loadingContainer: {
    padding: 2,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  categoriesList: {
    gap: 8,
  },
  categoryChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
  },
  categoryChipSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  categoryChipTextSelected: {
    color: colors.homeBackground,
    fontFamily: fonts.semiBold,
  },
  // Card Styles
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  initialsBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.homeBackground,
  },
  studentBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  facultyBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
  },
  initialsText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  userMainInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  studentRoleBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.4)',
  },
  facultyRoleBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.4)',
  },
  roleText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  userStats: {
    alignItems: 'flex-end',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  followButton: {
    flex: 1,
    backgroundColor: 'rgba(58, 140, 130, 0.8)',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(133, 255, 229, 0.8)',
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  followButtonText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  followingButtonText: {
    color: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  deleteButtonText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#f44336',
  },
  // Results Header
  resultsHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  // Empty States
  emptyState: {
    padding: 30,
    alignItems: 'center',
    marginTop: 30,
  },
  emptyStateIcon: {
    width: 60,
    height: 60,
    tintColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 15,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  // Welcome State
  welcomeState: {
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  welcomeIcon: {
    width: 60,
    height: 60,
    tintColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 15,
  },
  welcomeTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  errorText: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: '#f44336',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 30,
  },
});