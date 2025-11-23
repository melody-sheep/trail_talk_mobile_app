import React, { useState, useContext, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { UserContext } from '../contexts/UserContext';
import { fonts } from '../styles/fonts';
import { colors } from '../styles/colors';
import reportCategories from '../constants/reportCategories';

export default function ReportModal({ visible, onClose, postId, onSubmitted }) {
  const { user } = useContext(UserContext);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const submitReport = async () => {
    if (!selectedCategory || !postId || !user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('reports').insert([
        {
          post_id: postId,
          reporter_id: user.id,
          category: selectedCategory,
          description,
        }
      ]);
      if (error) {
        console.log('Error inserting report:', error);
      } else {
        // clear inputs and show a short toast then close
        setSelectedCategory(null);
        setDescription('');
        setSuccessVisible(true);
        Animated.timing(toastAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
        // after 2 seconds, hide toast and then close modal / notify parent
        setTimeout(() => {
          Animated.timing(toastAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
            setSuccessVisible(false);
            onSubmitted && onSubmitted();
            onClose && onClose();
          });
        }, 2000);
      }
    } catch (err) {
      console.log('submitReport error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType="slide" visible={visible} transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.backdropTouchable} onPress={onClose} activeOpacity={1} />
          <SafeAreaView style={styles.sheet} edges={["bottom"]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Report Post</Text>
              <Text style={styles.subtitle}>Help keep our community safe</Text>
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose a category</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.chipsRow}
                contentContainerStyle={styles.chipsContainer}
              >
                {reportCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chip,
                      selectedCategory === cat && styles.chipSelected
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[
                      styles.chipText,
                      selectedCategory === cat && styles.chipTextSelected
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Description Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional details (optional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe what's concerning about this post..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.input}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
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
                  styles.btnSubmit, 
                  (!selectedCategory || loading) && styles.btnDisabled
                ]}
                onPress={submitReport}
                disabled={!selectedCategory || loading}
              >
                <Text style={styles.btnSubmitText}>
                  {loading ? 'Submitting...' : 'Submit Report'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Success toast */}
          {successVisible && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.toast,
                {
                  opacity: toastAnim,
                  transform: [
                    { translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }
                  ]
                }
              ]}
            >
              <Text style={styles.toastText}>Report submitted</Text>
            </Animated.View>
          )}
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
    marginBottom: 0, // small buffer above device bottom
    maxHeight: '90%',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.6)',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
    marginBottom: 12,
  },
  chipsRow: {
    marginBottom: 4,
  },
  chipsContainer: {
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
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
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
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    color: colors.white,
    minHeight: 100,
    fontFamily: fonts.normal,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginRight: 10,
    alignItems: 'center',
  },
  btnCancelText: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  btnSubmit: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  btnSubmitText: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.4,
  }
  ,
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  toastText: {
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 14,
  }
});