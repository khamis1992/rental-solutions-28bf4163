
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';

export class SyncService {
  static async syncOfflineData() {
    const isConnected = (await NetInfo.fetch()).isConnected;
    if (!isConnected) return;

    try {
      // Sync offline maintenance records
      const offlineRecords = JSON.parse(
        await AsyncStorage.getItem('offline_maintenance_records') || '[]'
      );

      for (const record of offlineRecords) {
        await supabase.from('maintenance_records').upsert(record);
      }
      await AsyncStorage.removeItem('offline_maintenance_records');

      // Sync offline documents
      const offlineDocuments = JSON.parse(
        await AsyncStorage.getItem('offline_documents') || '[]'
      );

      for (const doc of offlineDocuments) {
        if (doc.pendingUpload) {
          await supabase.storage.from('documents').upload(doc.path, doc.data);
        }
      }
      await AsyncStorage.removeItem('offline_documents');

    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  static async cacheForOffline(key: string, data: any) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Caching error:', error);
    }
  }
}
