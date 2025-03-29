
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Searchbar } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export default function CustomersScreen() {
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${searchQuery}%`);
      
      if (error) throw error;
      return data;
    }
  });

  const renderCustomer = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">{item.full_name}</Text>
        <Text variant="bodyMedium">Email: {item.email}</Text>
        <Text variant="bodyMedium">Phone: {item.phone}</Text>
        <Text variant="bodyMedium">Status: {item.status}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search customers"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      <FlatList
        data={customers}
        renderItem={renderCustomer}
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
  searchbar: {
    margin: 16,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
});
