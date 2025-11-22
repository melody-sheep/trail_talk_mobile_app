import React, { useState, useEffect } from 'react';
import {
  View, 
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  StatusBar,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { colors } from '../styles/colors';
import { fonts } from '../styles/fonts';

export default function SignInScreen({ navigation }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
    checkDatabaseConnection();
  }, []);

  const checkDatabaseConnection = async () => {
    const connected = await testSupabaseConnection();
    setDbConnected(connected);
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignIn = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in both email and password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          Alert.alert(
            'Sign In Failed',
            'Invalid email or password. Please check your credentials and try again.'
          );
        } else if (error.message.includes('Email not confirmed')) {
          Alert.alert(
            'Email Not Verified',
            'Please check your email and verify your account before signing in.'
          );
        } else {
          Alert.alert('Sign In Failed', error.message);
        }
        return;
      }

      // Get user role after successful sign in
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user role:', profileError);
        Alert.alert('Error', 'Could not retrieve user information');
        return;
      }

      Alert.alert('Success', 'Welcome back to TrailTalk!');
      
      // Navigate based on role
      if (profileData.role === 'student') {
        navigation.navigate('StudentMain');
      } else if (profileData.role === 'faculty') {
        navigation.navigate('FacultyMain');
      } else {
        // Fallback if role is not set
        navigation.navigate('Welcome');
      }
      
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Header with better spacing */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Image 
                    source={require('../../assets/signing_signup_icons/trail_talk_logo.png')}
                    style={styles.logo}
                  />
                </View>
                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>Sign in to continue your journey</Text>
              </View>

              {/* Connection Status */}
              {!dbConnected && (
                <View style={styles.connectionWarning}>
                  <Ionicons name="warning-outline" size={16} color="#FF9500" />
                  <Text style={styles.connectionWarningText}>
                    Connection issues detected
                  </Text>
                </View>
              )}

              {/* Form Container */}
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>School Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your school email"
                    placeholderTextColor="#A0A3BD"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={formData.email}
                    onChangeText={(text) => updateFormData('email', text)}
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter your password"
                      placeholderTextColor="#A0A3BD"
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      value={formData.password}
                      onChangeText={(text) => updateFormData('password', text)}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={24}
                        color="#A0A3BD"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.signInButton, loading && styles.buttonDisabled]}
                  onPress={handleSignIn}
                  disabled={loading || !dbConnected}
                >
                  <Text style={styles.signInButtonText}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.signUpContainer}>
                  <Text style={styles.signUpText}>Don't have an account?</Text>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('RoleSelection')}
                    disabled={loading}
                  >
                    <Text style={styles.signUpLink}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40, // Added top padding for better spacing
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50, // Increased spacing between header and form
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 25, // Increased logo spacing
  },
  logo: {
    width: 100, // Slightly smaller logo
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    marginBottom: 8, // Added spacing between title and subtitle
    textAlign: 'center',
    color: colors.black,
    fontFamily: fonts.bold,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.gray,
    fontFamily: fonts.normal,
  },
  connectionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  connectionWarningText: {
    color: '#FF9500',
    fontSize: 14,
    fontFamily: fonts.medium,
    marginLeft: 8,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24, // Increased spacing between inputs
  },
  inputLabel: {
    fontSize: 16,
    color: colors.black,
    fontFamily: fonts.medium,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.normal,
    width: '100%', // Ensure fixed width
  },
  passwordContainer: {
    position: 'relative',
    width: '100%', // Fixed width container
  },
  passwordInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    paddingRight: 50, // Space for eye icon
    fontSize: 16,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.normal,
    width: '100%', // Fixed width
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    width: '100%',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: colors.gray,
    shadowOpacity: 0,
    elevation: 0,
  },
  signInButtonText: {
    color: colors.white,
    fontSize: 18,
    textAlign: 'center',
    fontFamily: fonts.medium,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  signUpText: {
    color: colors.black,
    fontSize: 16,
    marginRight: 5,
    fontFamily: fonts.normal,
  },
  signUpLink: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: fonts.medium,
  }
});