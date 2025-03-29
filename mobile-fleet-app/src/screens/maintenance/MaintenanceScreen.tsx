
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export default function MaintenanceScreen() {
  const { data: maintenanceRecords, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select(`
          *,
          vehicles:vehicle_id(*)
        `)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const renderMaintenanceItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">
          {item.vehicles?.car_type || 'Unknown Vehicle'}
        </Text>
        <Text variant="bodyMedium">
          Type: {item.maintenance_type}
        </Text>
        <Text variant="bodyMedium">
          Due: {new Date(item.due_date).toLocaleDateString()}
        </Text>
        <Chip style={styles.statusChip}>
          {item.status}
        </Chip>
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading maintenance records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={maintenanceRecords}
        renderItem={renderMaintenanceItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  statusChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
});
