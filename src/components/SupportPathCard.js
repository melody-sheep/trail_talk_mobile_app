import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { fonts } from '../styles/fonts';

export default function SupportPathCard({ path = {}, onDonatePress = () => {}, showFacultyBadge = false, currentUserId = null }) {
	const renderItem = ({ item }) => (
		<View style={styles.itemRow}>
			<View style={styles.itemLeft}>
				<Ionicons name={item.icon || 'heart'} size={18} color={item.color || '#FFF'} />
				<View style={{ marginLeft: 8 }}>
					<Text style={styles.itemTitle}>{item.name || item.title}</Text>
					{item.quickDescription ? <Text style={styles.itemDesc}>{item.quickDescription}</Text> : null}
				</View>
			</View>
			<TouchableOpacity style={styles.donateBtn} onPress={() => onDonatePress(item)}>
				<Text style={styles.donateBtnText}>Donate</Text>
			</TouchableOpacity>
		</View>
	);

	return (
		<View style={styles.card}>
			<View style={styles.header}>
				<Text style={styles.title}>{path.title || path.name || 'Donation Path'}</Text>
				{showFacultyBadge && <Ionicons name="school" size={18} color="#8B5CF6" />}
			</View>

			{path.items && path.items.length > 0 ? (
				<FlatList
					data={path.items}
					keyExtractor={(i) => String(i.id || i.name || i.title)}
					renderItem={renderItem}
					scrollEnabled={false}
				/>
			) : (
				<Text style={styles.emptyText}>No items available</Text>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    marginBottom: 2,
  },
  itemDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fonts.normal,
    fontSize: 12,
    lineHeight: 16,
  },
  donateBtn: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  donateBtnText: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fonts.normal,
    textAlign: 'center',
    paddingVertical: 20,
  }
});
