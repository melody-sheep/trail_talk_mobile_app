import { useEffect, useState, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserContext } from '../contexts/UserContext';

export default function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(UserContext);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch reports with minimal post info
      const { data, error } = await supabase
        .from('reports')
        .select('*, post:post_id(id, content, category, author_id, created_at), reporter_id')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Error fetching reports:', error);
        setReports([]);
      } else {
        const reportsData = data || [];

        // Collect profile IDs to fetch (reporters + post authors)
        const reporterIds = reportsData.map(r => r.reporter_id).filter(Boolean);
        const authorIds = reportsData.map(r => r.post?.author_id).filter(Boolean);
        const profileIds = Array.from(new Set([...reporterIds, ...authorIds]));

        let profilesMap = {};
        if (profileIds.length > 0) {
          const { data: profiles, error: pErr } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url, role, user_type')
            .in('id', profileIds);

          if (!pErr && profiles) {
            profiles.forEach(p => { profilesMap[p.id] = p; });
          }
        }

        // Attach reporter and author profiles for convenience
        const enriched = reportsData.map(r => ({
          ...r,
          reporter: profilesMap[r.reporter_id] || null,
          post: r.post || null,
          post_author: profilesMap[r.post?.author_id] || null,
        }));

        setReports(enriched);
      }
    } catch (err) {
      console.log('fetchReports error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();

    // realtime subscription for new reports
    const channel = supabase
      .channel('public:reports')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (payload) => {
        setReports(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchReports]);

  const dismissReport = async (reportId, notes = '') => {
    try {
      await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId);
      await supabase.from('report_actions').insert([{ report_id: reportId, faculty_id: user?.id, action: 'dismiss', notes }]);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'dismissed' } : r));
    } catch (err) {
      console.log('dismissReport error', err);
    }
  };

  const deletePostForReport = async (reportId, postId, notes = '') => {
    try {
      // delete the post
      await supabase.from('posts').delete().eq('id', postId);
      // mark report resolved
      await supabase.from('reports').update({ status: 'deleted' }).eq('id', reportId);
      await supabase.from('report_actions').insert([{ report_id: reportId, faculty_id: user?.id, action: 'delete_post', notes }]);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'deleted' } : r));
    } catch (err) {
      console.log('deletePostForReport error', err);
    }
  };

  const warnUser = async (reportId, notes = '') => {
    try {
      await supabase.from('report_actions').insert([{ report_id: reportId, faculty_id: user?.id, action: 'warn_user', notes }]);
      await supabase.from('reports').update({ status: 'warned' }).eq('id', reportId);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'warned' } : r));
    } catch (err) {
      console.log('warnUser error', err);
    }
  };

  return {
    reports,
    loading,
    fetchReports,
    dismissReport,
    deletePostForReport,
    warnUser,
  };
}
