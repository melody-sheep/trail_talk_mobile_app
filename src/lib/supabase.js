import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://prpkerdbfrabzrnzelan.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycGtlcmRiZnJhYnpybnplbGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDEzMjAsImV4cCI6MjA3Njk3NzMyMH0.yFY75OmLrQxwHSqomO868CfDX44rJ2sDLmyOuRY7Zyo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('Supabase connection error:', error.message);
      return false;
    }
    console.log('Supabase connected successfully');
    return true;
  } catch (error) {
    console.log('Supabase connection failed:', error);
    return false;
  }
};

// ==================== COMMUNITY FUNCTIONS ====================

// Get all communities with optional category filter
export const getCommunities = async (category = 'all') => {
  try {
    let query = supabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false });

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching communities:', error);
    return { data: null, error };
  }
};

// Get communities with user join status
export const getCommunitiesWithUserStatus = async (userId, category = 'all') => {
  try {
    // First get all communities
    const { data: communities, error: communitiesError } = await getCommunities(category);
    if (communitiesError) throw communitiesError;

    // Then get user's joined communities
    const { data: userMemberships, error: membersError } = await supabase
      .from('community_members')
      .select('community_id, role')
      .eq('user_id', userId);

    if (membersError) throw membersError;

    // Map join status
    const userCommunityIds = userMemberships?.map(member => member.community_id) || [];
    
    const communitiesWithStatus = communities?.map(community => ({
      ...community,
      isJoined: userCommunityIds.includes(community.id),
      isAdmin: userMemberships?.some(member => 
        member.community_id === community.id && 
        member.role === 'admin'
      )
    })) || [];

    return { data: communitiesWithStatus, error: null };
  } catch (error) {
    console.error('Error fetching communities with user status:', error);
    return { data: null, error };
  }
};

// Get user's joined communities
export const getUserCommunities = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('community_members')
      .select(`
        community:communities(*),
        role
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) throw error;
    
    const communities = data?.map(item => ({
      ...item.community,
      userRole: item.role,
      isAdmin: item.role === 'admin'
    })) || [];

    return { data: communities, error: null };
  } catch (error) {
    console.error('Error fetching user communities:', error);
    return { data: null, error };
  }
};

// Create a new community
export const createCommunity = async (communityData) => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .insert([{
        name: communityData.name,
        description: communityData.description,
        category: communityData.category,
        privacy: communityData.privacy || 'public',
        rules: communityData.rules,
        created_by: communityData.created_by,
        icon: communityData.icon || 'people-outline',
        max_members: communityData.max_members || 50
      }])
      .select()
      .single();

    if (error) throw error;

    // Auto-add creator as admin
    const { error: memberError } = await supabase
      .from('community_members')
      .insert([{
        community_id: data.id,
        user_id: communityData.created_by,
        role: 'admin'
      }]);

    if (memberError) {
      console.error('Error adding creator as admin:', memberError);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating community:', error);
    return { data: null, error };
  }
};

// Join a community
export const joinCommunity = async (communityId, userId) => {
  try {
    const { data, error } = await supabase
      .from('community_members')
      .insert([{
        community_id: communityId,
        user_id: userId,
        role: 'member'
      }])
      .select()
      .single();

    if (error) throw error;

    // Update member count using RPC function
    const { error: updateError } = await supabase.rpc('increment_member_count', { 
      community_id: communityId 
    });

    if (updateError) {
      console.error('Error updating member count:', updateError);
    }

    return { data, error: null };
  } catch (error) {
    // Handle duplicate membership (user already joined)
    const isDuplicate = (error && (error.code === '23505' || (error.message && error.message.toLowerCase().includes('duplicate'))));
    if (isDuplicate) {
      console.warn('Attempted to join community but membership already exists', { communityId, userId });
      return { data: null, error: { code: '23505', message: 'Already a member' } };
    }

    console.error('Error joining community:', error);
    return { data: null, error };
  }
};

// Leave a community
export const leaveCommunity = async (communityId, userId) => {
  try {
    const { data, error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) throw error;

    // Update member count using RPC function
    const { error: updateError } = await supabase.rpc('decrement_member_count', { 
      community_id: communityId 
    });

    if (updateError) {
      console.error('Error updating member count:', updateError);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error leaving community:', error);
    return { data: null, error };
  }
};

// Delete a community (admin only) - FIXED VERSION
export const deleteCommunity = async (communityId, userId) => {
  try {
    console.log('Starting community deletion process...');
    console.log('Community ID:', communityId);
    console.log('User ID:', userId);

    // First verify user is admin of this community
    const { data: membership, error: membershipError } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single();

    if (membershipError) {
      console.error('Membership check error:', membershipError);
      throw new Error('Unable to verify admin permissions');
    }

    if (!membership || membership.role !== 'admin') {
      throw new Error('You must be an admin to delete this community');
    }

    console.log('User is admin, proceeding with deletion...');

    // Delete in this order to respect foreign key constraints:
    
    // 1. First get all community post IDs
    const { data: communityPosts, error: postsQueryError } = await supabase
      .from('community_posts')
      .select('id')
      .eq('community_id', communityId);

    if (postsQueryError) {
      console.error('Error fetching community posts:', postsQueryError);
    }

    console.log('Found posts to delete:', communityPosts?.length || 0);

    // 2. Delete community post likes if there are posts
    if (communityPosts && communityPosts.length > 0) {
      const postIds = communityPosts.map(post => post.id);
      const { error: likesError } = await supabase
        .from('community_post_likes')
        .delete()
        .in('post_id', postIds);

      if (likesError) {
        console.error('Error deleting post likes:', likesError);
      }
      console.log('Deleted post likes');
    }

    // 3. Delete community posts
    const { error: postsError } = await supabase
      .from('community_posts')
      .delete()
      .eq('community_id', communityId);

    if (postsError) {
      console.error('Error deleting posts:', postsError);
    }
    console.log('Deleted community posts');

    // 4. Delete community members
    const { error: membersError } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId);

    if (membersError) {
      console.error('Error deleting members:', membersError);
    }
    console.log('Deleted community members');

    // 5. Finally delete the community - REMOVED .select().single()
    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', communityId);

    if (error) {
      console.error('Error deleting community:', error);
      throw error;
    }

    console.log('Community deleted successfully');
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error deleting community:', error);
    return { data: null, error };
  }
};

// Check if user can create more communities (free tier limit)
export const canUserCreateCommunity = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('id')
      .eq('created_by', userId);

    if (error) throw error;

    const createdCount = data?.length || 0;
    const canCreate = createdCount < 3; // Free tier limit

    return { 
      canCreate, 
      createdCount, 
      maxFree: 3, 
      error: null 
    };
  } catch (error) {
    console.error('Error checking community creation limit:', error);
    return { 
      canCreate: false, 
      createdCount: 0, 
      maxFree: 3, 
      error 
    };
  }
};

  // Get community details with member count and user status
  export const getCommunityDetails = async (communityId, userId = null) => {
    try {
      const { data: community, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single();

      if (error) {
        // If community doesn't exist or user doesn't have access
        if (error.code === 'PGRST116') {
          return { data: null, error: new Error('Community not found or access denied') };
        }
        throw error;
      }

      // Check if user is a member (if userId provided)
      let isMember = false;
      let userRole = null;
      
      if (userId) {
        const { data: membership, error: membershipError } = await supabase
          .from('community_members')
          .select('role')
          .eq('community_id', communityId)
          .eq('user_id', userId)
          .single();

        // If membership doesn't exist, user is not a member
        if (membershipError && membershipError.code !== 'PGRST116') {
          console.error('Error checking membership:', membershipError);
        }
        
        isMember = !!membership;
        userRole = membership?.role || null;
      }

      return { 
        data: {
          ...community,
          isMember,
          userRole,
          isAdmin: userRole === 'admin'
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error fetching community details:', error);
      return { data: null, error };
    }
  };

// Get community members
export const getCommunityMembers = async (communityId) => {
  try {
    const { data, error } = await supabase
      .from('community_members')
      .select(`
        role,
        joined_at,
        user:profiles(
          id,
          username,
          display_name,
          avatar_url,
          role,
          department
        )
      `)
      .eq('community_id', communityId)
      .order('role', { ascending: false })
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching community members:', error);
    return { data: null, error };
  }
};

// Search communities
export const searchCommunities = async (searchQuery, category = 'all') => {
  try {
    let query = supabase
      .from('communities')
      .select('*')
      .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .order('member_count', { ascending: false });

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error searching communities:', error);
    return { data: null, error };
  }
};

// ==================== COMMUNITY POST FUNCTIONS ====================

// Get community posts
export const getCommunityPosts = async (communityId) => {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching community posts:', error);
    return { data: null, error };
  }
};

// Create community post
export const createCommunityPost = async (postData) => {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .insert([{
        community_id: postData.community_id,
        author_id: postData.author_id,
        anonymous_name: postData.anonymous_name || 'Anonymous User',
        content: postData.content
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating community post:', error);
    return { data: null, error };
  }
};

// Like a community post
export const likeCommunityPost = async (postId, userId) => {
  try {
    const { data, error } = await supabase
      .from('community_post_likes')
      .insert([{
        post_id: postId,
        user_id: userId
      }])
      .select()
      .single();

    if (error) throw error;

    // Update like count
    const { error: updateError } = await supabase.rpc('increment_community_post_likes', { 
      post_id: postId 
    });

    if (updateError) {
      console.error('Error updating like count:', updateError);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error liking community post:', error);
    return { data: null, error };
  }
};

// Unlike a community post
export const unlikeCommunityPost = async (postId, userId) => {
  try {
    const { data, error } = await supabase
      .from('community_post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;

    // Update like count
    const { error: updateError } = await supabase.rpc('decrement_community_post_likes', { 
      post_id: postId 
    });

    if (updateError) {
      console.error('Error updating like count:', updateError);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error unliking community post:', error);
    return { data: null, error };
  }
};


// ==================== FOLLOW FUNCTIONS ====================

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

// Find user by username (partial or exact)
export const findUserByUsername = async (query) => {
  try {
    const like = `%${query}%`;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, role, user_type, avatar_url')
      .ilike('username', like)
      .limit(50);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error finding user by username:', error);
    return { data: null, error };
  }
};

// ==================== COMMUNITY INVITATION FUNCTIONS ====================

// Create a community invitation
export const createCommunityInvitation = async ({ communityId, invitedUserId, invitedById, invitedRole = 'member' }) => {
  try {
    const payload = {
      community_id: communityId,
      invited_user_id: invitedUserId,
      invited_by: invitedById,
      role: invitedRole,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('community_invitations')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating community invitation:', error);
    return { data: null, error };
  }
};

// Get invitations for a user - FIXED VERSION
export const getUserCommunityInvitations = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('community_invitations')
      .select(`
        id,
        status,
        role,
        created_at,
        community:communities(id, name, icon),
        invited_by_user:profiles!community_invitations_invited_by_fkey(id, display_name, username, avatar_url),
        invited_user:profiles!community_invitations_invited_user_id_fkey(id, display_name, username, avatar_url)
      `)
      .eq('invited_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    // If the invitations table is not present in the database, return an empty list
    if (error && error.code === 'PGRST205') {
      console.warn('community_invitations table not found; returning empty invitations list');
      return { data: [], error: null };
    }

    console.error('Error fetching user community invitations:', error);
    return { data: null, error };
  }
};

// Accept an invitation: join the community and remove the invitation
export const acceptCommunityInvitation = async (invitationId, userId) => {
  try {
    // Get invitation
    const { data: inv, error: invErr } = await supabase
      .from('community_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (invErr) throw invErr;
    if (!inv) throw new Error('Invitation not found');

    // Add membership
    const { data: memberData, error: memberErr } = await supabase
      .from('community_members')
      .insert([{
        community_id: inv.community_id,
        user_id: userId,
        role: inv.role || 'member'
      }])
      .select()
      .single();

    if (memberErr) throw memberErr;

    // Update member count via RPC if exists
    try {
      const { error: rpcErr } = await supabase.rpc('increment_member_count', { community_id: inv.community_id });
      if (rpcErr) console.error('RPC increment_member_count error:', rpcErr);
    } catch (e) {
      console.log('RPC increment_member_count not available or failed', e);
    }

    // Delete the invitation (or set status accepted)
    const { error: delErr } = await supabase
      .from('community_invitations')
      .delete()
      .eq('id', invitationId);

    if (delErr) console.error('Error deleting invitation after accept:', delErr);

    return { data: memberData, error: null };
  } catch (error) {
    console.error('Error accepting community invitation:', error);
    return { data: null, error };
  }
};

// Decline an invitation: just delete it
export const declineCommunityInvitation = async (invitationId) => {
  try {
    const { data, error } = await supabase
      .from('community_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error declining community invitation:', error);
    return { data: null, error };
  }
};



// Add these functions to your existing supabase.js file:

// Get community invitations for admin view
export const getCommunityInvitations = async (communityId) => {
  try {
    const { data, error } = await supabase
      .from('community_invitations')
      .select(`
        id,
        status,
        role,
        created_at,
        invited_user:profiles!community_invitations_invited_user_id_fkey(
          id,
          username,
          display_name,
          avatar_url,
          user_type
        ),
        invited_by:profiles!community_invitations_invited_by_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('community_id', communityId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching community invitations:', error);
    return { data: null, error };
  }
};

// Cancel/revoke an invitation
export const cancelCommunityInvitation = async (invitationId) => {
  try {
    const { data, error } = await supabase
      .from('community_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error canceling community invitation:', error);
    return { data: null, error };
  }
};

// Bulk create community invitations
export const createBulkCommunityInvitations = async (invitations) => {
  try {
    const { data, error } = await supabase
      .from('community_invitations')
      .insert(invitations)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating bulk community invitations:', error);
    return { data: null, error };
  }
};