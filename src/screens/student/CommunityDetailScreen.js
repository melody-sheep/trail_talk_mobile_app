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
  Platform,
  Image
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
  deleteCommunity,
  findUserByUsername,
  createCommunityInvitation,
  getCommunityInvitations,
  supabase
} from '../../lib/supabase';
import CommunityPostCard from '../../components/CommunityPostCard';

export default function CommunityDetailScreen({ navigation, route }) {
  const { communityId } = route.params;
  const { user, triggerCommunityRefresh } = useContext(UserContext);
  
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [communityInvitations, setCommunityInvitations] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState([]);
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Load community data
  useEffect(() => {
    if (communityId && user?.id) {
      loadCommunityData();
    }
  }, [communityId, user?.id]);

  // Fetch posts when user switches to posts tab
  useEffect(() => {
    if (activeTab === 'posts' && communityId && user?.id) {
      loadCommunityData();
    }
  }, [activeTab, communityId, user?.id]);

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

  // Real-time subscription for community posts (create/update/delete)
  useEffect(() => {
    if (!communityId) return;

    const postsSub = supabase
      .channel(`community-detail-posts-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_posts',
          filter: `community_id=eq.${communityId}`
        },
        async (payload) => {
          console.log('CommunityDetailScreen real-time post event:', payload.eventType, payload.new?.id || payload.old?.id);
          // For posts tab, fetch posts only to avoid toggling the global loading state
          if (activeTab === 'posts') {
            try {
              const { data: postsData, error: postsError } = await getCommunityPosts(communityId);
              if (!postsError && postsData) {
                setPosts(postsData || []);
              } else if (postsError) {
                console.error('Error fetching posts on realtime update', postsError);
              }
            } catch (e) {
              console.error('Realtime posts fetch error', e);
            }
          }
        }
      )
      .subscribe();

    return () => {
      try { postsSub.unsubscribe(); } catch (e) { console.log('Error unsubscribing postsSub', e); }
    };
  }, [communityId, activeTab]);

  // Real-time subscriptions for invitations and members to auto-refresh UI
  useEffect(() => {
    if (!communityId) return;

    const invSub = supabase
      .channel(`community-invitations-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_invitations',
          filter: `community_id=eq.${communityId}`
        },
        async (payload) => {
          // Refresh pending invitations
          try {
            const { data: invitesData, error: invitesError } = await getCommunityInvitations(communityId);
            if (!invitesError && invitesData) setCommunityInvitations(invitesData || []);
          } catch (e) {
            console.error('Realtime fetch invitations error', e);
          }

          // If an invitation was accepted elsewhere, members may have changed; refresh members too
          try {
            const { data: membersData, error: membersError } = await getCommunityMembers(communityId);
            if (!membersError && membersData) setMembers(membersData || []);
          } catch (e) {
            console.error('Realtime fetch members error (from invitations sub)', e);
          }
        }
      )
      .subscribe();

    const membersSub = supabase
      .channel(`community-members-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_members',
          filter: `community_id=eq.${communityId}`
        },
        async (payload) => {
          // Refresh members list
          try {
            const { data: membersData, error: membersError } = await getCommunityMembers(communityId);
            if (!membersError && membersData) setMembers(membersData || []);
          } catch (e) {
            console.error('Realtime fetch members error', e);
          }
          // Also refresh invitations so invite modal updates when membership changes
          try {
            const { data: invitesData, error: invitesError } = await getCommunityInvitations(communityId);
            if (!invitesError && invitesData) setCommunityInvitations(invitesData || []);
          } catch (e) {
            console.error('Realtime fetch invitations error (from members sub)', e);
          }
        }
      )
      .subscribe();

    return () => {
      try { invSub.unsubscribe(); } catch (e) { /* ignore */ }
      try { membersSub.unsubscribe(); } catch (e) { /* ignore */ }
    };
  }, [communityId]);

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
        // Ensure community.member_count reflects actual members length (member_count field can be stale)
        if (membersData && communityData) {
          setCommunity(prev => ({ ...(prev || communityData), member_count: membersData.length }));
        }

        // Load pending community invitations (for admin invite modal filtering)
        try {
          const { data: invitesData, error: invitesError } = await getCommunityInvitations(communityId);
          if (!invitesError && invitesData) {
            setCommunityInvitations(invitesData || []);
          } else if (invitesError) {
            console.warn('Error loading community invitations', invitesError);
            setCommunityInvitations([]);
          }
        } catch (e) {
          console.error('Error fetching community invitations', e);
          setCommunityInvitations([]);
        }

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
      if (!error) {
        await loadCommunityData();
        Alert.alert('Success', `You've joined ${community.name}!`);
        return;
      }

      if (error.code === '23505' || (error.message && error.message.toLowerCase().includes('already'))) {
        // Already a member
        console.log('Already a member:', communityId, user.id);
        await loadCommunityData();
        Alert.alert('Info', `You're already a member of ${community.name}.`);
        return;
      }

      throw error;
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

  const openInviteModal = () => {
    setShowInviteModal(true);
    setInviteQuery('');
    setInviteResults([]);
    setSelectedUsers([]);
    // populate default user list for invite modal
    performUserSearch('');
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteQuery('');
    setInviteResults([]);
    setSelectedUsers([]);
  };

  const performUserSearch = async (q) => {
    setInviteLoading(true);
    try {
      let data = null;

      // If query is empty, fetch a default list of profiles to allow selecting without searching
      if (!q || q.trim().length === 0) {
        const { data: profilesData, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, role, user_type, avatar_url')
          .limit(50)
          .order('display_name', { ascending: true });

        if (error) {
          console.error('Error fetching profiles for invite', error);
          setInviteResults([]);
          return;
        }
        data = profilesData;
      } else {
        const { data: found, error } = await findUserByUsername(q.trim());
        if (error) {
          console.error('Invite search error', error);
          setInviteResults([]);
          return;
        }
        data = found;
      }

      if (data) {
        // Filter out current user and users who are already members
        const filteredUsers = data.filter(u => 
          u.id !== user.id && 
          !members.some(member => member.user?.id === u.id) &&
          !communityInvitations.some(inv => inv.invited_user?.id === u.id)
        );
        setInviteResults(filteredUsers);
      } else {
        setInviteResults([]);
      }
    } catch (e) {
      console.error('Error searching users for invite', e);
      setInviteResults([]);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSearchChange = (text) => {
    setInviteQuery(text);
    
    // Debounce search
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    setSearchTimeout(setTimeout(() => {
      performUserSearch(text);
    }, 500));
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSendInvites = async () => {
    if (selectedUsers.length === 0 || !community) return;
    
    try {
      setInviteLoading(true);
      
      const invitations = selectedUsers.map(u => ({
        communityId: community.id,
        invitedUserId: u.id,
        invitedById: user.id,
        role: inviteRole
      }));

      // Send invitations one by one
      const results = [];
      for (const invitation of invitations) {
        try {
          const { data, error } = await createCommunityInvitation(invitation);
          if (!error) {
            results.push({ success: true, user: invitation.invitedUserId });
          } else {
            results.push({ success: false, user: invitation.invitedUserId, error });
          }
        } catch (e) {
          results.push({ success: false, user: invitation.invitedUserId, error: e });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      let message = '';
      if (successful > 0) {
        message += `Successfully sent ${successful} invitation${successful > 1 ? 's' : ''}.`;
      }
      if (failed > 0) {
        message += ` ${failed} invitation${failed > 1 ? 's' : ''} failed to send.`;
      }

      Alert.alert('Invitations Sent', message);
      closeInviteModal();
    } catch (e) {
      console.error('Error sending invitations', e);
      Alert.alert('Error', 'Failed to send invitations.');
    } finally {
      setInviteLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmation('');
  };

  const handleCreatePost = () => {
    navigation.navigate('CreateCommunityPost', { 
      communityId, 
      communityName: community?.name,
      onPostCreated: () => {
        console.log('CommunityDetailScreen: onPostCreated callback invoked');
        setTimeout(() => loadCommunityData(), 100);
        setTimeout(() => loadCommunityData(), 600);
      }
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
    const iconSize = isSmall ? 12 : 14;
    const fontSize = isSmall ? 9 : 11;
    const padding = isSmall ? 4 : 6;

    return (
      <View style={[
        styles.badgeContainer,
        { 
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          paddingHorizontal: padding,
          paddingVertical: padding - 1,
          borderRadius: 6
        }
      ]}>
        <Ionicons name={config.icon} size={iconSize} color={config.color} />
        <Text style={[
          styles.badgeText, 
          { 
            color: config.color, 
            fontSize: fontSize,
            marginLeft: 3
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
          {item.user?.avatar_url ? (
            <Image
              source={{ uri: item.user.avatar_url }}
              style={styles.memberAvatarImage}
            />
          ) : (
            <Ionicons name="person" size={16} color="rgba(255,255,255,0.6)" />
          )}
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
          <Ionicons name="shield-checkmark" size={14} color="#4CAF50" />
        )}
      </View>
    );
  };

  // Render post item
  const renderPostItem = ({ item }) => (
    <CommunityPostCard post={item} userRole={community?.userRole || 'student'} onInteraction={(postId, field, newCount) => {
      console.log('CommunityDetailScreen: post interaction', postId, field, newCount);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, [field]: newCount } : p));
    }} />
  );

  // Render user search result item
  const renderUserItem = ({ item }) => {
    const isSelected = selectedUsers.some(u => u.id === item.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.userItem,
          isSelected && styles.userItemSelected
        ]}
        onPress={() => toggleUserSelection(item)}
      >
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            {item.avatar_url ? (
              <Image
                source={{ uri: item.avatar_url }}
                style={styles.userAvatarImage}
              />
            ) : (
              <Ionicons name="person" size={20} color="rgba(255,255,255,0.6)" />
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {item.display_name || item.username}
            </Text>
            <Text style={styles.userRole}>
              {item.user_type || item.role || 'User'}
            </Text>
          </View>
        </View>
        <View style={[
          styles.checkbox,
          isSelected && styles.checkboxSelected
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color={colors.white} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
            <Ionicons name="warning" size={28} color="#FF6B6B" />
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
                  <Ionicons name="trash" size={16} color={colors.white} />
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
          <Ionicons name="people" size={40} color="#4ECDC4" />
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
          <Ionicons name="alert-circle" size={40} color="#FF6B6B" />
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
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {community.name}
        </Text>
        {/* Removed header delete icon to make deletion less accessible */}
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
          <View style={[styles.communityIcon, { backgroundColor: `${categoryConfig.color}15` }]}>
            <Ionicons name={categoryConfig.icon} size={28} color={categoryConfig.color} />
          </View>
          
          <View style={styles.communityInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.communityName}>{community.name}</Text>
              <View style={styles.badgeRow}>
                {community.is_featured && <ProfessionalBadge type="featured" size="small" />}
                {community.is_official && <ProfessionalBadge type="official" size="small" />}
                {community.isAdmin && <ProfessionalBadge type="verified" size="small" />}
              </View>
            </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={styles.communityCategory}>
              {community.category.charAt(0).toUpperCase() + community.category.slice(1)} Community
                        </Text>
                        {community.isMember && (
                          <View style={styles.joinedSmall}>
                            <Text style={styles.joinedSmallText}>Joined</Text>
                          </View>
                        )}
                      </View>
            <View style={styles.communityStats}>
              <View style={styles.stat}>
                <Ionicons name="people" size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.statText}>{community.member_count} members</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name={community.privacy === 'public' ? 'globe' : 'lock-closed'} size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.statText}>
                  {community.privacy === 'public' ? 'Public' : 'Private'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons: Joined label above, Create Post + Leave side-by-side */}
        {community.isMember ? (
          <>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleCreatePost}
              >
                <Ionicons name="create-outline" size={18} color={colors.white} />
                <Text style={styles.primaryButtonText}>Create Post</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.leaveButtonRed]}
                onPress={handleLeaveCommunity}
              >
                <Ionicons name="exit-outline" size={18} color={colors.white} />
                <Text style={[styles.leaveButtonTextWhite]}>Leave</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleJoinCommunity}
            >
              <Ionicons name="person-add" size={18} color={colors.white} />
              <Text style={styles.primaryButtonText}>Join Community</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Admin Actions */}
        {community.isAdmin && (
          <View style={styles.adminSection}>
            <Text style={styles.adminTitle}>Admin Actions</Text>
            <TouchableOpacity 
              style={styles.adminInviteButton}
              onPress={openInviteModal}
            >
              <Ionicons name="person-add-outline" size={18} color="#4ECDC4" />
              <Text style={styles.adminInviteText}>Invite Members</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.adminDeleteButton}
              onPress={openDeleteModal}
            >
              <Ionicons name="trash-bin" size={18} color="#FF6B6B" />
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
                <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                  {new Date(community.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.infoLabel}>Max Members</Text>
                <Text style={styles.infoValue}>{community.max_members}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="lock-closed-outline" size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.infoLabel}>Privacy</Text>
                <Text style={styles.infoValue}>
                  {community.privacy === 'public' ? 'Public' : 'Private'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name={categoryConfig.icon} size={14} color="rgba(255,255,255,0.6)" />
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
                contentContainerStyle={styles.postsList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={40} color="rgba(255,255,255,0.3)" />
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
      
      {/* Invite Members Modal */}
      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeInviteModal}
      >
        <View style={styles.inviteModalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inviteModalContent}>
            <View style={styles.modalInner}>
              <View style={styles.modalHeader}>
              <Ionicons name="person-add" size={28} color="#4ECDC4" />
              <Text style={styles.modalTitle}>Invite Members</Text>
              <Text style={styles.modalSubtitle}>Search users and select multiple to invite</Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchSection}>
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
              <TextInput
                placeholder="Search by username..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={inviteQuery}
                onChangeText={handleSearchChange}
                style={styles.searchInput}
                autoCapitalize="none"
              />
            </View>

            {/* Role Selection */}
            <View style={styles.roleSection}>
              <Text style={styles.roleLabel}>Invite as:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity 
                  style={[styles.roleButton, inviteRole === 'member' && styles.roleButtonActive]}
                  onPress={() => setInviteRole('member')}
                >
                  <Text style={[styles.roleButtonText, inviteRole === 'member' && styles.roleButtonTextActive]}>
                    Member
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.roleButton, inviteRole === 'admin' && styles.roleButtonActive]}
                  onPress={() => setInviteRole('admin')}
                >
                  <Text style={[styles.roleButtonText, inviteRole === 'admin' && styles.roleButtonTextActive]}>
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Selected Users Count */}
              {selectedUsers.length > 0 && (
                <View style={styles.selectedCount}>
                  <Text style={styles.selectedCountText}>
                    {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                  </Text>
                </View>
              )}

              {/* Users List */}
              <View style={styles.usersListContainer}>
              {inviteLoading ? (
                <View style={styles.loadingState}>
                  <Text style={styles.loadingText}>Searching users...</Text>
                </View>
              ) : inviteResults.length === 0 && inviteQuery ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={40} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyStateText}>No users found</Text>
                </View>
              ) : (
                <FlatList
                  data={inviteResults}
                  renderItem={renderUserItem}
                  keyExtractor={(item) => item.id}
                  style={styles.usersList}
                  contentContainerStyle={styles.usersListContent}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={closeInviteModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.primaryButton,
                  (selectedUsers.length === 0 || inviteLoading) && styles.buttonDisabled
                ]} 
                onPress={handleSendInvites}
                disabled={selectedUsers.length === 0 || inviteLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {inviteLoading ? 'Sending...' : `Invite (${selectedUsers.length})`}
                </Text>
              </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
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
    backgroundColor: colors.homeBackground,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.homeBackground,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.homeBackground,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  deleteHeaderButton: {
    padding: 6,
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  communityHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  communityIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  communityInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  communityName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  communityCategory: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  communityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.6)',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    letterSpacing: 0.2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#4ECDC4',
  },
  joinedBadge: {
    backgroundColor: '#FF8C00',
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  primaryButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#FF6B6B',
  },
  /* New layout styles for joined + action row */
  joinedRow: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  joinedBadgeCentered: {
    alignSelf: 'center',
  },
  joinedText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  leaveButtonStyle: {
    borderColor: 'rgba(255,255,255,0.12)'
  },
  leaveButtonText: {
    color: '#FF8C00'
  },
  adminSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  adminTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 8,
  },
  adminDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  adminDeleteText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#FF6B6B',
  },
  adminInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78,205,196,0.08)',
    borderWidth: 1,
    borderColor: '#4ECDC4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
    marginBottom: 8,
  },
  adminInviteText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#4ECDC4',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4ECDC4',
  },
  tabText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.6)',
  },
  tabTextActive: {
    color: '#4ECDC4',
    fontFamily: fonts.semiBold,
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: 20,
  },
  rules: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
    textAlign: 'center',
  },
  postsList: {
    gap: 8,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  membersCount: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  viewAllText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#4ECDC4',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  memberAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 11,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.5)',
  },
  bottomSpacer: {
    height: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  inviteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 60,
  },
  modalContent: {
    backgroundColor: colors.homeBackground,
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inviteModalContent: {
    backgroundColor: colors.homeBackground,
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    height: '78%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: '#4ECDC4',
    marginTop: 10,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  warningSection: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
    marginBottom: 20,
  },
  warningText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 10,
    textAlign: 'center',
  },
  communityNameHighlight: {
    color: '#FF6B6B',
    fontFamily: fonts.bold,
  },
  warningDetails: {
    gap: 6,
  },
  warningDetail: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.7)',
  },
  confirmationSection: {
    marginBottom: 20,
  },
  confirmationLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmationWord: {
    color: '#FF6B6B',
    fontFamily: fonts.bold,
  },
  confirmationInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fonts.normal,
    color: colors.white,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  deleteButtonDisabled: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(78, 205, 196, 0.3)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  deleteButtonText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  // Invite Modal Styles
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.normal,
    color: colors.white,
    paddingVertical: 12,
  },
  roleSection: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderColor: '#4ECDC4',
  },
  roleButtonText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.7)',
  },
  roleButtonTextActive: {
    color: '#4ECDC4',
    fontFamily: fonts.semiBold,
  },
  /* small joined badge near title */
  joinedSmall: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 6,
    alignSelf: 'flex-start'
  },
  joinedSmallText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  /* leave button red style */
  leaveButtonRed: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  leaveButtonTextWhite: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  selectedCount: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  selectedCountText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#4ECDC4',
  },
  usersListContainer: {
    flex: 1,
    minHeight: 150,
    maxHeight: '60%',
    marginBottom: 16,
    overflow: 'hidden',
  },
  usersList: {
    flex: 1,
  },
  usersListContent: {
    paddingBottom: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  userItemSelected: {
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
    borderRadius: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 2,
  },
  userRole: {
    fontSize: 11,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.5)',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});