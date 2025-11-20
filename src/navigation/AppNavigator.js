// src/navigation/AppNavigator.js
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

// Import BOTH EditProfileScreens - ADD THIS LINE
import EditProfileScreen from '../screens/student/EditProfileScreen';
import FacultyEditProfileScreen from '../screens/faculty/EditProfileScreen'; // ADD THIS

// Import SearchScreen
import StudentSearchScreen from '../screens/student/SearchScreen';
import FacultySearchScreen from '../screens/student/SearchScreen'; // Using same for now

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

// Import CreateCommunityScreen (Student only for now)
import StudentCreateCommunityScreen from '../screens/student/CreateCommunityScreen';

// Import CommunityDetailScreen
import CommunityDetailScreen from '../screens/student/CommunityDetailScreen';

// Import CreateCommunityPostScreen
import CreateCommunityPostScreen from '../screens/student/CreateCommunityPostScreen';
import CommentScreen from '../screens/student/CommentScreen';

import BottomNavigation from '../components/BottomNavigation';

const Stack = createNativeStackNavigator();
const StudentTab = createBottomTabNavigator();
const FacultyTab = createBottomTabNavigator();

// Create placeholder screens for unimplemented features
const PlaceholderScreen = () => (
  <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}>
    <text style={{ color: 'white', fontSize: 18 }}>Coming Soon</text>
  </div>
);

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
      <FacultyTab.Screen name="FacultyMessages" component={PlaceholderScreen} />
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
      
      {/* CREATE POST SCREENS - These are outside the tab navigator */}
      <Stack.Screen 
        name="StudentCreatePost" 
        component={StudentCreatePostScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="CommentScreen"
        component={CommentScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="FacultyCreatePost" 
        component={FacultyCreatePostScreen}
        options={{
          animation: 'slide_from_bottom',
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
        name="FacultyProfile" 
        component={FacultyProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* EDIT PROFILE SCREENS - BOTH STUDENT AND FACULTY */}
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      {/* ADD THIS NEW SCREEN FOR FACULTY */}
      <Stack.Screen 
        name="FacultyEditProfile" 
        component={FacultyEditProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* CREATE COMMUNITY SCREEN - STUDENT ONLY (for now) */}
      <Stack.Screen 
        name="CreateCommunity" 
        component={StudentCreateCommunityScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* COMMUNITY DETAIL SCREEN */}
      <Stack.Screen 
        name="CommunityDetail" 
        component={CommunityDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* CREATE COMMUNITY POST SCREEN */}
      <Stack.Screen 
        name="CreateCommunityPost" 
        component={CreateCommunityPostScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}