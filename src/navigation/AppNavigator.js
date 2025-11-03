import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import WelcomeScreen from '../screens/WelcomeScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SignInScreen from '../screens/SignInScreen';
import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import FacultyHomeScreen from '../screens/faculty/FacultyHomeScreen';
import StudentSearchScreen from '../screens/student/SearchScreen';
import FacultySearchScreen from '../screens/faculty/SearchScreen';
// Import other screens as you create them
import StudentMessagesScreen from '../screens/student/MessagesScreen';
import FacultyMessagesScreen from '../screens/faculty/MessagesScreen';
import StudentCommunityScreen from '../screens/student/CommunityScreen';
import FacultyCommunityScreen from '../screens/faculty/CommunityScreen';
import StudentNotificationsScreen from '../screens/student/NotificationsScreen';
import FacultyNotificationsScreen from '../screens/faculty/NotificationsScreen';
import StudentSupportScreen from '../screens/student/SupportScreen';
import FacultySupportScreen from '../screens/faculty/SupportScreen';

// ADD THESE IMPORTS
import StudentCreatePostScreen from '../screens/student/CreatePostScreen';
import FacultyCreatePostScreen from '../screens/faculty/CreatePostScreen';

// ADD PROFILE SCREEN IMPORTS
import StudentProfileScreen from '../screens/student/ProfileScreen';
import FacultyProfileScreen from '../screens/faculty/ProfileScreen';

import BottomNavigation from '../components/BottomNavigation';

const Stack = createNativeStackNavigator();
const StudentTab = createBottomTabNavigator();
const FacultyTab = createBottomTabNavigator();

function StudentTabNavigator() {
  return (
    <StudentTab.Navigator
      tabBar={(props) => <BottomNavigation {...props} userRole="student" />}
      screenOptions={{
        headerShown: false,
        unmountOnBlur: false,
      }}
    >
      <StudentTab.Screen name="StudentHome" component={StudentHomeScreen} options={{ tabBarButton: () => null }} />
      <StudentTab.Screen name="StudentSearch" component={StudentSearchScreen} options={{ tabBarButton: () => null }} />
      <StudentTab.Screen name="StudentSupport" component={StudentSupportScreen} options={{ tabBarButton: () => null }} />
      <StudentTab.Screen name="StudentCommunity" component={StudentCommunityScreen} options={{ tabBarButton: () => null }} />
      <StudentTab.Screen name="StudentNotifications" component={StudentNotificationsScreen} options={{ tabBarButton: () => null }} />
      <StudentTab.Screen name="StudentMessages" component={StudentMessagesScreen} options={{ tabBarButton: () => null }} />
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
      <FacultyTab.Screen name="FacultyHome" component={FacultyHomeScreen} options={{ tabBarButton: () => null }} />
      <FacultyTab.Screen name="FacultySearch" component={FacultySearchScreen} options={{ tabBarButton: () => null }} />
      <FacultyTab.Screen name="FacultySupport" component={FacultySupportScreen} options={{ tabBarButton: () => null }} />
      <FacultyTab.Screen name="FacultyCommunity" component={FacultyCommunityScreen} options={{ tabBarButton: () => null }} />
      <FacultyTab.Screen name="FacultyNotifications" component={FacultyNotificationsScreen} options={{ tabBarButton: () => null }} />
      <FacultyTab.Screen name="FacultyMessages" component={FacultyMessagesScreen} options={{ tabBarButton: () => null }} />
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
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="StudentMain" component={StudentTabNavigator} />
      <Stack.Screen name="FacultyMain" component={FacultyTabNavigator} />
      
      {/* CREATE POST SCREENS */}
      <Stack.Screen name="StudentCreatePost" component={StudentCreatePostScreen} />
      <Stack.Screen name="FacultyCreatePost" component={FacultyCreatePostScreen} />
      
      {/* PROFILE SCREENS WITH LEFT-TO-RIGHT ANIMATION */}
      <Stack.Screen 
        name="StudentProfile" 
        component={StudentProfileScreen}
        options={{
          animation: 'slide_from_left',
        }}
      />
      <Stack.Screen 
        name="FacultyProfile" 
        component={FacultyProfileScreen}
        options={{
          animation: 'slide_from_left',
        }}
      />
    </Stack.Navigator>
  );
}