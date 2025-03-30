
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export default function AgreementDetailScreen({ route }: any) {
  const { agreementId } = route.params;
  
  const { data: agreement, isLoading } = useQuery({
    queryKey: ['agreement', agreementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_agreements')
        .select(`
          *,
          vehicles:vehicle_id(*),
          customers:customer_id(*)
        `)
        .eq('id', agreementId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading agreement details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Agreement #{agreement?.id}</Text>
          <Text variant="bodyMedium">Customer: {agreement?.customers?.full_name}</Text>
          <Text variant="bodyMedium">Vehicle: {agreement?.vehicles?.make} {agreement?.vehicles?.model}</Text>
          <Text variant="bodyMedium">Start Date: {new Date(agreement?.start_date).toLocaleDateString()}</Text>
          <Text variant="bodyMedium">End Date: {new Date(agreement?.end_date).toLocaleDateString()}</Text>
          <Text variant="bodyMedium">Status: {agreement?.status}</Text>
          <Text variant="titleMedium" style={styles.amount}>
            Amount: QAR {agreement?.total_amount?.toLocaleString()}
          </Text>
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
  amount: {
    marginTop: 16,
  },
});
