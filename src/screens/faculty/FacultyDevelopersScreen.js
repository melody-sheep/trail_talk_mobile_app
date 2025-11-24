import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';

const FacultyDevelopersScreen = ({ navigation }) => {
  const teamMembers = [
    {
      id: 1,
      name: 'Alther',
      role: 'Lead Developer',
      description: 'Responsible for full-stack development and system architecture. Alther designed the core infrastructure and implemented the real-time features.',
      skills: ['React Native', 'Node.js', 'PostgreSQL', 'Supabase']
    },
    {
      id: 2,
      name: 'Celine',
      role: 'UI/UX Designer',
      description: 'Crafted the beautiful user interface and seamless user experience. Celine ensured the app is both functional and visually appealing.',
      skills: ['Figma', 'UI Design', 'UX Research', 'Prototyping']
    },
    {
      id: 3,
      name: 'Divine',
      role: 'Backend Developer',
      description: 'Built the robust backend infrastructure and database design. Divine implemented the complex business logic and API integrations.',
      skills: ['Node.js', 'PostgreSQL', 'REST APIs', 'Authentication']
    },
    {
      id: 4,
      name: 'Faisal',
      role: 'Mobile Developer',
      description: 'Specialized in React Native development and cross-platform compatibility. Faisal brought the designs to life with smooth animations.',
      skills: ['React Native', 'JavaScript', 'Mobile Development', 'Animation']
    },
    {
      id: 5,
      name: 'Harry',
      role: 'Project Manager',
      description: 'Coordinated the development process and ensured timely delivery. Harry maintained quality standards and team communication.',
      skills: ['Project Management', 'Agile', 'Quality Assurance', 'Documentation']
    }
  ];

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
        <Text style={styles.headerTitle}>Development Team</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Meet the TrailTalk Team</Text>
          <Text style={styles.heroDescription}>
            A passionate group of developers and designers dedicated to creating 
            the best campus social experience for students and faculty.
          </Text>
        </View>

        {/* Team Members */}
        <View style={styles.teamSection}>
          {teamMembers.map((member) => (
            <View key={member.id} style={styles.developerCard}>
              <View style={styles.developerHeader}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {member.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.developerInfo}>
                  <Text style={styles.developerName}>{member.name}</Text>
                  <Text style={styles.developerRole}>{member.role}</Text>
                </View>
              </View>
              
              <Text style={styles.developerDescription}>{member.description}</Text>
              
              <View style={styles.skillsContainer}>
                {member.skills.map((skill, index) => (
                  <View key={index} style={styles.skillChip}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            TrailTalk v1.0 • Built with ❤️ for the campus community
          </Text>
        </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  teamSection: {
    paddingHorizontal: 20,
    gap: 16,
  },
  developerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  developerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  developerInfo: {
    flex: 1,
  },
  developerName: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  developerRole: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  developerDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});

export default FacultyDevelopersScreen;