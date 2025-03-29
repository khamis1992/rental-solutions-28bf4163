
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';

export class SyncService {
  static async syncOfflineData() {
    const networkState = await NetInfo.fetch();
    
    if (networkState.isConnected) {
      const offlineChanges = await AsyncStorage.getItem('offlineChanges');
      if (offlineChanges) {
        const changes = JSON.parse(offlineChanges);
        
        for (const change of changes) {
          const { table, operation, data } = change;
          
          switch (operation) {
            case 'INSERT':
              await supabase.from(table).insert(data);
              break;
            case 'UPDATE':
              await supabase.from(table).update(data.changes).match(data.conditions);
              break;
            case 'DELETE':
              await supabase.from(table).delete().match(data);
              break;
          }
        }
        
        await AsyncStorage.removeItem('offlineChanges');
      }
    }
  }

  static async saveOfflineChange(table: string, operation: string, data: any) {
    const existingChanges = await AsyncStorage.getItem('offlineChanges');
    const changes = existingChanges ? JSON.parse(existingChanges) : [];
    
    changes.push({ table, operation, data });
    await AsyncStorage.setItem('offlineChanges', JSON.stringify(changes));
  }
}
