import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function useBannedWords() {
  const [banned, setBanned] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('banned_words').select('*');
        if (!error && mounted) setBanned(data || []);
      } catch (err) {
        console.log('Error fetching banned words', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, []);

  const refetch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('banned_words').select('*');
      if (!error) setBanned(data || []);
    } catch (err) {
      console.log('Error refetching banned words', err);
    } finally {
      setLoading(false);
    }
  };

  const checkContent = (text) => {
    if (!text) return [];
    const lower = text.toLowerCase();
    const matches = [];
    for (const b of banned) {
      try {
        const word = (b.word || '').toLowerCase().trim();
        if (!word) continue;
        // simple word boundary match
        const re = new RegExp("\\b" + escapeRegExp(word) + "\\b", 'i');
        if (re.test(lower)) matches.push({ ...b });
      } catch (err) {
        // ignore bad regex
      }
    }
    return matches;
  };

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  return { banned, loading, checkContent, refetch };
}
