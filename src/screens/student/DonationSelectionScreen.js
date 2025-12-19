// src/screens/student/DonationSelectionScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { DONATION_PATHS } from '../../constants/donationPaths';

export default function DonationSelectionScreen({ navigation, route }) {
  const [selectedPath, setSelectedPath] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [expandedPath, setExpandedPath] = useState(null);

  // Get all donation paths
  const donationPaths = DONATION_PATHS;

  const handlePathSelect = (path) => {
    setSelectedPath(path.id);
    setExpandedPath(expandedPath === path.id ? null : path.id);
  };

  const handleDonationItemPress = (path, item) => {
    // Navigate to donation flow with selected item
    navigation.navigate('DonationFlow', {
      donationType: item.id,
      amount: item.amount,
      pathName: path.title,
      itemName: item.name,
      isCustom: false
    });
  };

  const handleCustomDonation = () => {
    if (customAmount && !isNaN(customAmount) && parseFloat(customAmount) > 0) {
      navigation.navigate('DonationFlow', {
        donationType: 'custom',
        amount: parseFloat(customAmount),
        pathName: 'Custom Donation',
        itemName: 'Custom Amount Donation',
        isCustom: true
      });
    } else {
      alert('Please enter a valid amount');
    }
  };

  const renderDonationItem = (item, path, index) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.donationItem,
        index !== path.items.length - 1 && styles.donationItemBorder
      ]}
      onPress={() => handleDonationItemPress(path, item)}
      activeOpacity={0.7}
    >
      <View style={styles.donationItemLeft}>
        <View style={[styles.itemIconContainer, { backgroundColor: `${item.color}20` }]}>
          <Ionicons name={item.icon} size={20} color={item.color} />
        </View>
        <View style={styles.itemDetails}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={[styles.amountBadge, { backgroundColor: `${path.color}20` }]}>
              <Text style={[styles.amountText, { color: path.color }]}>
                ₱{item.amount}{item.isMonthly ? '/month' : ''}
              </Text>
            </View>
          </View>
          <Text style={styles.itemDescription}>{item.description}</Text>
          {item.subDescription && (
            <Text style={styles.itemSubDescription}>{item.subDescription}</Text>
          )}
        </View>
      </View>
      <Ionicons name="arrow-forward" size={18} color={path.color} />
    </TouchableOpacity>
  );

  const renderDonationPath = (path) => (
    <View key={path.id} style={[styles.donationPathCard, { borderLeftColor: path.color }]}>
      {/* Path Header */}
      <TouchableOpacity 
        style={styles.pathHeader}
        onPress={() => handlePathSelect(path)}
        activeOpacity={0.7}
      >
        <View style={styles.pathHeaderLeft}>
          <View style={[styles.pathIconContainer, { backgroundColor: `${path.color}20` }]}>
            <Ionicons name={path.icon} size={22} color={path.color} />
          </View>
          <View style={styles.pathTitleContainer}>
            <Text style={[styles.pathTitle, { color: path.color }]}>{path.title}</Text>
            <Text style={styles.pathDescription}>{path.description}</Text>
          </View>
        </View>
        <Ionicons 
          name={expandedPath === path.id ? 'chevron-up' : 'chevron-down'} 
          size={22} 
          color={path.color}
        />
      </TouchableOpacity>

      {/* Path Items (expanded when selected) */}
      {expandedPath === path.id && (
        <View style={styles.pathItemsContainer}>
          {path.items.map((item, index) => renderDonationItem(item, path, index))}
        </View>
      )}
    </View>
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
          <Text style={styles.headerTitle}>Choose Your Donation</Text>
          <Text style={styles.headerSubtitle}>Every peso creates hope</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Custom Donation Section */}
          <View style={styles.customDonationSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="create-outline" size={20} color="#4ECDC4" />
              <Text style={styles.sectionTitle}>Or Donate Any Amount</Text>
            </View>
            
            <View style={styles.customAmountContainer}>
              <View style={styles.amountInputWrapper}>
                <Text style={styles.pesoSign}>₱</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
              
              <TouchableOpacity
                style={[
                  styles.customDonateButton,
                  { opacity: customAmount && parseFloat(customAmount) > 0 ? 1 : 0.6 }
                ]}
                onPress={handleCustomDonation}
                disabled={!customAmount || parseFloat(customAmount) <= 0}
              >
                <Text style={styles.customDonateButtonText}>Donate Custom Amount</Text>
              </TouchableOpacity>
              
              <Text style={styles.quickAmountsLabel}>Quick amounts:</Text>
              <View style={styles.quickAmountsContainer}>
                {[100, 200, 500, 1000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickAmountButton}
                    onPress={() => {
                      setCustomAmount(amount.toString());
                      setTimeout(() => {
                        navigation.navigate('DonationFlow', {
                          donationType: 'custom',
                          amount: amount,
                          pathName: 'Quick Donation',
                          itemName: `₱${amount} Donation`,
                          isCustom: true
                        });
                      }, 100);
                    }}
                  >
                    <Text style={styles.quickAmountText}>₱{amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* All Donation Paths */}
          <View style={styles.donationPathsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart" size={20} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Choose a Donation Path</Text>
            </View>
            
            <Text style={styles.sectionSubtitle}>
              Select from predefined donation types
            </Text>
            
            {donationPaths.map(renderDonationPath)}
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>100% Transparent</Text>
                <Text style={styles.infoText}>
                  Every donation is recorded in our public ledger. You can track exactly how your money helps.
                </Text>
              </View>
            </View>
            
            <View style={styles.infoCard}>
              <Ionicons name="repeat" size={24} color="#9B5DE5" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Monthly Options Available</Text>
                <Text style={styles.infoText}>
                  Choose sustaining donations to provide continuous support throughout the semester.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  // Custom Donation Section
  customDonationSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  customAmountContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pesoSign: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    padding: 0,
  },
  customDonateButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  customDonateButtonText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  quickAmountsLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 10,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickAmountText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  // Donation Paths Section
  donationPathsSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  donationPathCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  pathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  pathHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pathIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pathTitleContainer: {
    flex: 1,
  },
  pathTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  pathDescription: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  pathItemsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  donationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  donationItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  donationItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.white,
    flex: 1,
  },
  amountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  amountText: {
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  itemDescription: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  itemSubDescription: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
    marginTop: 2,
    lineHeight: 16,
  },
  // Info Section
  infoSection: {
    paddingHorizontal: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 20,
  },
});