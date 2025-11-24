import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Enhanced: support custom comment table and post table/count field for community posts
const useComments = (
  postId,
  userId,
  options = { commentsTable: 'comments', postTable: 'posts', commentCountField: 'comments_count' }
) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasCommented, setHasCommented] = useState(false);

  // Fetch comments for the post
  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const commentsTable = options?.commentsTable || 'comments';
      // Determine the foreign key field name for the post id in the comments table
      const postIdField = options?.postIdField || (commentsTable === 'community_comments' ? 'community_post_id' : 'post_id');
      const { data, error } = await supabase
        .from(commentsTable)
        .select(`*, user:profiles(id, display_name, avatar_url)`)
        .eq(postIdField, postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setComments(data || []);
      // IMMEDIATELY check if current user has commented
      const userHasCommented = !!data?.find(c => c.user_id === userId);
      setHasCommented(userHasCommented);
      console.log('User has commented:', userHasCommented, 'for post:', postId);
    } catch (err) {
      setError(err.message || 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  // Add a new comment
  const addComment = async (content, isAnonymous = false, anonymousName = 'Anonymous User') => {
    setLoading(true);
    setError(null);
    try {
      const commentsTable = options?.commentsTable || 'comments';
      const postIdField = options?.postIdField || (commentsTable === 'community_comments' ? 'community_post_id' : 'post_id');
      const { data, error } = await supabase
        .from(commentsTable)
        .insert([
          {
            [postIdField]: postId,
            user_id: userId,
            content,
            is_anonymous: isAnonymous,
            anonymous_name: anonymousName,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      
      // IMMEDIATELY set hasCommented to true
      setHasCommented(true);
      console.log('Comment added - setting hasCommented to TRUE');

      // Try to update post comment count (may be blocked by RLS); it's optional
      await updatePostCommentCount(1);

      // Refresh local comments list
      await fetchComments();

      return { success: true, data };
    } catch (err) {
      setError(err.message || 'Failed to add comment');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Delete a comment (only allowed for the owning user)
  const deleteComment = async (commentId) => {
    setLoading(true);
    setError(null);
    try {
      const commentsTable = options?.commentsTable || 'comments';
      const { error } = await supabase
        .from(commentsTable)
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Decrement post comment count (best-effort)
      await updatePostCommentCount(-1);

      // Refresh and update hasCommented status
      await fetchComments();

      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to delete comment');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Update post comment count in database
  const updatePostCommentCount = async (change) => {
    try {
      // Get current count from configured post table and field
      const postTable = options?.postTable || 'posts';
      const countField = options?.commentCountField || 'comments_count';

      const { data: currentPost } = await supabase
        .from(postTable)
        .select(countField)
        .eq('id', postId)
        .single();

      if (currentPost) {
        const currentCount = Number(currentPost[countField]) || 0;
        const newCount = Math.max(0, currentCount + change);
        
        const { error } = await supabase
          .from(postTable)
          .update({ [countField]: newCount })
          .eq('id', postId);

        if (!error) {
          console.log(`Successfully updated ${countField} to ${newCount}`);
        }
      }
    } catch (error) {
      console.log('Error updating post comment count:', error);
    }
  };

  // REAL-TIME SUBSCRIPTION FOR COMMENTS - IMPROVED
  useEffect(() => {
    if (!postId) return;

    // Initial fetch
    fetchComments();

    // Subscribe to comment changes on the configured comments table
    const commentsTable = options?.commentsTable || 'comments';
    const postIdField = options?.postIdField || (commentsTable === 'community_comments' ? 'community_post_id' : 'post_id');
    const subscription = supabase
      .channel(`${commentsTable}-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: commentsTable,
          filter: `${postIdField}=eq.${postId}`
        },
        (payload) => {
          console.log('Real-time comment update:', payload.eventType, 'by user:', payload.new?.user_id);
          
          // Update hasCommented status immediately based on the event
          if (userId) {
            if (payload.eventType === 'INSERT' && payload.new.user_id === userId) {
              setHasCommented(true);
              console.log('Real-time: User commented - setting hasCommented to TRUE');
            } else if (payload.eventType === 'DELETE' && payload.old.user_id === userId) {
              // Check if user still has other comments
              const stillHasComment = comments.some(c => 
                c.id !== payload.old.id && c.user_id === userId
              );
              setHasCommented(stillHasComment);
              console.log('Real-time: User comment deleted - hasCommented:', stillHasComment);
            }
          }
          
          // Refresh comments list
          fetchComments();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [postId, userId]);

  return {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    fetchComments,
    hasCommented,
  };
};

export default useComments;