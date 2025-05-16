
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/spinner';

interface VehicleSelectorProps {
  onVehicleSelect: (vehicleId: string) => void;
  statusFilter?: string;
  excludeVehicleId?: string;
}

const VehicleSelector: React.FC<VehicleSelectorProps> = ({ 
  onVehicleSelect, 
  statusFilter,
  excludeVehicleId 
}) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setIsLoading(true);
        
        let query = supabase.from('vehicles').select('*');
        
        if (statusFilter) {
          query = query.eq('status', statusFilter as any);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        // Filter out excluded vehicle if specified
        const filteredVehicles = excludeVehicleId
          ? data?.filter(v => v.id !== excludeVehicleId)
          : data || [];
          
        setVehicles(filteredVehicles);
      } catch (err: any) {
        console.error('Error fetching vehicles:', err);
        setError(err.message || 'Failed to load vehicles');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVehicles();
  }, [statusFilter, excludeVehicleId]);

  if (isLoading) {
    return <div className="flex justify-center py-4"><Spinner /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  if (vehicles.length === 0) {
    return <div className="text-muted-foreground text-sm">No vehicles available</div>;
  }

  return (
    <Select onValueChange={onVehicleSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Select a vehicle" />
      </SelectTrigger>
      <SelectContent>
        {vehicles.map((vehicle) => (
          <SelectItem key={vehicle.id} value={vehicle.id}>
            {vehicle.make} {vehicle.model} - {vehicle.license_plate} ({vehicle.year})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default VehicleSelector;
