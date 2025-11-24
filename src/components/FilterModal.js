// src/components/FilterModal.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { fonts } from '../styles/fonts';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FilterModal = ({ visible, onClose, onApplyFilters, selectedCategories = [] }) => {
  const [tempSelectedCategories, setTempSelectedCategories] = useState([...selectedCategories]);
  const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;

  React.useEffect(() => {
    if (visible) {
      setTempSelectedCategories([...selectedCategories]);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const categories = [
    { 
      id: 'academics', 
      name: 'Academics', 
      icon: 'school-outline',
      iconType: 'Ionicons',
      color: '#4ECDC4'
    },
    { 
      id: 'rant', 
      name: 'Rant', 
      icon: 'chatbubble-outline',
      iconType: 'Ionicons',
      color: '#FF6B6B'
    },
    { 
      id: 'support', 
      name: 'Support', 
      icon: 'handshake-outline',
      iconType: 'MaterialIcons',
      color: '#45B7D1'
    },
    { 
      id: 'campus', 
      name: 'Campus', 
      icon: 'business-outline',
      iconType: 'Ionicons',
      color: '#96CEB4'
    },
    { 
      id: 'general', 
      name: 'General', 
      icon: 'chat-outline',
      iconType: 'Ionicons',
      color: '#FFCC00'
    }
  ];

  const toggleCategory = (categoryId) => {
    setTempSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleApply = () => {
    onApplyFilters(tempSelectedCategories);
    onClose();
  };

  const handleClear = () => {
    setTempSelectedCategories([]);
    onApplyFilters([]);
    onClose();
  };

  const isCategorySelected = (categoryId) => tempSelectedCategories.includes(categoryId);

  const renderIcon = (category) => {
    const iconProps = {
      size: 20,
      color: isCategorySelected(category.id) ? colors.homeBackground : category.color
    };

    switch(category.iconType) {
      case 'MaterialIcons':
        return <MaterialIcons name={category.icon} {...iconProps} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={category.icon} {...iconProps} />;
      default:
        return <Ionicons name={category.icon} {...iconProps} />;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="filter" size={24} color={colors.white} />
              <Text style={styles.modalTitle}>Filter Posts</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Select Categories</Text>
            <Text style={styles.sectionSubtitle}>
              Choose categories to filter your feed
            </Text>

            <ScrollView 
              style={styles.categoriesContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
            >
              <View style={styles.categoriesGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      isCategorySelected(category.id) && styles.categoryChipSelected,
                      isCategorySelected(category.id) && { backgroundColor: category.color }
                    ]}
                    onPress={() => toggleCategory(category.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.categoryIconContainer}>
                      {renderIcon(category)}
                    </View>
                    <Text style={[
                      styles.categoryName,
                      isCategorySelected(category.id) && styles.categoryNameSelected
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Selection Summary */}
            {tempSelectedCategories.length > 0 && (
              <View style={styles.selectionSummary}>
                <Text style={styles.summaryText}>
                  {tempSelectedCategories.length} category{tempSelectedCategories.length !== 1 ? 's' : ''} selected
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.clearButton]}
                onPress={handleClear}
                disabled={tempSelectedCategories.length === 0}
              >
                <Text style={[
                  styles.clearButtonText,
                  tempSelectedCategories.length === 0 && styles.disabledButtonText
                ]}>
                  Clear All
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.applyButton]}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>
                  Apply Filters
                </Text>
                {tempSelectedCategories.length > 0 && (
                  <View style={styles.filterCount}>
                    <Text style={styles.filterCountText}>
                      {tempSelectedCategories.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: colors.homeBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.65, // More compressed height
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
  },
  categoriesContainer: {
    maxHeight: 280, // Reduced height for compression
  },
  categoriesContent: {
    paddingBottom: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10, // Using gap instead of margins for better spacing
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20, // More rounded for modern look
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: (screenWidth - 60) / 2 - 5, // Adjusted for gap
    flexGrow: 1,
  },
  categoryChipSelected: {
    borderColor: 'transparent',
  },
  categoryIconContainer: {
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  categoryNameSelected: {
    color: colors.homeBackground,
    fontFamily: fonts.semiBold,
  },
  selectionSummary: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#FFCC00',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  applyButton: {
    backgroundColor: '#FFCC00',
  },
  clearButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.homeBackground,
  },
  disabledButtonText: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  filterCount: {
    backgroundColor: colors.homeBackground,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: '#FFCC00',
  },
});

export default FilterModal;