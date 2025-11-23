import React, { useState, useContext } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { fonts } from '../styles/fonts';
import { colors } from '../styles/colors';
import { UserContext } from '../contexts/UserContext';
import reportCategories from '../constants/reportCategories';

export default function BannedWordModal({ visible, onClose, onAdded }) {
  const [word, setWord] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useContext(UserContext);

  const handleAdd = async () => {
    if (!word.trim()) return;
    setLoading(true);
    try {
      await supabase.from('banned_words').insert([{ word: word.trim(), category: category.trim() || null, created_by: user?.id }]);
      setWord(''); 
      setCategory('');
      onAdded && onAdded();
      onClose && onClose();
    } catch (err) {
      console.log('Error adding banned word', err);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = word && word.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.backdropTouchable} onPress={onClose} activeOpacity={1} />
          <SafeAreaView style={styles.sheet} edges={["bottom"]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <MaterialIcons name="block" size={24} color="#EF4444" style={styles.headerIcon} />
                <Text style={styles.title}>Add Banned Word</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={22} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>Prevent inappropriate content by adding words to the banned list</Text>

            {/* Word Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Banned Word</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter word or phrase..." 
                placeholderTextColor="rgba(255,255,255,0.4)" 
                value={word} 
                onChangeText={setWord}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {!canSubmit && word.length > 0 && (
                <Text style={styles.validationText}>Please enter a valid word</Text>
              )}
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category (optional)</Text>
              <Text style={styles.sectionSubtitle}>Associate this word with a specific report category</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.chipsContainer}
                contentContainerStyle={styles.chipsContent}
              >
                {reportCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat === category ? '' : cat)}
                    style={[
                      styles.chip,
                      category === cat && styles.chipSelected
                    ]}
                  >
                    <Text style={[
                      styles.chipText,
                      category === cat && styles.chipTextSelected
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={styles.btnCancel} 
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.btnAdd, 
                  loading && styles.btnLoading,
                  !canSubmit && styles.btnDisabled
                ]}
                onPress={handleAdd}
                disabled={loading || !canSubmit}
              >
                <Text style={styles.btnAddText}>
                  {loading ? 'Adding...' : 'Add Word'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  backdropTouchable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
    marginBottom: 30, // small buffer above device bottom
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.white,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    color: colors.white,
    fontFamily: fonts.normal,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  validationText: {
    color: '#EF4444',
    fontFamily: fonts.normal,
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  chipsContainer: {
    marginBottom: 4,
  },
  chipsContent: {
    paddingRight: 20,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  chipText: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  chipTextSelected: {
    color: colors.white,
    fontFamily: fonts.semiBold,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  btnCancelText: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  btnAdd: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  btnAddText: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnLoading: {
    opacity: 0.7,
  },
});