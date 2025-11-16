// src/contexts/UserContext.js
import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshCommunities, setRefreshCommunities] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const triggerCommunityRefresh = () => {
    console.log('Triggering community refresh...');
    setRefreshCommunities(prev => prev + 1);
    setRefreshTrigger(prev => prev + 1);
  };

  const value = {
    user,
    loading,
    refreshCommunities,
    refreshTrigger,
    triggerCommunityRefresh,
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};