
import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Searchbar } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';

export default function VehiclesScreen() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const navigation = useNavigation();

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles', searchQuery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .ilike('car_type', `%${searchQuery}%`);
      
      if (error) throw error;
      return data;
    }
  });

  const renderVehicle = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('VehicleDetail', { id: item.id })}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">{item.car_type}</Text>
          <Text variant="bodyMedium">Status: {item.status}</Text>
          <Text variant="bodyMedium">License: {item.license_plate}</Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search vehicles"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      <FlatList
        data={vehicles}
        renderItem={renderVehicle}
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
