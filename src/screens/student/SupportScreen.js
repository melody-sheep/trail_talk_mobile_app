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
  Image,
  ScrollView,
  FlatList,
  Animated
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
  const { user } = useContext(UserContext);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  // Calculate header animation values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [100, 60],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const collapsedTitleOpacity = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const searchSectionTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -40],
    extrapolate: 'clamp',
  });

  const categories = [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'faq', label: 'FAQ', icon: 'help-circle-outline' },
    { id: 'reporting', label: 'Reporting', icon: 'flag-outline' },
    { id: 'communities', label: 'Communities', icon: 'people-outline' },
    { id: 'resources', label: 'Resources', icon: 'business-outline' },
    { id: 'volunteers', label: 'Volunteers', icon: 'heart-outline' }
  ];

  // Mock data for support content
  const supportContent = [
    // FAQ Items
    {
      id: 'faq1',
      category: 'faq',
      title: 'How to Report Inappropriate Content',
      description: 'Learn how to flag posts or comments that violate community guidelines',
      content: 'To report a post:\n1. Tap the three dots on the post\n2. Select "Report Post"\n3. Choose the reason for reporting\n4. Submit your report\n\nOur moderation team will review within 24 hours.',
      icon: 'flag',
      iconColor: '#FF6B6B',
      emergency: false
    },
    {
      id: 'faq2',
      category: 'faq', 
      title: 'How to Join Support Groups',
      description: 'Find and join campus support communities',
      content: 'Available Support Groups:\n• Mental Health Support\n• Academic Success\n• International Students\n• LGBTQ+ Community\n• First-Generation Students\n\nTap "Join Community" below to explore.',
      icon: 'people',
      iconColor: '#4ECDC4',
      emergency: false
    },
    {
      id: 'faq3',
      category: 'faq',
      title: 'Privacy and Anonymity',
      description: 'Understanding how your data is protected',
      content: 'Your privacy matters:\n• Posts are anonymous by default\n• Personal information is encrypted\n• You control what you share\n• Data is never sold to third parties',
      icon: 'lock-closed',
      iconColor: '#45B7D1',
      emergency: false
    },

    // Reporting Items
    {
      id: 'report1',
      category: 'reporting',
      title: 'Emergency Reporting',
      description: 'Immediate assistance for urgent situations',
      content: 'For immediate danger:\n• Campus Security: (555) 123-4567\n• Emergency Services: 911\n• Crisis Hotline: 988\n\nAvailable 24/7 for urgent matters.',
      icon: 'warning',
      iconColor: '#FF6B6B',
      emergency: true
    },
    {
      id: 'report2',
      category: 'reporting',
      title: 'Post Reporting Steps',
      description: 'Step-by-step guide to reporting content',
      content: 'Reporting Process:\n1. Identify the concerning content\n2. Use the report feature\n3. Provide specific details\n4. Our team investigates\n5. You receive updates on the outcome',
      icon: 'document-text',
      iconColor: '#96CEB4',
      emergency: false
    },

    // Community Items
    {
      id: 'community1',
      category: 'communities',
      title: 'Mental Health Support Group',
      description: 'Safe space for mental health discussions',
      content: 'This group provides:\n• Peer support sessions\n• Professional guidance\n• Resource sharing\n• Weekly meetings\n\nMembers: 150+ students',
      icon: 'heart',
      iconColor: '#FF6B6B',
      emergency: false
    },
    {
      id: 'community2',
      category: 'communities',
      title: 'Academic Success Community',
      description: 'Study groups and academic resources',
      content: 'Features include:\n• Study buddy matching\n• Tutoring resources\n• Time management tips\n• Exam preparation help',
      icon: 'school',
      iconColor: '#4CAF50',
      emergency: false
    },

    // Resource Items
    {
      id: 'resource1',
      category: 'resources',
      title: 'Campus Counseling Services',
      description: 'Professional mental health support',
      content: 'Services Offered:\n• Individual therapy\n• Group sessions\n• Crisis intervention\n• Referrals to specialists\n\nLocation: Student Wellness Center, Room 201',
      icon: 'medical',
      iconColor: '#45B7D1',
      emergency: false
    },
    {
      id: 'resource2',
      category: 'resources',
      title: 'Self-Help Resources',
      description: 'Tools and materials for self-care',
      content: 'Available Resources:\n• Meditation guides\n• Stress management\n• Sleep improvement\n• Mindfulness exercises\n• Digital wellness tools',
      icon: 'build',
      iconColor: '#FFA726',
      emergency: false
    },

    // Volunteer Items
    {
      id: 'volunteer1',
      category: 'volunteers',
      title: 'Peer Support Volunteers',
      description: 'Trained student volunteers ready to help',
      content: 'Our volunteers:\n• Complete 20-hour training\n• Maintain confidentiality\n• Provide empathetic listening\n• Connect you to resources\n\nAvailable: Mon-Fri, 9AM-5PM',
      icon: 'hand-left',
      iconColor: '#4ECDC4',
      emergency: false
    },
    {
      id: 'volunteer2',
      category: 'volunteers',
      title: 'Schedule a Chat',
      description: 'Book time with a support volunteer',
      content: 'How to connect:\n1. Browse available volunteers\n2. Select a time slot\n3. Choose video or text chat\n4. Receive confirmation\n\nAll chats are confidential.',
      icon: 'chatbubble-ellipses',
      iconColor: '#45B7D1',
      emergency: false
    }
  ];

  // Quick action buttons
  const quickActions = [
    { 
      id: 'report', 
      label: 'Report Post', 
      icon: 'flag-outline', 
      color: '#FF6B6B' 
    },
    { 
      id: 'community', 
      label: 'Join Community', 
      icon: 'people-outline', 
      color: '#4ECDC4' 
    },
    { 
      id: 'talk', 
      label: 'Talk Now', 
      icon: 'chatbubble-ellipses-outline', 
      color: '#45B7D1' 
    },
    { 
      id: 'resources', 
      label: 'Resources', 
      icon: 'book-outline', 
      color: '#96CEB4' 
    }
  ];

  // Emergency contacts
  const emergencyContacts = [
    { 
      id: 'security', 
      name: 'Campus Security', 
      number: '(555) 123-4567', 
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
      name: 'Counseling Services', 
      number: '(555) 123-4568', 
      available: 'Mon-Fri 9AM-5PM',
      icon: 'medical' 
    }
  ];

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
    console.log('Quick action:', actionId);
    // Navigate to appropriate screen based on action
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

  const renderSupportCard = ({ item }) => (
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
          <Ionicons 
            name={item.icon} 
            size={20} 
            color={item.iconColor} 
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDescription}>{item.description}</Text>
        </View>
        <Ionicons 
          name={expandedItems[item.id] ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="rgba(255, 255, 255, 0.6)" 
        />
      </View>
      
      {expandedItems[item.id] && (
        <View style={styles.expandedContent}>
          <Text style={styles.expandedText}>{item.content}</Text>
          {item.emergency && (
            <View style={styles.emergencyBadge}>
              <Ionicons name="warning" size={12} color={colors.white} />
              <Text style={styles.emergencyText}>EMERGENCY</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmergencyContact = ({ item }) => (
    <View style={styles.emergencyContact}>
      <View style={styles.contactLeft}>
        <View style={styles.contactIconContainer}>
          <Ionicons 
            name={item.icon} 
            size={20} 
            color="#FF6B6B" 
          />
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactNumber}>{item.number}</Text>
          <Text style={styles.contactAvailability}>{item.available}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.callButton}>
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
          {/* Original Header Content - Fades out when scrolling */}
          <Animated.View style={[styles.headerContent, { opacity: headerTitleOpacity }]}>
            <Text style={styles.headerTitle}>Support & Resources</Text>
            <Text style={styles.headerSubtitle}>Get help when you need it</Text>
          </Animated.View>

          {/* Collapsed Header Title - Appears when scrolling */}
          <Animated.View 
            style={[
              styles.collapsedHeaderContent,
              { opacity: collapsedTitleOpacity }
            ]}
          >
            <Text style={styles.collapsedHeaderTitle}>Support</Text>
          </Animated.View>
        </ImageBackground>
      </Animated.View>

      {/* Sticky Search & Categories Section */}
      <Animated.View 
        style={[
          styles.stickySection,
          { transform: [{ translateY: searchSectionTranslateY }] }
        ]}
      >
        {/* Search Field */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons 
              name="search" 
              size={20} 
              color="rgba(255, 255, 255, 0.6)" 
              style={styles.searchIcon}
            />
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

        {/* Category Chips - Always Visible */}
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
        stickyHeaderIndices={[]}
      >
        {/* Quick Action Buttons */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Help</Text>
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
              <Text style={styles.sectionTitle}>
                {activeCategory === 'all' && 'All Support Resources'}
                {activeCategory === 'faq' && 'Frequently Asked Questions'}
                {activeCategory === 'reporting' && 'Reporting & Safety'}
                {activeCategory === 'communities' && 'Support Communities'} 
                {activeCategory === 'resources' && 'Campus Resources'}
                {activeCategory === 'volunteers' && 'Volunteer Support'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {filteredContent.length} resources available
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

        {/* Bottom Spacer */}
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
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
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
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
  },
  stickySection: {
    position: 'absolute',
    top: 100, // Matches reduced header height
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.homeBackground,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
    marginTop: 100, // Space for header + sticky section
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 120, // Space for sticky section
    paddingBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  quickActionsSection: {
    marginTop: 10,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginBottom: 8,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  quickActionsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: 110,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.white,
    textAlign: 'center',
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingBottom: 15,
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
    marginTop: 0,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionHeaderContent: {
    paddingHorizontal: 0,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 20,
  },
  supportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
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
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  expandedText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  emergencyText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.white,
    letterSpacing: 0.5,
  },
  emergencySection: {
    marginTop: 10,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  emergencySubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 15,
  },
  emergencyContact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
    marginHorizontal: 20,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  contactAvailability: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  callButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  bottomSpacer: {
    height: 20,
  },
});