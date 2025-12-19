// src/screens/faculty/SupportScreen.js - UPDATED VERSION (Complete with Mock Data)
import React, { useState, useContext, useRef, useEffect } from 'react';
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
  Linking,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import ReportModal from '../../components/ReportModal';
import SupportPathCard from '../../components/SupportPathCard';
import { DONATION_PATHS, INITIAL_IMPACT_COUNTERS } from '../../constants/donationPaths';

export default function FacultySupportScreen({ navigation, route }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState({});
  const [communityImpact, setCommunityImpact] = useState(INITIAL_IMPACT_COUNTERS);
  const { user } = useContext(UserContext);
  const [facultyCreatedDonations, setFacultyCreatedDonations] = useState([]);
  
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

  // Check for new donations from CreateDonationScreen
  useEffect(() => {
    if (route.params?.newDonation) {
      const newDonation = route.params.newDonation;
      setFacultyCreatedDonations(prev => [...prev, newDonation]);
      
      // Show success message
      Alert.alert(
        'Donation Created!',
        `${newDonation.title} has been added to the donation paths.`,
        [{ text: 'OK' }]
      );
      
      // Clear params
      navigation.setParams({ newDonation: null });
    }
  }, [route.params?.newDonation]);

  // Combine default donations with faculty-created ones
  const getDonationsWithFaculty = () => {
    const paths = DONATION_PATHS.map(path => {
      // Add faculty donations to appropriate path
      const facultyDonationsInPath = facultyCreatedDonations.filter(
        donation => donation.path === path.id
      ).map(donation => ({
        ...donation,
        name: donation.title,
        isCustom: true,
        createdByYou: donation.createdBy === user?.id,
        icon: 'heart-circle',
        color: '#8B5CF6',
        quickDescription: `₱${donation.amount} - Faculty Created`
      }));

      return {
        ...path,
        items: [...path.items, ...facultyDonationsInPath]
      };
    });
    return paths;
  };

  const categories = [
    { id: 'all', label: 'All', icon: 'grid-outline', color: '#8B5CF6' },
    { id: 'faq', label: 'FAQ', icon: 'help-circle-outline', color: '#38BDF8' },
    { id: 'reporting', label: 'Reporting', icon: 'flag-outline', color: '#FF6B6B' },
    { id: 'resources', label: 'Resources', icon: 'business-outline', color: '#4ECDC4' },
    { id: 'volunteers', label: 'Volunteers', icon: 'heart-outline', color: '#FFA726' }
  ];

  // Quick action buttons - Updated for faculty
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
      id: 'create-donation', 
      label: 'Create Donation', 
      icon: 'add-circle-outline', 
      color: '#FFA726',
      action: () => navigation.navigate('CreateDonationScreen')
    },
    { 
      id: 'donate', 
      label: 'Make Donation', 
      icon: 'heart-outline', 
      color: '#FF6B6B',
      action: () => navigation.navigate('DonationSelection')
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

  // USTP Specific Support Content - Faculty Version (Fully Populated)
  const [supportContent, setSupportContent] = useState([
    // FAQ Category (4 items)
    {
      id: 'faq1',
      title: 'How to access faculty research grants?',
      description: 'Finding and applying for research funding opportunities',
      content: 'Access the Research Grants Portal through the USTP Faculty Dashboard. All available grants are listed with deadlines, requirements, and application procedures. Contact the Research Office at research@ustp.edu.ph for assistance.',
      category: 'faq',
      icon: 'school-outline',
      iconColor: '#4ECDC4',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Research Office'
    },
    {
      id: 'faq2',
      title: 'What are the procedures for grade submission?',
      description: 'Deadlines and process for submitting final grades',
      content: 'Final grades must be submitted within 5 working days after the final exam. Use the Faculty Portal → Grade Submission section. Late submissions require department chair approval.',
      category: 'faq',
      icon: 'document-text-outline',
      iconColor: '#118AB2',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Academic Office'
    },
    {
      id: 'faq3',
      title: 'How to report student academic misconduct?',
      description: 'Process for reporting cheating or plagiarism cases',
      content: 'Document the incident with evidence → Submit through Faculty Portal under "Academic Integrity Reports" → Case will be reviewed by Academic Committee within 7 days.',
      category: 'faq',
      icon: 'flag-outline',
      iconColor: '#FF6B6B',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Academic Office'
    },
    {
      id: 'faq4',
      title: 'Where to access professional development workshops?',
      description: 'Monthly training sessions and skill enhancement',
      content: 'Professional Development Center offers monthly workshops. Register through PDC Portal. Topics include: Digital Teaching Tools, Research Methodology, Student Mentoring.',
      category: 'faq',
      icon: 'book-outline',
      iconColor: '#FFD166',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'PDC Office'
    },

    // Reporting Category (4 items)
    {
      id: 'report1',
      title: 'Academic Dishonesty Report',
      description: 'Report cases of cheating, plagiarism, or other academic misconduct',
      content: 'Include student details, incident description, and evidence.\n\nContact: Academic Affairs Office - (088) 123-4570\nProcedure: Submit through Faculty Portal or email academic.affairs@ustp.edu.ph',
      category: 'reporting',
      icon: 'flag-outline',
      iconColor: '#FF6B6B',
      emergency: true,
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Academic Office'
    },
    {
      id: 'report2',
      title: 'Student Crisis Intervention',
      description: 'Reporting students in emotional or psychological distress',
      content: 'For immediate danger: Call Campus Security at (088) 123-4567\nFor non-emergency: Contact Counseling Center at (088) 123-4568\nAll reports are confidential.',
      category: 'reporting',
      icon: 'medical-outline',
      iconColor: '#4CAF50',
      emergency: true,
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Counseling Center'
    },
    {
      id: 'report3',
      title: 'Facility Maintenance Issues',
      description: 'Report classroom equipment or building maintenance problems',
      content: 'Submit maintenance requests through Facilities Portal or call (088) 123-4575.\nPriority levels: Emergency (4 hrs), High (24 hrs), Normal (3-5 days).',
      category: 'reporting',
      icon: 'build-outline',
      iconColor: '#FF9800',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Facilities Management'
    },
    {
      id: 'report4',
      title: 'IT System Outages',
      description: 'Report technical issues with online systems or network',
      content: 'For system outages: Call IT Help Desk at (088) 123-4573\nFor individual issues: Submit ticket through IT Portal\nResponse time: 2-4 hours for critical issues.',
      category: 'reporting',
      icon: 'hardware-chip-outline',
      iconColor: '#073B4C',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'IT Department'
    },

    // Resources Category (4 items)
    {
      id: 'resource1',
      title: 'Faculty Handbook & Policies',
      description: 'Complete guide to USTP academic policies and procedures',
      content: 'Available on Faculty Portal → Resources section\nIncludes: Academic calendar, Grading policies, Leave procedures, Research guidelines\nUpdated annually.',
      category: 'resources',
      icon: 'document-outline',
      iconColor: '#118AB2',
      isOfficial: true,
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Academic Office'
    },
    {
      id: 'resource2',
      title: 'Research Database Access',
      description: '24/7 access to academic journals and publications',
      content: 'Access through: library.ustp.edu.ph/faculty\nIncludes: IEEE, Springer, JSTOR, Scopus, Web of Science\nNo access limits for faculty members.',
      category: 'resources',
      icon: 'library-outline',
      iconColor: '#06D6A0',
      isOfficial: true,
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Library'
    },
    {
      id: 'resource3',
      title: 'Classroom Technology Guide',
      description: 'Instructions for using smart classrooms and AV equipment',
      content: 'Available in each classroom and online\nIncludes: Projector setup, Sound system, Video conferencing, Document camera\nSupport: IT Help Desk (088) 123-4573',
      category: 'resources',
      icon: 'desktop-outline',
      iconColor: '#9B5DE5',
      isOfficial: true,
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'IT Department'
    },
    {
      id: 'resource4',
      title: 'Mental Health Resources',
      description: 'Faculty wellness programs and stress management',
      content: 'Services: Counseling sessions, Stress workshops, Peer support groups\nContact: Faculty Wellness Center at (088) 123-4576\nConfidential and free for all faculty.',
      category: 'resources',
      icon: 'heart-outline',
      iconColor: '#FF6B6B',
      isOfficial: true,
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Wellness Center'
    },

    // Volunteers Category (4 items)
    {
      id: 'volunteer1',
      title: 'Faculty Mentorship Program',
      description: 'Mentor junior faculty and guide professional development',
      content: 'Commitment: 2-4 hours per month\nBenefits: Leadership experience, Professional network, Service recognition\nApply through: Faculty Development Center',
      category: 'volunteers',
      icon: 'people-outline',
      iconColor: '#4ECDC4',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Faculty Development'
    },
    {
      id: 'volunteer2',
      title: 'Thesis/Dissertation Committee',
      description: 'Serve on graduate student thesis committees',
      content: 'Commitment: Varies by project (typically 5-10 hours/month)\nRequirements: Relevant expertise, Published research\nApply through: Graduate Studies Office',
      category: 'volunteers',
      icon: 'school-outline',
      iconColor: '#8B5CF6',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Graduate Studies'
    },
    {
      id: 'volunteer3',
      title: 'Community Outreach Coordinator',
      description: 'Lead community service projects and charity initiatives',
      content: 'Commitment: 4-6 hours per month\nProjects: Food drives, Tutoring programs, Environmental cleanups\nApply through: Community Relations Office',
      category: 'volunteers',
      icon: 'heart-circle-outline',
      iconColor: '#FF6B6B',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Community Relations'
    },
    {
      id: 'volunteer4',
      title: 'Student Organization Advisor',
      description: 'Guide and support student clubs and organizations',
      content: 'Commitment: 3-5 hours per month\nBenefits: Student engagement, Leadership development, Service credit\nApply through: Student Affairs Office',
      category: 'volunteers',
      icon: 'trophy-outline',
      iconColor: '#FFD700',
      editable: true,
      lastUpdated: 'Dec 18, 2024',
      updatedBy: 'Student Affairs'
    }
  ]);

  const filteredContent = supportContent.filter(item => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  // Enhanced permission checking
  const canEditSupport = user?.role === 'faculty' || user?.organization_role === 'president' || user?.organization_role === 'officer';
  
  const canEditItem = (item) => {
    return canEditSupport && item.editable;
  };

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

  // Add this function for editing support items (if needed)
  const handleEditItem = (itemId) => {
    const item = supportContent.find(item => item.id === itemId);
    if (item && canEditItem(item)) {
      // Navigate to edit screen or show edit modal
      Alert.alert(
        'Edit Content',
        `Would you like to edit "${item.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit', onPress: () => {
            // Add edit functionality here
            Alert.alert('Edit Feature', 'Edit functionality would be implemented here.');
          }}
        ]
      );
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
      <View style={[styles.badgeContainer, { 
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        paddingHorizontal: padding,
        paddingVertical: padding - 2,
        borderRadius: 8
      }]}>
        <Ionicons name={config.icon} size={iconSize} color={config.color} />
        <Text style={[styles.badgeText, { 
          color: config.color, 
          fontSize: fontSize,
          marginLeft: 4
        }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  // Community Impact Dashboard - Same as student
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
          onPress={() => navigation.navigate('DonationSelection')}
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
        
        <TouchableOpacity
          style={[styles.createDonationButton, { marginTop: 0 }]}
          onPress={() => navigation.navigate('CreateDonationScreen')}
        >
          <Ionicons name="add-circle" size={16} color="#4A90E2" />
          <Text style={styles.createDonationText}>Create Donation</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.dashboardFooter}>
        These aren't metrics. They're <Text style={{ color: '#FF6B6B' }}>heartbeats</Text>.
      </Text>
    </View>
  );

  // Faculty Created Donations Section (optional - can be removed if not needed)
  const FacultyDonationsSection = () => {
    if (facultyCreatedDonations.length === 0) return null;

    return (
      <View style={styles.facultyDonationsSection}>
        <View style={styles.sectionHeaderContent}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Your Created Donations</Text>
            <ProfessionalBadge type="faculty" size="small" />
          </View>
          <Text style={styles.sectionSubtitle}>
            {facultyCreatedDonations.length} donation{facultyCreatedDonations.length !== 1 ? 's' : ''} created by you
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.facultyDonationsScroll}
          contentContainerStyle={styles.facultyDonationsList}
        >
          {facultyCreatedDonations.map((donation) => (
            <View key={donation.id} style={styles.facultyDonationCard}>
              <Text style={styles.facultyDonationTitle}>{donation.title}</Text>
              <Text style={styles.facultyDonationAmount}>₱{donation.amount}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

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
              <TouchableOpacity style={styles.editHeaderButton} onPress={() => {}}>
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

        {/* Faculty Created Donations (Optional) */}
        {/* <FacultyDonationsSection /> */}

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick Help</Text>
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

        {/* Support Content Section */}
        <View style={styles.supportContentSection}>
          <View style={styles.sectionHeaderContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {activeCategory === 'all' ? 'All Support Topics' :
                 categories.find(cat => cat.id === activeCategory)?.label || 'Support Topics'}
              </Text>
              <ProfessionalBadge type="official" size="small" />
            </View>
            <Text style={styles.sectionSubtitle}>
              {filteredContent.length} item{filteredContent.length !== 1 ? 's' : ''} available
            </Text>
          </View>

          <FlatList
            data={filteredContent}
            renderItem={renderSupportCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.supportList}
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
  statIcon: {
    marginBottom: 6,
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
    paddingVertical: 14,
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
  // Faculty Donations Section
  facultyDonationsSection: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 24,
  },
  facultyDonationsScroll: {
    marginTop: 16,
  },
  facultyDonationsList: {
    paddingRight: 16,
  },
  facultyDonationCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    minWidth: 140,
  },
  facultyDonationTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginBottom: 4,
  },
  facultyDonationAmount: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#8B5CF6',
  },
  // Support Content Section
  supportContentSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  supportList: {
    gap: 8,
  },
  // Support Card Styles
  supportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
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
  // Create Donation Button
  createDonationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,144,226,0.08)',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(74,144,226,0.16)',
    alignSelf: 'stretch',
  },
  createDonationText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#4A90E2',
    textAlign: 'center',
  },
  // Existing styles
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'left',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  quickActionsSection: {
    marginHorizontal: 16,
    marginBottom: 18,
  },
  quickActionsList: {
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
  sectionHeaderContent: {
    marginBottom: 10,
  },
  emergencySection: {
    marginHorizontal: 16,
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