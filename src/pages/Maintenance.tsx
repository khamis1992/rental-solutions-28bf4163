
import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MaintenanceDashboard from '@/components/maintenance/MaintenanceDashboard';
import MaintenanceFilters, { MaintenanceFilterOptions } from '@/components/maintenance/MaintenanceFilters';
import VehicleMaintenanceCards from '@/components/maintenance/VehicleMaintenanceCards';
import { useMaintenance, MaintenanceRecord } from '@/hooks/use-maintenance';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const Maintenance = () => {
  const navigate = useNavigate();
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<MaintenanceFilterOptions>({
    searchTerm: '',
    status: '',
    vehicle: '',
    dateFrom: undefined,
    dateTo: undefined,
    maintenanceType: ''
  });

  const { getAllRecords, deleteMaintenanceRecord } = useMaintenance();

  // Get vehicles that are in maintenance
  const { vehicles, isLoading: isLoadingVehicles } = useVehicleService({
    statuses: ['maintenance', 'accident']
  });

  // Fetch all maintenance records
  useEffect(() => {
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const records = await getAllRecords();
        setMaintenanceRecords(records);
        setFilteredRecords(records);
      } catch (error) {
        console.error('Error fetching maintenance records:', error);
        toast.error('Failed to load maintenance records');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecords();
  }, [getAllRecords]);

  // Apply filters to maintenance records
  useEffect(() => {
    if (!maintenanceRecords) return;
    
    let filtered = [...maintenanceRecords];
    
    // Apply search term
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        (record.service_type && record.service_type.toLowerCase().includes(search)) ||
        (record.description && record.description.toLowerCase().includes(search)) ||
        (record.notes && record.notes.toLowerCase().includes(search))
      );
    }
    
    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(record => record.status === filters.status);
    }
    
    // Apply vehicle filter
    if (filters.vehicle) {
      filtered = filtered.filter(record => record.vehicle_id === filters.vehicle);
    }
    
    // Apply maintenance type filter
    if (filters.maintenanceType) {
      filtered = filtered.filter(record => record.maintenance_type === filters.maintenanceType);
    }
    
    // Apply date range filters
    if (filters.dateFrom) {
      filtered = filtered.filter(record => 
        record.scheduled_date && new Date(record.scheduled_date) >= filters.dateFrom!
      );
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(record => 
        record.scheduled_date && new Date(record.scheduled_date) <= filters.dateTo!
      );
    }
    
    setFilteredRecords(filtered);
  }, [filters, maintenanceRecords]);

  // Vehicle options for filter dropdown
  const vehicleOptions = vehicles?.map(vehicle => ({
    id: vehicle.id,
    label: `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`
  })) || [];

  const handleFilterChange = (newFilters: MaintenanceFilterOptions) => {
    setFilters(newFilters);
  };

  const handleAddMaintenance = () => {
    navigate('/maintenance/add');
  };

  const handleEditMaintenance = (record: MaintenanceRecord) => {
    navigate(`/maintenance/${record.id}/edit`);
  };

  const handleDeleteMaintenance = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        await deleteMaintenanceRecord(id);
        setMaintenanceRecords(prev => prev.filter(record => record.id !== id));
        toast.success('Maintenance record deleted successfully');
      } catch (error) {
        console.error('Error deleting maintenance record:', error);
        toast.error('Failed to delete maintenance record');
      }
    }
  };

  return (
    <PageContainer
      title="Vehicle Maintenance"
      description="Track and manage all your vehicle maintenance activities"
      systemDate={new Date()}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex-1" /> {/* Empty div to maintain spacing */}
        <Button onClick={handleAddMaintenance}>
          <Plus className="mr-2 h-4 w-4" />
          Add Maintenance
        </Button>
      </div>

      <MaintenanceDashboard />

      <MaintenanceFilters 
        onFilterChange={handleFilterChange}
        vehicleOptions={vehicleOptions}
      />

      <Card className="p-4">
        <VehicleMaintenanceCards 
          vehicles={vehicles || []}
          isLoading={isLoadingVehicles}
        />
      </Card>
    </PageContainer>
  );
};

export default Maintenance;
