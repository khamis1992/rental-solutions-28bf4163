import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, Filter, Wrench, Car, User, Clock, DollarSign, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMaintenance, MaintenanceRecord } from '@/hooks/use-maintenance';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import { Loader2 } from 'lucide-react';
import { ExtendedVehicle } from '@/types/vehicle';

const MaintenanceHistory = () => {
  const { language } = useLanguage();
  const { getAllRecords } = useMaintenance();
  const { getAllVehicles } = useVehicleService();
  
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<ExtendedVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [maintenanceTypeFilter, setMaintenanceTypeFilter] = useState('all');

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [recordsData, vehiclesData] = await Promise.all([
          getAllRecords(),
          getAllVehicles()
        ]);
        
        setMaintenanceRecords(recordsData);
        setFilteredRecords(recordsData);
        setVehicles(vehiclesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(language === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [getAllRecords, getAllVehicles, language]);

  // Apply filters
  useEffect(() => {
    let filtered = [...maintenanceRecords];
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        (record.service_type && record.service_type.toLowerCase().includes(search)) ||
        (record.description && record.description.toLowerCase().includes(search)) ||
        (record.notes && record.notes.toLowerCase().includes(search)) ||
        (record.performed_by && record.performed_by.toLowerCase().includes(search))
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Vehicle filter
    if (vehicleFilter && vehicleFilter !== 'all') {
      filtered = filtered.filter(record => record.vehicle_id === vehicleFilter);
    }

    // Maintenance type filter
    if (maintenanceTypeFilter && maintenanceTypeFilter !== 'all') {
      filtered = filtered.filter(record => 
        record.maintenance_type === maintenanceTypeFilter || 
        record.service_type === maintenanceTypeFilter
      );
    }

    setFilteredRecords(filtered);
  }, [maintenanceRecords, searchTerm, statusFilter, vehicleFilter, maintenanceTypeFilter]);

  const getStatusBadge = (status: string) => {
    const statusLabels = language === 'ar' ? {
      'scheduled': 'مجدولة',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتملة',
      'cancelled': 'ملغاة'
    } : {
      'scheduled': 'Scheduled',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };

    const label = statusLabels[status as keyof typeof statusLabels] || status;

    switch(status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{label}</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{label}</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">{label}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{label}</Badge>;
      default:
        return <Badge variant="outline">{label}</Badge>;
    }
  };

  const getMaintenanceTypeLabel = (type: string) => {
    const typeLabels = language === 'ar' ? {
      'oil_change': 'تغيير الزيت',
      'tire_replacement': 'استبدال الإطارات',
      'brake_service': 'خدمة الفرامل',
      'routine_inspection': 'فحص دوري',
      'engine_repair': 'إصلاح المحرك',
      'air_conditioning': 'تكييف الهواء',
      'transmission': 'ناقل الحركة',
      'battery_replacement': 'استبدال البطارية',
      'electrical_repair': 'إصلاح كهربائي'
    } : {
      'oil_change': 'Oil Change',
      'tire_replacement': 'Tire Replacement',
      'brake_service': 'Brake Service',
      'routine_inspection': 'Routine Inspection',
      'engine_repair': 'Engine Repair',
      'air_conditioning': 'Air Conditioning',
      'transmission': 'Transmission',
      'battery_replacement': 'Battery Replacement',
      'electrical_repair': 'Electrical Repair'
    };

    return typeLabels[type as keyof typeof typeLabels] || type.replace(/_/g, ' ');
  };

  const getVehicleDisplayName = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => (v as any).id === vehicleId);
    if (!vehicle) return vehicleId;
    return `${vehicle.make} ${vehicle.model} (${vehicle.license_plate || 'N/A'})`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setVehicleFilter('all');
    setMaintenanceTypeFilter('all');
  };

  const statusOptions = [
    { value: 'scheduled', label: language === 'ar' ? 'مجدولة' : 'Scheduled' },
    { value: 'in_progress', label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress' },
    { value: 'completed', label: language === 'ar' ? 'مكتملة' : 'Completed' },
    { value: 'cancelled', label: language === 'ar' ? 'ملغاة' : 'Cancelled' }
  ];

  const maintenanceTypeOptions = [
    { value: 'oil_change', label: language === 'ar' ? 'تغيير الزيت' : 'Oil Change' },
    { value: 'tire_replacement', label: language === 'ar' ? 'استبدال الإطارات' : 'Tire Replacement' },
    { value: 'brake_service', label: language === 'ar' ? 'خدمة الفرامل' : 'Brake Service' },
    { value: 'routine_inspection', label: language === 'ar' ? 'فحص دوري' : 'Routine Inspection' },
    { value: 'engine_repair', label: language === 'ar' ? 'إصلاح المحرك' : 'Engine Repair' },
    { value: 'air_conditioning', label: language === 'ar' ? 'تكييف الهواء' : 'Air Conditioning' },
    { value: 'transmission', label: language === 'ar' ? 'ناقل الحركة' : 'Transmission' },
    { value: 'battery_replacement', label: language === 'ar' ? 'استبدال البطارية' : 'Battery Replacement' },
    { value: 'electrical_repair', label: language === 'ar' ? 'إصلاح كهربائي' : 'Electrical Repair' }
  ];

  if (isLoading) {
    return (
      <PageContainer systemDate={new Date()}>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer systemDate={new Date()}>
      <PageHeader
        title={language === 'ar' ? 'تاريخ الصيانة' : 'Maintenance History'}
        subtitle={language === 'ar' ? 'عرض جميع سجلات صيانة المركبات' : 'View all vehicle maintenance records'}
        icon={<Wrench className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />

      {/* Filters Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle 
            className={`flex items-center ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <Filter className={`h-5 w-5 text-blue-500 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'تصفية النتائج' : 'Filter Results'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${language === 'ar' ? 'text-right' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Search Input */}
            <div className="relative">
              <Search className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
            <Input
                placeholder={language === 'ar' ? 'البحث في السجلات...' : 'Search records...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className={language === 'ar' ? 'pr-10 text-right' : 'pl-10'}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
          
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={language === 'ar' ? 'text-right' : ''}>
                <SelectValue placeholder={language === 'ar' ? 'تصفية بالحالة' : 'Filter by Status'} />
              </SelectTrigger>
              <SelectContent align={language === 'ar' ? 'start' : 'end'}>
                <SelectItem value="all">{language === 'ar' ? 'كل الحالات' : 'All Statuses'}</SelectItem>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Vehicle Filter */}
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className={language === 'ar' ? 'text-right' : ''}>
                <SelectValue placeholder={language === 'ar' ? 'تصفية بالمركبة' : 'Filter by Vehicle'} />
            </SelectTrigger>
            <SelectContent align={language === 'ar' ? 'start' : 'end'}>
                <SelectItem value="all">{language === 'ar' ? 'كل المركبات' : 'All Vehicles'}</SelectItem>
                {vehicles.map(vehicle => (
                  <SelectItem key={(vehicle as any).id} value={(vehicle as any).id}>
                    {`${vehicle.make} ${vehicle.model} (${vehicle.license_plate || 'N/A'})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
            {/* Maintenance Type Filter */}
            <Select value={maintenanceTypeFilter} onValueChange={setMaintenanceTypeFilter}>
              <SelectTrigger className={language === 'ar' ? 'text-right' : ''}>
                <SelectValue placeholder={language === 'ar' ? 'تصفية بنوع الصيانة' : 'Filter by Type'} />
            </SelectTrigger>
            <SelectContent align={language === 'ar' ? 'start' : 'end'}>
                <SelectItem value="all">{language === 'ar' ? 'كل الأنواع' : 'All Types'}</SelectItem>
                {maintenanceTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

          {/* Clear Filters Button */}
          <div className={`mt-4 ${language === 'ar' ? 'text-right' : ''}`}>
            <Button variant="outline" onClick={clearFilters}>
              {language === 'ar' ? 'إزالة التصفية' : 'Clear Filters'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className={`mb-4 ${language === 'ar' ? 'text-right' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <p className="text-sm text-muted-foreground">
          {language === 'ar' 
            ? `عرض ${filteredRecords.length} من أصل ${maintenanceRecords.length} سجل صيانة`
            : `Showing ${filteredRecords.length} of ${maintenanceRecords.length} maintenance records`
          }
        </p>
      </div>

      {/* Maintenance Records */}
      <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className={`text-center text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
                <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{language === 'ar' ? 'لا توجد سجلات صيانة متطابقة مع المعايير المحددة.' : 'No maintenance records match the specified criteria.'}</p>
            </div>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <div className={`bg-muted p-4 flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <Wrench className={`h-5 w-5 text-primary ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  <div className={language === 'ar' ? 'text-right' : ''}>
                    <h3 className="font-medium">
                      {getMaintenanceTypeLabel(record.maintenance_type || record.service_type || 'maintenance')}
                    </h3>
                    <div className={`flex items-center text-sm text-muted-foreground ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <Car className={`h-4 w-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                      <span>{getVehicleDisplayName(record.vehicle_id)}</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(record.status || 'unknown')}
                    </div>
              <CardContent className="p-4">
                <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 text-sm ${language === 'ar' ? 'text-right' : ''}`}>
                  <div>
                    <div className={`flex items-center text-muted-foreground mb-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <Calendar className={`h-4 w-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                      <span className="font-medium">
                        {language === 'ar' ? 'تاريخ الجدولة' : 'Scheduled Date'}
                      </span>
                    </div>
                    <p>{formatDate(record.scheduled_date)}</p>
                  </div>
                  
                  {record.completed_date && (
                    <div>
                      <div className={`flex items-center text-muted-foreground mb-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <Clock className={`h-4 w-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                        <span className="font-medium">
                          {language === 'ar' ? 'تاريخ الإنجاز' : 'Completed Date'}
                        </span>
                      </div>
                      <p>{formatDate(record.completed_date)}</p>
                    </div>
                  )}
                  
                  {record.performed_by && (
                    <div>
                      <div className={`flex items-center text-muted-foreground mb-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <User className={`h-4 w-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                        <span className="font-medium">
                          {language === 'ar' ? 'المنفذ' : 'Performed By'}
                        </span>
                      </div>
                      <p>{record.performed_by}</p>
                    </div>
                  )}
                  
                  {record.cost && (
                    <div>
                      <div className={`flex items-center text-muted-foreground mb-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <DollarSign className={`h-4 w-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                        <span className="font-medium">
                          {language === 'ar' ? 'التكلفة' : 'Cost'}
                        </span>
                      </div>
                      <p>
                        {formatCurrency(record.cost, language === 'ar')}
                      </p>
                    </div>
                  )}
                </div>
                
                {record.description && (
                  <div className={`mt-4 ${language === 'ar' ? 'text-right' : ''}`}>
                    <div className={`flex items-center text-muted-foreground mb-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <FileText className={`h-4 w-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                      <span className="font-medium">
                        {language === 'ar' ? 'الوصف' : 'Description'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{record.description}</p>
                  </div>
                )}
                
                {record.notes && (
                  <div className={`mt-3 ${language === 'ar' ? 'text-right' : ''}`}>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {language === 'ar' ? 'ملاحظات' : 'Notes'}
                    </p>
                    <p className="text-sm text-gray-600">{record.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageContainer>
  );
};

export default MaintenanceHistory;