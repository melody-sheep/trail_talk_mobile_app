// src/navigation/AppNavigator.js - FIXED VERSION
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

// Import Community Screens - STUDENT
import StudentCreateCommunityScreen from '../screens/student/CreateCommunityScreen';
import StudentCommunityDetailScreen from '../screens/student/CommunityDetailScreen';
import StudentCommunityFeedScreen from '../screens/student/CommunityFeedScreen';
import StudentCreateCommunityPostScreen from '../screens/student/CreateCommunityPostScreen';

// Import Community Screens - FACULTY
import FacultyCreateCommunityScreen from '../screens/faculty/CreateCommunityScreen';
import FacultyCommunityDetailScreen from '../screens/faculty/CommunityDetailScreen';
import FacultyCommunityFeedScreen from '../screens/faculty/CommunityFeedScreen';
import ReportDashboardScreen from '../screens/faculty/ReportDashboardScreen';

// Import Shared Screens
import CommentScreen from '../screens/student/CommentScreen';

import BottomNavigation from '../components/BottomNavigation';
import { colors } from '../styles/colors';
import { fonts } from '../styles/fonts';

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

// Try to import the new screens, fallback to placeholder if they don't exist
let StudentSettingsScreen, FacultySettingsScreen, StudentDevelopersScreen, FacultyDevelopersScreen;

try {
  StudentSettingsScreen = require('../screens/student/StudentSettingsScreen').default;
} catch (error) {
  StudentSettingsScreen = PlaceholderScreen;
}

try {
  FacultySettingsScreen = require('../screens/faculty/FacultySettingsScreen').default;
} catch (error) {
  FacultySettingsScreen = PlaceholderScreen;
}

try {
  StudentDevelopersScreen = require('../screens/student/StudentDevelopersScreen').default;
} catch (error) {
  StudentDevelopersScreen = PlaceholderScreen;
}

try {
  FacultyDevelopersScreen = require('../screens/faculty/FacultyDevelopersScreen').default;
} catch (error) {
  FacultyDevelopersScreen = PlaceholderScreen;
}

function StudentTabNavigator() {
  return (
    <StudentTab.Navigator
      tabBar={(props) => <BottomNavigation {...props} userRole="student" />}
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
  return (
    <FacultyTab.Navigator
      tabBar={(props) => <BottomNavigation {...props} userRole="faculty" />}
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
      <Stack.Screen name="ReportDashboard" component={ReportDashboardScreen} />
      
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
      
      {/* COMMENT SCREEN */}
      <Stack.Screen
        name="CommentScreen"
        component={CommentScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* CHAT SCREEN */}
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
      
      {/* NEW SETTINGS AND DEVELOPERS SCREENS */}
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
    </Stack.Navigator>
  );
}

// Add missing imports at the top
import { View, Text, TouchableOpacity } from 'react-native';