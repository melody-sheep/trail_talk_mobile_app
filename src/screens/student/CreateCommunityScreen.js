// src/screens/student/CreateCommunityScreen.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import { createCommunity, canUserCreateCommunity } from '../../lib/supabase';

export default function CreateCommunityScreen({ navigation, route }) {
  const { user, triggerCommunityRefresh } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'academic',
    privacy: 'public',
    rules: '',
    max_members: 50
  });
  const [userCommunityStats, setUserCommunityStats] = useState({
    createdCommunities: 0,
    maxFreeCommunities: 3,
    canCreate: true
  });

  // Free plan settings — update if you determine plan server-side
  const FREE_PLAN_MAX = 50;
  const isFreePlan = true;

  const categories = [
    { id: 'academic', label: 'Academic', icon: 'school-outline', color: '#4ECDC4' },
    { id: 'social', label: 'Social', icon: 'people-outline', color: '#FFA726' },
    { id: 'support', label: 'Support', icon: 'heart-outline', color: '#FF6B6B' },
    { id: 'hobbies', label: 'Hobbies', icon: 'game-controller-outline', color: '#45B7D1' },
    { id: 'sports', label: 'Sports', icon: 'basketball-outline', color: '#FFD700' }
  ];

  const privacyOptions = [
    { id: 'public', label: 'Public', description: 'Anyone can join and view content', icon: 'earth-outline' },
    { id: 'private', label: 'Private', description: 'Membership requires approval', icon: 'lock-closed-outline' }
  ];

  // Load user community stats
  useEffect(() => {
    loadUserCommunityStats();
  }, [user?.id]);

  const loadUserCommunityStats = async () => {
    if (!user?.id) return;
    
    try {
      const { canCreate, createdCount } = await canUserCreateCommunity(user.id);
      setUserCommunityStats({
        createdCommunities: createdCount,
        maxFreeCommunities: 3,
        canCreate
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a community name');
      return false;
    }

    if (formData.name.length < 3) {
      Alert.alert('Error', 'Community name must be at least 3 characters long');
      return false;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a community description');
      return false;
    }

    if (formData.description.length < 10) {
      Alert.alert('Error', 'Description must be at least 10 characters long');
      return false;
    }

    return true;
  };

  const handleCreateCommunity = async () => {
    if (!validateForm()) return;

    if (!userCommunityStats.canCreate) {
      Alert.alert(
        'Community Limit Reached',
        `You have reached the free tier limit of ${userCommunityStats.maxFreeCommunities} communities. Upgrade to premium for unlimited communities.`,
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('PremiumSubscription') }
        ]
      );
      return;
    }

    setLoading(true);

    try {
      const communityData = {
        ...formData,
        created_by: user.id,
        icon: categories.find(cat => cat.id === formData.category)?.icon || 'people-outline'
      };

      const { data, error } = await createCommunity(communityData);

      if (error) {
        throw error;
      }

      if (triggerCommunityRefresh) {
        triggerCommunityRefresh();
      }

      Alert.alert(
        'Success!',
        `Community "${formData.name}" has been created successfully!`,
        [
          {
            text: 'View Community',
            onPress: () => {
              navigation.replace('CommunityDetail', { communityId: data.id });
            }
          },
          {
            text: 'Back to Communities',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error creating community:', error);
      Alert.alert('Error', 'Failed to create community. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberLimitChange = (value) => {
    // Accept numeric input or numeric deltas.
    let numValue = typeof value === 'number' ? value : parseInt(value);
    if (Number.isNaN(numValue)) return;
    // Clamp value between 2 and either free-plan max or 500
    const clampMax = isFreePlan ? FREE_PLAN_MAX : 500;
    numValue = Math.max(2, Math.min(clampMax, numValue));
    handleInputChange('max_members', numValue);
  };

  // Slightly darken a hex color by a given amount (0-255)
  const darkenColor = (hex, amount = 20) => {
    try {
      let col = hex.replace('#', '');
      if (col.length === 3) col = col.split('').map(c => c + c).join('');
      const num = parseInt(col, 16);
      let r = (num >> 16) - amount;
      let g = ((num >> 8) & 0x00FF) - amount;
      let b = (num & 0x0000FF) - amount;
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      const newHex = '#' + ( (r << 16) | (g << 8) | b ).toString(16).padStart(6, '0');
      return newHex;
    } catch (e) {
      return hex;
    }
  };

  const isFormValid = () => {
    return formData.name.trim().length >= 3 && formData.description.trim().length >= 10;
  };

  const renderCategoryOption = (category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryOption,
        { borderColor: 'rgba(255,255,255,0.12)' },
        formData.category === category.id && styles.categoryOptionSelected
      ]}
      onPress={() => handleInputChange('category', category.id)}
    >
      <View style={[
        styles.chipLeft,
        {
          backgroundColor: formData.category === category.id ? darkenColor(category.color, 28) : 'rgba(255,255,255,0.04)'
        }
      ]}>
        <Ionicons name={category.icon} size={16} color={formData.category === category.id ? colors.white : category.color} />
      </View>
      <Text style={[
        styles.categoryLabel,
        formData.category === category.id && styles.categoryLabelSelected
      ]}>{category.label}</Text>
      {formData.category === category.id && (
        <Ionicons name="checkmark" size={14} color={colors.white} style={styles.chipCheck} />
      )}
    </TouchableOpacity>
  );

  const renderPrivacyOption = (option) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.privacyOption,
        formData.privacy === option.id && styles.privacyOptionSelected
      ]}
      onPress={() => handleInputChange('privacy', option.id)}
    >
      <View style={styles.privacyContent}>
        <View style={styles.privacyIconContainer}>
          <Ionicons 
            name={option.icon} 
            size={22} 
            color={formData.privacy === option.id ? '#4ECDC4' : 'rgba(255,255,255,0.6)'} 
          />
        </View>
        <View style={styles.privacyTextContainer}>
          <Text style={[
            styles.privacyLabel,
            formData.privacy === option.id && styles.privacyLabelSelected
          ]}>
            {option.label}
          </Text>
          <Text style={styles.privacyDescription}>
            {option.description}
          </Text>
        </View>
        {formData.privacy === option.id && (
          <View style={styles.privacySelected}>
            <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Enhanced Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Create Community</Text>
            <Text style={styles.headerSubtitle}>Build your campus community</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Enhanced Community Creation Status */}
          <View style={styles.creationStatus}>
            <View style={styles.statusHeader}>
              <View style={styles.statusIconContainer}>
                <Ionicons name="rocket-outline" size={20} color="#4ECDC4" />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Free Plan Progress</Text>
                <Text style={styles.statusSubtitle}>
                  {userCommunityStats.createdCommunities} of {userCommunityStats.maxFreeCommunities} communities used
                </Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${(userCommunityStats.createdCommunities / userCommunityStats.maxFreeCommunities) * 100}%`,
                      backgroundColor: userCommunityStats.createdCommunities >= userCommunityStats.maxFreeCommunities ? '#FF6B6B' : '#4ECDC4'
                    }
                  ]} 
                />
              </View>
            </View>
            {!userCommunityStats.canCreate && (
              <View style={styles.limitWarning}>
                <Ionicons name="warning-outline" size={16} color="#FF6B6B" />
                <Text style={styles.limitWarningText}>
                  Free tier limit reached. Upgrade to premium for more.
                </Text>
              </View>
            )}
          </View>

          {/* Enhanced Form Sections */}
          <View style={styles.formCard}>
            {/* Community Name */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Community Name</Text>
                <Text style={styles.requiredBadge}>Required</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Enter community name"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                maxLength={50}
              />
              <Text style={styles.charCount}>{formData.name.length}/50</Text>
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Description</Text>
                <Text style={styles.requiredBadge}>Required</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your community's purpose and what members can expect..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>{formData.description.length}/500</Text>
            </View>
          </View>

          {/* Enhanced Category Selection */}
          <View style={styles.formCard}>
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Category</Text>
                <Text style={styles.requiredBadge}>Required</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Choose the category that best fits your community
              </Text>
              <View style={styles.categoriesGrid}>
                {categories.map(renderCategoryOption)}
              </View>
            </View>
          </View>

          {/* Enhanced Privacy Settings */}
          <View style={styles.formCard}>
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Privacy Settings</Text>
              <Text style={styles.sectionDescription}>
                Control who can join and view your community
              </Text>
              <View style={styles.privacyOptions}>
                {privacyOptions.map(renderPrivacyOption)}
              </View>
            </View>
          </View>

          {/* Enhanced Member Limit */}
          <View style={styles.formCard}>
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Member Limit</Text>
              {!isFreePlan && (
                <Text style={styles.sectionDescription}>
                  Set maximum number of members (2-500) — you can type a number or use the buttons
                </Text>
              )}
              <View style={styles.memberLimitContainer}>
                <TouchableOpacity
                  style={[
                    styles.limitButton,
                      formData.max_members <= 2 && styles.limitButtonDisabled
                  ]}
                    onPress={() => handleMemberLimitChange(formData.max_members - 1)}
                    disabled={formData.max_members <= 2}
                >
                  <Ionicons name="remove" size={18} color={formData.max_members <= 2 ? 'rgba(255,255,255,0.3)' : colors.white} />
                </TouchableOpacity>
                
                <View style={styles.limitInputContainer}>
                  <TextInput
                    style={styles.limitInput}
                    value={formData.max_members.toString()}
                    onChangeText={handleMemberLimitChange}
                    keyboardType="numeric"
                    maxLength={3}
                    textAlign="center"
                  />
                  <Text style={styles.limitLabel}>members max</Text>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.limitButton,
                    (isFreePlan ? formData.max_members >= FREE_PLAN_MAX : formData.max_members >= 500) && styles.limitButtonDisabled
                  ]}
                  onPress={() => handleMemberLimitChange(formData.max_members + 1)}
                  disabled={isFreePlan ? formData.max_members >= FREE_PLAN_MAX : formData.max_members >= 500}
                >
                  <Ionicons name="add" size={18} color={(isFreePlan ? formData.max_members >= FREE_PLAN_MAX : formData.max_members >= 500) ? 'rgba(255,255,255,0.3)' : colors.white} />
                </TouchableOpacity>
              </View>
              <Text style={styles.limitNote}>Free tier supports up to 50 members</Text>
            </View>
          </View>

          {/* Enhanced Community Rules */}
          <View style={styles.formCard}>
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Community Rules</Text>
              <Text style={styles.sectionDescription}>
                Optional: Set guidelines for your community members
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Example: Be respectful to all members, No spam, Keep discussions relevant..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={formData.rules}
                onChangeText={(text) => handleInputChange('rules', text)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.charCount}>{formData.rules.length}/1000</Text>
            </View>
          </View>

          {/* Enhanced Create Button */}
          <TouchableOpacity
            style={[
              styles.createButton,
              (!userCommunityStats.canCreate || loading || !isFormValid()) && styles.createButtonDisabled
            ]}
            onPress={handleCreateCommunity}
            disabled={!userCommunityStats.canCreate || loading || !isFormValid()}
          >
            <View style={styles.createButtonContent}>
              {loading ? (
                <Text style={styles.createButtonText}>Creating Community...</Text>
              ) : (
                <>
                  <Ionicons name="people" size={20} color={colors.white} />
                  <Text style={styles.createButtonText}>
                    {userCommunityStats.canCreate ? 'Create Community' : 'Free Limit Reached'}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  // Enhanced Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  // Enhanced Cards
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  // Enhanced Creation Status
  creationStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
    marginTop: 8,
  },
  limitWarningText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#FF6B6B',
    marginLeft: 8,
    flex: 1,
  },
  // Enhanced Form Sections
  formSection: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  requiredBadge: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  charCount: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'right',
    marginTop: 6,
  },
  // Enhanced Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    margin: 6,
  },
  categoryOptionSelected: {
    backgroundColor: 'rgba(78, 205, 196, 0.18)',
    borderColor: 'rgba(78, 205, 196, 0.35)'
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chipLeft: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.9)'
  },
  chipCheck: {
    marginLeft: 8,
  },
  categoryLabelSelected: {
    color: colors.white,
    fontFamily: fonts.semiBold,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Enhanced Privacy Options
  privacyOptions: {
    gap: 12,
  },
  privacyOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  privacyOptionSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  privacyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyIconContainer: {
    marginRight: 16,
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyLabel: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  privacyLabelSelected: {
    color: colors.white,
    fontFamily: fonts.semiBold,
  },
  privacyDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  privacySelected: {
    marginLeft: 8,
  },
  // Enhanced Member Limit
  memberLimitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  limitButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  limitButtonDisabled: {
    opacity: 0.4,
  },
  limitInputContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  limitInput: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    padding: 0,
    includeFontPadding: false,
  },
  limitLabel: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  limitNote: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 8,
  },
  // Enhanced Create Button
  createButton: {
    backgroundColor: '#4ECDC4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  bottomSpacer: {
    height: 30,
  },
});