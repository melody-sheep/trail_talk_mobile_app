// src/screens/faculty/CreateCommunityScreen.js
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
    max_members: 100 // Faculty get higher member limits
  });
  const [userCommunityStats, setUserCommunityStats] = useState({
    createdCommunities: 0,
    maxFreeCommunities: 5, // Faculty get more communities
    canCreate: true
  });

  // Faculty-specific categories
  const categories = [
    { id: 'academic', label: 'Academic', icon: 'school-outline', color: '#4ECDC4' },
    { id: 'department', label: 'Department', icon: 'business-outline', color: '#9C27B0' },
    { id: 'research', label: 'Research', icon: 'flask-outline', color: '#2196F3' },
    { id: 'faculty', label: 'Faculty', icon: 'people-circle-outline', color: '#FF9800' },
    { id: 'professional', label: 'Professional', icon: 'briefcase-outline', color: '#607D8B' }
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
        maxFreeCommunities: 5, // Faculty limit
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

    // Check if user can create more communities
    if (!userCommunityStats.canCreate) {
      Alert.alert(
        'Community Limit Reached',
        `You have reached the faculty tier limit of ${userCommunityStats.maxFreeCommunities} communities.`,
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    setLoading(true);

    try {
      const communityData = {
        ...formData,
        created_by: user.id,
        icon: categories.find(cat => cat.id === formData.category)?.icon || 'people-outline',
        is_official: formData.category === 'department' || formData.category === 'faculty' // Auto-mark department/faculty as official
      };

      const { data, error } = await createCommunity(communityData);

      if (error) {
        throw error;
      }

      // TRIGGER COMMUNITY REFRESH
      if (triggerCommunityRefresh) {
        triggerCommunityRefresh();
      }

      Alert.alert(
        'Success!',
        `Faculty Community "${formData.name}" has been created successfully!`,
        [
          {
            text: 'View Community',
            onPress: () => {
              navigation.replace('FacultyCommunityDetail', { communityId: data.id });
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

  const renderCategoryOption = (category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryOption,
        formData.category === category.id && styles.categoryOptionSelected,
        { borderColor: category.color }
      ]}
      onPress={() => handleInputChange('category', category.id)}
    >
      <View style={[styles.categoryIconContainer, { backgroundColor: `${category.color}20` }]}>
        <Ionicons name={category.icon} size={20} color={category.color} />
      </View>
      <Text style={[
        styles.categoryLabel,
        formData.category === category.id && styles.categoryLabelSelected
      ]}>
        {category.label}
      </Text>
      {formData.category === category.id && (
        <Ionicons name="checkmark-circle" size={20} color={category.color} style={styles.selectedIcon} />
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
      <View style={styles.privacyHeader}>
        <View style={styles.privacyIconContainer}>
          <Ionicons name={option.icon} size={20} color={formData.privacy === option.id ? '#4ECDC4' : 'rgba(255,255,255,0.6)'} />
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
          <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Faculty Community</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Community Creation Status */}
          <View style={styles.creationStatus}>
            <View style={styles.statusHeader}>
              <Ionicons name="school-outline" size={24} color="#4ECDC4" />
              <Text style={styles.statusTitle}>Faculty Plan</Text>
            </View>
            <View style={styles.statusProgress}>
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
              <Text style={styles.progressText}>
                {userCommunityStats.createdCommunities}/{userCommunityStats.maxFreeCommunities} faculty communities used
              </Text>
            </View>
            {!userCommunityStats.canCreate && (
              <Text style={styles.limitWarning}>
                You've reached the faculty tier limit. Contact administration for additional communities.
              </Text>
            )}
          </View>

          {/* Community Name */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Community Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter faculty community name (e.g., Computer Science Department)"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              maxLength={50}
            />
            <Text style={styles.charCount}>{formData.name.length}/50</Text>
          </View>

          {/* Description */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe your faculty community's purpose, goals, and collaboration focus..."
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

          {/* Category Selection */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Category *</Text>
            <Text style={styles.sectionDescription}>
              Choose the category that best fits your faculty community
            </Text>
            <View style={styles.categoriesGrid}>
              {categories.map(renderCategoryOption)}
            </View>
          </View>

          {/* Privacy Settings */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Privacy Settings</Text>
            <Text style={styles.sectionDescription}>
              Control who can join and view your faculty community
            </Text>
            <View style={styles.privacyOptions}>
              {privacyOptions.map(renderPrivacyOption)}
            </View>
          </View>

          {/* Community Rules (Optional) */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Community Guidelines</Text>
            <Text style={styles.sectionDescription}>
              Optional: Set professional guidelines for your faculty community members
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Example: Maintain professional discourse, Respect diverse perspectives, Share research ethically..."
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

          {/* Member Limit */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Member Limit</Text>
            <Text style={styles.sectionDescription}>
              Maximum number of members (Faculty tier: 200 members max)
            </Text>
            <View style={styles.memberLimitContainer}>
              <TouchableOpacity
                style={styles.limitButton}
                onPress={() => handleInputChange('max_members', Math.max(20, formData.max_members - 20))}
              >
                <Ionicons name="remove" size={20} color={colors.white} />
              </TouchableOpacity>
              
              <View style={styles.limitDisplay}>
                <Text style={styles.limitNumber}>{formData.max_members}</Text>
                <Text style={styles.limitLabel}>members</Text>
              </View>
              
              <TouchableOpacity
                style={styles.limitButton}
                onPress={() => handleInputChange('max_members', Math.min(200, formData.max_members + 20))}
              >
                <Ionicons name="add" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[
              styles.createButton,
              (!userCommunityStats.canCreate || loading) && styles.createButtonDisabled
            ]}
            onPress={handleCreateCommunity}
            disabled={!userCommunityStats.canCreate || loading}
          >
            {loading ? (
              <Text style={styles.createButtonText}>Creating Faculty Community...</Text>
            ) : (
              <>
                <Ionicons name="school" size={20} color={colors.white} />
                <Text style={styles.createButtonText}>
                  {userCommunityStats.canCreate ? 'Create Faculty Community' : 'Faculty Limit Reached'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// KEEP ALL THE SAME STYLES FROM STUDENT VERSION
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  creationStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginLeft: 8,
  },
  statusProgress: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  limitWarning: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 4,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  },
  charCount: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'right',
    marginTop: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
  },
  categoryOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: colors.white,
    fontFamily: fonts.semiBold,
  },
  selectedIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
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
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  privacyIconContainer: {
    marginRight: 12,
    marginTop: 2,
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
  memberLimitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  limitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  limitNumber: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  limitLabel: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  createButton: {
    backgroundColor: '#4ECDC4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  bottomSpacer: {
    height: 30,
  },
});