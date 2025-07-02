import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { useMaintenance } from '@/hooks/use-maintenance';
import { ExtendedVehicle } from '@/types/vehicle';
import PageHeader from '@/components/ui/PageHeader';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Car, 
  Wrench, 
  Plus, 
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Using ExtendedVehicle from types/vehicle.ts instead of local interface

interface MaintenanceScheduleItem {
  id: string;
  vehicle_id: string;
  vehicle_make: string;
  vehicle_model: string;
  license_plate: string;
  maintenance_type: string;
  scheduled_date: string;
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  estimated_cost: number;
  service_provider?: string;
  notes?: string;
}

type StatusType = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

const MaintenanceSchedule = () => {
  const { language } = useLanguage();
  const { getAllVehicles } = useVehicleService();
  const { getAllRecords, createMaintenanceRecord } = useMaintenance();
  
  const [vehicles, setVehicles] = useState<ExtendedVehicle[]>([]);
  const [scheduleItems, setScheduleItems] = useState<MaintenanceScheduleItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MaintenanceScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    vehicle_id: '',
    maintenance_type: '',
    scheduled_date: new Date(),
    description: '',
    estimated_cost: 0,
    service_provider: '',
    notes: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [vehicleData, maintenanceData] = await Promise.all([
          getAllVehicles(),
          getAllRecords()
        ]);
        
        setVehicles(vehicleData);
        
        // Transform maintenance records to schedule items
        console.log('Raw maintenance data:', maintenanceData);
        const scheduleData = maintenanceData
          .map((record: any) => {
            const vehicle = vehicleData.find((v: any) => v.id === record.vehicle_id);
            console.log('Processing record:', record, 'Vehicle:', vehicle);
            return {
              id: record.id,
              vehicle_id: record.vehicle_id,
              vehicle_make: vehicle?.make || '',
              vehicle_model: vehicle?.model || '',
              license_plate: vehicle?.license_plate || '',
              maintenance_type: record.service_type || record.maintenance_type || '',
              scheduled_date: record.scheduled_date || record.date_scheduled || '',
              description: record.description || '',
              status: (record.status as StatusType) || 'pending',
              estimated_cost: record.cost || 0,
              service_provider: record.service_provider || '',
              notes: record.notes || ''
            };
          });
          // Temporarily show all records to debug
          // .filter((item: any) => item.status !== 'completed');
        
        setScheduleItems(scheduleData);
        setFilteredItems(scheduleData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(language === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [language]);

  // Apply filters
  useEffect(() => {
    let filtered = [...scheduleItems];
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.vehicle_make.toLowerCase().includes(search) ||
        item.vehicle_model.toLowerCase().includes(search) ||
        item.license_plate.toLowerCase().includes(search) ||
        item.maintenance_type.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    setFilteredItems(filtered);
  }, [searchTerm, statusFilter, scheduleItems]);

  const handleAddSchedule = async () => {
    try {
      // Create maintenance record without id (it will be auto-generated)
      const newRecord = {
        vehicle_id: formData.vehicle_id,
        service_type: formData.maintenance_type,
        scheduled_date: formData.scheduled_date.toISOString(),
        description: formData.description,
        status: 'scheduled', // Use 'scheduled' instead of 'pending' which is not valid
        cost: formData.estimated_cost,
        notes: formData.notes
      };
      
      console.log('Creating maintenance record:', newRecord);
      const result = await createMaintenanceRecord(newRecord as any);
      console.log('Create result:', result);
      
      toast.success(language === 'ar' ? 'تم إضافة جدولة الصيانة بنجاح' : 'Maintenance schedule added successfully');
      setShowAddForm(false);
      
      // Reset form
      setFormData({
        vehicle_id: '',
        maintenance_type: '',
        scheduled_date: new Date(),
        description: '',
        estimated_cost: 0,
        service_provider: '',
        notes: ''
      });
      
      // Refresh data by calling fetchData directly instead of reloading the page
      const fetchUpdatedData = async () => {
        try {
          const [vehicleData, maintenanceData] = await Promise.all([
            getAllVehicles(),
            getAllRecords()
          ]);
          
          setVehicles(vehicleData);
          
          // Transform maintenance records to schedule items
          const scheduleData = maintenanceData
            .map((record: any) => {
              const vehicle = vehicleData.find((v: any) => v.id === record.vehicle_id);
              return {
                id: record.id,
                vehicle_id: record.vehicle_id,
                vehicle_make: vehicle?.make || '',
                vehicle_model: vehicle?.model || '',
                license_plate: vehicle?.license_plate || '',
                maintenance_type: record.service_type || record.maintenance_type || '',
                scheduled_date: record.scheduled_date || record.date_scheduled || '',
                description: record.description || '',
                status: (record.status as StatusType) || 'pending',
                estimated_cost: record.cost || 0,
                service_provider: record.service_provider || '',
                notes: record.notes || ''
              };
            });
            // Temporarily show all records to debug
            // .filter((item: any) => item.status !== 'completed');
          
          setScheduleItems(scheduleData);
          setFilteredItems(scheduleData);
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      };
      
      await fetchUpdatedData();
    } catch (error) {
      console.error('Error adding maintenance schedule:', error);
      toast.error(language === 'ar' ? 'فشل في إضافة جدولة الصيانة' : 'Failed to add maintenance schedule');
    }
  };

  const getStatusBadge = (status: StatusType) => {
    const statusConfig: Record<StatusType, { label: string; variant: 'secondary' | 'default' | 'destructive'; icon: React.ReactNode }> = {
      scheduled: { 
        label: language === 'ar' ? 'مجدول' : 'Scheduled', 
        variant: 'secondary',
        icon: <Clock className="w-2 h-2" />
      },
      in_progress: { 
        label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress', 
        variant: 'default',
        icon: <AlertCircle className="w-2 h-2" />
      },
      completed: { 
        label: language === 'ar' ? 'مكتمل' : 'Completed', 
        variant: 'default',
        icon: <CheckCircle className="w-2 h-2" />
      },
      cancelled: { 
        label: language === 'ar' ? 'ملغي' : 'Cancelled', 
        variant: 'destructive',
        icon: <XCircle className="w-2 h-2" />
      }
    };
    
    const config = statusConfig[status];
    
    return (
      <Badge variant={config.variant} className={cn(
        "flex items-center gap-1 text-xs px-2 py-1",
        language === 'ar' ? 'flex-row-reverse' : 'flex-row'
      )}>
        {language === 'ar' && config.icon}
        {config.label}
        {language !== 'ar' && config.icon}
      </Badge>
    );
  };

  return (
    <PageContainer systemDate={new Date()}>
      <PageHeader
        title={language === 'ar' ? 'جدولة الصيانة' : 'Maintenance Scheduling'}
        subtitle={language === 'ar' ? 'إدارة وتخطيط جدولة صيانة المركبات' : 'Manage and plan vehicle maintenance schedules'}
        icon={<CalendarIcon className="w-5 h-5 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />

      {/* Filters and Actions */}
      <div className={cn(
        "flex flex-col md:flex-row gap-3 mb-5",
        language === 'ar' ? 'md:flex-row-reverse' : ''
      )} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex-1 flex gap-3">
          <div className="relative flex-1">
            <Search className={cn(
              "absolute top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400",
              language === 'ar' ? 'right-3' : 'left-3'
            )} />
            <Input
              placeholder={language === 'ar' ? 'البحث في الجدولة...' : 'Search schedules...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "h-10 text-sm",
                language === 'ar' ? 'pr-9 text-right' : 'pl-9'
              )}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-10 text-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} />
            </SelectTrigger>
            <SelectContent align={language === 'ar' ? 'start' : 'end'}>
              <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</SelectItem>
              <SelectItem value="scheduled">{language === 'ar' ? 'مجدول' : 'Scheduled'}</SelectItem>
              <SelectItem value="in_progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</SelectItem>
              <SelectItem value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
              <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setShowAddForm(true)} className="h-10">
          <Plus className={cn("h-3 w-3", language === 'ar' ? 'ml-2' : 'mr-2')} />
          {language === 'ar' ? 'إضافة جدولة' : 'Add Schedule'}
        </Button>
      </div>

      {/* Add Schedule Form */}
      {showAddForm && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className={cn(
              "flex items-center gap-2 text-lg",
              language === 'ar' ? 'flex-row-reverse text-right' : 'flex-row text-left'
            )} dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {language === 'ar' && <Plus className="h-4 w-4" />}
              {language === 'ar' ? 'إضافة جدولة صيانة جديدة' : 'Add New Maintenance Schedule'}
              {language !== 'ar' && <Plus className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <div className="space-y-2">
                <Label className={cn("text-sm", language === 'ar' ? 'text-right' : 'text-left')}>
                  {language === 'ar' ? 'المركبة' : 'Vehicle'}
                </Label>
                <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}>
                  <SelectTrigger className="h-10 text-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <SelectValue placeholder={language === 'ar' ? 'اختر المركبة' : 'Select Vehicle'} />
                  </SelectTrigger>
                  <SelectContent align={language === 'ar' ? 'start' : 'end'}>
                    {(vehicles as any[]).map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {`${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className={cn("text-sm", language === 'ar' ? 'text-right' : 'text-left')}>
                  {language === 'ar' ? 'نوع الصيانة' : 'Maintenance Type'}
                </Label>
                <Select value={formData.maintenance_type} onValueChange={(value) => setFormData({ ...formData, maintenance_type: value })}>
                  <SelectTrigger className="h-10 text-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <SelectValue placeholder={language === 'ar' ? 'اختر نوع الصيانة' : 'Select Type'} />
                  </SelectTrigger>
                  <SelectContent align={language === 'ar' ? 'start' : 'end'}>
                    <SelectItem value="oil_change">{language === 'ar' ? 'تغيير الزيت' : 'Oil Change'}</SelectItem>
                    <SelectItem value="tire_rotation">{language === 'ar' ? 'دوران الإطارات' : 'Tire Rotation'}</SelectItem>
                    <SelectItem value="brake_service">{language === 'ar' ? 'خدمة الفرامل' : 'Brake Service'}</SelectItem>
                    <SelectItem value="general_inspection">{language === 'ar' ? 'فحص عام' : 'General Inspection'}</SelectItem>
                    <SelectItem value="other">{language === 'ar' ? 'أخرى' : 'Other'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className={cn("text-sm", language === 'ar' ? 'text-right' : 'text-left')}>
                  {language === 'ar' ? 'التاريخ المجدول' : 'Scheduled Date'}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn(
                      "w-full justify-start text-left font-normal h-10 text-sm",
                      language === 'ar' ? 'flex-row-reverse text-right' : 'flex-row text-left'
                    )} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      {language === 'ar' && <CalendarIcon className="ml-2 h-3 w-3" />}
                      {formData.scheduled_date ? format(formData.scheduled_date, 'PPP', { locale: language === 'ar' ? ar : undefined }) : (
                        <span>{language === 'ar' ? 'اختر التاريخ' : 'Pick a date'}</span>
                      )}
                      {language !== 'ar' && <CalendarIcon className="mr-2 h-3 w-3" />}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align={language === 'ar' ? 'start' : 'end'}>
                    <Calendar
                      mode="single"
                      selected={formData.scheduled_date}
                      onSelect={(date) => date && setFormData({ ...formData, scheduled_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label className={cn("text-sm", language === 'ar' ? 'text-right' : 'text-left')}>
                  {language === 'ar' ? 'التكلفة المقدرة (ريال)' : 'Estimated Cost (QAR)'}
                </Label>
                <Input
                  type="number"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: parseFloat(e.target.value) || 0 })}
                  className={cn("h-10 text-sm", language === 'ar' ? 'text-right' : 'text-left')}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              
              <div className="space-y-2">
                <Label className={cn("text-sm", language === 'ar' ? 'text-right' : 'text-left')}>
                  {language === 'ar' ? 'مقدم الخدمة' : 'Service Provider'}
                </Label>
                <Input
                  value={formData.service_provider}
                  onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
                  placeholder={language === 'ar' ? 'اسم مقدم الخدمة' : 'Service provider name'}
                  className={cn("h-10 text-sm", language === 'ar' ? 'text-right' : 'text-left')}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label className={cn("text-sm", language === 'ar' ? 'text-right' : 'text-left')}>
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={language === 'ar' ? 'تفاصيل الصيانة المطلوبة' : 'Details of required maintenance'}
                  className={cn("text-sm", language === 'ar' ? 'text-right' : 'text-left')}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label className={cn("text-sm", language === 'ar' ? 'text-right' : 'text-left')}>
                  {language === 'ar' ? 'ملاحظات' : 'Notes'}
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={language === 'ar' ? 'ملاحظات إضافية' : 'Additional notes'}
                  className={cn("text-sm", language === 'ar' ? 'text-right' : 'text-left')}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </div>
            
            <div className={cn(
              "flex gap-2 mt-5",
              language === 'ar' ? 'flex-row-reverse' : 'flex-row'
            )}>
              <Button onClick={handleAddSchedule} className="h-10 text-sm">
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="h-10 text-sm">
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Items */}
      <div className="grid gap-3">
        {isLoading ? (
          <div className="text-center py-6">
            <div className="text-gray-500 text-sm">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="p-6 text-center">
            <CalendarIcon className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === 'ar' ? 'لا توجد جدولة صيانة' : 'No maintenance schedules'}
            </h3>
            <p className="text-gray-500 text-sm">
              {language === 'ar' ? 'لم يتم العثور على أي جدولة صيانة. أضف جدولة جديدة للبدء.' : 'No maintenance schedules found. Add a new schedule to get started.'}
            </p>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="p-3">
              <div className={cn(
                "flex items-start justify-between",
                language === 'ar' ? 'flex-row-reverse' : 'flex-row'
              )} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="flex-1">
                  <div className={cn(
                    "flex items-center gap-2 mb-2",
                    language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                  )}>
                    {language === 'ar' && <Car className="h-4 w-4 text-blue-500" />}
                    <h3 className={cn(
                      "font-semibold text-sm",
                      language === 'ar' ? 'text-right' : 'text-left'
                    )}>
                      {item.vehicle_make} {item.vehicle_model}
                    </h3>
                    {language !== 'ar' && <Car className="h-4 w-4 text-blue-500" />}
                    <Badge variant="outline" className="text-xs px-2 py-1">{item.license_plate}</Badge>
                  </div>
                  
                  <div className={cn(
                    "flex items-center gap-3 mb-2 text-xs text-gray-600",
                    language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                  )}>
                    <div className={cn(
                      "flex items-center gap-1",
                      language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      {language === 'ar' && <Wrench className="h-3 w-3" />}
                      <span>{item.maintenance_type}</span>
                      {language !== 'ar' && <Wrench className="h-3 w-3" />}
                    </div>
                    
                    <div className={cn(
                      "flex items-center gap-1",
                      language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      {language === 'ar' && <CalendarIcon className="h-3 w-3" />}
                      <span>
                        {format(new Date(item.scheduled_date), 'PPP', { 
                          locale: language === 'ar' ? ar : undefined 
                        })}
                      </span>
                      {language !== 'ar' && <CalendarIcon className="h-3 w-3" />}
                    </div>
                  </div>
                  
                  <p className={cn(
                    "text-gray-700 mb-2 text-xs",
                    language === 'ar' ? 'text-right' : 'text-left'
                  )}>
                    {item.description}
                  </p>
                  
                  <div className={cn(
                    "flex items-center gap-2",
                    language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                  )}>
                    {getStatusBadge(item.status)}
                    <span className="text-sm font-semibold text-green-600">
                      {item.estimated_cost} {language === 'ar' ? 'ريال' : 'QAR'}
                    </span>
                  </div>
                  
                  {item.service_provider && (
                    <p className={cn(
                      "text-xs text-gray-500 mt-1",
                      language === 'ar' ? 'text-right' : 'text-left'
                    )}>
                      {language === 'ar' ? 'مقدم الخدمة: ' : 'Service Provider: '}
                      {item.service_provider}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </PageContainer>
  );
};

export default MaintenanceSchedule;