import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { DONATION_PATHS } from '../../constants/donationPaths';

export default function AssignPathScreen({ navigation }) {
  const handlePathPress = (path) => {
    navigation.navigate('SelectCategory', { selectedPath: path });
  };

  const renderPathItem = (path, index) => (
    <TouchableOpacity
      key={path.id}
      style={[
        styles.pathItem,
        index !== DONATION_PATHS.length - 1 && styles.pathItemBorder
      ]}
      onPress={() => handlePathPress(path)}
      activeOpacity={0.7}
    >
      <View style={styles.pathItemLeft}>
        <View style={[styles.pathIconContainer, { backgroundColor: `${path.color}20` }]}>
          <Ionicons name={path.icon} size={24} color={path.color} />
        </View>
        <View style={styles.pathDetails}>
          <Text style={[styles.pathTitle, { color: path.color }]}>{path.title}</Text>
          <Text style={styles.pathDescription}>{path.description}</Text>
        </View>
      </View>
      <Ionicons name="arrow-forward" size={20} color={path.color} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.homeBackground} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Choose Your Path</Text>
          <Text style={styles.headerSubtitle}>Select how you'd like to make an impact</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Introduction */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Three Paths to Change Lives</Text>
          <Text style={styles.introDescription}>
            Every donation creates ripples of hope. Choose the path that speaks to your heart.
          </Text>
        </View>

        {/* Paths */}
        <View style={styles.pathsSection}>
          <Text style={styles.sectionTitle}>Available Paths</Text>
          <Text style={styles.sectionSubtitle}>
            Select from {DONATION_PATHS.length} meaningful ways to contribute
          </Text>

          <View style={styles.pathsContainer}>
            {DONATION_PATHS.map((path, index) => renderPathItem(path, index))}
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.homeBackground,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  introSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  introDescription: {
    fontSize: 16,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  pathsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  pathsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  pathItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  pathItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  pathItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pathIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  pathDetails: {
    flex: 1,
  },
  pathTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  pathDescription: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 20,
  },
});
