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
      selectedIcon: 'school',
      iconType: 'Ionicons',
      // neon blue when selected
      color: '#00E5FF',
      bgColor: 'rgba(0, 229, 255, 0.12)',
      borderColor: 'rgba(0, 229, 255, 0.25)'
    },
    { 
      id: 'rant', 
      name: 'Rant', 
      icon: 'flame-outline',
      selectedIcon: 'flame',
      iconType: 'Ionicons',
      // bright ember yellow/orange when selected
      color: '#FFB020',
      bgColor: 'rgba(255, 176, 32, 0.12)',
      borderColor: 'rgba(255, 176, 32, 0.25)'
    },
    { 
      id: 'support', 
      name: 'Support', 
      icon: 'heart-outline',
      selectedIcon: 'heart',
      iconType: 'Ionicons',
      color: '#EC4899',
      bgColor: 'rgba(236, 72, 153, 0.15)',
      borderColor: 'rgba(236, 72, 153, 0.3)'
    },
    { 
      id: 'campus', 
      name: 'Campus', 
      icon: 'business-outline',
      selectedIcon: 'business',
      iconType: 'Ionicons',
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.3)'
    },
    { 
      id: 'general', 
      name: 'General', 
      icon: 'chatbubble-outline',
      selectedIcon: 'chatbubble',
      iconType: 'Ionicons',
      color: '#8B5CF6',
      bgColor: 'rgba(139, 92, 246, 0.15)',
      borderColor: 'rgba(139, 92, 246, 0.3)'
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
    const isSelected = isCategorySelected(category.id);
    const iconName = isSelected ? category.selectedIcon : category.icon;
    const iconColor = isSelected ? category.color : 'rgba(255, 255, 255, 0.7)';

    const iconProps = {
      size: 22,
      color: iconColor
    };

    switch(category.iconType) {
      case 'MaterialIcons':
        return <MaterialIcons name={iconName} {...iconProps} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={iconName} {...iconProps} />;
      default:
        return <Ionicons name={iconName} {...iconProps} />;
    }
  };

  const hasSelections = tempSelectedCategories.length > 0;

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
                {categories.map((category) => {
                  const isSelected = isCategorySelected(category.id);
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        isSelected && [
                          styles.categoryChipSelected,
                          { 
                            backgroundColor: category.bgColor,
                            borderColor: category.color
                          }
                        ]
                      ]}
                      onPress={() => toggleCategory(category.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.iconContainer}>
                        {renderIcon(category)}
                      </View>
                      <Text style={[
                        styles.categoryName,
                        isSelected && [
                          styles.categoryNameSelected,
                          { color: category.color }
                        ]
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Selection Summary */}
            {hasSelections && (
              <View style={styles.selectionSummary}>
                <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                <Text style={styles.summaryText}>
                  {tempSelectedCategories.length} categor{tempSelectedCategories.length !== 1 ? 'ies' : 'y'} selected
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.clearButton,
                  !hasSelections && styles.buttonDisabled
                ]}
                onPress={handleClear}
                disabled={!hasSelections}
              >
                <Text style={[
                  styles.clearButtonText,
                  !hasSelections && styles.disabledButtonText
                ]}>
                  Clear All
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.applyButton,
                  !hasSelections && styles.buttonDisabled
                ]}
                onPress={handleApply}
                disabled={!hasSelections}
              >
                <Text style={[
                  styles.applyButtonText,
                  !hasSelections && styles.disabledButtonText
                ]}>
                  Apply Filters
                </Text>
                {hasSelections && (
                  <View style={styles.filterCount}>
                    <Text style={styles.filterCountText}>
                      {tempSelectedCategories.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom margin for better touch area */}
            <View style={styles.bottomTouchArea} />
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
    maxHeight: screenHeight * 0.65,
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
    paddingBottom: 8, // Reduced bottom padding since we have bottomTouchArea
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
    maxHeight: 280,
  },
  categoriesContent: {
    paddingBottom: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: (screenWidth - 60) / 2 - 5,
    flexGrow: 1,
  },
  categoryChipSelected: {
    borderWidth: 1.5,
  },
  iconContainer: {
    marginRight: 10,
  },
  categoryName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  categoryNameSelected: {
    fontFamily: fonts.semiBold,
  },
  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  summaryText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#22C55E',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
    marginBottom: 8, // Added margin bottom
  },
  button: {
    flex: 1,
    paddingVertical: 16, // Increased padding for better touch
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 52, // Minimum touch target size
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  applyButton: {
    backgroundColor: '#22C55E', // Bright green
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  clearButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  disabledButtonText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  filterCount: {
    backgroundColor: colors.white,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  filterCountText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: '#22C55E',
  },
  bottomTouchArea: {
    height: 20, // Extra bottom margin for better touch area
  },
});

export default FilterModal;