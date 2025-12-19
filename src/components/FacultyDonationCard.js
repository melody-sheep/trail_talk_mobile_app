// src/components/FacultyDonationCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { fonts } from '../styles/fonts';

export default function FacultyDonationCard({ donation, onPress = () => {} }) {
  // Get path-specific colors - matching donationPaths.js
  const getPathColor = (pathId) => {
    switch(pathId) {
      case 'immediateRescue': return '#FF6B6B'; // Red
      case 'dualImpact': return '#1DD1A1'; // Green
      case 'sustainingLegacy': return '#9B5DE5'; // Purple
      default: return '#8B5CF6'; // Faculty purple
    }
  };

  const getPathIcon = (pathId) => {
    switch(pathId) {
      case 'immediateRescue': return 'flash';
      case 'dualImpact': return 'git-compare';
      case 'sustainingLegacy': return 'infinite';
      default: return 'heart-circle';
    }
  };

  const getPathName = (pathId) => {
    switch(pathId) {
      case 'immediateRescue': return 'Path 1';
      case 'dualImpact': return 'Path 2';
      case 'sustainingLegacy': return 'Path 3';
      default: return 'Custom';
    }
  };

  const pathColor = getPathColor(donation.path);
  const pathIcon = getPathIcon(donation.path);
  const pathName = getPathName(donation.path);

  return (
    <TouchableOpacity 
      style={[styles.card, { borderColor: `${pathColor}30` }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Top Row: Icon and Title */}
      <View style={styles.topRow}>
        <Ionicons 
          name={pathIcon} 
          size={20} 
          color={pathColor} 
          style={styles.icon}
        />
        <Text style={styles.title} numberOfLines={2}>
          {donation.title}
        </Text>
      </View>

      {/* Middle Row: Amount */}
      <Text style={[styles.amount, { color: pathColor }]}>
        ₱{donation.amount}
      </Text>

      {/* Bottom Row: Path and Created Badge */}
      <View style={styles.bottomRow}>
        <View style={[styles.pathBadge, { backgroundColor: `${pathColor}15` }]}>
          <Text style={[styles.pathText, { color: pathColor }]}>
            {pathName}
          </Text>
        </View>
        
        <View style={[styles.createdBadge, { backgroundColor: `${pathColor}10` }]}>
          <Ionicons name="create-outline" size={10} color={pathColor} />
          <Text style={[styles.createdText, { color: pathColor }]}>
            Created
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 14,
    width: 180, // Compact width
    borderWidth: 1.5,
    marginRight: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 10,
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.white,
    flex: 1,
    lineHeight: 18,
  },
  amount: {
    fontSize: 22,
    fontFamily: fonts.bold,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pathBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pathText: {
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  createdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  createdText: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
  },
});