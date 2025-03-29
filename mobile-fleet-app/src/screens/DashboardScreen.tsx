
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export default function DashboardScreen() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_dashboard_stats');
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleMedium">Total Vehicles</Text>
            <Text variant="headlineMedium">{stats?.totalVehicles || 0}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleMedium">Active Rentals</Text>
            <Text variant="headlineMedium">{stats?.activeRentals || 0}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleMedium">Maintenance Due</Text>
            <Text variant="headlineMedium">{stats?.maintenanceRequired || 0}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleMedium">Total Revenue</Text>
            <Text variant="headlineMedium">${stats?.totalRevenue || 0}</Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsGrid: {
    padding: 16,
    gap: 16,
  },
  statCard: {
    marginBottom: 16,
  },
});
