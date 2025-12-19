// src/screens/student/DonationLedgerScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { DONATION_LEDGER, INITIAL_IMPACT_COUNTERS } from '../../constants/donationPaths';

export default function DonationLedgerScreen({ navigation }) {
  const [filter, setFilter] = useState('all');
  const [ledgerData, setLedgerData] = useState(DONATION_LEDGER);
  
  // Filters
  const filters = [
    { id: 'all', label: 'All Donations' },
    { id: 'recent', label: 'Recent' },
    { id: 'large', label: 'Large Donations' },
    { id: 'monthly', label: 'Monthly' },
  ];

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get icon and color for donation type
  const getDonationTypeInfo = (type) => {
    switch(type) {
      case 'meal':
        return { icon: 'fast-food-outline', color: '#FF6B6B', label: 'Meal' };
      case 'transport':
        return { icon: 'bus-outline', color: '#FF9E6B', label: 'Transport' };
      case 'print':
        return { icon: 'print-outline', color: '#FFD166', label: 'Printing' };
      case 'platformStudent':
        return { icon: 'git-compare-outline', color: '#1DD1A1', label: 'Dual Impact' };
      case 'studentSustainer':
        return { icon: 'heart-outline', color: '#9B5DE5', label: 'Sustainer' };
      default:
        return { icon: 'cash-outline', color: '#4ECDC4', label: 'Donation' };
    }
  };

  const renderLedgerItem = ({ item }) => {
    const typeInfo = getDonationTypeInfo(item.type);
    
    return (
      <View style={styles.ledgerItem}>
        <View style={styles.ledgerItemLeft}>
          <View style={[styles.typeIconContainer, { backgroundColor: `${typeInfo.color}15` }]}>
            <Ionicons name={typeInfo.icon} size={18} color={typeInfo.color} />
          </View>
          
          <View style={styles.ledgerContent}>
            <View style={styles.ledgerHeader}>
              <Text style={styles.ledgerTitle}>{item.impact}</Text>
              <Text style={[styles.ledgerAmount, { color: typeInfo.color }]}>₱{item.amount}</Text>
            </View>
            
            <View style={styles.ledgerDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={12} color="rgba(255, 255, 255, 0.5)" />
                <Text style={styles.detailText}>{item.donor}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={12} color="rgba(255, 255, 255, 0.5)" />
                <Text style={styles.detailText}>{formatDate(item.date)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="pricetag-outline" size={12} color="rgba(255, 255, 255, 0.5)" />
                <Text style={[styles.detailText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
              </View>
            </View>
            
            {/* Blockchain-like hash (simulated) */}
            <View style={styles.hashContainer}>
              <Text style={styles.hashLabel}>Transaction ID:</Text>
              <Text style={styles.hashValue}>TX{Math.random().toString(36).substr(2, 9).toUpperCase()}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.statusIndicator}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.statusText}>Completed</Text>
        </View>
      </View>
    );
  };

  const renderFilterChip = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        filter === item.id && styles.filterChipSelected
      ]}
      onPress={() => setFilter(item.id)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.filterChipText,
        filter === item.id && styles.filterChipTextSelected
      ]}>
        {item.label}
      </Text>
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
          <Text style={styles.headerTitle}>Donations Ledger</Text>
          <Text style={styles.headerSubtitle}>Transparent record of all contributions</Text>
        </View>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download-outline" size={22} color="#4ECDC4" />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsOverview}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{ledgerData.length}</Text>
          <Text style={styles.statLabel}>Total Donations</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            ₱{ledgerData.reduce((sum, item) => sum + item.amount, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Amount</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{INITIAL_IMPACT_COUNTERS.studentsHelped}</Text>
          <Text style={styles.statLabel}>Students Helped</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={filters}
          renderItem={renderFilterChip}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Ledger List */}
      <View style={styles.ledgerContainer}>
        <View style={styles.ledgerHeaderSection}>
          <View style={styles.ledgerTitleRow}>
            <Ionicons name="document-text-outline" size={20} color="#4ECDC4" />
            <Text style={styles.ledgerSectionTitle}>Recent Transactions</Text>
          </View>
          <Text style={styles.ledgerSubtitle}>
            Every donation is recorded like a blockchain transaction
          </Text>
        </View>
        
        {ledgerData.length > 0 ? (
          <FlatList
            data={ledgerData}
            renderItem={renderLedgerItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ledgerList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={60} color="rgba(255, 255, 255, 0.2)" />
            <Text style={styles.emptyStateTitle}>No donations yet</Text>
            <Text style={styles.emptyStateText}>
              Be the first to make a donation and start creating hope!
            </Text>
            <TouchableOpacity 
              style={styles.makeDonationButton}
              onPress={() => navigation.navigate('DonationSelection')}
            >
              <Text style={styles.makeDonationButtonText}>Make a Donation</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Blockchain Info */}
      <View style={styles.blockchainInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="lock-closed" size={16} color="#4CAF50" />
          <Text style={styles.infoText}>Immutable record - cannot be altered</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="eye" size={16} color="#4ECDC4" />
          <Text style={styles.infoText}>Publicly viewable - 100% transparent</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time" size={16} color="#FFA726" />
          <Text style={styles.infoText}>Timestamped - every transaction recorded</Text>
        </View>
      </View>
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
  exportButton: {
    padding: 8,
  },
  // Stats Overview
  statsOverview: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  // Filters
  filtersContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  filtersList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipSelected: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filterChipTextSelected: {
    color: colors.white,
    fontFamily: fonts.semiBold,
  },
  // Ledger Container
  ledgerContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  ledgerHeaderSection: {
    marginBottom: 16,
  },
  ledgerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ledgerSectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  ledgerSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  ledgerList: {
    paddingBottom: 20,
  },
  // Ledger Item
  ledgerItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  ledgerItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ledgerContent: {
    flex: 1,
  },
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ledgerTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.white,
    flex: 1,
    marginRight: 12,
    lineHeight: 20,
  },
  ledgerAmount: {
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  ledgerDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  hashContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  hashLabel: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 2,
  },
  hashValue: {
    fontSize: 11,
    fontFamily: fonts.mono,
    color: '#4ECDC4',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#4CAF50',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  makeDonationButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  makeDonationButtonText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  // Blockchain Info
  blockchainInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    flex: 1,
  },
});