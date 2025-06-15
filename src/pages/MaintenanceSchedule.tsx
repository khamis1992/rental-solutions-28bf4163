import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { useMaintenance } from '@/hooks/use-maintenance';
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
import { cn } from '@/lib/utils';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  status: string;
}

interface MaintenanceScheduleItem {
  id: string;
  vehicle_id: string;
  vehicle_make: string;
  vehicle_model: string;
  license_plate: string;
  maintenance_type: string;
  scheduled_date: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  estimated_cost: number;
  service_provider?: string;
  notes?: string;
}

type StatusType = 'pending' | 'in_progress' | 'completed' | 'overdue';
type PriorityType = 'low' | 'medium' | 'high';

const MaintenanceSchedule = () => {
  const { language } = useLanguage();
  const { getAllVehicles } = useVehicleService();
  const { getAllRecords, createMaintenanceRecord } = useMaintenance();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [scheduleItems, setScheduleItems] = useState<MaintenanceScheduleItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MaintenanceScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    vehicle_id: '',
    maintenance_type: '',
    scheduled_date: new Date(),
    description: '',
    priority: 'medium' as PriorityType,
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
        const scheduleData = maintenanceData
          .filter((record: any) => record.status !== 'completed')
          .map((record: any) => {
            const vehicle = vehicleData.find((v: Vehicle) => v.id === record.vehicle_id);
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
              priority: (record.priority as PriorityType) || 'medium',
              estimated_cost: record.cost || 0,
              service_provider: record.service_provider || '',
              notes: record.notes || ''
            };
          });
        
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
  }, [getAllVehicles, getAllRecords, language]);

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
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }
    
    setFilteredItems(filtered);
  }, [searchTerm, statusFilter, priorityFilter, scheduleItems]);

  const handleAddSchedule = async () => {
    try {
      // Create maintenance record without id (it will be auto-generated)
      const newRecord = {
        vehicle_id: formData.vehicle_id,
        service_type: formData.maintenance_type,
        scheduled_date: formData.scheduled_date.toISOString(),
        description: formData.description,
        status: 'pending',
        cost: formData.estimated_cost,
        notes: formData.notes
      };
      
      await createMaintenanceRecord(newRecord as any);
      
      toast.success(language === 'ar' ? 'تم إضافة جدولة الصيانة بنجاح' : 'Maintenance schedule added successfully');
      setShowAddForm(false);
      
      // Reset form
      setFormData({
        vehicle_id: '',
        maintenance_type: '',
        scheduled_date: new Date(),
        description: '',
        priority: 'medium',
        estimated_cost: 0,
        service_provider: '',
        notes: ''
      });
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error adding maintenance schedule:', error);
      toast.error(language === 'ar' ? 'فشل في إضافة جدولة الصيانة' : 'Failed to add maintenance schedule');
    }
  };

  const getStatusBadge = (status: StatusType) => {
    const statusConfig: Record<StatusType, { label: string; variant: 'secondary' | 'default' | 'destructive'; icon: React.ReactNode }> = {
      pending: { 
        label: language === 'ar' ? 'في الانتظار' : 'Pending', 
        variant: 'secondary',
        icon: <Clock className="w-3 h-3" />
      },
      in_progress: { 
        label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress', 
        variant: 'default',
        icon: <AlertCircle className="w-3 h-3" />
      },
      completed: { 
        label: language === 'ar' ? 'مكتمل' : 'Completed', 
        variant: 'default',
        icon: <CheckCircle className="w-3 h-3" />
      },
      overdue: { 
        label: language === 'ar' ? 'متأخر' : 'Overdue', 
        variant: 'destructive',
        icon: <XCircle className="w-3 h-3" />
      }
    };
    
    const config = statusConfig[status];
    
    return (
      <Badge variant={config.variant} className={cn(
        "flex items-center gap-1",
        language === 'ar' ? 'flex-row-reverse' : 'flex-row'
      )}>
        {language === 'ar' && config.icon}
        {config.label}
        {language !== 'ar' && config.icon}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: PriorityType) => {
    const priorityConfig: Record<PriorityType, { label: string; color: string }> = {
      low: { label: language === 'ar' ? 'منخفض' : 'Low', color: 'bg-green-100 text-green-800' },
      medium: { label: language === 'ar' ? 'متوسط' : 'Medium', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: language === 'ar' ? 'عالي' : 'High', color: 'bg-red-100 text-red-800' }
    };
    
    const config = priorityConfig[priority];
    
    return (
      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", config.color)}>
        {config.label}
      </span>
    );
  };

  return (
    <PageContainer systemDate={new Date()}>
      <PageHeader
        title={language === 'ar' ? 'جدولة الصيانة' : 'Maintenance Scheduling'}
        subtitle={language === 'ar' ? 'إدارة وتخطيط جدولة صيانة المركبات' : 'Manage and plan vehicle maintenance schedules'}
        icon={<CalendarIcon className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />

      {/* Filters and Actions */}
      <div className={cn(
        "flex flex-col md:flex-row gap-4 mb-6",
        language === 'ar' ? 'md:flex-row-reverse' : ''
      )} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex-1 flex gap-4">
          <div className="relative flex-1">
            <Search className={cn(
              "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400",
              language === 'ar' ? 'right-3' : 'left-3'
            )} />
            <Input
              placeholder={language === 'ar' ? 'البحث في الجدولة...' : 'Search schedules...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                language === 'ar' ? 'pr-10 text-right' : 'pl-10'
              )}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} />
            </SelectTrigger>
            <SelectContent align={language === 'ar' ? 'start' : 'end'}>
              <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</SelectItem>
              <SelectItem value="pending">{language === 'ar' ? 'في الانتظار' : 'Pending'}</SelectItem>
              <SelectItem value="in_progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</SelectItem>
              <SelectItem value="overdue">{language === 'ar' ? 'متأخر' : 'Overdue'}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <SelectValue placeholder={language === 'ar' ? 'الأولوية' : 'Priority'} />
            </SelectTrigger>
            <SelectContent align={language === 'ar' ? 'start' : 'end'}>
              <SelectItem value="all">{language === 'ar' ? 'جميع الأولويات' : 'All Priorities'}</SelectItem>
              <SelectItem value="high">{language === 'ar' ? 'عالي' : 'High'}</SelectItem>
              <SelectItem value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
              <SelectItem value="low">{language === 'ar' ? 'منخفض' : 'Low'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className={cn("h-4 w-4", language === 'ar' ? 'ml-2' : 'mr-2')} />
          {language === 'ar' ? 'إضافة جدولة' : 'Add Schedule'}
        </Button>
      </div>

      {/* Add Schedule Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className={cn(
              "flex items-center gap-2",
              language === 'ar' ? 'flex-row-reverse text-right' : 'flex-row text-left'
            )} dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {language === 'ar' && <Plus className="h-5 w-5" />}
              {language === 'ar' ? 'إضافة جدولة صيانة جديدة' : 'Add New Maintenance Schedule'}
              {language !== 'ar' && <Plus className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'المركبة' : 'Vehicle'}
                </Label>
                <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}>
                  <SelectTrigger dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <SelectValue placeholder={language === 'ar' ? 'اختر المركبة' : 'Select Vehicle'} />
                  </SelectTrigger>
                  <SelectContent align={language === 'ar' ? 'start' : 'end'}>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {`${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'نوع الصيانة' : 'Maintenance Type'}
                </Label>
                <Select value={formData.maintenance_type} onValueChange={(value) => setFormData({ ...formData, maintenance_type: value })}>
                  <SelectTrigger dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'التاريخ المجدول' : 'Scheduled Date'}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn(
                      "w-full justify-start text-left font-normal",
                      language === 'ar' ? 'flex-row-reverse text-right' : 'flex-row text-left'
                    )} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      {language === 'ar' && <CalendarIcon className="ml-2 h-4 w-4" />}
                      {formData.scheduled_date ? format(formData.scheduled_date, 'PPP', { locale: language === 'ar' ? ar : undefined }) : (
                        <span>{language === 'ar' ? 'اختر التاريخ' : 'Pick a date'}</span>
                      )}
                      {language !== 'ar' && <CalendarIcon className="mr-2 h-4 w-4" />}
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
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'الأولوية' : 'Priority'}
                </Label>
                <Select value={formData.priority} onValueChange={(value: PriorityType) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align={language === 'ar' ? 'start' : 'end'}>
                    <SelectItem value="low">{language === 'ar' ? 'منخفض' : 'Low'}</SelectItem>
                    <SelectItem value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                    <SelectItem value="high">{language === 'ar' ? 'عالي' : 'High'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'التكلفة المقدرة (ريال)' : 'Estimated Cost (QAR)'}
                </Label>
                <Input
                  type="number"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: parseFloat(e.target.value) || 0 })}
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'مقدم الخدمة' : 'Service Provider'}
                </Label>
                <Input
                  value={formData.service_provider}
                  onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
                  placeholder={language === 'ar' ? 'اسم مقدم الخدمة' : 'Service provider name'}
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={language === 'ar' ? 'تفاصيل الصيانة المطلوبة' : 'Details of required maintenance'}
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'ملاحظات' : 'Notes'}
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={language === 'ar' ? 'ملاحظات إضافية' : 'Additional notes'}
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </div>
            
            <div className={cn(
              "flex gap-2 mt-6",
              language === 'ar' ? 'flex-row-reverse' : 'flex-row'
            )}>
              <Button onClick={handleAddSchedule}>
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Items */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="p-8 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === 'ar' ? 'لا توجد جدولة صيانة' : 'No maintenance schedules'}
            </h3>
            <p className="text-gray-500">
              {language === 'ar' ? 'لم يتم العثور على أي جدولة صيانة. أضف جدولة جديدة للبدء.' : 'No maintenance schedules found. Add a new schedule to get started.'}
            </p>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className={cn(
                "flex items-start justify-between",
                language === 'ar' ? 'flex-row-reverse' : 'flex-row'
              )} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="flex-1">
                  <div className={cn(
                    "flex items-center gap-3 mb-2",
                    language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                  )}>
                    {language === 'ar' && <Car className="h-5 w-5 text-blue-500" />}
                    <h3 className={cn(
                      "font-semibold text-lg",
                      language === 'ar' ? 'text-right' : 'text-left'
                    )}>
                      {item.vehicle_make} {item.vehicle_model}
                    </h3>
                    {language !== 'ar' && <Car className="h-5 w-5 text-blue-500" />}
                    <Badge variant="outline">{item.license_plate}</Badge>
                  </div>
                  
                  <div className={cn(
                    "flex items-center gap-4 mb-3 text-sm text-gray-600",
                    language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                  )}>
                    <div className={cn(
                      "flex items-center gap-1",
                      language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      {language === 'ar' && <Wrench className="h-4 w-4" />}
                      <span>{item.maintenance_type}</span>
                      {language !== 'ar' && <Wrench className="h-4 w-4" />}
                    </div>
                    
                    <div className={cn(
                      "flex items-center gap-1",
                      language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      {language === 'ar' && <CalendarIcon className="h-4 w-4" />}
                      <span>
                        {format(new Date(item.scheduled_date), 'PPP', { 
                          locale: language === 'ar' ? ar : undefined 
                        })}
                      </span>
                      {language !== 'ar' && <CalendarIcon className="h-4 w-4" />}
                    </div>
                  </div>
                  
                  <p className={cn(
                    "text-gray-700 mb-3",
                    language === 'ar' ? 'text-right' : 'text-left'
                  )}>
                    {item.description}
                  </p>
                  
                  <div className={cn(
                    "flex items-center gap-3",
                    language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                  )}>
                    {getStatusBadge(item.status)}
                    {getPriorityBadge(item.priority)}
                    <span className="text-lg font-semibold text-green-600">
                      {item.estimated_cost} {language === 'ar' ? 'ريال' : 'QAR'}
                    </span>
                  </div>
                  
                  {item.service_provider && (
                    <p className={cn(
                      "text-sm text-gray-500 mt-2",
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