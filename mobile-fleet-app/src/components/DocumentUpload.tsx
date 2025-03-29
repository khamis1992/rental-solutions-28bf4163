
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DocumentUpload() {
  const [uploading, setUploading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        await uploadDocument(file);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const uploadDocument = async (file: DocumentPicker.DocumentPickerAsset) => {
    try {
      setUploading(true);
      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('documents')
        .upload(fileName, blob);

      if (error) throw error;
      
      // Cache the document reference locally
      const documents = JSON.parse(await AsyncStorage.getItem('cached_documents') || '[]');
      documents.push({ name: file.name, path: fileName });
      await AsyncStorage.setItem('cached_documents', JSON.stringify(documents));
      
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View>
      <TouchableOpacity 
        onPress={pickDocument}
        style={{ 
          backgroundColor: '#4CAF50',
          padding: 15,
          borderRadius: 5,
          alignItems: 'center'
        }}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={{ color: '#ffffff' }}>Upload Document</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
