// src/screens/student/CommunityDetailScreen.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import { 
  getCommunityDetails, 
  joinCommunity, 
  leaveCommunity,
  getCommunityMembers,
  getCommunityPosts,
  deleteCommunity
} from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

export default function CommunityDetailScreen({ navigation, route }) {
  const { communityId } = route.params;
  const { user, triggerCommunityRefresh } = useContext(UserContext);
  
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Load community data
  useEffect(() => {
    if (communityId && user?.id) {
      loadCommunityData();
    }
  }, [communityId, user?.id]);

  // Real-time subscription for community deletion
  useEffect(() => {
    if (!communityId || !user?.id) return;

    const subscription = supabase
      .channel('community-changes')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'communities',
          filter: `id=eq.${communityId}`
        },
        (payload) => {
          console.log('Community was deleted in real-time:', payload);
          setCommunity(null);
          Alert.alert(
            'Community Deleted',
            'This community has been deleted by the admin.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [communityId, user?.id, navigation]);

  const loadCommunityData = async () => {
    try {
        setLoading(true);
        
        // Load community details
        const { data: communityData, error: communityError } = await getCommunityDetails(communityId, user.id);
        
        // Check if community exists and user has access
        if (communityError) {
        if (communityError.code === 'PGRST116' || communityError.message?.includes('not found')) {
            setCommunity(null);
            setLoading(false);
            return;
        }
        throw communityError;
        }

        if (!communityData) {
        setCommunity(null);
        setLoading(false);
        return;
        }

        setCommunity(communityData);

        // Load members
        const { data: membersData, error: membersError } = await getCommunityMembers(communityId);
        if (membersError) {
        if (membersError.code === 'PGRST116') {
            setCommunity(null);
            setLoading(false);
            return;
        }
        throw membersError;
        }
        setMembers(membersData || []);

        // Load posts if on posts tab
        if (activeTab === 'posts') {
        const { data: postsData, error: postsError } = await getCommunityPosts(communityId);
        if (postsError) {
            if (postsError.code === 'PGRST116') {
            setCommunity(null);
            setLoading(false);
            return;
            }
            throw postsError;
        }
        setPosts(postsData || []);
        }

    } catch (error) {
        console.error('Error loading community data:', error);
        
        if (error.code === 'PGRST116' || error.message?.includes('not found')) {
        setCommunity(null);
        } else {
        Alert.alert('Error', 'Failed to load community details');
        }
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
    };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunityData();
  };

  const handleJoinCommunity = async () => {
    if (!community || !user?.id) return;

    try {
      const { error } = await joinCommunity(communityId, user.id);
      if (error) throw error;

      await loadCommunityData();
      
      Alert.alert('Success', `You've joined ${community.name}!`);
    } catch (error) {
      console.error('Error joining community:', error);
      Alert.alert('Error', 'Failed to join community. Please try again.');
    }
  };

  const handleLeaveCommunity = async () => {
    if (!community || !user?.id) return;

    Alert.alert(
      'Leave Community',
      `Are you sure you want to leave ${community.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await leaveCommunity(communityId, user.id);
              if (error) throw error;

              await loadCommunityData();
              
              Alert.alert('Success', `You've left ${community.name}`);
            } catch (error) {
              console.error('Error leaving community:', error);
              Alert.alert('Error', 'Failed to leave community. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteCommunity = async () => {
    if (!community || !user?.id || deleting) return;

    setDeleting(true);
    try {
      const { data, error } = await deleteCommunity(communityId, user.id);
      
      if (error) {
        if (error.message.includes('admin')) {
          throw new Error('You must be an admin to delete this community');
        } else if (error.message.includes('permissions')) {
          throw new Error('Permission denied. You cannot delete this community.');
        }
        throw error;
      }

      Alert.alert(
        'Community Deleted',
        `"${community.name}" has been permanently deleted.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (triggerCommunityRefresh) {
                triggerCommunityRefresh();
              }
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting community:', error);
      
      let errorMessage = 'Failed to delete community. Please try again.';
      if (error.message.includes('admin')) {
        errorMessage = 'You must be an admin to delete this community.';
      } else if (error.message.includes('permissions')) {
        errorMessage = 'Permission denied. You cannot delete this community.';
      } else if (error.message.includes('verify')) {
        errorMessage = 'Unable to verify your permissions. Please try again.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmation('');
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteConfirmation('');
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmation('');
  };

  const handleCreatePost = () => {
    navigation.navigate('CreateCommunityPost', { 
      communityId, 
      communityName: community?.name 
    });
  };

  const handleViewMembers = () => {
    navigation.navigate('CommunityMembers', { communityId, communityName: community?.name });
  };

  // Professional Badge Component
  const ProfessionalBadge = ({ type, size = 'medium' }) => {
    const badgeConfig = {
      verified: {
        icon: 'shield-checkmark',
        color: '#1877F2',
        label: 'Verified',
        bgColor: 'rgba(24, 119, 242, 0.1)',
        borderColor: '#1877F2'
      },
      official: {
        icon: 'shield-checkmark',
        color: '#4CAF50',
        label: 'Official',
        bgColor: 'rgba(76, 175, 80, 0.1)',
        borderColor: '#4CAF50'
      },
      featured: {
        icon: 'star',
        color: '#FFD700',
        label: 'Featured',
        bgColor: 'rgba(255, 215, 0, 0.1)',
        borderColor: '#FFD700'
      }
    };

    const config = badgeConfig[type];
    const isSmall = size === 'small';
    const iconSize = isSmall ? 14 : 16;
    const fontSize = isSmall ? 10 : 12;
    const padding = isSmall ? 6 : 8;

    return (
      <View style={[
        styles.badgeContainer,
        { 
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          paddingHorizontal: padding,
          paddingVertical: padding - 2,
          borderRadius: 8
        }
      ]}>
        <Ionicons name={config.icon} size={iconSize} color={config.color} />
        <Text style={[
          styles.badgeText, 
          { 
            color: config.color, 
            fontSize: fontSize,
            marginLeft: 4
          }
        ]}>
          {config.label}
        </Text>
      </View>
    );
  };

  // Category Icon and Color
  const getCategoryConfig = (category) => {
    const categoryConfig = {
      academic: { icon: 'school-outline', color: '#4ECDC4' },
      social: { icon: 'people-outline', color: '#FFA726' },
      support: { icon: 'heart-outline', color: '#FF6B6B' },
      hobbies: { icon: 'game-controller-outline', color: '#45B7D1' },
      sports: { icon: 'basketball-outline', color: '#FFD700' }
    };
    return categoryConfig[category] || { icon: 'people-outline', color: '#4ECDC4' };
  };

  // Render member item
  const renderMemberItem = ({ item, index }) => {
    if (index >= 5) return null;
    
    return (
      <View style={styles.memberItem}>
        <View style={styles.memberAvatar}>
          <Ionicons name="person" size={20} color="rgba(255,255,255,0.6)" />
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {item.user?.display_name || item.user?.username || 'Unknown User'}
          </Text>
          <Text style={styles.memberRole}>
            {item.role === 'admin' ? 'Admin' : 'Member'}
          </Text>
        </View>
        {item.role === 'admin' && (
          <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
        )}
      </View>
    );
  };

  // Render post item
  const renderPostItem = ({ item }) => (
    <View style={styles.postItem}>
      <View style={styles.postHeader}>
        <View style={styles.postAuthor}>
          <View style={styles.authorAvatar}>
            <Ionicons name="person" size={16} color="rgba(255,255,255,0.6)" />
          </View>
          <Text style={styles.authorName}>
            {item.anonymous_name || item.author?.display_name || 'Anonymous'}
          </Text>
        </View>
        <Text style={styles.postTime}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart-outline" size={14} color="rgba(255,255,255,0.5)" />
          <Text style={styles.statText}>{item.like_count}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={14} color="rgba(255,255,255,0.5)" />
          <Text style={styles.statText}>{item.comment_count}</Text>
        </View>
      </View>
    </View>
  );

  // Delete Confirmation Modal
  const renderDeleteModal = () => (
    <Modal
      visible={showDeleteModal}
      transparent={true}
      animationType="slide"
      onRequestClose={closeDeleteModal}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Ionicons name="warning" size={32} color="#FF6B6B" />
            <Text style={styles.modalTitle}>Delete Community</Text>
            <Text style={styles.modalSubtitle}>
              This action cannot be undone
            </Text>
          </View>

          <View style={styles.warningSection}>
            <Text style={styles.warningText}>
              You are about to permanently delete <Text style={styles.communityNameHighlight}>"{community?.name}"</Text>
            </Text>
            <View style={styles.warningDetails}>
              <Text style={styles.warningDetail}>• All posts will be deleted</Text>
              <Text style={styles.warningDetail}>• All members will be removed</Text>
              <Text style={styles.warningDetail}>• This action is irreversible</Text>
            </View>
          </View>

          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationLabel}>
              Type <Text style={styles.confirmationWord}>DELETE</Text> to confirm:
            </Text>
            <TextInput
              style={styles.confirmationInput}
              placeholder="Type DELETE here"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={closeDeleteModal}
              disabled={deleting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.modalButton, 
                styles.deleteButton,
                (deleteConfirmation !== 'DELETE' || deleting) && styles.deleteButtonDisabled
              ]}
              onPress={handleDeleteCommunity}
              disabled={deleteConfirmation !== 'DELETE' || deleting}
            >
              {deleting ? (
                <Text style={styles.deleteButtonText}>Deleting...</Text>
              ) : (
                <>
                  <Ionicons name="trash" size={18} color={colors.white} />
                  <Text style={styles.deleteButtonText}>Delete Forever</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
        <View style={styles.loadingContainer}>
          <Ionicons name="people" size={48} color="#4ECDC4" />
          <Text style={styles.loadingText}>Loading Community...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!community) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>Community not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryConfig = getCategoryConfig(community.category);

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {community.name}
        </Text>
        {community.isAdmin && (
          <TouchableOpacity 
            style={styles.deleteHeaderButton}
            onPress={openDeleteModal}
          >
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.white}
            colors={[colors.white]}
          />
        }
      >
        {/* Community Header */}
        <View style={styles.communityHeader}>
          <View style={[styles.communityIcon, { backgroundColor: `${categoryConfig.color}20` }]}>
            <Ionicons name={categoryConfig.icon} size={32} color={categoryConfig.color} />
          </View>
          
          <View style={styles.communityInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.communityName}>{community.name}</Text>
              {community.is_featured && <ProfessionalBadge type="featured" size="small" />}
              {community.is_official && <ProfessionalBadge type="official" size="small" />}
              {community.isAdmin && <ProfessionalBadge type="verified" size="small" />}
            </View>
            <Text style={styles.communityCategory}>
              {community.category.charAt(0).toUpperCase() + community.category.slice(1)} Community
            </Text>
            <View style={styles.communityStats}>
              <View style={styles.stat}>
                <Ionicons name="people" size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.statText}>{community.member_count} members</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.statText}>
                  {community.privacy === 'public' ? 'Public' : 'Private'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {community.isMember ? (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleCreatePost}
              >
                <Ionicons name="create-outline" size={20} color={colors.white} />
                <Text style={styles.primaryButtonText}>Create Post</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handleLeaveCommunity}
              >
                <Ionicons name="exit-outline" size={20} color="#FF6B6B" />
                <Text style={styles.secondaryButtonText}>Leave</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleJoinCommunity}
            >
              <Ionicons name="person-add" size={20} color={colors.white} />
              <Text style={styles.primaryButtonText}>Join Community</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Admin Actions */}
        {community.isAdmin && (
          <View style={styles.adminSection}>
            <Text style={styles.adminTitle}>Admin Actions</Text>
            <TouchableOpacity 
              style={styles.adminDeleteButton}
              onPress={openDeleteModal}
            >
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              <Text style={styles.adminDeleteText}>Delete Community</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.tabActive]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'members' && styles.tabActive]}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
              Members
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{community.description}</Text>
            
            {community.rules && (
              <>
                <Text style={styles.sectionTitle}>Community Rules</Text>
                <Text style={styles.rules}>{community.rules}</Text>
              </>
            )}

            <Text style={styles.sectionTitle}>Community Info</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                  {new Date(community.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="people-outline" size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.infoLabel}>Max Members</Text>
                <Text style={styles.infoValue}>{community.max_members}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.infoLabel}>Privacy</Text>
                <Text style={styles.infoValue}>
                  {community.privacy === 'public' ? 'Public' : 'Private'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name={categoryConfig.icon} size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>
                  {community.category.charAt(0).toUpperCase() + community.category.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'posts' && (
          <View style={styles.tabContent}>
            {posts.length > 0 ? (
              <FlatList
                data={posts}
                renderItem={renderPostItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyStateText}>No posts yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  {community.isMember 
                    ? 'Be the first to create a post!' 
                    : 'Join the community to see posts'
                  }
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'members' && (
          <View style={styles.tabContent}>
            <View style={styles.membersHeader}>
              <Text style={styles.membersCount}>
                {members.length} {members.length === 1 ? 'Member' : 'Members'}
              </Text>
              {members.length > 5 && (
                <TouchableOpacity onPress={handleViewMembers}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <FlatList
              data={members}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item.user?.id || Math.random().toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Delete Confirmation Modal */}
      {renderDeleteModal()}
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
    backgroundColor: colors.homeBackground,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.homeBackground,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.white,
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  deleteHeaderButton: {
    padding: 8,
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  communityHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  communityIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  communityInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  communityName: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.white,
    marginRight: 8,
    marginBottom: 4,
  },
  communityCategory: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  communityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.6)',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    letterSpacing: 0.3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#4ECDC4',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: '#FF6B6B',
  },
  adminSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  adminTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 12,
  },
  adminDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  adminDeleteText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: '#FF6B6B',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4ECDC4',
  },
  tabText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.6)',
  },
  tabTextActive: {
    color: '#4ECDC4',
    fontFamily: fonts.semiBold,
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
    marginBottom: 24,
  },
  rules: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
    textAlign: 'center',
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  membersCount: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#4ECDC4',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.5)',
  },
  postItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.8)',
  },
  postTime: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.4)',
  },
  postContent: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bottomSpacer: {
    height: 30,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.homeBackground,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#FF6B6B',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  warningSection: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    marginBottom: 24,
  },
  warningText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    textAlign: 'center',
  },
  communityNameHighlight: {
    color: '#FF6B6B',
    fontFamily: fonts.bold,
  },
  warningDetails: {
    gap: 8,
  },
  warningDetail: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.7)',
  },
  confirmationSection: {
    marginBottom: 24,
  },
  confirmationLabel: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationWord: {
    color: '#FF6B6B',
    fontFamily: fonts.bold,
  },
  confirmationInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  deleteButtonDisabled: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },
});