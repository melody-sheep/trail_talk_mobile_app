// src/screens/faculty/SupportScreen.js
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

export default function FacultySupportScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState({});
  const [showFeatured, setShowFeatured] = useState(true);
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
    { id: 'faculty', label: 'Faculty', icon: 'school-outline' },
    { id: 'support', label: 'Support', icon: 'headset-outline' }
  ];

  // Faculty-specific support content
  const [supportContent, setSupportContent] = useState([
    // FAQ Items - READ ONLY
    {
      id: 'faq1',
      category: 'faq',
      title: 'Faculty Reporting Guidelines',
      description: 'How to handle student concerns and reports professionally',
      content: 'Faculty Reporting Process:\n1. Document concerns with specific details and evidence\n2. Consult with department chair when appropriate\n3. Use official USTP reporting channels\n4. Maintain student confidentiality and privacy\n5. Follow up with relevant administrative offices\n6. Document all actions taken',
      icon: 'document-text',
      iconColor: '#4ECDC4',
      emergency: false,
      lastUpdated: '2024-01-15',
      updatedBy: 'USTP Administration',
      editable: false,
      isOfficial: true
    },
    {
      id: 'faq2',
      category: 'faq', 
      title: 'Student Support Referrals',
      description: 'Where to refer students for different types of support',
      content: 'Referral Resources:\n• Academic Issues: Academic Success Center\n• Mental Health: USTP Counseling Services\n• Financial Concerns: Financial Aid Office\n• Disability Accommodations: Accessibility Office\n• Career Guidance: Career Development Center\n• International Students: International Office\n• Housing Issues: Student Housing Office',
      icon: 'people',
      iconColor: '#45B7D1',
      emergency: false,
      lastUpdated: '2024-01-10',
      updatedBy: 'Student Affairs',
      editable: false,
      isOfficial: true
    },
    {
      id: 'faq3',
      category: 'faq',
      title: 'Platform Usage Guidelines',
      description: 'Best practices for faculty using TrailTalk',
      content: 'Faculty Guidelines:\n• Maintain professional boundaries at all times\n• Use appropriate communication channels\n• Report technical issues promptly to IT\n• Respect student privacy and anonymity settings\n• Provide constructive, professional feedback\n• Follow USTP code of conduct and policies',
      icon: 'shield-checkmark',
      iconColor: '#96CEB4',
      emergency: false,
      lastUpdated: '2024-01-12',
      updatedBy: 'IT Department',
      editable: false,
      isOfficial: true
    },

    // Reporting Items - READ ONLY
    {
      id: 'report1',
      category: 'reporting',
      title: 'Emergency Situations Protocol',
      description: 'Immediate response for critical student situations',
      content: 'Emergency Protocols:\n• USTP Campus Security: (088) 123-4567\n• Student Crisis Intervention Team: (088) 123-4569\n• Title IX Office: (088) 123-4570\n• Faculty Emergency Hotline: (088) 123-4572\n\nAlways document concerns and follow established protocols.',
      icon: 'warning',
      iconColor: '#FF6B6B',
      emergency: true,
      lastUpdated: '2024-01-14',
      updatedBy: 'Campus Security',
      editable: false,
      isOfficial: true
    },
    {
      id: 'report2',
      category: 'reporting',
      title: 'Academic Integrity Reports',
      description: 'Reporting academic dishonesty concerns',
      content: 'Academic Integrity Process:\n1. Gather concrete evidence and documentation\n2. Consult with department chair for guidance\n3. Submit official report to Academic Affairs Office\n4. Participate in academic integrity hearings if required\n5. Maintain strict student privacy throughout process\n6. Follow USTP academic integrity policy guidelines',
      icon: 'school',
      iconColor: '#FFA726',
      emergency: false,
      lastUpdated: '2024-01-08',
      updatedBy: 'Academic Affairs',
      editable: false,
      isOfficial: true
    },

    // Resource Items - EDITABLE by faculty
    {
      id: 'resource1',
      category: 'resources',
      title: 'Faculty Development Resources',
      description: 'Professional growth and teaching enhancement resources',
      content: 'Available Resources:\n• Center for Teaching Excellence workshops\n• Faculty Mentoring Program sessions\n• Research Support Services consultations\n• Technology Training Workshops schedule\n• Grant Writing Assistance programs\n• Professional Development funding opportunities',
      icon: 'book',
      iconColor: '#45B7D1',
      emergency: false,
      lastUpdated: '2024-01-11',
      updatedBy: 'Faculty Development',
      editable: true
    },
    {
      id: 'resource2',
      category: 'resources',
      title: 'Faculty Wellness Support',
      description: 'Resources for faculty mental health and work-life balance',
      content: 'Faculty Wellness Programs:\n• Employee Assistance Program (confidential)\n• Mindfulness and Meditation Sessions\n• Work-Life Balance Workshops\n• Faculty Peer Support Network\n• Health and Wellness Center services\n• Stress management resources and tools',
      icon: 'heart',
      iconColor: '#FF6B6B',
      emergency: false,
      lastUpdated: '2024-01-07',
      updatedBy: 'Wellness Committee',
      editable: true
    },

    // Faculty Specific Items - EDITABLE by faculty
    {
      id: 'faculty1',
      category: 'faculty',
      title: 'Faculty Community Forum',
      description: 'Connect with fellow USTP faculty members',
      content: 'Faculty Community Features:\n• Department-specific discussion channels\n• Teaching strategy sharing and collaboration\n• Research partnership opportunities\n• Policy updates and important announcements\n• Social events and networking opportunities\n• Cross-disciplinary project discussions',
      icon: 'people-circle',
      iconColor: '#4ECDC4',
      emergency: false,
      lastUpdated: '2024-01-13',
      updatedBy: 'Faculty Senate',
      editable: true
    },
    {
      id: 'faculty2',
      category: 'faculty',
      title: 'Administrative Support Contacts',
      description: 'Key department and administrative resources',
      content: 'Administrative Resources:\n• Department Chairs directory\n• Dean\'s Office contact information\n• HR Services and benefits\n• IT Support and help desk\n• Facilities Management requests\n• Research Administration office\n• Budget and Finance contacts',
      icon: 'business',
      iconColor: '#96CEB4',
      emergency: false,
      lastUpdated: '2024-01-09',
      updatedBy: 'Administration',
      editable: true
    },

    // Support Items - EDITABLE by faculty
    {
      id: 'support1',
      category: 'support',
      title: 'Technical Support Services',
      description: 'IT help and platform technical assistance',
      content: 'Technical Support Channels:\n• IT Help Desk: help@ustp.edu.ph\n• Platform Support: support@trailtalk.ustp.edu.ph\n• Emergency IT Line: (088) 123-4571\n• Online Knowledge Base and tutorials\n• Classroom technology support\n• Software and tool assistance',
      icon: 'desktop',
      iconColor: '#45B7D1',
      emergency: false,
      lastUpdated: '2024-01-06',
      updatedBy: 'IT Department',
      editable: true
    },
    {
      id: 'support2',
      category: 'support',
      title: 'Teaching Support Services',
      description: 'Resources for course development and instructional excellence',
      content: 'Teaching Support Services:\n• Course Design Consultation\n• Classroom Technology Training\n• Assessment Development support\n• Online Teaching Resources library\n• Instructional Design assistance\n• Teaching innovation grants\n• Student evaluation analysis',
      icon: 'ribbon',
      iconColor: '#FFA726',
      emergency: false,
      lastUpdated: '2024-01-05',
      updatedBy: 'Teaching Excellence',
      editable: true
    }
  ]);

  // Quick action buttons for faculty
  const quickActions = [
    { 
      id: 'report', 
      label: 'Report Concern', 
      icon: 'flag-outline', 
      color: '#FF6B6B',
      action: () => navigation.navigate('FacultyReportFlow')
    },
    { 
      id: 'resources', 
      label: 'Faculty Resources', 
      icon: 'library-outline', 
      color: '#4ECDC4',
      action: () => navigation.navigate('FacultyResources')
    },
    { 
      id: 'community', 
      label: 'Faculty Forum', 
      icon: 'people-circle-outline', 
      color: '#45B7D1',
      action: () => navigation.navigate('Communities', { 
        filter: 'faculty',
        source: 'faculty-support'
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

  // USTP Faculty Emergency contacts
  const emergencyContacts = [
    { 
      id: 'security', 
      name: 'USTP Campus Security', 
      number: '(088) 123-4567', 
      available: '24/7',
      icon: 'shield-checkmark' 
    },
    { 
      id: 'faculty-emergency', 
      name: 'Faculty Emergency Line', 
      number: '(088) 123-4572', 
      available: '24/7',
      icon: 'call' 
    },
    { 
      id: 'it-emergency', 
      name: 'IT Emergency Support', 
      number: '(088) 123-4571', 
      available: '24/7',
      icon: 'desktop' 
    },
    { 
      id: 'crisis-team', 
      name: 'Crisis Intervention Team', 
      number: '(088) 123-4569', 
      available: 'Mon-Fri 8AM-5PM',
      icon: 'medical' 
    }
  ];

  // Faculty Community Stats
  const facultyCommunityStats = {
    createdCommunities: user?.createdCommunities || 0,
    maxFreeCommunities: 5, // Faculty get more free communities
    subscription: user?.subscription || 'free',
    isVerifiedCreator: user?.isVerifiedCreator || true // Faculty are automatically verified
  };

  // Enhanced permission checking for faculty
  const canEditSupport = user?.role === 'faculty' || user?.user_type === 'faculty';
  
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
    console.log('Searching faculty support for:', searchQuery);
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
    navigation.navigate('EditFacultySupportContent', { 
      supportContent, 
      onSave: (updatedContent) => setSupportContent(updatedContent) 
    });
  };

  const handleEditItem = (itemId) => {
    const item = supportContent.find(item => item.id === itemId);
    if (item && canEditItem(item)) {
      navigation.navigate('EditFacultySupportContent', {
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

  // Professional Badge Component with Shield Badge
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
      },
      faculty: {
        icon: 'school',
        color: '#8B5CF6',
        label: 'Faculty',
        bgColor: 'rgba(139, 92, 246, 0.1)',
        borderColor: '#8B5CF6'
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

  // Faculty Community Creation Section
  const FacultyCommunitySection = () => (
    <View style={styles.featuredSection}>
      {/* SINGLE FRAME HEADER with Title + Featured Label + Dropdown */}
      <TouchableOpacity 
        style={styles.featuredHeader}
        onPress={() => setShowFeatured(!showFeatured)}
        activeOpacity={0.7}
      >
        {/* LEFT: Title Text */}
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Faculty Community Plans</Text>
        </View>
        
        {/* RIGHT: Featured Label + Dropdown Icon */}
        <View style={styles.headerRight}>
          <ProfessionalBadge type="faculty" size="medium" />
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
          {/* Faculty Plan Card */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleContainer}>
                <Text style={styles.planName}>Faculty Plan</Text>
                <Text style={styles.planDescription}>
                  Enhanced features for USTP faculty members
                </Text>
              </View>
              <View style={[
                styles.communityCount,
                facultyCommunityStats.createdCommunities >= facultyCommunityStats.maxFreeCommunities && styles.communityCountFull
              ]}>
                <Text style={styles.countText}>
                  {facultyCommunityStats.createdCommunities}/{facultyCommunityStats.maxFreeCommunities}
                </Text>
              </View>
            </View>
            
            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureItem}>Create up to 5 academic communities</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureItem}>Faculty verification badge</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureItem}>Up to 200 members per community</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureItem}>Academic collaboration tools</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.planButton,
                facultyCommunityStats.createdCommunities >= facultyCommunityStats.maxFreeCommunities && styles.disabledButton
              ]}
              onPress={() => navigation.navigate('CreateCommunity', { tier: 'faculty' })}
              disabled={facultyCommunityStats.createdCommunities >= facultyCommunityStats.maxFreeCommunities}
            >
              <Text style={styles.planButtonText}>
                {facultyCommunityStats.createdCommunities >= facultyCommunityStats.maxFreeCommunities ? 'Faculty Limit Reached' : 'Create Faculty Community'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Department Plan Card */}
          <View style={[styles.planCard, styles.premiumCard]}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleContainer}>
                <Text style={styles.premiumPlanName}>Department Plan</Text>
                <Text style={styles.planDescription}>
                  Advanced tools for department-wide communities
                </Text>
              </View>
              <ProfessionalBadge type="verified" size="medium" />
            </View>
            
            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Unlimited department communities</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Department admin controls</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Advanced analytics dashboard</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Priority faculty support</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.premiumFeatureItem}>Custom department branding</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.premiumButton}
              onPress={() => navigation.navigate('DepartmentSubscription')}
            >
              <Text style={styles.premiumButtonText}>Request Department Plan</Text>
              <Text style={styles.premiumButtonSubtext}>Contact Administration</Text>
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

  // Support Card with proper badge hierarchy
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
              {item.category === 'faculty' && <ProfessionalBadge type="faculty" size="small" />}
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
            <Text style={styles.headerTitle}>Faculty Support & Resources</Text>
            <Text style={styles.headerSubtitle}>Professional resources and assistance for USTP faculty</Text>
          </Animated.View>

          <Animated.View style={[styles.collapsedHeaderContent, { opacity: collapsedTitleOpacity }]}>
            <Text style={styles.collapsedHeaderTitle}>Faculty Support</Text>
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
              placeholder="Search faculty resources, guidelines, contacts..."
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
        {/* Faculty Community Creation Section with Dropdown */}
        <FacultyCommunitySection />

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
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
                  {activeCategory === 'all' && 'All Faculty Resources'}
                  {activeCategory === 'faq' && 'Frequently Asked Questions'}
                  {activeCategory === 'reporting' && 'Reporting & Protocols'}
                  {activeCategory === 'resources' && 'Faculty Resources'}
                  {activeCategory === 'faculty' && 'Faculty Community'}
                  {activeCategory === 'support' && 'Technical Support'}
                </Text>
                {canEditSupport && <ProfessionalBadge type="faculty" size="small" />}
              </View>
              <Text style={styles.sectionSubtitle}>
                {filteredContent.length} resources available
                {canEditSupport && ' • You can edit Resources, Faculty & Support content'}
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
            <Text style={styles.emergencySubtitle}>Available for urgent faculty situations and student crises</Text>
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
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
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
    color: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  premiumButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  premiumButtonSubtext: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
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
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
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