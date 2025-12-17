import React, { useState, useRef, useContext, useEffect } from 'react'; 
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  ImageBackground, 
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { supabase } from '../../lib/supabase';
import { UserContext } from '../../contexts/UserContext';
import useBannedWords from '../../hooks/useBannedWords';
import { Modal } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CreatePostScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [message, setMessage] = useState('');
  const [inputHeight, setInputHeight] = useState(140);
  const [isFocused, setIsFocused] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState('Blazer01');
  const [userInitials, setUserInitials] = useState('USR');
  const [isUsingCustomName, setIsUsingCustomName] = useState(false);
  const [postAnonymously, setPostAnonymously] = useState(true);
  const [userProfileData, setUserProfileData] = useState(null);
  const { user, loading } = useContext(UserContext);
  const { checkContent } = useBannedWords();
  const [warningMatches, setWarningMatches] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const textInputRef = useRef(null);
  const scrollViewRef = useRef(null);

  // Request camera and gallery permissions on mount
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera and gallery permissions to make this work!');
      }
    })();
  }, []);

  // Fetch user profile data when component mounts
  useEffect(() => {
    if (user && !loading) {
      fetchUserProfile();
    }
  }, [user, loading]);

  // Function to fetch user profile and set display name
  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('username, display_name, student_id, school_email, user_type, avatar_url, post_anonymously')
        .eq('id', user.id)
        .single();

      if (error) {
        console.log('Error fetching profile:', error);
        handleFallbackDisplayName();
        return;
      }

      setUserProfileData(profileData);
      setPostAnonymously(profileData.post_anonymously ?? true);

      let displayName = 'Blazer01';
      let initials = 'USR';
      let usingCustomName = false;

      if (profileData?.display_name && profileData.display_name.trim() !== '') {
        displayName = profileData.display_name;
        initials = profileData.display_name.substring(0, 3).toUpperCase();
        usingCustomName = true;
      }
      else if (profileData?.username) {
        displayName = profileData.username;
        initials = profileData.username.substring(0, 3).toUpperCase();
        usingCustomName = false;
      }
      else if (profileData?.student_id) {
        displayName = profileData.student_id;
        initials = profileData.student_id.substring(0, 3).toUpperCase();
        usingCustomName = false;
      }
      else if (profileData?.school_email) {
        const emailPart = profileData.school_email.split('@')[0];
        displayName = emailPart;
        initials = emailPart.substring(0, 3).toUpperCase();
        usingCustomName = false;
      }
      else {
        handleFallbackDisplayName();
        return;
      }

      setUserDisplayName(displayName);
      setUserInitials(initials);
      setIsUsingCustomName(usingCustomName);
      
    } catch (error) {
      console.log('Error in fetchUserProfile:', error);
      handleFallbackDisplayName();
    }
  };

  // Fallback function using auth user data
  const handleFallbackDisplayName = () => {
    if (user?.email) {
      const emailPart = user.email.split('@')[0];
      setUserDisplayName(emailPart);
      setUserInitials(emailPart.substring(0, 3).toUpperCase());
      setIsUsingCustomName(false);
    } else {
      setUserDisplayName('Blazer01');
      setUserInitials('USR');
      setIsUsingCustomName(false);
    }
  };

  // Function to get display name for post
  const getDisplayNameForPost = async () => {
    if (!user) return 'USR';
    
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('display_name, username, student_id, school_email, post_anonymously')
        .eq('id', user.id)
        .single();

      if (!error && profileData) {
        const shouldPostAnonymously = postAnonymously;

        if (shouldPostAnonymously) {
          return 'Anonymous User';
        }

        if (profileData.display_name && profileData.display_name.trim() !== '') {
          return profileData.display_name;
        }
        if (profileData.username) {
          return profileData.username.substring(0, 3).toUpperCase();
        }
        if (profileData.student_id) {
          return profileData.student_id.substring(0, 3).toUpperCase();
        }
        if (profileData.school_email) {
          const emailPart = profileData.school_email.split('@')[0];
          return emailPart.substring(0, 3).toUpperCase();
        }
      }

      if (user.email) {
        const emailPart = user.email.split('@')[0];
        return postAnonymously ? 'Anonymous User' : emailPart.substring(0, 3).toUpperCase();
      }

      return postAnonymously ? 'Anonymous User' : 'USR';
    } catch (error) {
      console.log('Error getting display name for post:', error);
      if (user?.email) {
        const emailPart = user.email.split('@')[0];
        return postAnonymously ? 'Anonymous User' : emailPart.substring(0, 3).toUpperCase();
      }
      return postAnonymously ? 'Anonymous User' : (userInitials || 'USR');
    }
  };

  // Image Picker Functions
  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // FIXED: Upload image to Supabase Storage - SIMPLIFIED VERSION
  const uploadImage = async (imageUri) => {
    if (!imageUri) return null;

    try {
      setUploading(true);
      console.log('Starting image upload...');
      
      // Get file extension and create unique filename
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `post-images/${fileName}`;

      console.log('Uploading file:', filePath);

      // Use fetch + arrayBuffer which works reliably in Expo/React Native
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload to Supabase Storage (Uint8Array / ArrayBuffer is supported)
      const { data, error } = await supabase.storage
        .from('posts')
        .upload(filePath, uint8Array, {
          cacheControl: '3600',
          upsert: false,
          contentType: `image/${fileExt}`
        });

      if (error) {
        console.log('Supabase upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      console.log('Image uploaded successfully:', publicUrl);
      return publicUrl;
      
    } catch (error) {
      console.log('Error in uploadImage:', error);
      Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Alternative upload method using FormData approach
  const uploadImageAlternative = async (imageUri) => {
    if (!imageUri) return null;

    try {
      setUploading(true);
      
      // Get file extension and create unique filename
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `post-images/${fileName}`;

      // Alternative: fetch as arrayBuffer (avoids relying on atob/Blob globals)
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const { data, error } = await supabase.storage
        .from('posts')
        .upload(filePath, uint8Array, {
          cacheControl: '3600',
          upsert: false,
          contentType: `image/${fileExt}`
        });

      if (error) {
        console.log('Error uploading image:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      console.log('Image uploaded successfully:', publicUrl);
      return publicUrl;
      
    } catch (error) {
      console.log('Error in uploadImageAlternative:', error);
      Alert.alert('Upload Error', 'Failed to upload image. Please try a different image.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
  };

  const handlePostPress = async () => {
    if (!selectedCategory || !message.trim()) return;

    // Check for banned words
    const matches = checkContent(message.trim());
    if (matches && matches.length > 0) {
      setWarningMatches(matches);
      setShowWarningModal(true);
      return;
    }

    try {
      console.log('Submitting post to Supabase...');
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.log('No user logged in');
        Alert.alert('Error', 'Please sign in to create posts');
        return;
      }

      // Upload image if selected
      let imageUrl = null;
      if (selectedImage) {
        console.log('Uploading image...');
        // Try the main upload method first
        imageUrl = await uploadImage(selectedImage);
        
        // If main method fails, try alternative
        if (!imageUrl) {
          console.log('Trying alternative upload method...');
          imageUrl = await uploadImageAlternative(selectedImage);
        }
        
        console.log('Image upload result:', imageUrl);
      }

      const displayName = await getDisplayNameForPost();

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            content: message.trim(),
            category: selectedCategory,
            author_id: userData.user.id,
            author_initials: displayName,
            is_anonymous: postAnonymously,
            image_url: imageUrl // Add image URL to post
          }
        ])
        .select();

      if (error) {
        console.log('Error submitting post:', error);
        Alert.alert('Error', 'Failed to create post');
        return;
      }

      console.log('Post submitted successfully:', data);
      
      // Clear form and go back
      setMessage('');
      setSelectedCategory(null);
      setSelectedImage(null);
      navigation.goBack();
      
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const continueDespiteWarnings = async () => {
    setShowWarningModal(false);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          imageUrl = await uploadImageAlternative(selectedImage);
        }
      }

      const displayName = await getDisplayNameForPost();
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            content: message.trim(),
            category: selectedCategory,
            author_id: userData.user.id,
            author_initials: displayName,
            is_anonymous: postAnonymously,
            image_url: imageUrl
          }
        ])
        .select();
      if (!error) {
        setMessage('');
        setSelectedCategory(null);
        setSelectedImage(null);
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to create post');
      }
    } catch (err) {
      console.log('Error posting after warnings', err);
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const selectCategory = (category) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const handleContentSizeChange = (event) => {
    const { height } = event.nativeEvent.contentSize;
    const newHeight = Math.max(140, Math.min(height + 40, 400));
    setInputHeight(newHeight);
  };

  const focusTextInput = () => {
    textInputRef.current?.focus();
  };

  const getCurrentDisplayName = () => {
    if (postAnonymously) {
      return 'Anonymous User';
    }
    return isUsingCustomName ? userDisplayName : userInitials;
  };

  const getCurrentStatus = () => {
    if (postAnonymously) {
      return 'Anonymous User • Your identity is hidden';
    }
    return `${isUsingCustomName ? 'Custom Name' : userInitials} • Your identity is visible`;
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

  const categories = [
    'Academics',
    'Rant',
    'Support', 
    'Campus',
    'General'
  ];

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Academics': return '📚';
      case 'Rant': return '💬';
      case 'Support': return '🤝';
      case 'Campus': return '🏛️';
      case 'General': return '💭';
      default: return '📝';
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <StatusBar 
            barStyle="light-content" 
            backgroundColor={colors.homeBackground}
            translucent={false}
          />
          
          {/* Header */}
          <ImageBackground 
            source={require('../../../assets/create_post_screen_icons/createpost_header_bg.png')}
            style={styles.headerBackground}
            resizeMode="cover"
          >
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBackPress}
                activeOpacity={0.7}
              >
                <Image 
                  source={require('../../../assets/create_post_screen_icons/back_button_icon.png')}
                  style={styles.backIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Create Post</Text>
              </View>
            </View>
          </ImageBackground>

          {/* User Identity Card */}
          <View style={[styles.userCard, styles.userCardAdjusted]}>
            <View style={styles.userInfo}>
              <Image 
                source={require('../../../assets/create_post_screen_icons/anon_icon.png')}
                style={styles.anonIcon}
                resizeMode="contain"
              />
              <View style={styles.userText}>
                <Text style={styles.userName}>
                  {getCurrentDisplayName()}
                </Text>
                <Text style={styles.userStatus}>
                  {userInitials}
                </Text>
              </View>
            </View>
            <View style={styles.controlsRight}>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
              <Switch
                value={postAnonymously}
                onValueChange={setPostAnonymously}
                thumbColor={postAnonymously ? '#4ECDC4' : '#f4f3f4'}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(78,205,196,0.25)' }}
                style={styles.anonymousSwitchSmall}
              />
            </View>
          </View>

          {/* Category Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Image 
                source={require('../../../assets/create_post_screen_icons/category_icon.png')}
                style={styles.sectionIcon}
                resizeMode="contain"
              />
              <Text style={styles.sectionTitle}>Choose Category</Text>
            </View>
            
            <ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScrollView}
              contentContainerStyle={styles.categoriesScrollContent}
            >
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={`${category}-${index}`}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipSelected
                  ]}
                  onPress={() => selectCategory(category)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryIcon}>
                    {getCategoryIcon(category)}
                  </Text>
                  <Text 
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category && styles.categoryChipTextSelected
                    ]}
                    numberOfLines={1}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Message Input */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Image 
                source={require('../../../assets/create_post_screen_icons/quil_icon.png')}
                style={styles.sectionIcon}
                resizeMode="contain"
              />
              <Text style={styles.sectionTitle}>What's on your mind?</Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.messageInputContainer,
                { height: inputHeight },
                isFocused && styles.messageInputFocused
              ]}
              activeOpacity={1}
              onPress={focusTextInput}
            >
              <TextInput
                ref={textInputRef}
                style={styles.messageInput}
                multiline={true}
                placeholder="Share your thoughts, questions, or experiences..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={message}
                onChangeText={setMessage}
                onContentSizeChange={handleContentSizeChange}
                textAlignVertical="top"
                cursorColor={colors.white}
                selectionColor="rgba(255, 255, 255, 0.3)"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              <View style={styles.inputFooter}>
                <Text style={styles.charCount}>
                  {message.length} characters
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Image Preview */}
          {selectedImage && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Image 
                  source={require('../../../assets/create_post_screen_icons/attach_icon.png')}
                  style={styles.sectionIcon}
                  resizeMode="contain"
                />
                <Text style={styles.sectionTitle}>Image Preview</Text>
              </View>
              
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={{ uri: selectedImage }}
                  style={styles.selectedImage}
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={removeImage}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Attachment Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Image 
                source={require('../../../assets/create_post_screen_icons/attach_icon.png')}
                style={styles.sectionIcon}
                resizeMode="contain"
              />
              <Text style={styles.sectionTitle}>Attach Media</Text>
            </View>
            
            <View style={styles.attachmentButtons}>
              <TouchableOpacity 
                style={styles.mediaButton} 
                onPress={pickImageFromGallery}
                activeOpacity={0.7}
                disabled={uploading}
              >
                <View style={styles.mediaButtonIcon}>
                  <Image 
                    source={require('../../../assets/create_post_screen_icons/gallery_icon.png')}
                    style={styles.mediaIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.mediaButtonText}>Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.mediaButton} 
                onPress={takePhotoWithCamera}
                activeOpacity={0.7}
                disabled={uploading}
              >
                <View style={styles.mediaButtonIcon}>
                  <Image 
                    source={require('../../../assets/create_post_screen_icons/camera_icon.png')}
                    style={styles.mediaIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.mediaButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
            {uploading && (
              <Text style={styles.uploadingText}>Uploading image...</Text>
            )}
          </View>

          {/* Post Button */}
          <View style={styles.postButtonContainer}>
            <TouchableOpacity 
              style={[
                styles.postButton,
                (!selectedCategory || !message.trim() || uploading) && styles.postButtonDisabled
              ]}
              onPress={handlePostPress}
              activeOpacity={0.8}
              disabled={!selectedCategory || !message.trim() || uploading}
            >
              <Text style={styles.postButtonText}>
                {uploading ? 'Uploading...' : 'Post'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.postDisclaimer}>
              Your post will be published as{' '}
              <Text style={styles.postDisclaimerHighlight}>
                {getCurrentDisplayName()}
              </Text>
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Warning Modal for banned words */}
        <Modal visible={showWarningModal} transparent animationType="slide" onRequestClose={() => setShowWarningModal(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: '#1A1A1A', padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
              <Text style={{ color: '#fff', fontFamily: fonts.semiBold, fontSize: 16, marginBottom: 8 }}>Content Warning</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>Your post contains words that may violate community guidelines:</Text>
              {warningMatches.map((m) => (
                <Text key={m.id} style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>• {m.word} — {m.category || 'General'}</Text>
              ))}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity onPress={() => setShowWarningModal(false)} style={{ padding: 12 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={continueDespiteWarnings} style={{ padding: 12 }}>
                  <Text style={{ color: '#FFCC00', fontFamily: fonts.semiBold }}>Post Anyway</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ... (keep all your existing styles exactly the same)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  // Header
  headerBackground: {
    width: '100%',
    height: 140,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 42,
    height: 42,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: fonts.medium,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  // User Card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  anonIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  verifiedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: colors.white,
    fontFamily: fonts.bold,
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  anonymousSwitchSmall: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
    marginLeft: 8,
  },
  userCardAdjusted: {
    paddingVertical: 14,
  },
  // Section Styles
  section: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  // Category Chips
  categoriesScrollView: {
    height: 60,
  },
  categoriesScrollContent: {
    paddingRight: 20,
  },
  categoryChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    width: 120,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  categoryChipSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    flex: 1,
  },
  categoryChipTextSelected: {
    color: colors.homeBackground,
    fontFamily: fonts.semiBold,
  },
  // Message Input
  messageInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    minHeight: 140,
    maxHeight: 350,
  },
  messageInputFocused: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  charCount: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  // Image Preview
  imagePreviewContainer: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 200,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  // Attachment Section
  attachmentButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  mediaButton: {
    alignItems: 'center',
    marginRight: 20,
  },
  mediaButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 6,
  },
  mediaIcon: {
    width: 20,
    height: 20,
    tintColor: colors.white,
  },
  mediaButtonText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  uploadingText: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: '#FFCC00',
    marginTop: 8,
    textAlign: 'center',
  },
  // Post Button
  postButtonContainer: {
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 10,
    alignItems: 'center',
  },
  postButton: {
    backgroundColor: '#FFCC00',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  postButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  postButtonText: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.homeBackground,
    letterSpacing: 1,
  },
  postDisclaimer: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
    textAlign: 'center',
  },
  postDisclaimerHighlight: {
    color: '#FFCC00',
    fontFamily: fonts.semiBold,
  },
  bottomSpacer: {
    height: 10,
  },
  // Loading styles
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
});

export default CreatePostScreen;