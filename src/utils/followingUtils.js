import { supabase } from '../lib/supabase';

// Check if current user follows a specific user
export const checkIfFollowing = async (currentUserId, targetUserId) => {
  if (!currentUserId || !targetUserId) {
    console.log('Missing user IDs for follow check');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_user_id', currentUserId)
      .eq('following_user_id', targetUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.log('Error checking follow status:', error);
      return false;
    }

    const isFollowing = !!data;
    console.log(`User ${currentUserId} follows ${targetUserId}:`, isFollowing);
    return isFollowing;
  } catch (error) {
    console.log('Error in checkIfFollowing:', error);
    return false;
  }
};

// Follow a user
export const followUser = async (followerId, followingId) => {
  if (!followerId || !followingId) {
    return { success: false, error: 'Missing user IDs' };
  }

  try {
    console.log(`User ${followerId} following user ${followingId}`);
    
    const { data, error } = await supabase
      .from('follows')
      .insert({
        follower_user_id: followerId,
        following_user_id: followingId
      })
      .select()
      .single();

    if (error) {
      console.log('Error following user:', error);
      return { success: false, error };
    }

    console.log('Successfully followed user:', data);
    return { success: true, data };
  } catch (error) {
    console.log('Error in followUser:', error);
    return { success: false, error };
  }
};

// Unfollow a user
export const unfollowUser = async (followerId, followingId) => {
  if (!followerId || !followingId) {
    return { success: false, error: 'Missing user IDs' };
  }

  try {
    console.log(`User ${followerId} unfollowing user ${followingId}`);
    
    const { data, error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_user_id', followerId)
      .eq('following_user_id', followingId)
      .select()
      .single();

    if (error) {
      console.log('Error unfollowing user:', error);
      return { success: false, error };
    }

    console.log('Successfully unfollowed user:', data);
    return { success: true, data };
  } catch (error) {
    console.log('Error in unfollowUser:', error);
    return { success: false, error };
  }
};

// Get follow counts for a user
export const getFollowCounts = async (userId) => {
  if (!userId) {
    return { followers: 0, following: 0 };
  }

  try {
    const [followersResult, followingResult] = await Promise.all([
      supabase
        .from('follows')
        .select('id', { count: 'exact' })
        .eq('following_user_id', userId),
      supabase
        .from('follows')
        .select('id', { count: 'exact' })
        .eq('follower_user_id', userId)
    ]);

    const followers = followersResult.count || 0;
    const following = followingResult.count || 0;

    console.log(`User ${userId} follow counts - Followers: ${followers}, Following: ${following}`);
    
    return { followers, following };
  } catch (error) {
    console.log('Error in getFollowCounts:', error);
    return { followers: 0, following: 0 };
  }
};

// Toggle follow status
export const toggleFollow = async (currentUserId, targetUserId, isCurrentlyFollowing) => {
  if (isCurrentlyFollowing) {
    return await unfollowUser(currentUserId, targetUserId);
  } else {
    return await followUser(currentUserId, targetUserId);
  }
};