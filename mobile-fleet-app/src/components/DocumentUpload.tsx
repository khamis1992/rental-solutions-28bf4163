
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';
import { SyncService } from '../services/SyncService';

export const DocumentUpload = () => {
  const [uploading, setUploading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true
      });

      if (result.type === 'success') {
        await handleUpload(result);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const handleUpload = async (document) => {
    try {
      setUploading(true);
      const fileName = `${Date.now()}-${document.name}`;
      
      if (navigator.onLine) {
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(fileName, document);
          
        if (error) throw error;
      } else {
        // Store for offline sync
        await SyncService.saveOfflineData('offline_documents', {
          path: fileName,
          data: document,
          pendingUpload: true
        });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={pickDocument}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? 'Uploading...' : 'Upload Document'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  button: {
    backgroundColor: '#0284c7',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
