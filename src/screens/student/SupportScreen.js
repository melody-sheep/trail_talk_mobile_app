// src/screens/student/SupportScreen.js
import React, { useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Animated,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';

export default function SupportScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState({});
  const [showFeatured, setShowFeatured] = useState(true); // Dropdown state
  const { user } = useContext(UserContext);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  // Calculate header animation values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [160, 80],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const collapsedTitleOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const searchSectionTranslateY = scrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });

  const categories = [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'faq', label: 'FAQ', icon: 'help-circle-outline' },
    { id: 'reporting', label: 'Reporting', icon: 'flag-outline' },
    { id: 'resources', label: 'Resources', icon: 'business-outline' },
    { id: 'volunteers', label: 'Volunteers', icon: 'heart-outline' }
  ];

  // Mock data for support content - USTP Specific
  const [supportContent, setSupportContent] = useState([
    // FAQ Items - READ ONLY
    {
      id: 'faq1',
      category: 'faq',
      title: 'How to Report Inappropriate Content',
      description: 'Learn how to flag posts or comments that violate community guidelines.',
      content: 'To report a post:\n1. Tap the three dots on the post\n2. Select "Report Post"\n3. Choose the reason for reporting\n4. Submit your report\n\nOur USTP moderation team will review within 24 hours.',
      icon: 'flag',
      iconColor: '#FF6B6B',
      emergency: false,
      lastUpdated: '2024-01-15',
      updatedBy: 'USTP Admin',
      editable: false,
      isOfficial: true // Mark as official content
    },
    {
      id: 'faq2',
      category: 'faq', 
      title: 'How to Find Support Groups',
      description: 'Discover and explore campus support communities.',
      content: 'Support Groups Available:\n• Mental Health Support\n• Academic Success\n• International Students\n• LGBTQ+ Community\n• First-Generation Students\n\nTap "Find Support" below to explore.',
      icon: 'search',
      iconColor: '#4ECDC4',
      emergency: false,
      lastUpdated: '2024-01-10',
      updatedBy: 'Counseling Center',
      editable: false,
      isOfficial: true
    },

    // Reporting Items - READ ONLY
    {
      id: 'report1',
      category: 'reporting',
      title: 'Emergency Reporting',
      description: 'Immediate assistance for urgent situations.',
      content: 'For immediate danger:\n• USTP Campus Security: (088) 123-4567\n• Emergency Services: 911\n• Crisis Hotline: 988\n\nAvailable 24/7 for urgent matters.',
      icon: 'warning',
      iconColor: '#FF6B6B',
      emergency: true,
      lastUpdated: '2024-01-12',
      updatedBy: 'Campus Security',
      editable: false,
      isOfficial: true
    },

    // Resource Items - EDITABLE by verified users
    {
      id: 'resource1',
      category: 'resources',
      title: 'USTP Counseling Services',
      description: 'Professional mental health support.',
      content: 'Services Offered:\n• Individual therapy\n• Group sessions\n• Crisis intervention\n• Referrals to specialists\n\nLocation: USTP Student Wellness Center',
      icon: 'medical',
      iconColor: '#45B7D1',
      emergency: false,
      lastUpdated: '2024-01-14',
      updatedBy: 'Counseling Center',
      editable: true
    },
    {
      id: 'resource2',
      category: 'resources',
      title: 'Self-Help Resources',
      description: 'Tools and materials for self-care.',
      content: 'Available Resources:\n• Meditation guides\n• Stress management\n• Sleep improvement\n• Mindfulness exercises\n• Digital wellness tools',
      icon: 'build',
      iconColor: '#FFA726',
      emergency: false,
      lastUpdated: '2024-01-07',
      updatedBy: 'Wellness Committee',
      editable: true
    },

    // Volunteer Items - EDITABLE by verified users
    {
      id: 'volunteer1',
      category: 'volunteers',
      title: 'Peer Support Volunteers',
      description: 'Trained USTP student volunteers ready to help.',
      content: 'Our volunteers:\n• Complete 20-hour training\n• Maintain confidentiality\n• Provide empathetic listening\n• Connect you to resources\n\nAvailable: Mon-Fri, 9AM-5PM',
      icon: 'hand-left',
      iconColor: '#4ECDC4',
      emergency: false,
      lastUpdated: '2024-01-11',
      updatedBy: 'Student Affairs',
      editable: true
    }
  ]);

  // Quick action buttons
  const quickActions = [
    { 
      id: 'report', 
      label: 'Report Content', 
      icon: 'flag-outline', 
      color: '#FF6B6B',
      action: () => navigation.navigate('ReportFlow')
    },
    { 
      id: 'find-support', 
      label: 'Find Support', 
      icon: 'search-outline', 
      color: '#4ECDC4',
      action: () => navigation.navigate('Communities', { 
        filter: 'support',
        source: 'support-page'
      })
    },
    { 
      id: 'create-community', 
      label: 'Create Group', 
      icon: 'add-circle-outline', 
      color: '#FFA726',
      action: () => navigation.navigate('CreateCommunity')
    },
    { 
      id: 'emergency', 
      label: 'Emergency', 
      icon: 'warning-outline', 
      color: '#FF6B6B',
      action: () => scrollToEmergency()
    }
  ];

  // USTP Specific Emergency contacts
  const emergencyContacts = [
    { 
      id: 'security', 
      name: 'USTP Campus Security', 
      number: '(088) 123-4567', 
      available: '24/7',
      icon: 'shield-checkmark' 
    },
    { 
      id: 'crisis', 
      name: 'Crisis Hotline', 
      number: '988', 
      available: '24/7',
      icon: 'call' 
    },
    { 
      id: 'counseling', 
      name: 'USTP Counseling', 
      number: '(088) 123-4568', 
      available: 'Mon-Fri 8AM-5PM',
      icon: 'medical' 
    }
  ];

  // Community Creation Data
  const userCommunityStats = {
    createdCommunities: user?.createdCommunities || 0,
    maxFreeCommunities: 3,
    subscription: user?.subscription || 'free',
    isVerifiedCreator: user?.isVerifiedCreator || false
  };

  // Enhanced permission checking
  const canEditSupport = user?.role === 'faculty' || user?.organization_role === 'president' || user?.organization_role === 'officer';
  
  const canEditItem = (item) => {
    return canEditSupport && item.editable;
  };

  const filteredContent = supportContent.filter(item => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleSearch = () => {
    console.log('Searching support for:', searchQuery);
  };

  const handleQuickAction = (actionId) => {
    const action = quickActions.find(a => a.id === actionId);
    if (action && action.action) {
      action.action();
    }
  };

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const scrollToEmergency = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleEditSupport = () => {
    navigation.navigate('EditSupportContent', { 
      supportContent, 
      onSave: (updatedContent) => setSupportContent(updatedContent) 
    });
  };

  const handleEditItem = (itemId) => {
    const item = supportContent.find(item => item.id === itemId);
    if (item && canEditItem(item)) {
      navigation.navigate('EditSupportContent', {
        mode: 'edit',
        item: item,
        onSave: (updatedItem) => {
          setSupportContent(prev => 
            prev.map(item => item.id === itemId ? updatedItem : item)
          );
        }
      });
    }
  };

  // ENHANCED Professional Badge Component with Shield Badge
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
      },
      emergency: {
        icon: 'warning',
        color: '#FF6B6B',
        label: 'Emergency',
        bgColor: 'rgba(255, 107, 107, 0.1)',
        borderColor: '#FF6B6B'
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

  // ENHANCED CommunityCreationSection with SINGLE FRAME LAYOUT
  const CommunityCreationSection = () => (
    <View style={styles.featuredSection}>
      {/* SINGLE FRAME HEADER with Title + Featured Label + Dropdown */}
      <TouchableOpacity 
        style={styles.featuredHeader}
        onPress={() => setShowFeatured(!showFeatured)}
        activeOpacity={0.7}
      >
        {/* LEFT: Title Text */}
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Membership Plans</Text>
        </View>
        
        {/* RIGHT: Featured Label + Dropdown Icon */}
        <View style={styles.headerRight}>
          <ProfessionalBadge type="featured" size="medium" />
          <Ionicons 
            name={showFeatured ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="rgba(255, 255, 255, 0.6)" 
            style={styles.dropdownIcon}
          />
        </View>
      </TouchableOpacity>

      {/* CONTENT that shows/hides with dropdown */}
      {showFeatured && (
        <View style={styles.featuredContent}>
          {/* Free Plan Card */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleContainer}>
                <Text style={styles.planName}>Free Plan</Text>
                <Text style={styles.planDescription}>
                  Perfect for student clubs and study groups
                </Text>
              </View>
              <View style={[
                styles.communityCount,
                userCommunityStats.createdCommunities >= userCommunityStats.maxFreeCommunities && styles.communityCountFull
              ]}>
                <Text style={styles.countText}>
                  {userCommunityStats.createdCommunities}/{userCommunityStats.maxFreeCommunities}
                </Text>
              </View>
            </View>
            
            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureItem}>Create up to 3 communities</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureItem}>Basic community features</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureItem}>Up to 50 members each</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.planButton,
                userCommunityStats.createdCommunities >= userCommunityStats.maxFreeCommunities && styles.disabledButton
              ]}
              onPress={() => navigation.navigate('CreateCommunity', { tier: 'free' })}
              disabled={userCommunityStats.createdCommunities >= userCommunityStats.maxFreeCommunities}
            >
              <Text style={styles.planButtonText}>
                {userCommunityStats.createdCommunities >= userCommunityStats.maxFreeCommunities ? 'Free Limit Reached' : 'Create Free Community'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Premium Plan Card */}
          <View style={[styles.planCard, styles.premiumCard]}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleContainer}>
                <Text style={styles.premiumPlanName}>Premium Plan</Text>
                <Text style={styles.planDescription}>
                  Advanced tools for serious community builders
                </Text>
              </View>
              <ProfessionalBadge type="verified" size="medium" />
            </View>
            
            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Unlimited communities</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Verified creator badge</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Advanced analytics</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Priority support</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Custom branding</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.premiumButton}
              onPress={() => navigation.navigate('PremiumSubscription')}
            >
              <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
              <Text style={styles.premiumButtonSubtext}>₱99/month or ₱999/year</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderCategoryChip = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        activeCategory === item.id && styles.categoryChipSelected
      ]}
      onPress={() => setActiveCategory(item.id)}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={item.icon} 
        size={16} 
        color={activeCategory === item.id ? colors.homeBackground : colors.white} 
        style={styles.categoryIcon}
      />
      <Text style={[
        styles.categoryChipText,
        activeCategory === item.id && styles.categoryChipTextSelected
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderQuickAction = ({ item }) => (
    <TouchableOpacity 
      style={[styles.quickActionButton, { backgroundColor: item.color }]}
      onPress={() => handleQuickAction(item.id)}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={item.icon} 
        size={24} 
        color={colors.white} 
        style={styles.actionIcon}
      />
      <Text style={styles.actionLabel}>{item.label}</Text>
    </TouchableOpacity>
  );

  // FIXED Support Card with proper badge hierarchy
  const renderSupportCard = ({ item }) => {
    const userCanEdit = canEditItem(item);
    
    return (
      <TouchableOpacity 
        style={[
          styles.supportCard,
          item.emergency && styles.emergencyCard
        ]}
        onPress={() => toggleExpand(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconContainer, { backgroundColor: `${item.iconColor}20` }]}>
            <Ionicons name={item.icon} size={20} color={item.iconColor} />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {/* SINGLE BADGE PER CARD - Better hierarchy */}
              {item.emergency && <ProfessionalBadge type="emergency" size="small" />}
              {!item.emergency && item.isOfficial && <ProfessionalBadge type="official" size="small" />}
            </View>
            <Text style={styles.cardDescription}>{item.description}</Text>
            {userCanEdit && (
              <Text style={styles.lastUpdated}>
                Updated: {item.lastUpdated} by {item.updatedBy}
              </Text>
            )}
          </View>
          <View style={styles.cardActions}>
            <Ionicons 
              name={expandedItems[item.id] ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="rgba(255, 255, 255, 0.6)" 
            />
            {userCanEdit && (
              <TouchableOpacity 
                style={styles.editIconButton}
                onPress={() => handleEditItem(item.id)}
              >
                <Ionicons name="create-outline" size={16} color="#4ECDC4" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {expandedItems[item.id] && (
          <View style={styles.expandedContent}>
            <Text style={styles.expandedText}>{item.content}</Text>
            {userCanEdit && (
              <TouchableOpacity 
                style={styles.editContentButton}
                onPress={() => handleEditItem(item.id)}
              >
                <Ionicons name="create-outline" size={14} color="#4ECDC4" />
                <Text style={styles.editContentText}>Edit this content</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmergencyContact = ({ item }) => (
    <View style={styles.emergencyContact}>
      <View style={styles.contactLeft}>
        <View style={styles.contactIconContainer}>
          <Ionicons name={item.icon} size={20} color="#FF6B6B" />
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactNumber}>{item.number}</Text>
          <View style={styles.contactMeta}>
            <Ionicons name="time-outline" size={12} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.contactAvailability}>{item.available}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.callButton}
        onPress={() => handleCall(item.number)}
      >
        <Ionicons name="call" size={16} color={colors.white} />
        <Text style={styles.callButtonText}>Call</Text>
      </TouchableOpacity>
    </View>
  );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      {/* Animated Header Background */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <ImageBackground 
          source={require('../../../assets/create_post_screen_icons/createpost_header_bg.png')}
          style={styles.headerBackground}
          resizeMode="cover"
        >
          <Animated.View style={[styles.headerContent, { opacity: headerTitleOpacity }]}>
            <Text style={styles.headerTitle}>Support & Resources</Text>
            <Text style={styles.headerSubtitle}>Get help when you need it</Text>
          </Animated.View>

          <Animated.View style={[styles.collapsedHeaderContent, { opacity: collapsedTitleOpacity }]}>
            <Text style={styles.collapsedHeaderTitle}>Support</Text>
            {canEditSupport && (
              <TouchableOpacity style={styles.editHeaderButton} onPress={handleEditSupport}>
                <Ionicons name="create-outline" size={16} color={colors.white} />
              </TouchableOpacity>
            )}
          </Animated.View>
        </ImageBackground>
      </Animated.View>

      {/* Sticky Search & Categories Section */}
      <Animated.View style={[styles.stickySection, { transform: [{ translateY: searchSectionTranslateY }] }]}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.6)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help topics, resources..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {canEditSupport && (
              <TouchableOpacity style={styles.quickEditButton} onPress={handleEditSupport}>
                <Ionicons name="add-circle-outline" size={22} color="#4ECDC4" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <FlatList
            data={categories}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Community Creation Section with Dropdown */}
        <CommunityCreationSection />

        {/* Quick Action Buttons - FIXED MARGIN */}
        <View style={styles.quickActionsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick Help</Text>
            {canEditSupport && (
              <TouchableOpacity style={styles.manageButton} onPress={handleEditSupport}>
                <Text style={styles.manageButtonText}>Manage Content</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={quickActions}
            renderItem={renderQuickAction}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsList}
          />
        </View>

        {/* Support Content */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderContent}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  {activeCategory === 'all' && 'All Support Resources'}
                  {activeCategory === 'faq' && 'Frequently Asked Questions'}
                  {activeCategory === 'reporting' && 'Reporting & Safety'}
                  {activeCategory === 'resources' && 'USTP Resources'}
                  {activeCategory === 'volunteers' && 'Volunteer Support'}
                </Text>
                {canEditSupport && <ProfessionalBadge type="verified" size="small" />}
              </View>
              <Text style={styles.sectionSubtitle}>
                {filteredContent.length} resources available
                {canEditSupport && ' • You can edit Resources & Volunteers'}
              </Text>
            </View>
          </View>
          
          <FlatList
            data={filteredContent}
            renderItem={renderSupportCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Emergency Contacts */}
        <View style={styles.emergencySection}>
          <View style={styles.sectionHeaderContent}>
            <View style={styles.emergencyHeader}>
              <Ionicons name="warning" size={20} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Emergency Contacts</Text>
              <ProfessionalBadge type="emergency" size="small" />
            </View>
            <Text style={styles.emergencySubtitle}>Available 24/7 for urgent situations</Text>
          </View>
          <FlatList
            data={emergencyContacts}
            renderItem={renderEmergencyContact}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
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
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  collapsedHeaderContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  collapsedHeaderTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  editHeaderButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stickySection: {
    position: 'absolute',
    top: 160,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.homeBackground,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
    marginTop: 160,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 140,
    paddingBottom: 30,
  },
  // ENHANCED Badge Styles with Shield
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
  // NEW: Enhanced Featured Section Styles
  featuredSection: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownIcon: {
    marginLeft: 4,
  },
  featuredContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  premiumCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 6,
  },
  premiumPlanName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#FFD700',
    marginBottom: 6,
  },
  planDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  communityCount: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  communityCountFull: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  countText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#4CAF50',
  },
  featuresList: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureItem: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    lineHeight: 18,
  },
  premiumFeatureItem: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
    lineHeight: 18,
  },
  planButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  planButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  premiumButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  premiumButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#000',
  },
  premiumButtonSubtext: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(0, 0, 0, 0.7)',
    marginTop: 4,
  },
  // Search and Edit Styles
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
    padding: 0,
  },
  quickEditButton: {
    padding: 4,
    marginLeft: 8,
  },
  // FIXED Section Header Styles with proper margins
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 20, // ADDED: Proper margin alignment
  },
  manageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  manageButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#4ECDC4',
  },
  quickActionsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  quickActionsList: {
    paddingHorizontal: 20, // FIXED: Now aligned with other content
    gap: 12,
  },
  quickActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
    textAlign: 'center',
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  categoriesList: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
  },
  categoryChipSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  categoryChipTextSelected: {
    color: colors.homeBackground,
    fontFamily: fonts.semiBold,
  },
  contentSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionHeaderContent: {
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  // Support Card Enhanced Styles
  supportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emergencyCard: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
    marginBottom: 6,
  },
  lastUpdated: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
  },
  cardActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  editIconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  expandedText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  editContentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    gap: 6,
  },
  editContentText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#4ECDC4',
  },
  emergencySection: {
    marginBottom: 20,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  emergencySubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
  },
  // Emergency Contact Styles
  emergencyContact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
    marginHorizontal: 20,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
  },
  contactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactAvailability: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  callButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  bottomSpacer: {
    height: 30,
  },
});