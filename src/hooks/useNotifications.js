import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Hook: useNotifications
// Returns: { notifications, loading, error, unreadCount, fetchNotifications, markAsRead, markAllAsRead }
export default function useNotifications(passedUserId = null) {
  const [authUser, setAuthUser] = useState(null);
  const userIdFromParam = passedUserId;
  const userId = userIdFromParam || authUser?.id;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const channelRef = useRef(null);

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
    const post = row?.post || null;
    const community_post = row?.community_post || null;
    const { displayName, initials } = buildDisplayNameAndInitials(actor);

    const snippet = (post?.content || community_post?.content || '').slice(0, 120);
    let description = '';
    switch (row.type) {
      case 'like':
      case 'post_like':
        description = `${displayName} liked your post: "${snippet}"`;
        break;
      case 'comment':
        description = `${displayName} commented: "${snippet}"`;
        break;
      case 'repost':
        description = `${displayName} reposted your post`;
        break;
      case 'follow':
        description = `${displayName} started following you`;
        break;
      case 'community_post':
        description = `${displayName} posted in a community: "${snippet}"`;
        break;
      case 'mention':
        description = `${displayName} mentioned you: "${snippet}"`;
        break;
      case 'system':
        description = snippet || 'System notification';
        break;
      case 'achievement':
        description = snippet || 'Achievement unlocked';
        break;
      default:
        description = snippet || 'You have a new notification';
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
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch notifications (only columns and FK ids). Do NOT rely on PostgREST embedding here
      const { data: rows, error: fetchError } = await supabase
        .from('notifications')
        .select(`id, type, is_read, created_at, post_id, community_post_id, actor_id, data`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching notifications', fetchError);
        setError(fetchError);
        setNotifications([]);
      } else {
        const list = rows || [];

        // Collect related IDs
        const actorIds = Array.from(new Set(list.map(r => r.actor_id).filter(Boolean)));
        const postIds = Array.from(new Set(list.map(r => r.post_id).filter(Boolean)));
        const communityPostIds = Array.from(new Set(list.map(r => r.community_post_id).filter(Boolean)));

        // Fetch related profiles, posts, community_posts in parallel
        const fetches = [];
        fetches.push(
          actorIds.length
            ? supabase.from('profiles').select('id,display_name,username,student_id,school_email').in('id', actorIds)
            : Promise.resolve({ data: [], error: null })
        );
        fetches.push(
          postIds.length
            ? supabase.from('posts').select('id,content').in('id', postIds)
            : Promise.resolve({ data: [], error: null })
        );
        fetches.push(
          communityPostIds.length
            ? supabase.from('community_posts').select('id,content').in('id', communityPostIds)
            : Promise.resolve({ data: [], error: null })
        );

        const [profilesRes, postsRes, communityRes] = await Promise.all(fetches);

        const profiles = profilesRes?.data || [];
        const posts = postsRes?.data || [];
        const communities = communityRes?.data || [];

        const profilesMap = profiles.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
        const postsMap = posts.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
        const communityMap = communities.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});

        const enriched = list.map(r => ({
          ...r,
          actor: profilesMap[r.actor_id] || null,
          post: postsMap[r.post_id] || null,
          community_post: communityMap[r.community_post_id] || null,
        }));

        const mapped = enriched.map(mapNotificationRow);
        setNotifications(mapped);
        console.log(`Fetched ${mapped.length} notifications for user ${userId}`);
        console.log('Fetched notifications (mapped):', mapped);
      }
    } catch (err) {
      console.error('Unexpected error fetching notifications', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = async (notificationId) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
      if (error) console.error('Error marking as read', error);
    } catch (e) {
      console.error('Unexpected error markAsRead', e);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
      if (error) console.error('Error marking all read', error);
    } catch (e) {
      console.error('Unexpected error markAllAsRead', e);
    }
  };

  useEffect(() => {
    if (!userId) {
      // try to get current auth user if none provided
      (async () => {
        try {
          const { data } = await supabase.auth.getUser();
          if (data?.user) setAuthUser(data.user);
        } catch (e) {
          console.error('Error retrieving auth user in useNotifications', e);
        }
      })();
      return;
    }

    console.log('useNotifications initializing for user:', userId);
    fetchNotifications();

    // Setup realtime subscription for new notifications (with detailed debug logging)
    let channel = null;

    const setupRealtime = async () => {
      console.log('useNotifications: setting up realtime (supabase.channel exists? ', !!supabase.channel, ') (supabase.from? ', !!supabase.from, ') for userId=', userId);
      try {
        if (supabase.channel) {
          channel = supabase.channel(`notifications_user_${userId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, async (payload) => {
              console.log('Realtime payload (channel):', payload?.new ? { id: payload.new.id, user_id: payload.new.user_id, type: payload.new.type } : payload);
              try {
                // Fetch the inserted notification row (no embedding), then fetch related data
                const { data: [single], error: singleErr } = await supabase
                  .from('notifications')
                  .select('id, type, is_read, created_at, post_id, community_post_id, actor_id, data')
                  .eq('id', payload.new.id);

                if (singleErr) {
                  console.error('Realtime: error fetching single notification row', singleErr);
                }

                if (!singleErr && single) {
                  console.log('Realtime: fetched single row', { id: single.id, is_read: single.is_read, actor_id: single.actor_id, post_id: single.post_id });
                  // fetch related actor/post/community items
                  const [profilesRes, postsRes, communityRes] = await Promise.all([
                    single.actor_id ? supabase.from('profiles').select('id,display_name,username,student_id,school_email').eq('id', single.actor_id) : Promise.resolve({ data: [] }),
                    single.post_id ? supabase.from('posts').select('id,content').eq('id', single.post_id) : Promise.resolve({ data: [] }),
                    single.community_post_id ? supabase.from('community_posts').select('id,content').eq('id', single.community_post_id) : Promise.resolve({ data: [] }),
                  ]);

                  const actor = profilesRes?.data?.[0] || null;
                  const post = postsRes?.data?.[0] || null;
                  const community_post = communityRes?.data?.[0] || null;

                  const enrichedSingle = { ...single, actor, post, community_post };
                  const mappedSingle = mapNotificationRow(enrichedSingle);
                  setNotifications(prev => {
                    const next = [mappedSingle, ...prev];
                    console.log('Realtime: prepending mapped notification. New length=', next.length, 'unreadCountBefore=', prev.filter(n => !n.isRead).length, 'unreadCountAfter=', next.filter(n => !n.isRead).length);
                    return next;
                  });
                  console.log('Realtime added notification (mapped):', mappedSingle);
                }
              } catch (e) {
                console.error('Error fetching new notification (channel branch)', e);
              }
            })
            .subscribe();
          console.log('Realtime: channel created', channel && typeof channel === 'object');
          channelRef.current = channel;
        } else if (supabase.from) {
          console.log('useNotifications: using fallback supabase.from subscription for userId=', userId);
          channel = supabase.from(`notifications:user_id=eq.${userId}`).on('INSERT', async (payload) => {
            console.log('Realtime payload (from fallback):', payload?.new ? { id: payload.new.id, user_id: payload.new.user_id, type: payload.new.type } : payload);
            try {
              const { data: single, error: singleErr } = await supabase
                .from('notifications')
                .select(`
                  id,
                  type,
                  is_read,
                  created_at,
                  post:posts(content),
                  community_post:community_posts(content),
                  actor:profiles!notifications_actor_id_fkey(display_name, username, student_id, school_email)
                `)
                .eq('id', payload.new.id)
                .single();

              if (singleErr) {
                console.error('Realtime (fallback): error fetching single notification', singleErr);
              }

              if (!singleErr && single) {
                 const mappedSingle = mapNotificationRow(single);
                 setNotifications(prev => {
                   const next = [mappedSingle, ...prev];
                   console.log('Realtime (fallback): prepended notification. New length=', next.length);
                   return next;
                 });
                 console.log('Realtime (fallback): received new notification', mappedSingle.id, mappedSingle);
              }
            } catch (e) {
              console.error('Error fetching new notification (fallback branch)', e);
            }
          }).subscribe();
          channelRef.current = channel;
        }
      } catch (e) {
        console.error('Realtime subscription error', e);
      }
    };

    setupRealtime();

    return () => {
      try {
        const ch = channelRef.current;
        if (!ch) return;
        if (ch.unsubscribe) ch.unsubscribe();
        else if (supabase.removeChannel) supabase.removeChannel(ch);
      } catch (e) {
        // ignore
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
