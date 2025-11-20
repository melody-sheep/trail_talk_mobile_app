// src/screens/faculty/EditProfileScreen.js
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
  Platform,
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabase';

export default function FacultyEditProfileScreen({ navigation }) {
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [birthday, setBirthday] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [postAnonymously, setPostAnonymously] = useState(true);
  const [avatar, setAvatar] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageType, setImageType] = useState(''); // 'avatar' or 'cover'

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
        .select('username, display_name, birthday, avatar_url, cover_url, post_anonymously, role, user_type')
        .eq('id', user.id)
        .single();

      if (!error && profileData) {
        setDisplayName(profileData.display_name || profileData.username || '');
        
        // Set birthday if exists
        if (profileData.birthday) {
          setBirthday(new Date(profileData.birthday));
        }
        
        // Set images if exist
        if (profileData.avatar_url) {
          setAvatar(profileData.avatar_url);
        }
        if (profileData.cover_url) {
          setCoverPhoto(profileData.cover_url);
        }
        
        // Set post anonymously preference
        setPostAnonymously(profileData.post_anonymously ?? true);
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type) => {
    console.log('Pick image called for:', type);
    setImageType(type);
    
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to change your profile image.');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageModalVisible(false);
        await uploadImage(result.assets[0].uri, type);
      } else {
        console.log('Image selection cancelled');
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async (type) => {
    console.log('Take photo called for:', type);
    setImageType(type);
    
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera permissions to take a photo.');
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageModalVisible(false);
        await uploadImage(result.assets[0].uri, type);
      } else {
        console.log('Camera cancelled');
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadImage = async (uri, type) => {
    try {
      setUploading(true);
      console.log('Uploading image:', uri, 'for type:', type);
      
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${type}_${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      const bucket = type === 'avatar' ? 'avatars' : 'covers';

      console.log('Uploading to bucket:', bucket, 'path:', filePath);

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: fileName,
      });

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, formData, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (error) {
        console.log('Supabase upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log('Upload successful, public URL:', publicUrl);

      // Update local state
      if (type === 'avatar') {
        setAvatar(publicUrl);
      } else {
        setCoverPhoto(publicUrl);
      }

      Alert.alert('Success', `${type === 'avatar' ? 'Profile photo' : 'Cover photo'} updated successfully!`);

    } catch (error) {
      console.log('Error uploading image:', error);
      Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
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
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${month} ${day}, ${year}`;
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    try {
      setSaving(true);
      
      const updates = {
        display_name: displayName.trim(),
        updated_at: new Date().toISOString(),
        post_anonymously: postAnonymously,
      };

      // Add birthday if selected
      if (birthday) {
        updates.birthday = birthday.toISOString().split('T')[0];
      }

      // Add image URLs if they were updated
      if (avatar && avatar.includes('supabase.co')) {
        updates.avatar_url = avatar;
      }
      if (coverPhoto && coverPhoto.includes('supabase.co')) {
        updates.cover_url = coverPhoto;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

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
    return 'Faculty';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
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
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Edit Profile</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Cover Photo Section */}
        <View style={styles.coverSection}>
          <TouchableOpacity 
            style={styles.coverPhotoContainer}
            onPress={() => {
              setImageType('cover');
              setImageModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            {coverPhoto ? (
              <Image 
                source={{ uri: coverPhoto }}
                style={styles.coverPhoto}
              />
            ) : (
              <Image 
                source={require('../../../assets/profile_page_icons/profile_default_bg.png')}
                style={styles.coverPhoto}
              />
            )}
            <View style={styles.coverOverlay}>
              <Ionicons name="camera" size={24} color={colors.white} />
              <Text style={styles.changePhotoText}>Change Cover</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Profile Image Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => {
              setImageType('avatar');
              setImageModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            {avatar ? (
              <Image 
                source={{ uri: avatar }}
                style={styles.avatarImage}
              />
            ) : (
              <Image 
                source={require('../../../assets/profile_page_icons/default_profile_icon.png')}
                style={styles.avatarImage}
              />
            )}
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={20} color={colors.white} />
            </View>
          </TouchableOpacity>
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color={colors.white} />
            </View>
          )}
        </View>

        {/* Display Name */}
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Ionicons name="person-outline" size={20} color={colors.white} style={styles.labelIcon} />
            <Text style={styles.label}>Display Name</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your display name"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            maxLength={30}
          />
          <Text style={styles.charCount}>{displayName.length}/30</Text>
        </View>

        {/* Role (Read-only) */}
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Ionicons name="school-outline" size={20} color="#FF9800" style={styles.labelIcon} />
            <Text style={styles.label}>Role</Text>
          </View>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>{getRoleDisplay()}</Text>
          </View>
        </View>

        {/* Birthday */}
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.white} style={styles.labelIcon} />
            <Text style={styles.label}>Birthday</Text>
          </View>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={showDatepicker}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.dateInputText,
              !birthday && styles.dateInputPlaceholder
            ]}>
              {formatDate(birthday)}
            </Text>
            <TouchableOpacity 
              onPress={showDatepicker}
              style={styles.dateButton}
            >
              <Text style={styles.dateButtonText}>SET</Text>
            </TouchableOpacity>
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
              <Ionicons name="eye-off-outline" size={20} color={colors.white} style={styles.labelIcon} />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.label}>Post Anonymously</Text>
                <Text style={styles.toggleSubtext}>
                  {postAnonymously 
                    ? 'All posts will show as "Anonymous User" by default' 
                    : 'Posts will show your display name by default'
                  }
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
              (!displayName.trim() || saving) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={!displayName.trim() || saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.homeBackground} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Change {imageType === 'avatar' ? 'Profile Photo' : 'Cover Photo'}
            </Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => pickImage(imageType)}
              activeOpacity={0.7}
            >
              <Ionicons name="images-outline" size={24} color={colors.white} style={styles.modalOptionIcon} />
              <Text style={styles.modalOptionText}>Choose from Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => takePhoto(imageType)}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={24} color={colors.white} style={styles.modalOptionIcon} />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, styles.cancelOption]}
              onPress={() => setImageModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  headerSpacer: {
    width: 36,
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
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
  // Cover Photo Section
  coverSection: {
    marginBottom: 70,
  },
  coverPhotoContainer: {
    position: 'relative',
    height: 160,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Avatar Section
  avatarSection: {
    position: 'absolute',
    top: 100,
    left: 20,
    zIndex: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.homeBackground,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
    marginTop: 8,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Form Sections
  formSection: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelIcon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
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
  charCount: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'right',
    marginTop: 4,
  },
  // Read-only Field
  readOnlyField: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  readOnlyText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: '#FF9800',
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
    flex: 1,
  },
  dateInputPlaceholder: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  dateButton: {
    backgroundColor: '#FFCC00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateButtonText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.homeBackground,
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
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#FFCC00',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFCC00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.homeBackground,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 30,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.homeBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalOptionIcon: {
    marginRight: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
  },
  cancelOption: {
    borderBottomWidth: 0,
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
  },
  cancelOptionText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: '#FF4444',
    textAlign: 'center',
  },
});