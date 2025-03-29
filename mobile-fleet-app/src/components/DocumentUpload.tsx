
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

export default function DocumentUpload({ onUpload, type }) {
  const [uploading, setUploading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setUploading(true);
        const file = result.assets[0];
        const fileExt = file.uri.substring(file.uri.lastIndexOf('.') + 1);
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${type}/${fileName}`;

        const response = await fetch(file.uri);
        const blob = await response.blob();
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, blob);

        if (uploadError) {
          throw uploadError;
        }

        onUpload(filePath);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickDocument} style={styles.button} disabled={uploading}>
        <Text style={styles.buttonText}>
          {uploading ? 'Uploading...' : 'Upload Document'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: '#0EA5E9',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
