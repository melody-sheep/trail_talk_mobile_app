import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { View, Text, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider } from './src/contexts/UserContext';

// This bypasses the asset registry issue
if (typeof global.self === 'undefined') {
  global.self = global;
}

// Note: previously suppressed SafeAreaView deprecation; imports fixed across the app.

function FontLoader({ children }) {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#000000ff" />
        <Text style={{ marginTop: 10, color: '#7474B9' }}>Loading...</Text>
      </View>
    );
  }

  return children;
}

export default function App() {
  return (
    <FontLoader>
      <UserProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </UserProvider>
    </FontLoader>
  );
}