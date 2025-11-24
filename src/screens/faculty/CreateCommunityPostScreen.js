// src/screens/faculty/CreateCommunityPostScreen.js
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
  Alert,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { supabase } from '../../lib/supabase';
import { UserContext } from '../../contexts/UserContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CreateCommunityPostScreen = ({ navigation, route }) => {
  const { communityId, communityName, onPostCreated } = route.params || {};
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [message, setMessage] = useState('');
  const [inputHeight, setInputHeight] = useState(140);
  const [isFocused, setIsFocused] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState('Faculty01');
  const [userInitials, setUserInitials] = useState('FAC');
  const [communityData, setCommunityData] = useState(null);
  const { user, loading } = useContext(UserContext);
  const [isAnonymous, setIsAnonymous] = useState(false); // Faculty default to non-anonymous

  const textInputRef = useRef(null);
  const scrollViewRef = useRef(null);

  // Faculty-specific categories
  const categories = [
    'Discussion',
    'Announcement', 
    'Research',
    'Department',
    'Resource',
    'Professional'
  ];

  // Fetch user profile and community data
  useEffect(() => {
    if (user && !loading) {
      fetchUserProfile();
      fetchCommunityData();
    }
  }, [user, loading, communityId]);

  // Fetch community data
  const fetchCommunityData = async () => {
    if (!communityId) return;

    try {
      const { data, error } = await supabase
        .from('communities')
        .select('name, category, description, privacy')
        .eq('id', communityId)
        .single();

      if (error) {
        console.log('Error fetching community:', error);
        return;
      }

      setCommunityData(data);
    } catch (error) {
      console.log('Error in fetchCommunityData:', error);
    }
  };

  // Function to fetch user profile and set display name
  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('username, display_name, school_email, user_type, department')
        .eq('id', user.id)
        .single();

      if (error) {
        console.log('Error fetching profile:', error);
        handleFallbackDisplayName();
        return;
      }

      let displayName = 'Faculty01';
      let initials = 'FAC';

      // Faculty-specific display name logic
      if (profileData?.display_name) {
        displayName = profileData.display_name;
        initials = profileData.display_name.substring(0, 3).toUpperCase();
      }
      else if (profileData?.username) {
        displayName = profileData.username;
        initials = profileData.username.substring(0, 3).toUpperCase();
      }
      else if (profileData?.school_email) {
        const emailPart = profileData.school_email.split('@')[0];
        displayName = emailPart;
        initials = emailPart.substring(0, 3).toUpperCase();
      }
      else {
        handleFallbackDisplayName();
        return;
      }

      setUserDisplayName(displayName);
      setUserInitials(initials);
      
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
    } else {
      setUserDisplayName('Faculty01');
      setUserInitials('FAC');
    }
  };

  // Function to get user initials for post submission
  const getUserInitialsForPost = async () => {
    if (!user) return 'FAC';
    
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('username, display_name, school_email')
        .eq('id', user.id)
        .single();

      if (!error && profileData) {
        if (profileData.display_name) {
          return profileData.display_name.substring(0, 3).toUpperCase();
        }
        if (profileData.username) {
          return profileData.username.substring(0, 3).toUpperCase();
        }
        if (profileData.school_email) {
          const emailPart = profileData.school_email.split('@')[0];
          return emailPart.substring(0, 3).toUpperCase();
        }
      }

      if (user.email) {
        const emailPart = user.email.split('@')[0];
        return emailPart.substring(0, 3).toUpperCase();
      }

      return 'FAC';
    } catch (error) {
      console.log('Error getting user initials for post:', error);
      if (user?.email) {
        const emailPart = user.email.split('@')[0];
        return emailPart.substring(0, 3).toUpperCase();
      }
      return userInitials || 'FAC';
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

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Discussion': return '💬';
      case 'Announcement': return '📢';
      case 'Research': return '🔬';
      case 'Department': return '🏛️';
      case 'Resource': return '📚';
      case 'Professional': return '💼';
      default: return '📝';
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Enhanced post creation with immediate UI update trigger
  const handlePostPress = async () => {
    if (!selectedCategory || !message.trim() || !communityId) {
      Alert.alert('Missing Information', 'Please select a category and write your post.');
      return;
    }

    try {
      console.log('🔄 Submitting faculty community post to Supabase...');
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.log('❌ No user logged in');
        Alert.alert('Error', 'You must be logged in to post.');
        return;
      }

      // Get fresh initials for the post
      const authorInitials = await getUserInitialsForPost();

      console.log('📝 Creating faculty post with data:', {
        content: message.trim(),
        category: selectedCategory,
        author_id: userData.user.id,
        anonymous_name: authorInitials,
        community_id: communityId
      });

      // Insert into community_posts table (respecting anonymous toggle)
      const insertObj = {
        content: message.trim(),
        category: selectedCategory,
        author_id: userData.user.id,
        community_id: communityId,
        like_count: 0,
        comment_count: 0,
        repost_count: 0,
        bookmark_count: 0,
        is_anonymous: !!isAnonymous,
        ...(isAnonymous ? { anonymous_name: authorInitials } : {})
      };

      const { data, error } = await supabase
        .from('community_posts')
        .insert([insertObj])
        .select();

      if (error) {
        console.log('❌ Error submitting faculty community post:', error);
        Alert.alert('Error', 'Failed to create post. Please try again.');
        return;
      }

      console.log('✅ Faculty community post submitted successfully:', data);

      // Simple navigation back - real-time will handle the refresh
      Alert.alert(
        'Post Created!', 
        `Your post has been published in ${communityName || 'the faculty community'}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear form and go back to community
              setMessage('');
              setSelectedCategory(null);

              // Notify caller (e.g., CommunityFeedScreen) to refresh immediately
              try {
                if (typeof onPostCreated === 'function') {
                  console.log('🔔 Calling onPostCreated callback');
                  onPostCreated();
                }
              } catch (err) {
                console.log('Error calling onPostCreated callback:', err);
              }

              navigation.goBack();
            }
          }
        ]
      );
      
    } catch (error) {
      console.log('❌ Error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
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

  // Get community category icon
  const getCommunityCategoryIcon = (category) => {
    switch(category) {
      case 'academic': return '📚';
      case 'department': return '🏛️';
      case 'research': return '🔬';
      case 'faculty': return '👨‍🏫';
      case 'professional': return '💼';
      default: return '🏛️';
    }
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
                <View style={styles.headerTitleWrapper}>
                  <Text style={styles.headerTitleTop}>Create Community</Text>
                  <Text style={styles.headerTitleBottom}>Post</Text>
                </View>
              </View>

              <View style={styles.rightSpacer} />
            </View>
          </ImageBackground>

          {/* Faculty Community Info Card */}
          <View style={styles.communityCard}>
            <View style={styles.communityHeader}>
              <View style={styles.communityIcon}>
                <Text style={styles.communityIconText}>
                  {communityData ? getCommunityCategoryIcon(communityData.category) : '🏛️'}
                </Text>
              </View>
              <View style={styles.communityText}>
                <Text style={styles.communityName}>
                  {communityName || 'Faculty Community'}
                </Text>
                <Text style={styles.communityCategory}>
                  {communityData?.category ? `${communityData.category.charAt(0).toUpperCase() + communityData.category.slice(1)} Faculty Community` : 'Loading...'}
                </Text>
              </View>
            </View>
            {/* Description removed per UI request (Create Community Post screens only) */}
          </View>

          {/* Faculty User Identity Card */}
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <Image 
                source={require('../../../assets/create_post_screen_icons/anon_icon.png')}
                style={styles.anonIcon}
                resizeMode="contain"
              />
              <View style={styles.userText}>
                <Text style={styles.userName}>{userDisplayName}</Text>
                <Text style={styles.userStatus}>{isAnonymous ? 'Anonymous Faculty' : `${userDisplayName} (Faculty)`}</Text>
              </View>
            </View>
            <View style={styles.controlsRight}>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>👨‍🏫</Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                thumbColor={isAnonymous ? '#4ECDC4' : '#f4f3f4'}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(78,205,196,0.25)' }}
                style={styles.anonymousSwitch}
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
              <Text style={styles.sectionTitle}>Post Category</Text>
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
              <Text style={styles.sectionTitle}>Share with the faculty community</Text>
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
                placeholder="Share your professional insights, announcements, research, or department updates..."
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

              <TouchableOpacity style={styles.mediaButton} activeOpacity={0.7}>
                <View style={styles.mediaButtonIcon}>
                  <Image 
                    source={require('../../../assets/create_post_screen_icons/attach_icon.png')}
                    style={styles.mediaIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.mediaButtonText}>Document</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Post Button */}
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
              <Text style={styles.postButtonText}>Post to Faculty Community</Text>
            </TouchableOpacity>
            
            <Text style={styles.postDisclaimer}>
              {isAnonymous ? `Your post will be published anonymously as ${userInitials} in ${communityName || 'this faculty community'}` : `Your post will be published as ${userDisplayName} (Faculty) in ${communityName || 'this faculty community'}`}
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// KEEP ALL THE SAME STYLES FROM STUDENT VERSION
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
    fontSize: 24,
    fontFamily: fonts.medium,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 1,
  },
  headerTitleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleTop: {
    fontSize: 20,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  headerTitleBottom: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 1,
  },
  rightSpacer: {
    width: 42,
  },
  // Community Card
  communityCard: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  communityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  communityIconText: {
    fontSize: 18,
  },
  communityText: {
    flex: 1,
  },
  communityName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 2,
  },
  communityCategory: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  communityDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  // User Card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginTop: 10,
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
    backgroundColor: '#9C27B0',
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
  anonymousSwitch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
    marginLeft: 8,
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
  // Post Button
  postButtonContainer: {
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 10,
    alignItems: 'center',
  },
  postButton: {
    backgroundColor: '#4ECDC4',
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
    color: colors.white,
    letterSpacing: 1,
  },
  postDisclaimer: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
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

export default CreateCommunityPostScreen;