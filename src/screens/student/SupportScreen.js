// src/screens/student/SupportScreen.js
import React, { useState, useContext } from 'react';
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
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';

export default function SupportScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState({});
  const { user } = useContext(UserContext);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'faq', label: 'FAQ' },
    { id: 'reporting', label: 'Reporting' },
    { id: 'communities', label: 'Communities' },
    { id: 'resources', label: 'Resources' },
    { id: 'volunteers', label: 'Volunteers' }
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
      icon: '🚩',
      emergency: false
    },
    {
      id: 'faq2',
      category: 'faq', 
      title: 'How to Join Support Groups',
      description: 'Find and join campus support communities',
      content: 'Available Support Groups:\n• Mental Health Support\n• Academic Success\n• International Students\n• LGBTQ+ Community\n• First-Generation Students\n\nTap "Join Community" below to explore.',
      icon: '👥',
      emergency: false
    },
    {
      id: 'faq3',
      category: 'faq',
      title: 'Privacy and Anonymity',
      description: 'Understanding how your data is protected',
      content: 'Your privacy matters:\n• Posts are anonymous by default\n• Personal information is encrypted\n• You control what you share\n• Data is never sold to third parties',
      icon: '🔒',
      emergency: false
    },

    // Reporting Items
    {
      id: 'report1',
      category: 'reporting',
      title: 'Emergency Reporting',
      description: 'Immediate assistance for urgent situations',
      content: 'For immediate danger:\n• Campus Security: (555) 123-4567\n• Emergency Services: 911\n• Crisis Hotline: 988\n\nAvailable 24/7 for urgent matters.',
      icon: '🚨',
      emergency: true
    },
    {
      id: 'report2',
      category: 'reporting',
      title: 'Post Reporting Steps',
      description: 'Step-by-step guide to reporting content',
      content: 'Reporting Process:\n1. Identify the concerning content\n2. Use the report feature\n3. Provide specific details\n4. Our team investigates\n5. You receive updates on the outcome',
      icon: '📝',
      emergency: false
    },

    // Community Items
    {
      id: 'community1',
      category: 'communities',
      title: 'Mental Health Support Group',
      description: 'Safe space for mental health discussions',
      content: 'This group provides:\n• Peer support sessions\n• Professional guidance\n• Resource sharing\n• Weekly meetings\n\nMembers: 150+ students',
      icon: '💚',
      emergency: false
    },
    {
      id: 'community2',
      category: 'communities',
      title: 'Academic Success Community',
      description: 'Study groups and academic resources',
      content: 'Features include:\n• Study buddy matching\n• Tutoring resources\n• Time management tips\n• Exam preparation help',
      icon: '📚',
      emergency: false
    },

    // Resource Items
    {
      id: 'resource1',
      category: 'resources',
      title: 'Campus Counseling Services',
      description: 'Professional mental health support',
      content: 'Services Offered:\n• Individual therapy\n• Group sessions\n• Crisis intervention\n• Referrals to specialists\n\nLocation: Student Wellness Center, Room 201',
      icon: '🏥',
      emergency: false
    },
    {
      id: 'resource2',
      category: 'resources',
      title: 'Self-Help Resources',
      description: 'Tools and materials for self-care',
      content: 'Available Resources:\n• Meditation guides\n• Stress management\n• Sleep improvement\n• Mindfulness exercises\n• Digital wellness tools',
      icon: '🛠️',
      emergency: false
    },

    // Volunteer Items
    {
      id: 'volunteer1',
      category: 'volunteers',
      title: 'Peer Support Volunteers',
      description: 'Trained student volunteers ready to help',
      content: 'Our volunteers:\n• Complete 20-hour training\n• Maintain confidentiality\n• Provide empathetic listening\n• Connect you to resources\n\nAvailable: Mon-Fri, 9AM-5PM',
      icon: '🤝',
      emergency: false
    },
    {
      id: 'volunteer2',
      category: 'volunteers',
      title: 'Schedule a Chat',
      description: 'Book time with a support volunteer',
      content: 'How to connect:\n1. Browse available volunteers\n2. Select a time slot\n3. Choose video or text chat\n4. Receive confirmation\n\nAll chats are confidential.',
      icon: '💬',
      emergency: false
    }
  ];

  // Quick action buttons
  const quickActions = [
    { id: 'report', label: 'Report Post', icon: '🚩', color: '#FF6B6B' },
    { id: 'community', label: 'Join Community', icon: '👥', color: '#4ECDC4' },
    { id: 'talk', label: 'Talk Now', icon: '💬', color: '#45B7D1' },
    { id: 'resources', label: 'Resources', icon: '📚', color: '#96CEB4' }
  ];

  // Emergency contacts
  const emergencyContacts = [
    { id: 'security', name: 'Campus Security', number: '(555) 123-4567', available: '24/7' },
    { id: 'crisis', name: 'Crisis Hotline', number: '988', available: '24/7' },
    { id: 'counseling', name: 'Counseling Services', number: '(555) 123-4568', available: 'Mon-Fri 9AM-5PM' }
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
      <Text style={styles.actionIcon}>{item.icon}</Text>
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
        <View style={styles.cardIconContainer}>
          <Text style={styles.cardIcon}>{item.icon}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDescription}>{item.description}</Text>
        </View>
        <Text style={styles.expandIcon}>
          {expandedItems[item.id] ? '▲' : '▼'}
        </Text>
      </View>
      
      {expandedItems[item.id] && (
        <View style={styles.expandedContent}>
          <Text style={styles.expandedText}>{item.content}</Text>
          {item.emergency && (
            <View style={styles.emergencyBadge}>
              <Text style={styles.emergencyText}>EMERGENCY</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmergencyContact = ({ item }) => (
    <View style={styles.emergencyContact}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactNumber}>{item.number}</Text>
        <Text style={styles.contactAvailability}>{item.available}</Text>
      </View>
      <TouchableOpacity style={styles.callButton}>
        <Text style={styles.callButtonText}>Call</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      {/* Header Background */}
      <ImageBackground 
        source={require('../../../assets/create_post_screen_icons/createpost_header_bg.png')}
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Support</Text>
        </View>
      </ImageBackground>

      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Field */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Image 
              source={require('../../../assets/bottom_navigation_icons/search_icon_fill.png')}
              style={styles.searchIcon}
              resizeMode="contain"
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

        {/* Category Chips */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Support Categories</Text>
          <FlatList
            data={categories}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Support Content */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
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
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <Text style={styles.emergencySubtitle}>Available 24/7 for urgent situations</Text>
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
  headerBackground: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: fonts.medium,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
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
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: 'rgba(255, 255, 255, 0.6)',
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  quickActionsList: {
    paddingHorizontal: 20,
  },
  quickActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 12,
    minWidth: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.white,
    textAlign: 'center',
  },
  categoriesSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  categoryChipTextSelected: {
    color: colors.homeBackground,
    fontFamily: fonts.semiBold,
  },
  contentSection: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  expandIcon: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 8,
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
    alignSelf: 'flex-start',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  emergencyText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  emergencySection: {
    marginTop: 25,
    paddingHorizontal: 20,
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
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
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