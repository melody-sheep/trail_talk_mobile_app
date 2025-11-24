// src/screens/faculty/CommunityDetailScreen.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import { getCommunityDetails, deleteCommunity, isUserCommunityAdmin } from '../../lib/supabase';

export default function CommunityDetailScreen({ route, navigation }) {
  const { communityId } = route.params;
  const [community, setCommunity] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const { user, refreshCommunities } = useContext(UserContext);

  // Load community details
  useEffect(() => {
    loadCommunityDetails();
  }, [communityId, user?.id]);

  const loadCommunityDetails = async () => {
    try {
      if (!user?.id) return;
      
      setLoading(true);
      const { data: communityData, error } = await getCommunityDetails(communityId, user.id);
      
      if (!error && communityData) {
        setCommunity(communityData);
        setIsMember(communityData.isMember);
        
        // Check if user is admin
        const { isAdmin: userIsAdmin } = await isUserCommunityAdmin(communityId, user.id);
        setIsAdmin(userIsAdmin);
      } else {
        console.error('Error loading community details:', error);
        Alert.alert('Error', 'Failed to load community details');
      }
    } catch (error) {
      console.error('Error in loadCommunityDetails:', error);
      Alert.alert('Error', 'Failed to load community details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = () => {
    navigation.navigate('FacultyCommunityFeed', { communityId });
  };

  const handleCreatePost = () => {
    navigation.navigate('FacultyCreateCommunityPost', { 
      communityId,
      communityName: community?.name,
      onPostCreated: () => {
        // Refresh will be handled by real-time subscriptions
      }
    });
  };

  const handleViewMembers = () => {
    navigation.navigate('FacultyCommunityMembers', { communityId });
  };

  const handleEditCommunity = () => {
    navigation.navigate('EditCommunity', { communityId });
  };

  const handleDeleteCommunity = async () => {
    try {
      const { error } = await deleteCommunity(communityId, user.id);
      
      if (!error) {
        Alert.alert('Success', 'Community deleted successfully');
        
        // Trigger refresh in parent screens
        if (refreshCommunities) {
          refreshCommunities();
        }
        
        // Navigate back
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to delete community. You may not have permission.');
      }
    } catch (error) {
      console.error('Error deleting community:', error);
      Alert.alert('Error', 'Failed to delete community');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const confirmDelete = () => {
    setShowDeleteModal(true);
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'academic': return 'school-outline';
      case 'department': return 'business-outline';
      case 'research': return 'flask-outline';
      case 'faculty': return 'people-circle-outline';
      case 'professional': return 'briefcase-outline';
      default: return 'people-outline';
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'academic': return '#4ECDC4';
      case 'department': return '#9C27B0';
      case 'research': return '#2196F3';
      case 'faculty': return '#FF9800';
      case 'professional': return '#607D8B';
      default: return '#4ECDC4';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading faculty community...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!community) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>Community not found</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadCommunityDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      {/* Header */}
      <ImageBackground 
        source={require('../../../assets/create_post_screen_icons/createpost_header_bg.png')}
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer} />

          <View style={styles.headerRightRow}>
            {isAdmin && (
              <TouchableOpacity 
                style={styles.menuButton}
                onPress={() => {/* Add menu options */}}
              >
                <Ionicons name="ellipsis-vertical" size={20} color={colors.white} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('ViewProfileScreen', { userId: user?.id })}
            >
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person-circle-outline" size={34} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Community Info Card */}
        <View style={styles.communityCard}>
          <View style={styles.communityHeader}>
            <View style={[styles.communityIcon, { backgroundColor: `${getCategoryColor(community.category)}20` }]}>
              <Ionicons 
                name={getCategoryIcon(community.category)} 
                size={32} 
                color={getCategoryColor(community.category)} 
              />
            </View>
            <View style={styles.communityText}>
              <Text style={styles.communityName}>{community.name}</Text>
              <Text style={styles.communityCategory}>
                {community.category.charAt(0).toUpperCase() + community.category.slice(1)} Faculty Community
              </Text>
              {community.is_official && (
                <View style={styles.officialBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#4CAF50" />
                  <Text style={styles.officialText}>Official Faculty Community</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.communityDescription}>{community.description}</Text>

          <View style={styles.communityStats}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={20} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.statNumber}>{community.member_count}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.statNumber}>
                {new Date(community.created_at).toLocaleDateString()}
              </Text>
              <Text style={styles.statLabel}>Created</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="lock-closed-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.statNumber}>
                {community.privacy.charAt(0).toUpperCase() + community.privacy.slice(1)}
              </Text>
              <Text style={styles.statLabel}>Privacy</Text>
            </View>
          </View>

          {community.rules && (
            <View style={styles.rulesSection}>
              <Text style={styles.rulesTitle}>Community Guidelines</Text>
              <Text style={styles.rulesText}>{community.rules}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {isMember ? (
            <>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleCreatePost}
              >
                <Ionicons name="create-outline" size={20} color={colors.white} />
                <Text style={styles.primaryButtonText}>Create Post</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleViewMembers}
              >
                <Ionicons name="people-outline" size={18} color={colors.white} />
                <Text style={styles.secondaryButtonText}>Members</Text>
              </TouchableOpacity>

              {isAdmin && (
                <TouchableOpacity 
                  style={styles.adminButton}
                  onPress={handleEditCommunity}
                >
                  <Ionicons name="settings-outline" size={18} color={colors.white} />
                  <Text style={styles.adminButtonText}>Manage</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={handleJoinCommunity}
            >
              <Ionicons name="person-add-outline" size={20} color={colors.white} />
              <Text style={styles.joinButtonText}>Join Faculty Community</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Admin Section */}
        {isAdmin && (
          <View style={styles.adminSection}>
            <Text style={styles.adminSectionTitle}>Community Administration</Text>
            <View style={styles.adminActions}>
              <TouchableOpacity 
                style={styles.adminActionButton}
                onPress={handleEditCommunity}
              >
                <Ionicons name="create-outline" size={20} color="#4ECDC4" />
                <Text style={styles.adminActionText}>Edit Community</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.adminActionButton}
                onPress={handleViewMembers}
              >
                <Ionicons name="people-outline" size={20} color="#4ECDC4" />
                <Text style={styles.adminActionText}>Manage Members</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.adminActionButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                <Text style={[styles.adminActionText, styles.deleteText]}>Delete Community</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning-outline" size={48} color="#FF6B6B" />
            <Text style={styles.modalTitle}>Delete Faculty Community</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{community.name}"? This action cannot be undone and all community data will be permanently lost.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalDeleteButton}
                onPress={handleDeleteCommunity}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  headerBackground: {
    width: '100%',
    height: 120,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  profileButton: {
    paddingLeft: 8,
    paddingRight: 4,
  },
  profileImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  menuButton: {
    padding: 8,
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  communityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  communityIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  communityText: {
    flex: 1,
  },
  communityName: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  communityCategory: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  officialText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#4CAF50',
    marginLeft: 6,
  },
  communityDescription: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    marginBottom: 20,
  },
  communityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  rulesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  rulesTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 8,
  },
  rulesText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 2,
    gap: 8,
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(156, 39, 176, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    gap: 6,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  adminButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  adminSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.3)',
  },
  adminSectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 16,
  },
  adminActions: {
    gap: 12,
  },
  adminActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  adminActionText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: '#4ECDC4',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  deleteText: {
    color: '#FF6B6B',
  },
  bottomSpacer: {
    height: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.homeBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDeleteText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
  },
});