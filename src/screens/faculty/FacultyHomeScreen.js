import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import HeaderWithTabs from '../../components/HeaderWithTabs';
import PostCard from '../../components/PostCard';
import { Ionicons } from '@expo/vector-icons';
import { usePosts } from '../../hooks/usePost'; 
import { UserContext } from '../../contexts/UserContext';

export default function FacultyHomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('forYou');
  const { user } = useContext(UserContext);
  const isFocused = useIsFocused();
  const lastRefreshTime = useRef(0);
  const refreshCooldown = 5000; // 5 seconds cooldown between refreshes
  
  const { posts, refreshing, onRefresh, refetchPosts } = usePosts(activeTab, user?.id);

  const handleFilterPress = () => {
    console.log('Filter pressed');
  };

  // MANUAL FOCUS MANAGEMENT - No more useFocusEffect
  useEffect(() => {
    if (isFocused) {
      const now = Date.now();
      // Only refresh if it's been more than 5 seconds since last refresh
      if (now - lastRefreshTime.current > refreshCooldown) {
        console.log('Screen focused - refreshing posts after cooldown');
        lastRefreshTime.current = now;
        refetchPosts();
      } else {
        console.log('Screen focused - skipping refresh (in cooldown)');
      }
    }
  }, [isFocused, refetchPosts]);

  // Log mount once
  useEffect(() => {
    console.log('FacultyHomeScreen mounted with user:', user?.id);
    // Initial load
    refetchPosts();
  }, [user?.id]);

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
        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {activeTab === 'forYou' ? 'No posts yet' : 'No posts from followed users'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'forYou' 
                ? 'Be the first to share something with the community!'
                : 'Follow some users to see their posts here!'
              }
            </Text>
          </View>
        ) : (
          posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              userRole="faculty"
              currentUserId={user?.id}
              onInteraction={() => {
                // Don't refresh immediately on interaction
                console.log('Post interaction - not refreshing');
              }}
            />
          ))
        )}
        
        {/* Add some bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Small secondary FAB for Reports */}
      <TouchableOpacity
        style={styles.reportFab}
        onPress={() => navigation.navigate('ReportDashboard')}
        activeOpacity={0.8}
      >
        <Ionicons name="flag" size={16} color={colors.white} />
      </TouchableOpacity>
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
  },
  bottomPadding: {
    height: 20,
  },
  reportFab: {
    position: 'absolute',
    right: 30, // 12px from right
    bottom: 85, // keep existing bottom spacing (px)
    width: 40, // 40px diameter (smaller)
    height: 40, // 40px diameter (smaller)
    borderRadius: 20,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
});