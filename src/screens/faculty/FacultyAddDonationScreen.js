import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../../contexts/UserContext';

export default function FacultyAddDonationScreen({ navigation }) {
  const { user } = useContext(UserContext);
  const [title, setTitle] = useState('Meal Allowance');
  const [description, setDescription] = useState('Provide a short note about the need');
  const [amount, setAmount] = useState('49');
  const [path, setPath] = useState('immediateRescue');

  const handleSubmit = () => {
    if (!title || !amount) {
      Alert.alert('Validation', 'Please enter a title and amount');
      return;
    }

    // For now, just simulate creation. DB integration will follow.
    Alert.alert('Donation Created', `"${title}" ₱${amount} created under ${path}. It will appear in donation paths after backend integration.`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Donation Offer</Text>
          <Text style={styles.headerSubtitle}>Faculty can add urgent donation offers</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} />

          <Text style={styles.label}>Amount (₱)</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />

          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} multiline numberOfLines={4} />

          <Text style={styles.label}>Path</Text>
          <View style={styles.pathRow}>
            {[
              { id: 'immediateRescue', label: 'Immediate Rescue' },
              { id: 'dualImpact', label: 'Dual Impact' },
              { id: 'sustainingLegacy', label: 'Sustaining Legacy' }
            ].map(p => (
              <TouchableOpacity key={p.id} style={[styles.pathButton, path === p.id && styles.pathButtonActive]} onPress={() => setPath(p.id)}>
                <Text style={[styles.pathButtonText, path === p.id && styles.pathButtonTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.submitButtonText}>Create Donation Offer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.homeBackground },
  container: { padding: 16 },
  header: { marginBottom: 12 },
  headerTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.white },
  headerSubtitle: { fontFamily: fonts.normal, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  form: { marginTop: 12 },
  label: { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.semiBold, marginBottom: 6 },
  input: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 12, color: colors.white, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 12 },
  multiline: { height: 100, textAlignVertical: 'top' },
  pathRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pathButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)' },
  pathButtonActive: { backgroundColor: '#4ECDC4' },
  pathButtonText: { color: 'rgba(255,255,255,0.8)' },
  pathButtonTextActive: { color: colors.white, fontFamily: fonts.semiBold },
  submitButton: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4ECDC4', padding: 12, borderRadius: 10 },
  submitButtonText: { color: colors.white, fontFamily: fonts.bold, marginLeft: 6 }
});
