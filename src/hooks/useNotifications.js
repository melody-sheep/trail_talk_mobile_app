import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export default function useNotifications(passedUserId = null) {
  const [authUser, setAuthUser] = useState(null);
  const userIdFromParam = passedUserId;
  const userId = userIdFromParam || authUser?.id;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatRelativeTime = (date) => {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return `${diff} ${diff === 1 ? 'sec' : 'secs'} ago`;
    if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
    }
    if (diff < 86400) {
      const hrs = Math.floor(diff / 3600);
      return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`;
    }
    const days = Math.floor(diff / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  };

  const buildDisplayNameAndInitials = (actor) => {
    if (!actor) return { displayName: 'User', initials: 'USR' };
    const displayName = actor.display_name || actor.username || actor.student_id || (actor.school_email ? actor.school_email.split('@')[0] : 'User');
    const initials = displayName.split(' ').slice(0,2).map(s => s[0]).join('').toUpperCase().slice(0,3) || 'USR';
    return { displayName, initials };
  };

  const mapNotificationRow = (row) => {
    const actor = row?.actor || null;
    const { displayName, initials } = buildDisplayNameAndInitials(actor);

    let description = '';
    switch (row.type) {
      case 'like':
      case 'post_like':
        description = `${displayName} liked your post`;
        break;
      case 'comment':
        description = `${displayName} commented on your post`;
        break;
      case 'repost':
        description = `${displayName} reposted your content`;
        break;
      case 'follow':
        description = `${displayName} started following you`;
        break;
      case 'community_post':
        description = `${displayName} posted in your community`;
        break;
      case 'mention':
        description = `${displayName} mentioned you`;
        break;
      case 'system':
        description = row.data?.message || 'System notification';
        break;
      case 'achievement':
        description = row.data?.message || 'Achievement unlocked!';
        break;
      case 'bookmark':
        description = `${displayName} bookmarked your post`;
        break;
      case 'post_created':
        description = `${displayName} created a new post`;
        break;
      default:
        description = `${displayName} interacted with your content`;
    }

    return {
      id: row.id,
      type: row.type,
      description,
      timestamp: row.created_at,
      time: formatRelativeTime(row.created_at),
      isRead: !!row.is_read,
      displayName,
      initials,
      raw: row,
    };
  };

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      console.log('No user ID available for fetching notifications');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching notifications for user:', userId);
      
      // Fetch notifications with actor profiles
      const { data: notificationsData, error: fetchError } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!actor_id(
            id,
            display_name,
            username,
            student_id,
            school_email
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        console.error('Error fetching notifications:', fetchError);
        setError(fetchError);
        setNotifications([]);
      } else {
        console.log('Successfully fetched notifications:', notificationsData?.length || 0);
        const mappedNotifications = (notificationsData || []).map(mapNotificationRow);
        setNotifications(mappedNotifications);
      }
    } catch (err) {
      console.error('Unexpected error fetching notifications:', err);
      setError(err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = async (notificationId) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) console.error('Error marking as read:', error);
    } catch (e) {
      console.error('Unexpected error in markAsRead:', e);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) console.error('Error marking all as read:', error);
    } catch (e) {
      console.error('Unexpected error in markAllAsRead:', e);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    if (!userId) {
      // Try to get current auth user if none provided
      (async () => {
        try {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            setAuthUser(data.user);
          }
        } catch (e) {
          console.error('Error retrieving auth user:', e);
        }
      })();
      return;
    }

    console.log('Setting up notifications for user:', userId);
    
    // Initial fetch
    fetchNotifications();

    // Setup real-time subscription - FIXED with proper error handling
    let subscription;
    
    const setupRealtime = async () => {
      try {
        subscription = supabase
          .channel(`notifications-${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to ALL events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              console.log('Realtime notification update:', payload);
              // Always refresh when anything changes
              fetchNotifications();
            }
          )
          .subscribe((status) => {
            console.log('Realtime subscription status:', status);
          });

      } catch (error) {
        console.error('Error setting up realtime:', error);
      }
    };

    setupRealtime();

    // Cleanup subscription
    return () => {
      console.log('Cleaning up notifications subscription');
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [userId, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}