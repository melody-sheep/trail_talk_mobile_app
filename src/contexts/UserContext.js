// src/contexts/UserContext.js
import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshCommunities, setRefreshCommunities] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch user profile data
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const profileData = await fetchUserProfile(currentUser.id);
        setProfile(profileData);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const profileData = await fetchUserProfile(currentUser.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Function to update profile data (call this when profile is updated)
  const updateProfile = async (userId) => {
    if (!userId) return;
    
    const profileData = await fetchUserProfile(userId);
    setProfile(profileData);
  };

  // Heartbeat: update profiles.last_active_at while app is active
  const heartbeatIntervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const skipHeartbeatRef = useRef(false);

  const updateLastActive = useCallback(async (userId) => {
    if (!userId || skipHeartbeatRef.current) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        // If column doesn't exist, stop attempting further heartbeats
        if (error.code === '42703' || (error.message || '').includes('last_active_at')) {
          console.warn('last_active_at column missing, disabling heartbeat.');
          skipHeartbeatRef.current = true;
        } else {
          console.error('Error updating last_active_at:', error);
        }
        return;
      }

      // Update local profile timestamp for immediate UI feedback
      setProfile(prev => prev ? { ...prev, last_active_at: new Date().toISOString() } : prev);
    } catch (e) {
      console.error('Exception updating last_active_at:', e);
    }
  }, []);

  const startHeartbeat = useCallback((userId) => {
    if (!userId || skipHeartbeatRef.current) return;
    // immediate update
    updateLastActive(userId);
    // clear any existing
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    heartbeatIntervalRef.current = setInterval(() => updateLastActive(userId), 60 * 1000); // every 60s
  }, [updateLastActive]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Listen to app state changes to start/stop heartbeat
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (!user?.id) return;
      const prev = appStateRef.current;
      appStateRef.current = nextAppState;
      if (prev.match(/inactive|background/) && nextAppState === 'active') {
        // app came to foreground
        startHeartbeat(user.id);
      } else if (nextAppState.match(/inactive|background/)) {
        // app went to background
        stopHeartbeat();
        // also do one final update (best effort)
        updateLastActive(user.id);
      }
    });

    return () => {
      subscription.remove();
      stopHeartbeat();
    };
  }, [user?.id, startHeartbeat, stopHeartbeat, updateLastActive]);

  // Start heartbeat when user logs in
  useEffect(() => {
    if (user?.id) {
      startHeartbeat(user.id);
    } else {
      stopHeartbeat();
    }
    return () => stopHeartbeat();
  }, [user?.id, startHeartbeat, stopHeartbeat]);

  const triggerCommunityRefresh = () => {
    console.log('Triggering community refresh...');
    setRefreshCommunities(prev => prev + 1);
    setRefreshTrigger(prev => prev + 1);
  };

  const value = {
    user,
    profile,
    loading,
    refreshCommunities,
    refreshTrigger,
    triggerCommunityRefresh,
    updateProfile,
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};