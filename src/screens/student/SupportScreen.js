// src/screens/student/SupportScreen.js (SIMPLIFIED VERSION)
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
import { INITIAL_IMPACT_COUNTERS } from '../../constants/donationPaths';

export default function SupportScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState({});
  const [communityImpact, setCommunityImpact] = useState(INITIAL_IMPACT_COUNTERS);
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
    { id: 'all', label: 'All', icon: 'grid-outline', color: '#8B5CF6' },
    { id: 'faq', label: 'FAQ', icon: 'help-circle-outline', color: '#38BDF8' },
    { id: 'reporting', label: 'Reporting', icon: 'flag-outline', color: '#FF6B6B' },
    { id: 'resources', label: 'Resources', icon: 'business-outline', color: '#4ECDC4' },
    { id: 'volunteers', label: 'Volunteers', icon: 'heart-outline', color: '#FFA726' }
  ];

  // USTP Specific Support Content
  const [supportContent, setSupportContent] = useState([
    // FAQ Category
    {
      id: 'faq1',
      title: 'How do I create a community?',
      description: 'Creating study groups, clubs, or interest groups',
      content: 'Go to Communities tab → Tap "+ Create Community" → Fill in details → Set privacy → Create! All students can create unlimited communities.',
      category: 'faq',
      icon: 'people-outline',
      iconColor: '#4ECDC4',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'USTP Admin'
    },
    {
      id: 'faq2',
      title: 'What are donation paths?',
      description: 'Understanding the 3 emotional donation systems',
      content: 'We have 3 donation paths: 1) Immediate Rescue (basic needs), 2) Dual Impact (platform + students), 3) Sustaining Legacy (monthly support). Each peso becomes hope.',
      category: 'faq',
      icon: 'heart-outline',
      iconColor: '#FF6B6B',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'USTP Admin'
    },
    {
      id: 'faq3',
      title: 'How to report inappropriate content?',
      description: 'Keeping our campus safe and respectful',
      content: 'Tap "Report Content" quick action → Choose category → Add details → Submit. Faculty will review within 24 hours.',
      category: 'faq',
      icon: 'flag-outline',
      iconColor: '#FFA726',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'USTP Admin'
    },
    {
      id: 'faq4',
      title: 'Are my anonymous posts really anonymous?',
      description: 'Privacy and anonymity on TrailTalk',
      content: 'Yes! Anonymous posts hide your identity from other students. Only platform admins can see the author for moderation purposes.',
      category: 'faq',
      icon: 'eye-off-outline',
      iconColor: '#9B5DE5',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'USTP Admin'
    },

    // Reporting Category
    {
      id: 'report1',
      title: 'Reporting Harassment',
      description: 'What to do if you experience harassment',
      content: '1. Document the incident\n2. Use "Report Content" feature\n3. Contact USTP Counseling Center\n4. Reach out to trusted faculty\n\nWe take all reports seriously.',
      category: 'reporting',
      icon: 'warning-outline',
      iconColor: '#FF6B6B',
      emergency: true,
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'USTP Security'
    },
    {
      id: 'report2',
      title: 'Academic Integrity Violations',
      description: 'Reporting cheating or plagiarism',
      content: 'Submit report with evidence → Faculty review → Academic Committee → Appropriate action taken. Your identity will be protected.',
      category: 'reporting',
      icon: 'school-outline',
      iconColor: '#4ECDC4',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Academic Office'
    },
    {
      id: 'report3',
      title: 'Cybersecurity Concerns',
      description: 'Reporting suspicious accounts or hacking',
      content: 'If you suspect account compromise or malicious activity: 1) Report immediately 2) Change password 3) Contact IT Department at ithelp@ustp.edu.ph',
      category: 'reporting',
      icon: 'shield-outline',
      iconColor: '#1DD1A1',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'IT Department'
    },

    // Resources Category
    {
      id: 'resource1',
      title: 'Library Online Resources',
      description: '24/7 access to journals and e-books',
      content: 'Access via: library.ustp.edu.ph\nCredentials: Use your student ID\nIncludes: IEEE, Springer, JSTOR, 50,000+ e-books\n24/7 Research Assistance Chat',
      category: 'resources',
      icon: 'library-outline',
      iconColor: '#118AB2',
      isOfficial: true,
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Library Staff'
    },
    {
      id: 'resource2',
      title: 'Free Printing Stations',
      description: 'Campus locations with free printing',
      content: '1. Main Library - 10 pages/day\n2. Engineering Building - 5 pages/day\n3. CS Department - 20 pages/day for projects\n\nBring your own paper or use provided (limited)',
      category: 'resources',
      icon: 'print-outline',
      iconColor: '#FFD166',
      isOfficial: true,
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Student Affairs'
    },
    {
      id: 'resource3',
      title: 'Wi-Fi Access Points',
      description: 'Campus-wide internet coverage',
      content: 'Network: USTP-Student\nUsername: StudentID\nPassword: Your birthdate (DDMMYYYY)\n\nHigh-speed zones: Library, Cafeteria, Study Halls',
      category: 'resources',
      icon: 'wifi-outline',
      iconColor: '#06D6A0',
      isOfficial: true,
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'IT Department'
    },
    {
      id: 'resource4',
      title: 'Career Center Services',
      description: 'Resume building and job placement',
      content: 'Services: Resume workshops, Mock interviews, Company partnerships, Internship placement\nLocation: Admin Building Room 201\nHours: Mon-Fri 8AM-5PM',
      category: 'resources',
      icon: 'briefcase-outline',
      iconColor: '#FF9E6B',
      isOfficial: true,
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Career Center'
    },

    // Volunteers Category
    {
      id: 'volunteer1',
      title: 'Student Ambassador Program',
      description: 'Represent USTP and help new students',
      content: 'Requirements: GPA 2.5+, Good standing, Leadership potential\nBenefits: Certificate, Stipend, Network opportunities\nApply at: Student Affairs Office',
      category: 'volunteers',
      icon: 'megaphone-outline',
      iconColor: '#FFD700',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Student Affairs'
    },
    {
      id: 'volunteer2',
      title: 'Peer Tutoring Program',
      description: 'Help fellow students with difficult subjects',
      content: 'Subjects: Calculus, Programming, Physics, Chemistry\nHours: 10 hours/month minimum\nRewards: Service credits, Recognition certificate\nSign up: Academic Office',
      category: 'volunteers',
      icon: 'book-outline',
      iconColor: '#4ECDC4',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Academic Office'
    },
    {
      id: 'volunteer3',
      title: 'Mental Health Advocates',
      description: 'Support student mental wellness',
      content: 'Training: Provided by Counseling Center\nRole: Peer support, Event organization, Awareness campaigns\nCommitment: 5 hours/week\nApply: Counseling Center',
      category: 'volunteers',
      icon: 'heart-outline',
      iconColor: '#FF6B6B',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Counseling Center'
    },
    {
      id: 'volunteer4',
      title: 'Tech Support Volunteers',
      description: 'Help with campus technology issues',
      content: 'Skills needed: Basic troubleshooting, Software installation, Network basics\nSchedule: Flexible 2-4 hour shifts\nPerks: Tech certifications, Priority Wi-Fi access\nContact: IT Department',
      category: 'volunteers',
      icon: 'hardware-chip-outline',
      iconColor: '#073B4C',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'IT Department'
    }
  ]);

  // Quick action buttons
  const quickActions = [
    { 
      id: 'report', 
      label: 'Report Content', 
      icon: 'flag-outline', 
      color: '#FF6B6B',
      action: () => setReportModalVisible(true)
    },
    { 
      id: 'find-support', 
      label: 'Find Support', 
      icon: 'search-outline', 
      color: '#4ECDC4',
      action: () => {
        setActiveCategory('resources');
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    },
    { 
      id: 'create-community', 
      label: 'Create Group', 
      icon: 'add-circle-outline', 
      color: '#FFA726',
      action: () => navigation.navigate('CreateCommunity')
    },
    {
      id: 'donate',
      label: 'Make Donation',
      icon: 'heart-outline',
      color: '#FF6B6B',
      action: () => navigation.navigate('AssignPath')
    }
  ];

  // Local modal state for reporting
  const [reportModalVisible, setReportModalVisible] = useState(false);

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

  // Community Impact Dashboard (upgraded UI, no Create Donation)
  const CommunityImpactDashboard = () => (
    <View style={styles.impactDashboard}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>TOGETHER, WE HAVE CREATED</Text>
        </View>
      
      <View style={styles.impactStats}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Ionicons name="fast-food-outline" size={18} color="#FF6B6B" style={styles.statIcon} />
            <Text style={styles.statValue}>{communityImpact.mealsProvided}</Text>
            <Text style={styles.statLabel}>Days of meals</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="school-outline" size={18} color="#4ECDC4" style={styles.statIcon} />
            <Text style={styles.statValue}>{communityImpact.journeysFunded}</Text>
            <Text style={styles.statLabel}>Students helped</Text>
          </View>
        </View>
        
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Ionicons name="book-outline" size={18} color="#8B5CF6" style={styles.statIcon} />
            <Text style={styles.statValue}>
              {(communityImpact.pagesPrinted / 1000).toFixed(1)}k
            </Text>
            <Text style={styles.statLabel}>Pages printed (k)</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="cash-outline" size={18} color="#FFA726" style={styles.statIcon} />
            <Text style={styles.statValue}>
              ₱{(communityImpact.totalHopeGenerated / 1000).toFixed(1)}k
            </Text>
            <Text style={styles.statLabel}>Donations</Text>
          </View>
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.dashboardActions}>
        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={() => navigation.navigate('AssignPath')}
        >
          <Ionicons name="heart" size={18} color={colors.white} />
          <Text style={styles.primaryActionText}>Make a Donation</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryActionButton}
          onPress={() => navigation.navigate('DonationLedger')}
        >
          <Ionicons name="list" size={16} color="#4ECDC4" />
          <Text style={styles.secondaryActionText}>View Donations Ledger</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.dashboardFooter}>
        These aren't metrics. They're <Text style={{ color: '#FF6B6B' }}>heartbeats</Text>.
      </Text>
    </View>
  );

  const renderCategoryChip = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        activeCategory === item.id && styles.categoryChipActive
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
        activeCategory === item.id && { color: colors.homeBackground, fontFamily: fonts.semiBold }
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
            <Text style={styles.headerSubtitle}>Where Every Peso Becomes Hope</Text>
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
        {/* Community Impact Dashboard */}
        <CommunityImpactDashboard />

        {/* Quick Action Buttons */}
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
  // Impact Dashboard
  impactDashboard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    gap: 8,
  },
  dashboardTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
  },
  impactStats: {
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statValue: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  dashboardActions: {
    gap: 10,
    marginBottom: 16,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  primaryActionText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.2)',
  },
  secondaryActionText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#4ECDC4',
  },
  dashboardFooter: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Badge Styles
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
  // Existing styles (preserved)
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
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 16,
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
    minWidth: 100,
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
  categoryChipActive: {
    backgroundColor: colors.white,
    // keep borderColor unchanged (do not change to item color)
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
    paddingHorizontal: 16,
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