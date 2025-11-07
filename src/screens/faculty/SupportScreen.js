// src/screens/faculty/SupportScreen.js
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

export default function FacultySupportScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState({});
  const { user } = useContext(UserContext);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'faq', label: 'FAQ' },
    { id: 'reporting', label: 'Reporting' },
    { id: 'resources', label: 'Resources' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'support', label: 'Support' }
  ];

  // Mock data for faculty support content
  const supportContent = [
    // FAQ Items
    {
      id: 'faq1',
      category: 'faq',
      title: 'Faculty Reporting Guidelines',
      description: 'How to handle student concerns and reports',
      content: 'Faculty Reporting Process:\n1. Document the concern with specific details\n2. Contact department chair if needed\n3. Use official reporting channels\n4. Maintain student confidentiality\n5. Follow up with appropriate offices',
      icon: '📋',
      emergency: false
    },
    {
      id: 'faq2',
      category: 'faq', 
      title: 'Student Support Referrals',
      description: 'Where to refer students for different types of support',
      content: 'Referral Resources:\n• Academic Issues: Academic Success Center\n• Mental Health: Counseling Services\n• Financial Aid: Financial Aid Office\n• Disability Services: Accessibility Office\n• Career Guidance: Career Development Center',
      icon: '👥',
      emergency: false
    },
    {
      id: 'faq3',
      category: 'faq',
      title: 'Platform Usage Guidelines',
      description: 'Best practices for faculty using TrailTalk',
      content: 'Faculty Guidelines:\n• Maintain professional boundaries\n• Use appropriate communication channels\n• Report technical issues promptly\n• Respect student privacy and anonymity\n• Provide constructive feedback',
      icon: '💼',
      emergency: false
    },

    // Reporting Items
    {
      id: 'report1',
      category: 'reporting',
      title: 'Emergency Situations',
      description: 'Immediate response for critical student situations',
      content: 'Emergency Protocols:\n• Campus Security: (555) 123-4567\n• Student Crisis Team: (555) 123-4569\n• Title IX Office: (555) 123-4570\n• Always document concerns and follow up',
      icon: '🚨',
      emergency: true
    },
    {
      id: 'report2',
      category: 'reporting',
      title: 'Academic Integrity Reports',
      description: 'Reporting academic dishonesty concerns',
      content: 'Academic Integrity Process:\n1. Gather evidence and documentation\n2. Consult with department chair\n3. Submit official report to Academic Affairs\n4. Participate in hearing if required\n5. Maintain student privacy throughout',
      icon: '🎓',
      emergency: false
    },

    // Resource Items
    {
      id: 'resource1',
      category: 'resources',
      title: 'Faculty Development Resources',
      description: 'Professional growth and teaching resources',
      content: 'Available Resources:\n• Center for Teaching Excellence\n• Faculty Mentoring Program\n• Research Support Services\n• Technology Training Workshops\n• Grant Writing Assistance',
      icon: '📚',
      emergency: false
    },
    {
      id: 'resource2',
      category: 'resources',
      title: 'Mental Health Support',
      description: 'Resources for faculty wellness and stress management',
      content: 'Faculty Wellness:\n• Employee Assistance Program\n• Mindfulness and Meditation Sessions\n• Work-Life Balance Workshops\n• Peer Support Network\n• Health and Wellness Center',
      icon: '🧠',
      emergency: false
    },

    // Faculty Specific Items
    {
      id: 'faculty1',
      category: 'faculty',
      title: 'Faculty Community Forum',
      description: 'Connect with other faculty members',
      content: 'Faculty Community Features:\n• Department-specific discussions\n• Teaching strategy sharing\n• Research collaboration opportunities\n• Policy updates and announcements\n• Social events and networking',
      icon: '👨‍🏫',
      emergency: false
    },
    {
      id: 'faculty2',
      category: 'faculty',
      title: 'Administrative Support',
      description: 'Department and administrative contacts',
      content: 'Administrative Resources:\n• Department Chairs\n• Dean\'s Office Contacts\n• HR Services\n• IT Support\n• Facilities Management',
      icon: '🏛️',
      emergency: false
    },

    // Support Items
    {
      id: 'support1',
      category: 'support',
      title: 'Technical Support',
      description: 'IT help and platform assistance',
      content: 'Technical Support Channels:\n• IT Help Desk: help@university.edu\n• Platform Support: support@trailtalk.edu\n• Emergency IT: (555) 123-4571\n• Online Knowledge Base Available',
      icon: '💻',
      emergency: false
    },
    {
      id: 'support2',
      category: 'support',
      title: 'Teaching Support Services',
      description: 'Resources for course development and delivery',
      content: 'Teaching Support:\n• Course Design Consultation\n• Classroom Technology Training\n• Assessment Development\n• Online Teaching Resources\n• Instructional Design Support',
      icon: '🎯',
      emergency: false
    }
  ];

  // Quick action buttons for faculty
  const quickActions = [
    { id: 'report', label: 'Report Concern', icon: '🚩', color: '#FF6B6B' },
    { id: 'resources', label: 'Faculty Resources', icon: '📚', color: '#4ECDC4' },
    { id: 'community', label: 'Faculty Forum', icon: '👥', color: '#45B7D1' },
    { id: 'support', label: 'Get Support', icon: '💬', color: '#96CEB4' }
  ];

  // Emergency contacts for faculty
  const emergencyContacts = [
    { id: 'security', name: 'Campus Security', number: '(555) 123-4567', available: '24/7' },
    { id: 'faculty', name: 'Faculty Assistance', number: '(555) 123-4568', available: 'Mon-Fri 8AM-5PM' },
    { id: 'it', name: 'IT Emergency', number: '(555) 123-4571', available: '24/7' }
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
    console.log('Searching faculty support for:', searchQuery);
  };

  const handleQuickAction = (actionId) => {
    console.log('Faculty quick action:', actionId);
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
          <Text style={styles.headerTitle}>Faculty Support</Text>
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
              placeholder="Search for faculty resources, guidelines..."
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
          <Text style={styles.sectionTitle}>Quick Access</Text>
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
              {activeCategory === 'all' && 'All Faculty Resources'}
              {activeCategory === 'faq' && 'Frequently Asked Questions'}
              {activeCategory === 'reporting' && 'Reporting & Protocols'}
              {activeCategory === 'resources' && 'Faculty Resources'} 
              {activeCategory === 'faculty' && 'Faculty Community'}
              {activeCategory === 'support' && 'Technical Support'}
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
          <Text style={styles.emergencySubtitle}>Available for urgent faculty situations</Text>
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