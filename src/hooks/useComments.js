import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const useComments = (postId, userId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasCommented, setHasCommented] = useState(false);

  // Fetch comments for the post
  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`*, user:profiles(id, display_name, avatar_url)`)
        .eq('post_id', postId)
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
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: postId,
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
      const { error } = await supabase
        .from('comments')
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
      // Get current count
      const { data: currentPost } = await supabase
        .from('posts')
        .select('comments_count')
        .eq('id', postId)
        .single();

      if (currentPost) {
        const currentCount = currentPost.comments_count || 0;
        const newCount = Math.max(0, currentCount + change);
        
        const { error } = await supabase
          .from('posts')
          .update({ comments_count: newCount })
          .eq('id', postId);

        if (!error) {
          console.log(`Successfully updated comments_count to ${newCount}`);
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

    // Subscribe to comment changes
    const subscription = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
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