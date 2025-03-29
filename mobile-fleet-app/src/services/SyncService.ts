import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export class SyncService {
  static async saveOfflineData(key: string, data: any) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  static async getOfflineData(key: string) {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  }

  static async syncWithServer() {
    // Sync offline data with server when connection is restored
    const offlineChanges = await AsyncStorage.getItem('offlineChanges');
    if (offlineChanges) {
      const changes = JSON.parse(offlineChanges);
      // Process each change
      for (const change of changes) {
        await supabase.from(change.table).upsert(change.data);
      }
      await AsyncStorage.removeItem('offlineChanges');
    }

    //Sync offline maintenance records
    const offlineMaintenanceRecords = await this.getOfflineData('offline_maintenance_records');
    if(offlineMaintenanceRecords && offlineMaintenanceRecords.length > 0){
        for (const record of offlineMaintenanceRecords) {
            await supabase.from('maintenance_records').upsert(record);
        }
        await AsyncStorage.removeItem('offline_maintenance_records');
    }

    // Sync offline documents
    const offlineDocuments = await this.getOfflineData('offline_documents');
    if(offlineDocuments && offlineDocuments.length > 0){
        for (const doc of offlineDocuments) {
          if (doc.pendingUpload) {
            await supabase.storage.from('documents').upload(doc.path, doc.data);
          }
        }
        await AsyncStorage.removeItem('offline_documents');
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