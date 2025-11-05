import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import HeaderWithTabs from '../../components/HeaderWithTabs';
import PostCard from '../../components/PostCard';
import { supabase } from '../../lib/supabase';

export default function FacultyHomeScreen() {
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

      console.log('Fetched posts with counts:', data?.length || 0);
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

  // ENHANCED REAL-TIME SUBSCRIPTIONS FOR ALL INTERACTIONS
  useEffect(() => {
    console.log('Setting up real-time subscriptions for interactions...');

    // Channel for new posts
    const postsChannel = supabase
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
        console.log('Posts real-time subscription status:', status);
      });

    // Channel for post updates (count changes)
    const postsUpdateChannel = supabase
      .channel('posts_update_channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          console.log('Post updated in real-time:', payload);
          setPosts(currentPosts => 
            currentPosts.map(post => 
              post.id === payload.new.id ? { ...post, ...payload.new } : post
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('Posts update subscription status:', status);
      });

    // Channel for likes
    const likesChannel = supabase
      .channel('likes_channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT and DELETE
          schema: 'public',
          table: 'post_likes',
        },
        async (payload) => {
          console.log('Like interaction detected:', payload);
          // Refresh the specific post to get updated counts
          const { data: updatedPost } = await supabase
            .from('posts')
            .select('*')
            .eq('id', payload.new?.post_id || payload.old?.post_id)
            .single();
          
          if (updatedPost) {
            setPosts(currentPosts => 
              currentPosts.map(post => 
                post.id === updatedPost.id ? updatedPost : post
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Likes subscription status:', status);
      });

    // Channel for reposts
    const repostsChannel = supabase
      .channel('reposts_channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT and DELETE
          schema: 'public',
          table: 'reposts',
        },
        async (payload) => {
          console.log('Repost interaction detected:', payload);
          // Refresh the specific post to get updated counts
          const { data: updatedPost } = await supabase
            .from('posts')
            .select('*')
            .eq('id', payload.new?.post_id || payload.old?.post_id)
            .single();
          
          if (updatedPost) {
            setPosts(currentPosts => 
              currentPosts.map(post => 
                post.id === updatedPost.id ? updatedPost : post
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Reposts subscription status:', status);
      });

    // Channel for bookmarks
    const bookmarksChannel = supabase
      .channel('bookmarks_channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT and DELETE
          schema: 'public',
          table: 'bookmarks',
        },
        async (payload) => {
          console.log('Bookmark interaction detected:', payload);
          // Refresh the specific post to get updated counts
          const { data: updatedPost } = await supabase
            .from('posts')
            .select('*')
            .eq('id', payload.new?.post_id || payload.old?.post_id)
            .single();
          
          if (updatedPost) {
            setPosts(currentPosts => 
              currentPosts.map(post => 
                post.id === updatedPost.id ? updatedPost : post
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Bookmarks subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from all real-time channels');
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(postsUpdateChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(repostsChannel);
      supabase.removeChannel(bookmarksChannel);
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      <HeaderWithTabs 
        userRole="faculty" 
        onFilterPress={handleFilterPress}
        activeTab={activeTab}
        onTabChange={setActiveTab}
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
              userRole="faculty"
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