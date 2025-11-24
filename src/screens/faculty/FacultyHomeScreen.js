// src/screens/faculty/FacultyHomeScreen.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import HeaderWithTabs from '../../components/HeaderWithTabs';
import PostCard from '../../components/PostCard';
import FilterModal from '../../components/FilterModal';
import { usePosts } from '../../hooks/usePost';
import { UserContext } from '../../contexts/UserContext';

export default function FacultyHomeScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState('forYou');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const { user } = useContext(UserContext);
  const isFocused = useIsFocused();
  const lastRefreshTime = useRef(0);
  const refreshCooldown = 5000;
  
  const { posts, refreshing, onRefresh, refetchPosts } = usePosts(activeTab, user?.id);

  // Filter posts based on selected categories - FIXED LOGIC
  const filteredPosts = selectedCategories.length > 0 
    ? posts.filter(post => {
        // Handle both cases: post.category might be undefined or different case
        const postCategory = post.category?.toLowerCase() || '';
        return selectedCategories.some(selectedCat => 
          postCategory.includes(selectedCat.toLowerCase())
        );
      })
    : posts;

  useEffect(() => {
    const commentedPostId = route?.params?.commentedPostId;
    if (commentedPostId) {
      console.log('Detected commentedPostId, refetching posts:', commentedPostId);
      refetchPosts();
      try {
        navigation.setParams({ commentedPostId: null });
      } catch (e) {
        // ignore if not allowed
      }
    }
  }, [route?.params?.commentedPostId]);

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const handleApplyFilters = (categories) => {
    console.log('Applying filters:', categories);
    setSelectedCategories(categories);
  };

  useEffect(() => {
    if (isFocused) {
      const now = Date.now();
      if (now - lastRefreshTime.current > refreshCooldown) {
        console.log('Faculty screen focused - refreshing posts after cooldown');
        lastRefreshTime.current = now;
        refetchPosts();
      } else {
        console.log('Faculty screen focused - skipping refresh (in cooldown)');
      }
    }
  }, [isFocused, refetchPosts]);

  useEffect(() => {
    console.log('FacultyHomeScreen mounted with user:', user?.id);
    refetchPosts();
  }, [user?.id]);

  // Category mapping for display
  const categoryMap = {
    'academics': 'Academics',
    'rant': 'Rant',
    'support': 'Support',
    'campus': 'Campus',
    'general': 'General'
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      <HeaderWithTabs 
        userRole="faculty" 
        onFilterPress={handleFilterPress}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        navigation={navigation}
      />
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.white}
            colors={[colors.white]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Status */}
        {selectedCategories.length > 0 && (
          <View style={styles.filterStatus}>
            <View style={styles.filterStatusContent}>
              <Text style={styles.filterIcon}>🎯</Text>
              <View style={styles.filterTextContainer}>
                <Text style={styles.filterStatusText}>
                  Filtered by {selectedCategories.length} categor{selectedCategories.length !== 1 ? 'ies' : 'y'}
                </Text>
                <Text style={styles.filterSubtext}>
                  {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setSelectedCategories([])}
              style={styles.clearFilterButton}
            >
              <Text style={styles.clearFilterText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {selectedCategories.length > 0 ? '🔍' : '📝'}
            </Text>
            <Text style={styles.emptyTitle}>
              {selectedCategories.length > 0 
                ? 'No posts match your filters'
                : activeTab === 'forYou' 
                  ? 'No posts yet' 
                  : 'No posts from followed users'
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedCategories.length > 0
                ? 'Try selecting different categories or clear filters to see all posts'
                : activeTab === 'forYou' 
                  ? 'Be the first to share something with the community!'
                  : 'Follow some users to see their posts here!'
              }
            </Text>
            {selectedCategories.length > 0 && (
              <TouchableOpacity 
                style={styles.clearAllButton}
                onPress={() => setSelectedCategories([])}
              >
                <Text style={styles.clearAllButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredPosts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              userRole="faculty"
              currentUserId={user?.id}
              onInteraction={() => {
                console.log('Post interaction - not refreshing');
              }}
            />
          ))
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        selectedCategories={selectedCategories}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
    paddingTop: 10,
  },
  filterStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 204, 0, 0.3)',
  },
  filterStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  filterTextContainer: {
    flex: 1,
  },
  filterStatusText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#FFCC00',
    marginBottom: 2,
  },
  filterSubtext: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 204, 0, 0.7)',
  },
  clearFilterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  clearFilterText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#FFCC00',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  clearAllButton: {
    backgroundColor: 'rgba(255, 204, 0, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 204, 0, 0.5)',
  },
  clearAllButtonText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#FFCC00',
  },
  bottomPadding: {
    height: 20,
  },
});