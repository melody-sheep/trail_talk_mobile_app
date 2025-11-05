// src/screens/student/EditProfileScreen.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabase';

export default function EditProfileScreen({ navigation }) {
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [postAnonymously, setPostAnonymously] = useState(true);
  
  // Load user profile data
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('username, birthday, role, student_id, school_email, user_type')
        .eq('id', user.id)
        .single();

      if (!error && profileData) {
        setUsername(profileData.username || '');
        
        // Set birthday if exists
        if (profileData.birthday) {
          setBirthday(new Date(profileData.birthday));
        }
        
        // Note: postAnonymously would need to be stored in your database
        // For now, we'll use a default value
        setPostAnonymously(true);
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthday(selectedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const formatDate = (date) => {
    if (!date) return 'Select your birthday';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    try {
      setSaving(true);
      
      const updates = {
        username: username.trim(),
        updated_at: new Date().toISOString(),
      };

      // Add birthday if selected
      if (birthday) {
        updates.birthday = birthday.toISOString().split('T')[0]; // YYYY-MM-DD format
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
      
    } catch (error) {
      console.log('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplay = () => {
    // You can customize this based on your user_type or role fields
    return 'Student';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image 
            source={require('../../../assets/profile_page_icons/back_button.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Edit Profile</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={require('../../../assets/profile_page_icons/default_profile_icon.png')}
              style={styles.profileImage}
            />
          </View>
          <TouchableOpacity style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Change Avatar 📷</Text>
          </TouchableOpacity>
        </View>

        {/* Display Name */}
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Text style={styles.labelIcon}>👤</Text>
            <Text style={styles.label}>Display Name</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your display name"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            maxLength={30}
          />
        </View>

        {/* Role (Read-only) */}
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Text style={styles.labelIcon}>🎓</Text>
            <Text style={styles.label}>Role</Text>
          </View>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>{getRoleDisplay()}</Text>
            <Text style={styles.readOnlySubtext}>(from signup)</Text>
          </View>
        </View>

        {/* Birthday */}
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Text style={styles.labelIcon}>🎂</Text>
            <Text style={styles.label}>Birthday</Text>
          </View>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={showDatepicker}
          >
            <Text style={[
              styles.dateInputText,
              !birthday && styles.dateInputPlaceholder
            ]}>
              {formatDate(birthday)}
            </Text>
            <Text style={styles.datePickerIcon}>⌄</Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={birthday || new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Post Anonymously Toggle */}
        <View style={styles.formSection}>
          <View style={styles.toggleContainer}>
            <View style={styles.toggleLabelContainer}>
              <Text style={styles.labelIcon}>⏺️</Text>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.label}>Post Anonymously (Default)</Text>
                <Text style={styles.toggleSubtext}>
                  Your identity will be hidden when posting
                </Text>
              </View>
            </View>
            <Switch
              value={postAnonymously}
              onValueChange={setPostAnonymously}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={postAnonymously ? '#f5dd4b' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity 
            style={[
              styles.saveButton,
              (!username.trim() || saving) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={!username.trim() || saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save 💾'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.homeBackground,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 20,
    height: 22,
    resizeMode: 'contain',
    tintColor: colors.white,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  headerSpacer: {
    width: 36, // Balance the back button space
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.homeBackground,
  },
  loadingText: {
    fontSize: 16,
    color: colors.white,
    fontFamily: fonts.normal,
  },
  // Profile Image Section
  profileImageSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  changePhotoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  changePhotoText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  // Form Sections
  formSection: {
    marginBottom: 25,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  // Text Input
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
  },
  // Read-only Field
  readOnlyField: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  readOnlyText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  readOnlySubtext: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  // Date Input
  dateInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
  },
  dateInputPlaceholder: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  datePickerIcon: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Toggle Section
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  toggleTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  toggleSubtext: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  // Save Button
  saveButtonContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#FFCC00',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  saveButtonText: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.homeBackground,
    letterSpacing: 1,
  },
  bottomSpacer: {
    height: 30,
  },
});