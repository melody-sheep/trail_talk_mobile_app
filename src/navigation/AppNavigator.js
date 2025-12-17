// src/navigation/AppNavigator.js - COMPLETE UPDATED VERSION
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity } from 'react-native';
import WelcomeScreen from '../screens/WelcomeScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SignInScreen from '../screens/SignInScreen';
import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import FacultyHomeScreen from '../screens/faculty/FacultyHomeScreen';

// Import CreatePostScreen and ProfileScreen
import StudentCreatePostScreen from '../screens/student/CreatePostScreen';
import FacultyCreatePostScreen from '../screens/faculty/CreatePostScreen';
import StudentProfileScreen from '../screens/student/ProfileScreen';
import FacultyProfileScreen from '../screens/faculty/ProfileScreen';
import ViewProfileScreen from '../screens/student/ViewProfileScreen';
import FacultyViewProfileScreen from '../screens/faculty/ViewProfileScreen';

// Import BOTH EditProfileScreens
import EditProfileScreen from '../screens/student/EditProfileScreen';
import FacultyEditProfileScreen from '../screens/faculty/EditProfileScreen';

// Import SearchScreen
import StudentSearchScreen from '../screens/student/SearchScreen';
import FacultySearchScreen from '../screens/faculty/SearchScreen';

// Import SupportScreen
import StudentSupportScreen from '../screens/student/SupportScreen';
import FacultySupportScreen from '../screens/faculty/SupportScreen';

// Import CommunityScreen
import StudentCommunityScreen from '../screens/student/CommunityScreen';
import FacultyCommunityScreen from '../screens/faculty/CommunityScreen';

// Import NotificationsScreen
import StudentNotificationsScreen from '../screens/student/NotificationsScreen';
import FacultyNotificationsScreen from '../screens/faculty/NotificationsScreen';

// Import MessageScreen
import StudentMessagesScreen from '../screens/student/MessagesScreen';
import FacultyMessagesScreen from '../screens/faculty/MessagesScreen';

// Import ChatScreen
import ChatScreen from '../screens/student/ChatScreen';
import FacultyChatScreen from '../screens/faculty/ChatScreen';

// Import Community Screens - STUDENT
import StudentCreateCommunityScreen from '../screens/student/CreateCommunityScreen';
import StudentCommunityDetailScreen from '../screens/student/CommunityDetailScreen';
import StudentCommunityFeedScreen from '../screens/student/CommunityFeedScreen';
import StudentCreateCommunityPostScreen from '../screens/student/CreateCommunityPostScreen';

// Import Community Screens - FACULTY
import FacultyCreateCommunityScreen from '../screens/faculty/CreateCommunityScreen';
import FacultyCommunityDetailScreen from '../screens/faculty/CommunityDetailScreen';
import FacultyCommunityFeedScreen from '../screens/faculty/CommunityFeedScreen';
import FacultyCreateCommunityPostScreen from '../screens/faculty/CreateCommunityPostScreen';

// Import Report Dashboard
import ReportDashboardScreen from '../screens/faculty/ReportDashboardScreen';

// Import Settings and Developers Screens
import StudentSettingsScreen from '../screens/student/StudentSettingsScreen';
import FacultySettingsScreen from '../screens/faculty/FacultySettingsScreen';
import StudentDevelopersScreen from '../screens/student/StudentDevelopersScreen';
import FacultyDevelopersScreen from '../screens/faculty/FacultyDevelopersScreen';

// Import Shared Screens
import CommentScreen from '../screens/student/CommentScreen';
import FacultyCommentScreen from '../screens/faculty/CommentScreen';

import BottomNavigation from '../components/BottomNavigation';
import { colors } from '../styles/colors';
import { fonts } from '../styles/fonts';
import useNotifications from '../hooks/useNotifications';
import { useContext, useEffect, useState, useRef } from 'react';
import { UserContext } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';

const Stack = createNativeStackNavigator();
const StudentTab = createBottomTabNavigator();
const FacultyTab = createBottomTabNavigator();

// Create placeholder component for missing screens
const PlaceholderScreen = ({ navigation, route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.homeBackground }}>
    <Text style={{ color: colors.white, fontSize: 18, marginBottom: 20 }}>{route.name} - Coming Soon</Text>
    <TouchableOpacity 
      style={{ backgroundColor: colors.primary, padding: 15, borderRadius: 10 }}
      onPress={() => navigation.goBack()}
    >
      <Text style={{ color: colors.white, fontSize: 16 }}>Go Back</Text>
    </TouchableOpacity>
  </View>
);

function StudentTabNavigator() {
  const { user } = useContext(UserContext);
  const { unreadCount: unreadNotifications, markAllAsRead } = useNotifications(user?.id);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const skipReadByRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const fetchUnreadMessages = async () => {
      if (!user?.id) {
        if (mounted) setUnreadMessages(0);
        return;
      }
      try {
        if (skipReadByRef.current) {
          if (mounted) setUnreadMessages(0);
          return;
        }

        // Fetch recent messages sent by others and compute unread locally.
        const { data, error } = await supabase
          .from('messages')
          .select('id, read_by, sender_id, created_at')
          .neq('sender_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) {
          // detect missing column error and stop querying read_by
          if (error.code === '42703' || error.code === 42703 || (error.message || '').includes('read_by')) {
            skipReadByRef.current = true;
            if (mounted) setUnreadMessages(0);
            return;
          }

          console.error('Error fetching recent messages for unread count:', error);
          if (mounted) setUnreadMessages(0);
        } else {
          const unread = (data || []).filter(m => !(m.read_by || []).includes(user.id)).length;
          if (mounted) setUnreadMessages(unread);
        }
      } catch (err) {
        try {
          if (err?.code === '42703' || err?.code === 42703 || (err?.message || '').includes('read_by')) {
            skipReadByRef.current = true;
            if (mounted) setUnreadMessages(0);
            return;
          }
        } catch (e) {}
        console.error('Unexpected error fetching unread messages:', err);
        if (mounted) setUnreadMessages(0);
      }
    };

    fetchUnreadMessages();

    // Set up realtime subscription to messages table for this user to update count
    let subscription;
    try {
      subscription = supabase
        .channel(`unread-messages-${user?.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          fetchUnreadMessages();
        })
        .subscribe();
    } catch (e) {
      // ignore subscription errors
    }

    return () => {
      mounted = false;
      try { subscription?.unsubscribe(); } catch(e) {}
    };
  }, [user?.id]);
  
  const handleNotificationsPress = async () => {
    try {
      // Mark all notifications as read via hook
      if (typeof markAllAsRead === 'function') {
        await markAllAsRead();
      }
    } catch (e) {
      console.error('Error marking notifications as read from navigator:', e);
    }
  };

  const handleMessagesPress = async () => {
    try {
      // Optimistically clear the badge locally; Messages screen should perform DB updates
      setUnreadMessages(0);
    } catch (e) {
      console.error('Error clearing message badge:', e);
    }
  };
  return (
    <StudentTab.Navigator
      tabBar={(props) => (
        <BottomNavigation
          {...props}
          userRole="student"
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
          onNotificationsPress={handleNotificationsPress}
          onMessagesPress={handleMessagesPress}
        />
      )}
      screenOptions={{
        headerShown: false,
        unmountOnBlur: false,
      }}
    >
      <StudentTab.Screen name="StudentHome" component={StudentHomeScreen} />
      <StudentTab.Screen name="StudentSearch" component={StudentSearchScreen} />
      <StudentTab.Screen name="StudentSupport" component={StudentSupportScreen} />
      <StudentTab.Screen name="StudentCommunity" component={StudentCommunityScreen} />
      <StudentTab.Screen name="StudentNotifications" component={StudentNotificationsScreen} />
      <StudentTab.Screen name="StudentMessages" component={StudentMessagesScreen} />
    </StudentTab.Navigator>
  );
}

function FacultyTabNavigator() {
  const { user } = useContext(UserContext);
  const { unreadCount: unreadNotifications, markAllAsRead } = useNotifications(user?.id);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const skipReadByRefFaculty = useRef(false);

  useEffect(() => {
    let mounted = true;
    const fetchUnreadMessages = async () => {
      if (!user?.id) {
        if (mounted) setUnreadMessages(0);
        return;
      }
      try {
        if (skipReadByRefFaculty.current) {
          if (mounted) setUnreadMessages(0);
          return;
        }

        const { data, error } = await supabase
          .from('messages')
          .select('id, read_by, sender_id, created_at')
          .neq('sender_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) {
          if (error.code === '42703' || error.code === 42703 || (error.message || '').includes('read_by')) {
            skipReadByRefFaculty.current = true;
            if (mounted) setUnreadMessages(0);
            return;
          }

          console.error('Error fetching recent messages for unread count:', error);
          if (mounted) setUnreadMessages(0);
        } else {
          const unread = (data || []).filter(m => !(m.read_by || []).includes(user.id)).length;
          if (mounted) setUnreadMessages(unread);
        }
      } catch (err) {
        try {
          if (err?.code === '42703' || err?.code === 42703 || (err?.message || '').includes('read_by')) {
            skipReadByRefFaculty.current = true;
            if (mounted) setUnreadMessages(0);
            return;
          }
        } catch (e) {}
        console.error('Unexpected error fetching unread messages:', err);
        if (mounted) setUnreadMessages(0);
      }
    };

    fetchUnreadMessages();

    let subscription;
    try {
      subscription = supabase
        .channel(`unread-messages-${user?.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          fetchUnreadMessages();
        })
        .subscribe();
    } catch (e) {
      // ignore subscription errors
    }

    return () => {
      mounted = false;
      try { subscription?.unsubscribe(); } catch(e) {}
    };
  }, [user?.id]);

  const handleNotificationsPress = async () => {
    try {
      if (typeof markAllAsRead === 'function') {
        await markAllAsRead();
      }
    } catch (e) {
      console.error('Error marking notifications as read from navigator:', e);
    }
  };

  const handleMessagesPress = async () => {
    try {
      setUnreadMessages(0);
    } catch (e) {
      console.error('Error clearing message badge:', e);
    }
  };
  return (
    <FacultyTab.Navigator
      tabBar={(props) => (
        <BottomNavigation
          {...props}
          userRole="faculty"
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
          onNotificationsPress={handleNotificationsPress}
          onMessagesPress={handleMessagesPress}
        />
      )}
      screenOptions={{
        headerShown: false,
        unmountOnBlur: false,
      }}
    >
      <FacultyTab.Screen name="FacultyHome" component={FacultyHomeScreen} />
      <FacultyTab.Screen name="FacultySearch" component={FacultySearchScreen} />
      <FacultyTab.Screen name="FacultySupport" component={FacultySupportScreen} />
      <FacultyTab.Screen name="FacultyCommunity" component={FacultyCommunityScreen} />
      <FacultyTab.Screen name="FacultyNotifications" component={FacultyNotificationsScreen} />
      <FacultyTab.Screen name="FacultyMessages" component={FacultyMessagesScreen} />
    </FacultyTab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{
        headerShown: false
      }}
      initialRouteName="Welcome"
    >
      {/* AUTHENTICATION FLOW */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      
      {/* MAIN APP - STUDENT */}
      <Stack.Screen name="StudentMain" component={StudentTabNavigator} />
      
      {/* MAIN APP - FACULTY */}
      <Stack.Screen name="FacultyMain" component={FacultyTabNavigator} />

      {/* Report Dashboard - Faculty only */}
      <Stack.Screen 
        name="ReportDashboard" 
        component={ReportDashboardScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* CREATE POST SCREENS */}
      <Stack.Screen 
        name="StudentCreatePost" 
        component={StudentCreatePostScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="FacultyCreatePost" 
        component={FacultyCreatePostScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      
      {/* COMMENT SCREENS */}
      <Stack.Screen
        name="CommentScreen"
        component={CommentScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="FacultyCommentScreen"
        component={FacultyCommentScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* CHAT SCREENS */}
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.homeBackground,
          },
          headerTintColor: colors.white,
          headerTitleStyle: {
            fontFamily: fonts.semiBold,
          },
        }}
      />
      <Stack.Screen 
        name="FacultyChat" 
        component={FacultyChatScreen}
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.homeBackground,
          },
          headerTintColor: colors.white,
          headerTitleStyle: {
            fontFamily: fonts.semiBold,
          },
        }}
      />
      
      {/* PROFILE SCREENS */}
      <Stack.Screen 
        name="StudentProfile" 
        component={StudentProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="ViewProfile" 
        component={ViewProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="FacultyViewProfile" 
        component={FacultyViewProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="FacultyProfile" 
        component={FacultyProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* EDIT PROFILE SCREENS */}
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="FacultyEditProfile" 
        component={FacultyEditProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* SETTINGS AND DEVELOPERS SCREENS */}
      <Stack.Screen 
        name="StudentSettings" 
        component={StudentSettingsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="FacultySettings" 
        component={FacultySettingsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="StudentDevelopers" 
        component={StudentDevelopersScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="FacultyDevelopers" 
        component={FacultyDevelopersScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* COMMUNITY SCREENS - STUDENT */}
      <Stack.Screen 
        name="StudentCreateCommunity" 
        component={StudentCreateCommunityScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="StudentCommunityDetail" 
        component={StudentCommunityDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="StudentCommunityFeed" 
        component={StudentCommunityFeedScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="StudentCreateCommunityPost" 
        component={StudentCreateCommunityPostScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      
      {/* COMMUNITY SCREENS - FACULTY */}
      <Stack.Screen 
        name="FacultyCreateCommunity" 
        component={FacultyCreateCommunityScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="FacultyCommunityDetail" 
        component={FacultyCommunityDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="FacultyCommunityFeed" 
        component={FacultyCommunityFeedScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="FacultyCreateCommunityPost" 
        component={FacultyCreateCommunityPostScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      
      {/* LEGACY COMMUNITY SCREENS (for backward compatibility) */}
      <Stack.Screen 
        name="CreateCommunity" 
        component={StudentCreateCommunityScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="CommunityDetail" 
        component={StudentCommunityDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="CreateCommunityPost" 
        component={StudentCreateCommunityPostScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />

      {/* ADDITIONAL SCREENS FOR COMPLETENESS */}
      <Stack.Screen 
        name="PremiumSubscription" 
        component={PlaceholderScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="EditSupportContent" 
        component={PlaceholderScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}