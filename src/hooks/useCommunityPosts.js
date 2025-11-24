import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export const useCommunityPosts = (communityId) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const isFetching = useRef(false);
  const refreshCallbacks = useRef([]);

  // ADDED: Function to register refresh callbacks
  const onRefreshRequested = (callback) => {
    refreshCallbacks.current.push(callback);
    return () => {
      refreshCallbacks.current = refreshCallbacks.current.filter(cb => cb !== callback);
    };
  };

  // ADDED: Function to trigger all refresh callbacks
  const triggerRefreshCallbacks = () => {
    refreshCallbacks.current.forEach(callback => callback());
  };

  const fetchCommunityPosts = async () => {
    if (isFetching.current) return;
    
    try {
      isFetching.current = true;
      setLoading(true);
      console.log('🔄 FETCHING posts for community:', communityId);
      
      if (!communityId) {
        setPosts([]);
        return;
      }

      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles(
            id,
            username,
            display_name,
            user_type,
            avatar_url,
            nickname,
            created_at
          )
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      
      console.log(`✅ FOUND ${postsData?.length || 0} posts`);

      // ENHANCED: Format posts with proper author data
      const formattedPosts = (postsData || []).map(post => ({
        ...post,
        anonymous_username: post.anonymous_name || 'Anonymous',
        likes_count: post.like_count || 0,
        comments_count: post.comment_count || 0,
        reposts_count: post.repost_count || 0,
        bookmarks_count: post.bookmark_count || 0,
        category: post.category || 'Discussion',
        // Ensure author data is properly structured
        author: post.author ? {
          ...post.author,
          // Add avatar URL if available
          avatar_url: post.author.avatar_url
        } : null
      }));

      setPosts(formattedPosts);

    } catch (err) {
      console.log('❌ FETCH ERROR:', err);
      setError(err.message);
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetching.current = false;
    }
  };

  // FIXED: Enhanced real-time subscription
  useEffect(() => {
    if (!communityId) return;

    console.log('🔔 SETTING UP REAL-TIME FOR COMMUNITY:', communityId);

    // Initial fetch
    fetchCommunityPosts();

    const subscription = supabase
      .channel(`community-posts-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_posts',
          filter: `community_id=eq.${communityId}`
        },
        (payload) => {
          console.log('🎯 REAL-TIME EVENT:', payload.eventType, payload.new?.id);
          
          // FORCE REFRESH for any change
          console.log('🚀 FORCE REFRESHING DATA');
          fetchCommunityPosts();
          
          // Also trigger callbacks for immediate UI updates
          triggerRefreshCallbacks();
        }
      )
      .subscribe((status) => {
        console.log('📡 SUBSCRIPTION STATUS:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ SUCCESS: Real-time subscription active');
        }
      });

    return () => {
      console.log('🧹 CLEANING UP SUBSCRIPTION');
      subscription.unsubscribe();
    };
  }, [communityId]);

  const onRefresh = async () => {
    console.log('🔄 MANUAL REFRESH');
    setRefreshing(true);
    await fetchCommunityPosts();
  };

  // ADDED: Force refresh function
  const forceRefresh = async () => {
    console.log('💥 FORCE REFRESH TRIGGERED');
    await fetchCommunityPosts();
  };

  return { 
    posts, 
    loading, 
    error, 
    refreshing,
    refetch: fetchCommunityPosts,
    onRefresh,
    forceRefresh, // ADDED
    onRefreshRequested // ADDED
  };
};