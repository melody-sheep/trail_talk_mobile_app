import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../../contexts/UserContext';
import { studentTeamMembers } from './StudentDevelopersScreen';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';

const StudentSettingsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('settings');
  const indicatorPosition = React.useRef(new Animated.Value(0)).current;
  const [tabWidth, setTabWidth] = useState(0);
  const INDICATOR_WIDTH = 100;
  const TAB_CONTAINER_PADDING = 20;

  const tabs = [
    { id: 'settings', label: 'Settings' },
    { id: 'developers', label: 'Developers' }
  ];

  const handleTabPress = (tabId, index) => {
    setActiveTab(tabId);
    const toVal = tabWidth
      ? TAB_CONTAINER_PADDING + index * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2
      : index * 100;
    indicatorPosition.setValue(toVal);
  };

  React.useEffect(() => {
    if (!tabWidth) return;
    const activeIndex = tabs.findIndex((t) => t.id === activeTab);
    const toVal = TAB_CONTAINER_PADDING + activeIndex * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2;
    indicatorPosition.setValue(toVal);
  }, [tabWidth]);

  const settingsOptions = [
    {
      id: 'account',
      title: 'Account Settings',
      description: 'Manage your profile, email, and password',
      icon: 'person-outline',
      color: '#00E5FF',
      onPress: () => console.log('Navigate to Account Settings')
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Control your privacy and security settings',
      icon: 'shield-checkmark-outline',
      color: '#10B981',
      onPress: () => console.log('Navigate to Privacy & Security')
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage your notification preferences',
      icon: 'notifications-outline',
      color: '#EC4899',
      onPress: () => console.log('Navigate to Notifications')
    },
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: 'help-circle-outline',
      color: '#8B5CF6',
      onPress: () => navigation.navigate('StudentSupport')
    },
    {
      id: 'about',
      title: 'About TrailTalk',
      description: 'Learn more about the app and version',
      icon: 'information-circle-outline',
      color: '#F59E0B',
      onPress: () => console.log('Navigate to About')
    }
  ];

  // Fixed developer data with full names and proper images
  const teamMembers = [
    {
      id: 1,
      name: 'Alther Adrian P. Liga',
      role: 'Lead Developer',
      image: require('../../../assets/developer_profiles/alther.png'),
      icon: 'code-slash',
      iconColor: '#00E5FF'
    },
    {
      id: 2,
      name: 'Jocelyn D. Caballero',
      role: 'UI/UX Designer',
      image: require('../../../assets/developer_profiles/celine.png'),
      icon: 'color-palette',
      iconColor: '#FF2D78'
    },
    {
      id: 3,
      name: 'Divine Tapayan',
      role: 'Backend Developer',
      image: require('../../../assets/developer_profiles/divine.png'),
      icon: 'server',
      iconColor: '#10B981'
    },
    {
      id: 4,
      name: 'Faisal Inidal',
      role: 'Mobile Developer',
      image: require('../../../assets/developer_profiles/faisal.png'),
      icon: 'phone-portrait',
      iconColor: '#8B5CF6'
    },
    {
      id: 5,
      name: 'Harry Fernandez',
      role: 'Project Manager',
      image: require('../../../assets/developer_profiles/harry.png'),
      icon: 'ribbon',
      iconColor: '#F59E0B'
    }
  ];

  const { signOut } = useContext(UserContext);

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await signOut();
              navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
            } catch (err) {
              console.warn('Error signing out', err);
            }
          }
        }
      ]
    );
  };

  const renderSettingsContent = () => (
    <View style={styles.contentSection}>
      {/* Logout Section - Red with confirmation */}
      <View style={styles.logoutSection}>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout} 
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
        <Text style={styles.logoutDescription}>
          Sign out of your account and return to login screen
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Preferences</Text>
      <Text style={styles.sectionSubtitle}>
        Customize your TrailTalk experience
      </Text>

      <View style={styles.cardsContainer}>
        {settingsOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionCard}
            onPress={option.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${option.color}15` }]}>
              <Ionicons name={option.icon} size={24} color={option.color} />
            </View>
            
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDevelopersContent = () => (
    <View style={styles.contentSection}>
      <Text style={styles.sectionTitleSmall}>Meet the Team</Text>

      <View style={styles.teamContainer}>
        {teamMembers.map((member) => (
          <View key={member.id} style={styles.teamCard}>
            <View style={styles.teamMemberHeader}>
              <Image 
                source={member.image} 
                style={styles.developerImage}
                resizeMode="cover"
              />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
              <View style={[styles.roleIcon, { backgroundColor: `${member.iconColor}15` }]}>
                <Ionicons name={member.icon} size={16} color={member.iconColor} />
              </View>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.learnMoreButton}
        onPress={() => navigation.navigate('StudentDevelopers')}
        activeOpacity={0.7}
      >
        <Text style={styles.learnMoreText}>Learn More About Our Team</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Navigation */}
      <View
        style={styles.tabContainer}
        onLayout={(e) => {
          const fullWidth = e.nativeEvent.layout.width;
          const contentWidth = Math.max(0, fullWidth - TAB_CONTAINER_PADDING * 2);
          setTabWidth(contentWidth / tabs.length);
        }}
      >
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => handleTabPress(tab.id, index)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
        
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              width: INDICATOR_WIDTH,
              backgroundColor: colors.skyBlue,
              transform: [{ translateX: indicatorPosition }],
            },
          ]}
        />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'settings' ? renderSettingsContent() : renderDevelopersContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.homeBackground,
    paddingTop: Platform.OS === 'android' ? Math.max(0, (StatusBar.currentHeight || 0) - 15) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  headerRight: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 8,
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tabTextActive: {
    color: colors.white,
    fontFamily: fonts.semiBold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 100,
    height: 3,
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 8,
  },
  sectionTitleSmall: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
  },
  
  // Logout Section Styles
  // Logout Section Styles - Standalone Card
  logoutSection: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderRadius: 16,
    padding: 0, // Remove inner padding
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
    overflow: 'hidden', // For clean corners
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 12,
    width: '100%',
  },
  logoutText: {
    color: '#FF6B6B',
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  logoutDescription: {
    display: 'none', // Hide the description
  },
  // Cards Container
  cardsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  // Team/Developers Section
  teamContainer: {
    gap: 10,
    marginBottom: 24,
  },
  teamCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  teamMemberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  developerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  roleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef165bff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  learnMoreText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
});

export default StudentSettingsScreen;