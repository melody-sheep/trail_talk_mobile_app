// src/screens/faculty/CreateDonationScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { UserContext } from '../../contexts/UserContext';
import { DONATION_PATHS } from '../../constants/donationPaths'; // Import donation paths

export default function CreateDonationScreen({ navigation, route }) {
  const { user } = useContext(UserContext);
  const [step, setStep] = useState(1); // 1: Assign Path, 2: Category, 3: Details, 4: Preview
  const [selectedPath, setSelectedPath] = useState(null); // Start with no path selected
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customCategory, setCustomCategory] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Donation paths from constants
  const donationPaths = DONATION_PATHS.map(path => ({
    id: path.id,
    name: path.title,
    color: path.color,
    icon: path.icon.replace('-outline', ''),
    description: path.description,
    items: path.items
  }));

  // Get categories for the selected path
  const getCategoriesForPath = (pathId) => {
    const path = DONATION_PATHS.find(p => p.id === pathId);
    if (!path) return [];
    
    return path.items.map(item => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      color: item.color,
      icon: item.icon || 'help-circle',
      description: item.description,
      quickDescription: item.quickDescription,
      isMonthly: item.isMonthly || false
    }));
  };

  // Get category icon name
  const getCategoryIcon = (iconName) => {
    if (!iconName) return 'help-circle';
    return iconName.replace('-outline', '');
  };

  // Select path and auto-advance to category selection
  const handlePathSelect = (pathId) => {
    setSelectedPath(pathId);
    // Auto-advance to next step after selecting path
    setTimeout(() => {
      if (step === 1) {
        setStep(2);
      }
    }, 300);
  };

  // Select category
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    if (category.id !== 'custom') {
      setTitle(category.name);
      setAmount(category.amount > 0 ? category.amount.toString() : '');
    }
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedPath) {
      Alert.alert('Select Path', 'Please select a donation path to continue');
      return;
    }
    if (step === 2 && !selectedCategory) {
      Alert.alert('Select Category', 'Please select a category to continue');
      return;
    }
    if (step === 3 && (!title.trim() || !amount.trim())) {
      Alert.alert('Complete Details', 'Please fill in all required fields');
      return;
    }
    if (step < 4) {
      setStep(step + 1);
    } else {
      createDonation();
    }
  };

  // Determine if the Continue/Create button should be disabled
  const isActionDisabled = () => {
    if (step === 1) return !selectedPath;
    if (step === 2) return !selectedCategory;
    if (step === 3) return !(title.trim() && amount.trim());
    return false;
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const createDonation = () => {
    // Here you would integrate with your backend/database
    const donationData = {
      id: Date.now().toString(),
      path: selectedPath,
      category: selectedCategory.id,
      title: selectedCategory.id.includes('custom') ? customCategory : title,
      amount: parseInt(amount),
      description,
      createdBy: user?.id,
      isCustom: selectedCategory.id.includes('custom'),
      createdByName: user?.name || 'Faculty Member',
      createdAt: new Date().toISOString(),
    };

    console.log('Creating donation:', donationData);
    
    // Navigate back with the created donation data
    navigation.navigate('FacultySupport', { 
      newDonation: donationData,
      message: 'Donation created successfully!'
    });
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Assign Donation Path</Text>
      <Text style={styles.stepSubtitle}>Choose which emotional donation path this belongs to</Text>
      
      {donationPaths.map((path) => (
        <TouchableOpacity
          key={path.id}
          style={[
            styles.pathCard,
            selectedPath === path.id && { 
              borderColor: path.color, 
              backgroundColor: `${path.color}15` 
            }
          ]}
          onPress={() => handlePathSelect(path.id)}
        >
          <View style={styles.pathHeader}>
            <View style={[styles.pathIcon, { backgroundColor: path.color }]}>
              <Ionicons name={path.icon} size={24} color={colors.white} />
            </View>
            <Text style={styles.pathName}>{path.name}</Text>
          </View>
          <View style={styles.pathDescription}>
            <Text style={styles.pathDescText}>{path.description}</Text>
            <Ionicons 
              name={selectedPath === path.id ? 'checkmark-circle' : 'chevron-forward'} 
              size={24} 
              color={selectedPath === path.id ? path.color : 'rgba(255,255,255,0.3)'}
              style={styles.pathActionIcon}
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep2 = () => {
    const categories = getCategoriesForPath(selectedPath);
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Select Category</Text>
        <Text style={styles.stepSubtitle}>
          Choose from {categories.length} options for {donationPaths.find(p => p.id === selectedPath)?.name}
        </Text>
        
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                { 
                  borderColor: selectedCategory?.id === category.id ? category.color : 'rgba(255,255,255,0.06)',
                  width: category.id.includes('custom') ? '60%' : '47%'
                },
                selectedCategory?.id === category.id && styles.categoryCardSelected
              ]}
              onPress={() => handleCategorySelect(category)}
            >
              <View style={[
                styles.categoryIcon,
                {
                  backgroundColor: selectedCategory?.id === category.id ? category.color : `${category.color}20`
                }
              ]}>
                <Ionicons 
                  name={getCategoryIcon(category.icon)} 
                  size={20} 
                  color={colors.white} 
                />
              </View>
              <Text style={[
                styles.categoryName,
                { color: selectedCategory?.id === category.id ? category.color : colors.white }
              ]}>
                {category.name}
              </Text>
              <Text style={styles.categoryAmount}>
                {category.isMonthly ? `₱${category.amount}/month` : 
                 category.amount > 0 ? `₱${category.amount}` : 'Custom Amount'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Donation Details</Text>
      <Text style={styles.stepSubtitle}>Fill in the specific details</Text>
      
      {selectedCategory?.id.includes('custom') ? (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Custom Category Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Medical Support, Project Materials"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={customCategory}
            onChangeText={setCustomCategory}
          />
        </View>
      ) : null}
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Title</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Donation title"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={title}
          onChangeText={setTitle}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Amount (PHP)</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.currencySymbol}>₱</Text>
          <TextInput
            style={[styles.textInput, styles.amountInput]}
            placeholder="Enter amount"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={amount}
            onChangeText={(text) => {
              const digits = text.replace(/[^0-9]/g, '');
              if (digits === '') {
                setAmount('');
                return;
              }
              const num = Math.max(1, parseInt(digits, 10));
              setAmount(String(num));
            }}
            keyboardType="numeric"
          />
          {selectedCategory && !selectedCategory.id.includes('custom') && selectedCategory.amount > 0 && (
            <Text style={styles.suggestedAmount}>
              Suggested: ₱{selectedCategory.amount}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Explain the student/organization need..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>
    </View>
  );

  const renderStep4 = () => {
    const path = donationPaths.find(p => p.id === selectedPath);
    const category = selectedCategory;
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Preview & Create</Text>
        <Text style={styles.stepSubtitle}>Review your donation before publishing</Text>
        
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={[styles.previewIcon, { backgroundColor: path?.color }]}>
              <Ionicons name={getCategoryIcon(category?.icon)} size={24} color={colors.white} />
            </View>
            <View style={styles.previewTitleContainer}>
              <Text style={styles.previewTitle}>
                {selectedCategory?.id.includes('custom') ? customCategory : title}
              </Text>
              <Text style={styles.previewCategory}>
                {selectedCategory?.name} • {path?.name}
              </Text>
            </View>
            <Text style={styles.previewAmount}>₱{amount}</Text>
          </View>
          
          {description ? (
            <View style={styles.previewDescription}>
              <Text style={styles.descriptionLabel}>Description:</Text>
              <Text style={styles.descriptionText}>{description}</Text>
            </View>
          ) : null}
          
          <View style={styles.previewFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="person" size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.footerText}>Created by you</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="calendar" size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.footerText}>Today</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.confirmationNote}>
          <Ionicons name="information-circle" size={20} color="#4ECDC4" />
          <Text style={styles.confirmationText}>
            This donation will appear in the {path?.name} section for students to contribute to.
          </Text>
        </View>
      </View>
    );
  };

  const getStepTitle = () => {
    switch(step) {
      case 1: return 'Assign Path';
      case 2: return 'Select Category';
      case 3: return 'Donation Details';
      case 4: return 'Preview';
      default: return 'Create Donation';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getStepTitle()}</Text>
          <View style={styles.stepIndicator}>
            {[1, 2, 3, 4].map((stepNum) => (
              <View 
                key={stepNum} 
                style={[
                  styles.stepDot,
                  stepNum === step && styles.stepDotActive,
                  stepNum < step && styles.stepDotComplete
                ]}
              />
            ))}
          </View>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </ScrollView>
        
        {/* Footer with Next/Create Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.nextButton,
              step === 4 && styles.createButton,
              isActionDisabled() && styles.nextButtonDisabled
            ]}
            onPress={handleNextStep}
            disabled={isActionDisabled()}
          >
            <Text style={styles.nextButtonText}>
              {step === 4 ? 'Create Donation' : 'Continue'}
            </Text>
            <Ionicons 
              name={step === 4 ? 'checkmark-circle' : 'arrow-forward'} 
              size={20} 
              color={colors.white} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    flex: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  stepDotActive: {
    backgroundColor: '#00C851',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepDotComplete: {
    backgroundColor: '#00C851',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 30,
  },
  pathCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pathIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pathName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    flex: 1,
  },
  pathDescription: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pathDescText: {
    fontSize: 13,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  pathActionIcon: {
    marginLeft: 10,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
    justifyContent: 'center',
  },
  categoryCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  categoryCardSelected: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 5,
  },
  categoryAmount: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.6)',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  amountInputContainer: {
    position: 'relative',
  },
  currencySymbol: {
    position: 'absolute',
    left: 15,
    top: 12,
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
    zIndex: 1,
  },
  amountInput: {
    paddingLeft: 35,
  },
  suggestedAmount: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    alignSelf: 'flex-start',
    marginLeft: 0,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  previewIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  previewTitleContainer: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  previewCategory: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.6)',
  },
  previewAmount: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: '#FFD700',
  },
  previewDescription: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 15,
    marginTop: 10,
  },
  descriptionLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 15,
    marginTop: 15,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    fontFamily: fonts.normal,
    color: 'rgba(255,255,255,0.6)',
  },
  confirmationNote: {
    flexDirection: 'row',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    gap: 10,
    alignItems: 'flex-start',
  },
  confirmationText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.normal,
    color: '#4ECDC4',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  nextButton: {
    backgroundColor: '#00C851',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  createButton: {
    backgroundColor: '#00C851',
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },
});