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
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { DONATION_PATHS } from '../../constants/donationPaths';

export default function SelectCategoryScreen({ navigation, route }) {
  const { selectedPath } = route.params || {};
  const [customAmount, setCustomAmount] = useState('');

  const pathData = DONATION_PATHS.find(path => path.id === selectedPath.id);

  const handleCategoryPress = (item) => {
    if (item.amount === 0) {
      // Custom amount - show input
      if (customAmount && !isNaN(customAmount) && parseFloat(customAmount) > 0) {
        navigation.navigate('DonationFlow', {
          donationType: item.id,
          amount: parseFloat(customAmount),
          pathName: pathData.title,
          itemName: item.name,
          isCustom: true
        });
      } else {
        Alert.alert('Enter Amount', 'Please enter a valid donation amount');
      }
    } else {
      // Fixed amount
      navigation.navigate('DonationFlow', {
        donationType: item.id,
        amount: item.amount,
        pathName: pathData.title,
        itemName: item.name,
        isCustom: false
      });
    }
  };

  const renderCategoryItem = (item, index) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.categoryItem,
        index !== pathData.items.length - 1 && styles.categoryItemBorder
      ]}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryItemLeft}>
        <View style={[styles.itemIconContainer, { backgroundColor: `${item.color}20` }]}>
          <Ionicons name={item.icon} size={20} color={item.color} />
        </View>
        <View style={styles.itemDetails}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.amount > 0 && (
              <View style={[styles.amountBadge, { backgroundColor: `${pathData.color}20` }]}>
                <Text style={[styles.amountText, { color: pathData.color }]}>
                  ₱{item.amount}{item.isMonthly ? '/month' : ''}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.itemDescription}>{item.description}</Text>
          {item.subDescription && (
            <Text style={styles.itemSubDescription}>{item.subDescription}</Text>
          )}
        </View>
      </View>
      <Ionicons name="arrow-forward" size={18} color={pathData.color} />
    </TouchableOpacity>
  );

  const customItem = pathData.items.find(item => item.amount === 0);

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
          <Text style={styles.headerTitle}>Select Category</Text>
          <Text style={[styles.headerSubtitle, { color: pathData.color }]}>
            {pathData.title}
          </Text>
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
          {/* Path Info */}
          <View style={[styles.pathInfoCard, { borderLeftColor: pathData.color }]}>
            <View style={styles.pathInfoHeader}>
              <View style={[styles.pathIconContainer, { backgroundColor: `${pathData.color}20` }]}>
                <Ionicons name={pathData.icon} size={20} color={pathData.color} />
              </View>
              <Text style={[styles.pathInfoTitle, { color: pathData.color }]}>
                {pathData.title}
              </Text>
            </View>
            <Text style={styles.pathInfoDescription}>{pathData.description}</Text>
          </View>

          {/* Categories */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Choose Your Impact</Text>
            <Text style={styles.sectionSubtitle}>
              Select from {pathData.items.length} ways to make a difference
            </Text>

            <View style={styles.categoriesContainer}>
              {pathData.items.map((item, index) => renderCategoryItem(item, index))}
            </View>
          </View>

          {/* Custom Amount Input (only show if there's a custom item) */}
          {customItem && (
            <View style={styles.customAmountSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="create-outline" size={20} color="#4ECDC4" />
                <Text style={styles.sectionTitle}>Or Enter Custom Amount</Text>
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
                  onPress={() => handleCategoryPress(customItem)}
                  disabled={!customAmount || parseFloat(customAmount) <= 0}
                >
                  <Text style={styles.customDonateButtonText}>Donate Custom Amount</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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
  pathInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 4,
  },
  pathInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pathIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pathInfoTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  pathInfoDescription: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  categoriesSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
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
  categoriesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryItemLeft: {
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
  customAmountSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
  },
  customDonateButtonText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  bottomSpacer: {
    height: 20,
  },
});
