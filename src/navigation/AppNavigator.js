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

// Import the new EditProfileScreen
import EditProfileScreen from '../screens/student/EditProfileScreen';

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
      <StudentTab.Screen name="StudentSearch" component={PlaceholderScreen} />
      <StudentTab.Screen name="StudentSupport" component={PlaceholderScreen} />
      <StudentTab.Screen name="StudentCommunity" component={PlaceholderScreen} />
      <StudentTab.Screen name="StudentNotifications" component={PlaceholderScreen} />
      <StudentTab.Screen name="StudentMessages" component={PlaceholderScreen} />
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
      <FacultyTab.Screen name="FacultySearch" component={PlaceholderScreen} />
      <FacultyTab.Screen name="FacultySupport" component={PlaceholderScreen} />
      <FacultyTab.Screen name="FacultyCommunity" component={PlaceholderScreen} />
      <FacultyTab.Screen name="FacultyNotifications" component={PlaceholderScreen} />
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
      
      {/* EDIT PROFILE SCREEN - STUDENT ONLY (for now) */}
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}