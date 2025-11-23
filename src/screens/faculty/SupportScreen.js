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
import ReportModal from '../../components/ReportModal';

export default function FacultySupportScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState({});
  const [showFeatured, setShowFeatured] = useState(true);
  // Local modal state for reporting (reuse ReportModal component)
  const [reportModalVisible, setReportModalVisible] = useState(false);
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
    // CITL / Onboarding
    {
      id: 'citl-focus',
      category: 'resources',
      title: 'CITL: Faculty Onboarding (FOCUS Online)',
      description: 'FOCUS Online — an EdApp course on USTP culture, employment, and career growth',
      content: 'Course: Faculty Onboarding and Career Upstart Seminar (FOCUS) Online\nPlatform: EdApp (USTP CITL)\nPurpose: Introduces USTP culture, policies, teaching expectations, and career development resources.\n\nContact CITL for enrollment or access instructions.',
      icon: 'school',
      iconColor: '#8B5CF6',
      emergency: false,
      lastUpdated: '2024-01-20',
      updatedBy: 'CITL',
      editable: false,
      isOfficial: true
    },
    // Research Databases / Access notes
    {
      id: 'research-dbs',
      category: 'resources',
      title: 'Research Databases — Access Notes',
      description: 'Key research resources and access information for faculty',
      content: 'ProQuest:\nUsername: PQUSTPhil\nPassword: USTPpq#21\n\nWiley Online Library:\nUsername: EAL00000170035\nPassword: Wiley12345\n\nELSEVIER ScienceDirect:\nRemote access available — download the access guide from CITL or library portal.\n\nNOTE: Credentials and remote access details are managed by the Library/CITL. Please contact CITL or the University Library to confirm current credentials or arrange IP-based access.',
      icon: 'book',
      iconColor: '#FFA726',
      emergency: false,
      lastUpdated: '2024-01-21',
      updatedBy: 'University Library / CITL',
      editable: false,
      isOfficial: true
    },
    // Instructional support
    {
      id: 'instructional-support',
      category: 'resources',
      title: 'Instructional Support & Video Guides',
      description: 'Video resources for syllabus creation, modules, and embedding narration',
      content: 'Resources:\n• How to create a course syllabus\n• Preparing modules and assessments\n• Recording narrated slides and embedding video in PowerPoint\n• Using the LMS and EdTech tools (EdApp, Moodle, etc.)\n\nContact CITL for workshops, templates, and one-on-one instructional support.',
      icon: 'videocam',
      iconColor: '#45B7D1',
      emergency: false,
      lastUpdated: '2024-01-18',
      updatedBy: 'CITL',
      editable: false,
      isOfficial: true
    },
    // Office of Student Affairs contact (also useful for faculty who coordinate student requests)
    {
      id: 'studentaffairs-cdo',
      category: 'resources',
      title: 'Office of Student Affairs — CDO (Student Affairs)',
      description: 'Student Affairs contact for document requests and student services',
      content: 'Phone: +63 926-905-3363\nEmail: studentaffairs-cdo@ustp.edu.ph\n\nServices: Good Moral Certificates, student ID updates, records assistance.\nContact this office when faculty need official student documents or verifications.',
      icon: 'business',
      iconColor: '#4ECDC4',
      emergency: false,
      lastUpdated: '2024-01-20',
      updatedBy: 'Office of Student Affairs - CDO',
      editable: false,
      isOfficial: true
    },
    // USTP Emergency Warning System (EWS)
    {
      id: 'ews',
      category: 'resources',
      title: 'USTP Emergency Warning System (EWS)',
      description: 'Color-coded alert levels and recommended actions',
      content: 'RED — Extreme / Full Emergency:\nOperations seriously impaired or halted. Multiple casualties or severe property damage possible.\nActions: Evacuate if instructed, follow IMT/security orders, seek shelter immediately.\n\nORANGE — Severe / Significant Emergency:\nSignificant damage; campus operations disrupted.\nActions: Prepare to suspend activities, follow campus advisories.\n\nYELLOW — Moderate / Active Emergency:\nLocalized incidents; campus functions continue with caution.\nActions: Monitor updates, avoid affected areas.\n\nGREEN — Normal / Monitoring:\nNo active threat; routine monitoring.\nActions: Continue normal operations and report hazards.',
      icon: 'warning',
      iconColor: '#FF6B6B',
      emergency: true,
      lastUpdated: '2024-01-18',
      updatedBy: 'USTP System',
      editable: false,
      isOfficial: true
    },
    // USTP System Campuses
    {
      id: 'ustp-campuses',
      category: 'resources',
      title: 'USTP System Campuses',
      description: 'Main and satellite campuses across the USTP system',
      content: 'Main Campus: USTP Alubijid\nMajor Campuses: Cagayan de Oro, Claveria, Villanueva\nSatellite Campuses: Balubal, Jasaan, Oroquieta, Panaon\n\nFaculty can contact local campus administration for localized protocols and support.',
      icon: 'map',
      iconColor: '#FFA726',
      emergency: false,
      lastUpdated: '2024-01-18',
      updatedBy: 'USTP System',
      editable: false,
      isOfficial: true
    },
    // Incident Management Team (IMT)
    {
      id: 'imt',
      category: 'resources',
      title: 'Incident Management Team (IMT)',
      description: 'Emergency coordination team for USTP',
      content: 'Chairperson: Vice President for Administration and Legal Affairs – USTP System\nCo-Chairperson: Director for Disaster Risk Reduction and Management Office – USTP System\nMembers include: Chief of Security and Safety (each campus), Security & Safety Coordinator – USTP System, Incident Commander (each major campus)\n\nIMT issues official instructions during emergencies and coordinates multi-campus responses.',
      icon: 'people',
      iconColor: '#8B5CF6',
      emergency: false,
      lastUpdated: '2024-01-18',
      updatedBy: 'USTP System',
      editable: false,
      isOfficial: true
    }
  ]);

  // Quick action buttons for faculty
  const quickActions = [
    { 
      id: 'report', 
      label: 'Report Concern', 
      icon: 'flag-outline', 
      color: '#FF6B6B',
      action: () => setReportModalVisible(true)
    },
    { 
      id: 'resources', 
      label: 'Faculty Resources', 
      icon: 'library-outline', 
      color: '#4ECDC4',
      action: () => {
        // reuse the support page design: filter to resources
        setActiveCategory('resources');
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    },
    { 
      id: 'community', 
      label: 'Faculty Forum', 
      icon: 'people-circle-outline', 
      color: '#45B7D1',
      action: () => navigation.navigate('FacultyCommunity', { 
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

  // Faculty Community Stats
  const facultyCommunityStats = {
    createdCommunities: user?.createdCommunities || 0,
    maxFreeCommunities: 5,
    subscription: user?.subscription || 'free',
    isVerifiedCreator: user?.isVerifiedCreator || false
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
          <ProfessionalBadge type="faculty" size="small" />
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
              <ProfessionalBadge type="verified" size="small" />
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
                <Text style={styles.premiumFeatureItem}>Priority faculty support</Text>
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
        <ReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          postId={null}
          onSubmitted={() => { setReportModalVisible(false); }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles: copied from student SupportScreen for compact header and sections
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
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  collapsedHeaderContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedHeaderTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
  },
  editHeaderButton: {
    padding: 6,
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
    marginTop: 200,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 70,
    paddingBottom: 20,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    letterSpacing: 0.3,
    fontSize: 11,
  },
  featuredSection: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownIcon: {
    marginLeft: 4,
  },
  featuredContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 12,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  premiumCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  premiumPlanName: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#FFD700',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },
  communityCount: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  communityCountFull: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  countText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#4CAF50',
  },
  featuresList: {
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureItem: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
    lineHeight: 16,
  },
  premiumFeatureItem: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 6,
    lineHeight: 16,
  },
  planButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  planButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  premiumButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  premiumButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#000',
  },
  premiumButtonSubtext: {
    fontSize: 11,
    fontFamily: fonts.normal,
    color: 'rgba(0, 0, 0, 0.7)',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.normal,
    color: colors.white,
    padding: 0,
  },
  quickEditButton: {
    padding: 2,
    marginLeft: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  manageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  manageButtonText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#4ECDC4',
  },
  quickActionsSection: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'left',
    marginLeft: 0,
  },
  quickActionsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 90,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionIcon: {
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.white,
    textAlign: 'center',
  },
  categoriesSection: {
    paddingTop: 6,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  categoriesList: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 90,
  },
  categoryChipSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.9)',
  },
  categoryChipTextSelected: {
    color: colors.homeBackground,
    fontFamily: fonts.semiBold,
  },
  contentSection: {
    marginBottom: 18,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderContent: {
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  supportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    minHeight: 70,
  },
  emergencyCard: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  cardDescription: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 11,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
  },
  cardActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  editIconButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  expandedContent: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  expandedText: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  editContentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    gap: 4,
  },
  editContentText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#4ECDC4',
  },
  emergencySection: {
    marginBottom: 12,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  emergencySubtitle: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 10,
  },
  emergencyContact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 8,
    marginHorizontal: 16,
    minHeight: 60,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  contactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactAvailability: {
    fontSize: 11,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    minWidth: 60,
    justifyContent: 'center',
  },
  callButtonText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  bottomSpacer: {
    height: 18,
  },
});