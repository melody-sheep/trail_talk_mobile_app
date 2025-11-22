import { supabase } from '../lib/supabase';

// Follow a user
export const followUser = async (followerId, followingId) => {
  try {
    console.log('Attempting to follow user:', { followerId, followingId });
    
    const { data, error } = await supabase
      .from('follows')
      .insert([{
        follower_user_id: followerId,
        following_user_id: followingId
      }])
      .select()
      .single();

    if (error) {
      console.log('Follow error:', error);
      throw error;
    }

    console.log('Follow successful:', data);
    return { data, error: null };
  } catch (error) {
    console.log('Error in followUser:', error);
    return { data: null, error };
  }
};

// Unfollow a user
export const unfollowUser = async (followerId, followingId) => {
  try {
    console.log('Attempting to unfollow user:', { followerId, followingId });
    
    const { data, error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_user_id', followerId)
      .eq('following_user_id', followingId);

    if (error) {
      console.log('Unfollow error:', error);
      throw error;
    }

    console.log('Unfollow successful');
    return { data, error: null };
  } catch (error) {
    console.log('Error in unfollowUser:', error);
    return { data: null, error };
  }
};

// Get follow counts for a user
export const getFollowCounts = async (userId) => {
  try {
    // Get followers count (people who follow this user)
    const { count: followersCount, error: followersError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_user_id', userId);

    if (followersError) {
      console.log('Error getting followers count:', followersError);
      throw followersError;
    }

    // Get following count (people this user follows)
    const { count: followingCount, error: followingError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_user_id', userId);

    if (followingError) {
      console.log('Error getting following count:', followingError);
      throw followingError;
    }

    return {
      followers: followersCount || 0,
      following: followingCount || 0
    };
  } catch (error) {
    console.log('Error in getFollowCounts:', error);
    return { followers: 0, following: 0 };
  }
};

// Check if current user is following another user
export const checkIsFollowing = async (currentUserId, targetUserId) => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_user_id', currentUserId)
      .eq('following_user_id', targetUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.log('Error checking follow status:', error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.log('Error in checkIsFollowing:', error);
    return false;
  }
};