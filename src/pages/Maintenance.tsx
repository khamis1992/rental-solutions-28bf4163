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
import { useLanguage } from '@/contexts/LanguageContext';
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

  const { language } = useLanguage();

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
        toast.error(language === 'ar' ? 'فشل في تحميل سجلات الصيانة' : 'Failed to load maintenance records');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecords();
  }, [getAllRecords, language]);

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
    const confirmMessage = language === 'ar' ? 
      'هل أنت متأكد من حذف سجل الصيانة هذا؟' : 
      'Are you sure you want to delete this maintenance record?';
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteMaintenanceRecord(id);
        setMaintenanceRecords(prev => prev.filter(record => record.id !== id));
        toast.success(language === 'ar' ? 'تم حذف سجل الصيانة بنجاح' : 'Maintenance record deleted successfully');
      } catch (error) {
        console.error('Error deleting maintenance record:', error);
        toast.error(language === 'ar' ? 'فشل في حذف سجل الصيانة' : 'Failed to delete maintenance record');
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
    <PageContainer systemDate={new Date()}>
      <PageHeader
        title={language === 'ar' ? 'صيانة المركبات' : 'Vehicle Maintenance'}
        subtitle={language === 'ar' ? 'تتبع وإدارة جميع أنشطة صيانة المركبات' : 'Track and manage all your vehicle maintenance activities'}
        icon={<Wrench className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 ${language === 'ar' ? 'md:flex-row-reverse' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex-1" /> {/* Empty div to maintain spacing */}
        <Button onClick={handleAddMaintenance}>
          <Plus className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {language === 'ar' ? 'إضافة صيانة' : 'Add Maintenance'}
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
