import React, { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Text } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { SyncService } from '../services/SyncService';


export const DocumentUpload = ({ onUpload, documentType }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, //Allow all media types
        allowsEditing: true,
        quality: 1,
      });
    } catch (err) {
      setError('Error accessing image library: ' + err.message);
      return;
    }

    if (!result.canceled) {
      setUploading(true);
      const file = result.assets[0];
      const fileExt = file.uri.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${documentType}/${fileName}`;

      try {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const { error } = await supabase.storage
          .from('documents')
          .upload(filePath, blob);

        if (error) throw new Error(`Supabase upload error: ${error.message}`);
        const { data, error: getUrlError } = await supabase.storage.from('documents').getPublicUrl(filePath);
        if (getUrlError) throw new Error(`Supabase get URL error: ${getUrlError.message}`);
        onUpload(data.publicUrl);
        setError('');
      } catch (error) {
        setError(`Upload failed: ${error.message}`);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} style={styles.button} disabled={uploading}>
        <Text>{uploading ? 'Uploading...' : 'Upload Document'}</Text>
      </TouchableOpacity>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
});