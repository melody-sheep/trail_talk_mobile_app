import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import HeaderWithTabs from '../../components/HeaderWithTabs';
import PostCard from '../../components/PostCard';
import { supabase } from '../../lib/supabase';

export default function StudentHomeScreen({ navigation }) { // ADDED navigation prop here
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('forYou');

  const handleFilterPress = () => {
    console.log('Filter pressed');
  };

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts...');
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Error fetching posts:', error);
        return;
      }

      console.log('Fetched posts:', data?.length || 0);
      setPosts(data || []);
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // AUTO-REFRESH WHEN RETURNING FROM CREATEPOST SCREEN
  useFocusEffect(
    useCallback(() => {
      console.log('Home screen focused - refreshing posts');
      fetchPosts();
    }, [])
  );

  // REAL-TIME SUBSCRIPTION (BACKUP)
  useEffect(() => {
    const channel = supabase
      .channel('posts_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          console.log('New post received in real-time:', payload);
          setPosts(currentPosts => [payload.new, ...currentPosts]);
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from real-time channel');
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      <HeaderWithTabs 
        userRole="student" 
        onFilterPress={handleFilterPress}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        navigation={navigation} // ADDED navigation prop here
      />
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.white}
          />
        }
      >
        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to share something with the community!
            </Text>
          </View>
        ) : (
          posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              userRole="student"
            />
          ))
        )}
      </ScrollView>
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
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});