
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export default function VehicleDetailScreen({ route }: any) {
  const { vehicleId } = route.params;
  
  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading vehicle details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">{vehicle?.make} {vehicle?.model}</Text>
          <Text variant="bodyMedium">Year: {vehicle?.year}</Text>
          <Text variant="bodyMedium">Plate Number: {vehicle?.plate_number}</Text>
          <Text variant="bodyMedium">Status: {vehicle?.status}</Text>
          <Text variant="bodyMedium">Mileage: {vehicle?.mileage}</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
});
