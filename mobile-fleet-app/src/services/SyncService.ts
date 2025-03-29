import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';

export class SyncService {
  static async syncOfflineData() {
    const networkState = await NetInfo.fetch();

    if (!networkState.isConnected) return;

    try {
      const offlineData = await AsyncStorage.getItem('offlineChanges');
      if (offlineData) {
        const changes = JSON.parse(offlineData);
        for (const change of changes) {
          if (change.type === 'supabase') {
            await supabase
              .from(change.table)
              .upsert(change.data);
          } else if (change.type === 'storage') {
            await supabase.storage.from('documents').upload(change.path, change.data);
          }
        }
        await AsyncStorage.removeItem('offlineChanges');
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  static async saveOfflineChange(change: { type: string; table?: string; data?: any; path?: string }) {
    try {
      const existingData = await AsyncStorage.getItem('offlineChanges');
      const changes = existingData ? JSON.parse(existingData) : [];
      changes.push(change);
      await AsyncStorage.setItem('offlineChanges', JSON.stringify(changes));
    } catch (error) {
      console.error('Error saving offline change:', error);
    }
  }

  static async saveOfflineMaintenanceRecord(record: any) {
    await this.saveOfflineChange({ type: 'supabase', table: 'maintenance_records', data: record });
  }

  static async saveOfflineDocument(path: string, data: any) {
    await this.saveOfflineChange({ type: 'storage', path, data });
  }

}