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
import PageHeader from '@/components/ui/PageHeader';
import { Wrench } from 'lucide-react';
import { MaintenanceSchedulingWizard } from '@/components/maintenance/MaintenanceSchedulingWizard';

const Maintenance = () => {
  const navigate = useNavigate();
  const [maintenanceRecords, setMaintenanceRecords] = useState([] as MaintenanceRecord[]);
  const [filteredRecords, setFilteredRecords] = useState([] as MaintenanceRecord[]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<MaintenanceFilterOptions>({
    searchTerm: '',
    status: '',
    vehicle: '',
    dateFrom: undefined,
    dateTo: undefined,
    maintenanceType: ''
  });

  const { getAllRecords, deleteMaintenanceRecord, useRealtimeUpdates } = useMaintenance();
  
  useRealtimeUpdates();

  // Get vehicles that are in maintenance
  const { loading: isLoadingVehicles, getAllVehicles } = useVehicleService();
  const [vehicles, setVehicles] = useState<any[]>([]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const vehicleData = await getAllVehicles();
        setVehicles(vehicleData.filter(v => v.status === 'maintenance' || v.status === 'accident'));
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };
    
    fetchVehicles();
  }, [getAllVehicles]);

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
        toast.error('فشل في تحميل سجلات الصيانة');
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
        record.scheduled_date && new Date(record.scheduled_date) >= new Date(filters.dateFrom!)
      );
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(record => 
        record.scheduled_date && new Date(record.scheduled_date) <= new Date(filters.dateTo!)
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
    if (window.confirm('هل أنت متأكد من حذف سجل الصيانة هذا؟')) {
      try {
        await deleteMaintenanceRecord(id);
        setMaintenanceRecords(prev => prev.filter(record => record.id !== id));
        toast.success('تم حذف سجل الصيانة بنجاح');
      } catch (error) {
        console.error('Error deleting maintenance record:', error);
        toast.error('فشل في حذف سجل الصيانة');
      }
    }
  };

  const handleVehicleCardClick = (vehicle: any) => {
    if (!vehicle.maintenance || vehicle.maintenance.length === 0) {
      setSelectedVehicleId(vehicle.id);
      setIsCreateDialogOpen(true);
    } else {
      navigate(`/maintenance/job/${vehicle.id}`);
    }
  };

  return (
    <PageContainer 
      title="صيانة المركبات"
      description="تتبع وإدارة جميع أنشطة صيانة المركبات"
      systemDate={new Date()}
      dir="rtl"
    >
      <PageHeader
        title="صيانة المركبات"
        subtitle="تتبع وإدارة جميع أنشطة صيانة المركبات"
        icon={<Wrench className="w-6 h-6 text-blue-500" />}
        align="right"
        dir="rtl"
      />
      <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center mb-6 gap-4" dir="rtl">
        <div className="flex-1" /> {/* Empty div to maintain spacing */}
        <Button onClick={handleAddMaintenance} className="flex-row-reverse">
          <Plus className="h-4 w-4 ml-2" />
          إضافة صيانة
        </Button>
      </div>

      <MaintenanceDashboard />

      <MaintenanceFilters 
        onFilterChange={handleFilterChange}
        vehicleOptions={vehicleOptions}
      />

      <Card className="p-4" dir="rtl">
        <VehicleMaintenanceCards 
          vehicles={vehicles || []}
          isLoading={isLoadingVehicles}
          onVehicleCardClick={handleVehicleCardClick}
        />
      </Card>
      <MaintenanceSchedulingWizard
        open={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setSelectedVehicleId(undefined);
        }}
        onComplete={() => {
          setIsCreateDialogOpen(false);
          setSelectedVehicleId(undefined);
        }}
        vehicleId={selectedVehicleId}
      />
    </PageContainer>
  );
};

export default Maintenance;
