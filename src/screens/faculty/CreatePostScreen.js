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
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { supabase } from '../../lib/supabase';
import { UserContext } from '../../contexts/UserContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FacultyCreatePostScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [message, setMessage] = useState('');
  const [inputHeight, setInputHeight] = useState(140);
  const [isFocused, setIsFocused] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState('Faculty01'); // Default fallback
  const [userInitials, setUserInitials] = useState('FAC'); // Default fallback
  const [isUsingCustomName, setIsUsingCustomName] = useState(false);
  const [postAnonymously, setPostAnonymously] = useState(true); // Default to true
  const [userProfileData, setUserProfileData] = useState(null);
  const { user, loading } = useContext(UserContext);

  const textInputRef = useRef(null);
  const scrollViewRef = useRef(null);

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
      // Get FULL profile data from profiles table including display_name AND post_anonymously
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('username, display_name, school_email, user_type, avatar_url, post_anonymously, department')
        .eq('id', user.id)
        .single();

      if (error) {
        console.log('Error fetching profile:', error);
        // Fallback to auth user email
        handleFallbackDisplayName();
        return;
      }

      // Store profile data
      setUserProfileData(profileData);

      // Set global anonymous posting preference
      setPostAnonymously(profileData.post_anonymously ?? true);

      // Determine what to display as the username
      let displayName = 'Faculty01'; // Default
      let initials = 'FAC'; // Default
      let usingCustomName = false;

      // PRIORITY 1: Use display_name from profiles table if it's customized (not null/empty)
      if (profileData?.display_name && profileData.display_name.trim() !== '') {
        displayName = profileData.display_name;
        initials = profileData.display_name.substring(0, 3).toUpperCase();
        usingCustomName = true;
      }
      // PRIORITY 2: Use username from profiles table
      else if (profileData?.username) {
        displayName = profileData.username;
        initials = profileData.username.substring(0, 3).toUpperCase();
        usingCustomName = false;
      }
      // PRIORITY 3: Use department if available
      else if (profileData?.department) {
        displayName = profileData.department;
        initials = profileData.department.substring(0, 3).toUpperCase();
        usingCustomName = false;
      }
      // PRIORITY 4: Use school_email if available
      else if (profileData?.school_email) {
        const emailPart = profileData.school_email.split('@')[0];
        displayName = emailPart;
        initials = emailPart.substring(0, 3).toUpperCase();
        usingCustomName = false;
      }
      // PRIORITY 5: Fallback to auth user email
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
      setUserDisplayName('Faculty01');
      setUserInitials('FAC');
      setIsUsingCustomName(false);
    }
  };

  // Function to get display name for post - UPDATED FOR ANONYMOUS POSTING
  const getDisplayNameForPost = async () => {
    if (!user) return 'FAC';
    
    try {
      // Get fresh profile data to ensure we have the latest
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('display_name, username, school_email, department, post_anonymously')
        .eq('id', user.id)
        .single();

      if (!error && profileData) {
        // Check if we should post anonymously (global setting + current toggle)
        const shouldPostAnonymously = postAnonymously;

        if (shouldPostAnonymously) {
          return 'Anonymous Faculty'; // Return full anonymous name for faculty
        }

        // If not anonymous, use normal logic
        // PRIORITY 1: Use display_name if customized
        if (profileData.display_name && profileData.display_name.trim() !== '') {
          return profileData.display_name; // Return full name, not initials
        }
        // PRIORITY 2: Use username
        if (profileData.username) {
          return profileData.username.substring(0, 3).toUpperCase();
        }
        // PRIORITY 3: Use department
        if (profileData.department) {
          return profileData.department.substring(0, 3).toUpperCase();
        }
        // PRIORITY 4: Use school_email
        if (profileData.school_email) {
          const emailPart = profileData.school_email.split('@')[0];
          return emailPart.substring(0, 3).toUpperCase();
        }
      }

      // Fallback to auth user email
      if (user.email) {
        const emailPart = user.email.split('@')[0];
        return postAnonymously ? 'Anonymous Faculty' : emailPart.substring(0, 3).toUpperCase();
      }

      return postAnonymously ? 'Anonymous Faculty' : 'FAC'; // Final fallback
    } catch (error) {
      console.log('Error getting display name for post:', error);
      // Fallback to current state or auth email
      if (user?.email) {
        const emailPart = user.email.split('@')[0];
        return postAnonymously ? 'Anonymous Faculty' : emailPart.substring(0, 3).toUpperCase();
      }
      return postAnonymously ? 'Anonymous Faculty' : (userInitials || 'FAC');
    }
  };

  // ADDED: Loading state check
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
    'Announcement',
    'Support', 
    'Campus',
    'General'
  ];

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Academics': return '📚';
      case 'Announcement': return '📢';
      case 'Support': return '🤝';
      case 'Campus': return '🏛️';
      case 'General': return '💭';
      default: return '📝';
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handlePostPress = async () => {
    if (!selectedCategory || !message.trim()) return;

    try {
      console.log('Submitting faculty post to Supabase...');
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.log('No user logged in');
        return;
      }

      // Get display name for the post - USING UPDATED FUNCTION WITH ANONYMOUS LOGIC
      const displayName = await getDisplayNameForPost();

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            content: message.trim(),
            category: selectedCategory,
            author_id: userData.user.id,
            author_initials: displayName, // Now stores either "Anonymous Faculty" or actual name
            is_anonymous: postAnonymously // Store the anonymous status
          }
        ])
        .select();

      if (error) {
        console.log('Error submitting faculty post:', error);
        return;
      }

      console.log('Faculty post submitted successfully:', data);
      
      // Clear form and go back
      setMessage('');
      setSelectedCategory(null);
      navigation.goBack();
      
    } catch (error) {
      console.log('Error:', error);
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

  // Get current display name for UI
  const getCurrentDisplayName = () => {
    if (postAnonymously) {
      return 'Anonymous Faculty';
    }
    return isUsingCustomName ? userDisplayName : userInitials;
  };

  // Get current status text
  const getCurrentStatus = () => {
    if (postAnonymously) {
      return 'Anonymous Faculty • Your identity is hidden';
    }
    return `${isUsingCustomName ? 'Custom Name' : userInitials} • Your identity is visible`;
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
          
          {/* Header with Anonymous Toggle */}
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

              {/* Anonymous toggle moved into user card (see below) */}
            </View>
          </ImageBackground>

          {/* User Identity Card - NOW SHOWS ANONYMOUS OR ACTUAL NAME */}
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
                  {userProfileData?.department ? `${userProfileData.department} Faculty` : 'Faculty Member'}
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
            
            {/* Manual ScrollView */}
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
                placeholder="Share announcements, academic updates, or campus information..."
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
              <TouchableOpacity style={styles.mediaButton} activeOpacity={0.7}>
                <View style={styles.mediaButtonIcon}>
                  <Image 
                    source={require('../../../assets/create_post_screen_icons/gallery_icon.png')}
                    style={styles.mediaIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.mediaButtonText}>Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.mediaButton} activeOpacity={0.7}>
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
          </View>

          {/* Post Button - Clean Design */}
          <View style={styles.postButtonContainer}>
            <TouchableOpacity 
              style={[
                styles.postButton,
                (!selectedCategory || !message.trim()) && styles.postButtonDisabled
              ]}
              onPress={handlePostPress}
              activeOpacity={0.8}
              disabled={!selectedCategory || !message.trim()}
            >
              <Text style={styles.postButtonText}>Post</Text>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
  // Anonymous Toggle in Header
  anonymousToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  anonymousToggleText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.white,
    marginRight: 8,
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
  // Post Button - Clean Design
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
  // ADDED: Loading styles
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

export default FacultyCreatePostScreen;