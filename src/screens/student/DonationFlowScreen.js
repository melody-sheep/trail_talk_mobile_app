// src/screens/student/DonationFlowScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert
  ,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { getRandomImpactStory } from '../../constants/impactStories';
import { supabase } from '../../lib/supabase';
import { UserContext } from '../../contexts/UserContext';

export default function DonationFlowScreen({ navigation, route }) {
  const { donationType, amount, pathName, itemName, isCustom } = route.params || {};
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('gcash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [postAnonymously, setPostAnonymously] = useState(true);
  const [donorDisplayName, setDonorDisplayName] = useState('Anonymous User');
  const { user } = useContext(UserContext);

  // Payment methods
  const paymentMethods = [
    { id: 'gcash', name: 'GCash', icon: 'phone-portrait-outline', color: '#007AFF' },
    { id: 'paymaya', name: 'PayMaya', icon: 'card-outline', color: '#6C3BDC' },
    { id: 'credit', name: 'Credit/Debit Card', icon: 'card-outline', color: '#FF6B6B' },
    { id: 'bank', name: 'Bank Transfer', icon: 'business-outline', color: '#4CAF50' },
    { id: 'counter', name: 'Over-the-Counter', icon: 'storefront-outline', color: '#FFA726' },
  ];

  // Get impact story
  const impactStory = getRandomImpactStory(donationType);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, username, student_id, school_email, post_anonymously')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setPostAnonymously(data.post_anonymously ?? true);
          // prefer display_name, then username, then email prefix
          let name = 'Anonymous User';
          if (data.display_name && data.display_name.trim() !== '') name = data.display_name;
          else if (data.username) name = data.username;
          else if (data.school_email) name = data.school_email.split('@')[0];
          setDonorDisplayName(name);
        }
      } catch (e) {
        console.log('Error fetching profile in DonationFlow:', e);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handlePaymentSelect = (methodId) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleConfirmDonation = () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      // Determine donor name for ledger based on toggle
      const donorNameForLedger = postAnonymously ? 'Anonymous User' : donorDisplayName || (user?.email ? user.email.split('@')[0] : 'Supporter');

      // Show success with impact story and donor visibility
      Alert.alert(
        '🎉 Donation Successful!',
        `${impactStory}\n\nYour ₱${amount} donation has been processed as ${donorNameForLedger}. Thank you for making a difference!`,
        [
          {
            text: 'View Ledger',
            onPress: () => {
              // Navigate to DonationLedger (the ledger screen will show real data when DB is ready)
              navigation.navigate('DonationLedger');
            }
          },
          {
            text: 'Share',
            onPress: () => {
              console.log('Share donation');
            }
          },
          {
            text: 'Done',
            onPress: () => navigation.navigate('Support'),
            style: 'cancel'
          }
        ]
      );
    }, 2000);
  };

  const renderPaymentMethod = (method) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentMethod,
        selectedPaymentMethod === method.id && styles.paymentMethodSelected
      ]}
      onPress={() => handlePaymentSelect(method.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.methodIconContainer, { backgroundColor: `${method.color}20` }]}>
        <Ionicons name={method.icon} size={22} color={method.color} />
      </View>
      <View style={styles.methodDetails}>
        <Text style={styles.methodName}>{method.name}</Text>
        <Text style={styles.methodDescription}>
          {method.id === 'gcash' && 'Philippine mobile wallet'}
          {method.id === 'paymaya' && 'Digital wallet & prepaid card'}
          {method.id === 'credit' && 'Visa, Mastercard, etc.'}
          {method.id === 'bank' && 'BDO, BPI, Metrobank'}
          {method.id === 'counter' && '7-Eleven, Palawan Express'}
        </Text>
      </View>
      {selectedPaymentMethod === method.id && (
        <Ionicons name="checkmark-circle" size={24} color={method.color} />
      )}
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
          <Text style={styles.headerTitle}>Complete Donation</Text>
          <Text style={styles.headerSubtitle}>Final step to create hope</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Donation Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#4ECDC4" />
            <Text style={styles.summaryTitle}>Donation Summary</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Donation Type:</Text>
              <Text style={styles.summaryValue}>{itemName}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Path:</Text>
              <Text style={styles.summaryValue}>{pathName}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount:</Text>
              <Text style={[styles.summaryValue, styles.amountValue]}>₱{amount}</Text>
            </View>
            
            <View style={styles.impactPreview}>
              <Ionicons name="heart" size={16} color="#FF6B6B" />
              <Text style={styles.impactPreviewText}>{impactStory}</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet-outline" size={24} color="#FFA726" />
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            Choose how you want to pay (simulated for demo)
          </Text>
          
          <View style={styles.paymentMethodsContainer}>
            {paymentMethods.map(renderPaymentMethod)}
          </View>
        </View>

        {/* Payment Details (Simulated) */}
        {selectedPaymentMethod && (
          <View style={styles.detailsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={24} color="#4ECDC4" />
              <Text style={styles.sectionTitle}>Payment Details</Text>
            </View>
            
            <View style={styles.detailsCard}>
              <Text style={styles.detailsNote}>
                💡 This is a simulation. In a real implementation, you would enter payment details here.
              </Text>
              
              <View style={styles.simulatedDetails}>
                <View style={styles.simulatedRow}>
                  <View style={styles.simulatedLabel} />
                  <Text style={styles.simulatedText}>•••• •••• •••• 1234</Text>
                </View>
                <View style={styles.simulatedRow}>
                  <View style={styles.simulatedLabel} />
                  <Text style={styles.simulatedText}>MM/YY</Text>
                </View>
                <View style={styles.simulatedRow}>
                  <View style={styles.simulatedLabel} />
                  <Text style={styles.simulatedText}>•••</Text>
                </View>
              </View>
              
              <Text style={styles.disclaimer}>
                ⚠️ This is a demonstration only. No real money will be transferred.
              </Text>
            </View>
          </View>
        )}

        {/* Confirm Button */}
        {/* Name visibility toggle (hide/show in ledger) */}
        <View style={styles.nameToggleContainer}>
          <Text style={styles.nameToggleLabel}>Hide my name in ledger</Text>
          <View style={styles.nameToggleRight}>
            <Text style={styles.namePreview}>{postAnonymously ? 'Anonymous' : donorDisplayName}</Text>
            <Switch
              value={postAnonymously}
              onValueChange={(val) => setPostAnonymously(val)}
              thumbColor={postAnonymously ? '#fff' : '#fff'}
              trackColor={{ false: '#4ECDC4', true: '#888' }}
            />
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            isProcessing && styles.confirmButtonProcessing
          ]}
          onPress={handleConfirmDonation}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Ionicons name="sync" size={20} color={colors.white} style={styles.spinningIcon} />
              <Text style={styles.confirmButtonText}>Processing Donation...</Text>
            </>
          ) : (
            <>
              <Ionicons name="heart" size={20} color={colors.white} />
              <Text style={styles.confirmButtonText}>Confirm Donation of ₱{amount}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.securityText}>
            Your donation is secure and will be recorded in our transparent ledger
          </Text>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  // Summary Section
  summarySection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  amountValue: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: '#4ECDC4',
  },
  impactPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  impactPreviewText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  // Payment Section
  paymentSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  paymentMethodsContainer: {
    gap: 10,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  paymentMethodSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  // Details Section
  detailsSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  detailsNote: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
    lineHeight: 18,
  },
  simulatedDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  simulatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  simulatedLabel: {
    width: 80,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginRight: 12,
  },
  simulatedText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 107, 107, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Confirm Button
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  confirmButtonProcessing: {
    backgroundColor: '#4ECDC4',
    opacity: 0.8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  spinningIcon: {
    animation: 'spin 1s linear infinite',
  },
  // Security Note
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  securityText: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    flex: 1,
  },
  bottomSpacer: {
    height: 20,
  },
  nameToggleContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  nameToggleLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: 'rgba(255,255,255,0.9)'
  },
  nameToggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  namePreview: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.7)'
  },
});