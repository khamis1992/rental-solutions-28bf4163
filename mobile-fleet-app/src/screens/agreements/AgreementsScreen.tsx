
import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';

export default function AgreementsScreen() {
  const navigation = useNavigation();
  const { data: agreements, isLoading } = useQuery({
    queryKey: ['agreements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          profiles:customer_id(*),
          vehicles:vehicle_id(*)
        `);
      
      if (error) throw error;
      return data;
    }
  });

  const renderAgreement = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('AgreementDetail', { id: item.id })}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">
            {item.profiles?.full_name || 'Unknown Customer'}
          </Text>
          <Text variant="bodyMedium">
            Vehicle: {item.vehicles?.car_type || 'Unknown Vehicle'}
          </Text>
          <Text variant="bodyMedium">
            Status: {item.status}
          </Text>
          <Text variant="bodyMedium">
            Amount Paid: ${item.amount_paid}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading agreements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={agreements}
        renderItem={renderAgreement}
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
});
