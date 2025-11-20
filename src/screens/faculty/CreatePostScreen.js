// src/screens/faculty/CreatePostScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/fonts';

export default function FacultyCreatePostScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreatePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both the title and content.');
      return;
    }

    setLoading(true);

    try {
      // 🔥 TODO: Replace this with your own backend / Firebase code
      console.log('POST CREATED:', { title, content, role: 'faculty' });

      Alert.alert('Success', 'Post created successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Post</Text>

        {/* Title Input */}
        <TextInput
          style={styles.input}
          placeholder="Enter post title"
          placeholderTextColor="#aaa"
          value={title}
          onChangeText={setTitle}
        />

        {/* Content Input */}
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write your content here..."
          placeholderTextColor="#aaa"
          value={content}
          multiline
          numberOfLines={6}
          onChangeText={setContent}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.postButton}
          onPress={handleCreatePost}
          disabled={loading}
        >
          <Text style={styles.postButtonText}>
            {loading ? 'Posting...' : 'Submit Post'}
          </Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 25,
    color: colors.white,
    fontFamily: fonts.bold,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontFamily: fonts.normal,
    color: colors.white,
    marginBottom: 15,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: '#FFCC00',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  postButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.homeBackground,
  },
  backButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#FFCC00',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: '#FFCC00',
  },
});
