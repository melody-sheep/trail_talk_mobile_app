import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const usePosts = (activeTab, currentUserId) => {
  const [posts, setPosts] = useState([]);
  const [followingPosts, setFollowingPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // MANUAL JOIN APPROACH - No Supabase joins
  const fetchAllPosts = async () => {
    try {
      console.log('Fetching all posts...');
      
      // Step 1: Get posts only
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) {
        console.log('Error fetching posts:', postsError);
        throw postsError;
      }
      
      console.log(`Found ${postsData?.length || 0} posts`);

      if (!postsData || postsData.length === 0) return [];

      // Step 2: Get author profiles separately
      const authorIds = [...new Set(postsData.map(post => post.author_id))];
      console.log('Fetching profiles for author IDs:', authorIds);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', authorIds);

      if (profilesError) {
        console.log('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log(`Found ${profilesData?.length || 0} profiles`);

      // Step 3: Combine data manually
      const postsWithAuthors = postsData.map(post => ({
        ...post,
        author: profilesData?.find(profile => profile.id === post.author_id) || null
      }));

      console.log('Successfully combined posts with authors');
      return postsWithAuthors;
    } catch (error) {
      console.log('Error fetching all posts:', error);
      return [];
    }
  };

  const fetchFollowingPosts = async () => {
    if (!currentUserId) {
      console.log('No current user ID, skipping following posts');
      return [];
    }

    try {
      console.log('Fetching posts from followed users for user:', currentUserId);
      
      // Step 1: Get who the user follows
      const { data: followingData, error: followError } = await supabase
        .from('follows')
        .select('following_user_id')
        .eq('follower_user_id', currentUserId);

      if (followError) {
        console.log('Error fetching follows:', followError);
        throw followError;
      }

      console.log(`User follows ${followingData?.length || 0} users`);

      if (!followingData || followingData.length === 0) return [];

      // Step 2: Get posts from followed users
      const followingUserIds = followingData.map(follow => follow.following_user_id);
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('author_id', followingUserIds)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.log('Error fetching followed posts:', postsError);
        throw postsError;
      }

      console.log(`Found ${postsData?.length || 0} posts from followed users`);

      if (!postsData || postsData.length === 0) return [];

      // Step 3: Get author profiles
      const authorIds = [...new Set(postsData.map(post => post.author_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', authorIds);

      if (profilesError) {
        console.log('Error fetching followed profiles:', profilesError);
        throw profilesError;
      }

      // Step 4: Combine data manually
      const postsWithAuthors = postsData.map(post => ({
        ...post,
        author: profilesData?.find(profile => profile.id === post.author_id) || null
      }));

      console.log('Successfully combined followed posts with authors');
      return postsWithAuthors;
    } catch (error) {
      console.log('Error in fetchFollowingPosts:', error);
      return [];
    }
  };

  const fetchPosts = async () => {
    console.log('Starting fetchPosts...');
    setRefreshing(true);
    
    try {
      const [allPosts, followedPosts] = await Promise.all([
        fetchAllPosts(),
        fetchFollowingPosts()
      ]);
      
      console.log(`Setting ${allPosts.length} all posts and ${followedPosts.length} followed posts`);
      
      setPosts(allPosts);
      setFollowingPosts(followedPosts);
    } catch (error) {
      console.log('Error in fetchPosts:', error);
    } finally {
      setRefreshing(false);
      console.log('Finished fetchPosts');
    }
  };

  useEffect(() => {
    console.log('usePosts useEffect triggered with user:', currentUserId);
    if (currentUserId) {
      fetchPosts();
    }
  }, [currentUserId]);

  return {
    posts: activeTab === 'forYou' ? posts : followingPosts,
    refreshing,
    onRefresh: fetchPosts,
    refetchPosts: fetchPosts
  };
};