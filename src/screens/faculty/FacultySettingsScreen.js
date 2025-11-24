import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';

const FacultySettingsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('settings');
  const indicatorPosition = React.useRef(new Animated.Value(0)).current;

  const tabs = [
    { id: 'settings', label: 'Settings' },
    { id: 'developers', label: 'Developers' }
  ];

  const handleTabPress = (tabId, index) => {
    setActiveTab(tabId);
    Animated.spring(indicatorPosition, {
      toValue: index * 100,
      useNativeDriver: true,
      tension: 68,
      friction: 12
    }).start();
  };

  const settingsOptions = [
    {
      id: 'account',
      title: 'Account Settings',
      description: 'Manage your faculty profile and credentials',
      icon: 'person-outline',
      color: '#00E5FF',
      onPress: () => console.log('Navigate to Faculty Account Settings')
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
      id: 'moderation',
      title: 'Moderation Tools',
      description: 'Access content moderation and reporting tools',
      icon: 'flag-outline',
      color: '#EF4444',
      onPress: () => navigation.navigate('ReportDashboard')
    },
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: 'help-circle-outline',
      color: '#8B5CF6',
      onPress: () => console.log('Navigate to Help & Support')
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

  const teamMembers = [
    {
      id: 1,
      name: 'Alther',
      role: 'Lead Developer',
      description: 'Full-stack development & system architecture'
    },
    {
      id: 2,
      name: 'Celine',
      role: 'UI/UX Designer',
      description: 'User experience and interface design'
    },
    {
      id: 3,
      name: 'Divine',
      role: 'Backend Developer',
      description: 'Database design and API development'
    },
    {
      id: 4,
      name: 'Faisal',
      role: 'Mobile Developer',
      description: 'React Native and cross-platform development'
    },
    {
      id: 5,
      name: 'Harry',
      role: 'Project Manager',
      description: 'Project coordination and quality assurance'
    }
  ];

  const renderSettingsContent = () => (
    <View style={styles.contentSection}>
      <Text style={styles.sectionTitle}>Faculty Preferences</Text>
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
      <Text style={styles.sectionTitle}>Meet the Team</Text>
      <Text style={styles.sectionSubtitle}>
        The passionate developers behind TrailTalk
      </Text>

      <View style={styles.teamContainer}>
        {teamMembers.map((member) => (
          <View key={member.id} style={styles.teamCard}>
            <View style={styles.teamMemberHeader}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {member.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
            </View>
            <Text style={styles.memberDescription}>{member.description}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.learnMoreButton}
        onPress={() => navigation.navigate('FacultyDevelopers')}
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
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
            { transform: [{ translateX: indicatorPosition }] }
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
  sectionSubtitle: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
  },
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
  teamContainer: {
    gap: 12,
    marginBottom: 24,
  },
  teamCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  teamMemberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  memberDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
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

export default FacultySettingsScreen;