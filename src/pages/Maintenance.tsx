import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MaintenanceDashboard from '@/components/maintenance/MaintenanceDashboard';
import MaintenanceFilters, { MaintenanceFilterOptions } from '@/components/maintenance/MaintenanceFilters';
import VehicleMaintenanceCards from '@/components/maintenance/VehicleMaintenanceCards';
import MaintenanceTable from '@/components/maintenance/MaintenanceTable';
import { MaintenanceTimeline } from '@/components/maintenance/MaintenanceTimeline';
import { QuickActionsPanel } from '@/components/maintenance/QuickActionsPanel';
import { useMaintenance, MaintenanceRecord } from '@/hooks/use-maintenance';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import { Wrench } from 'lucide-react';
import { MaintenanceSchedulingWizard } from '@/components/maintenance/MaintenanceSchedulingWizard';

const Maintenance = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<MaintenanceFilterOptions>({
    searchTerm: '',
    status: '',
    vehicle: '',
    dateFrom: undefined,
    dateTo: undefined,
    maintenanceType: ''
  });

  const { getAllRecords, deleteMaintenanceRecord } = useMaintenance();
  const { getAllVehicles } = useVehicleService();

  // تحميل البيانات مرة واحدة فقط عند تحميل المكون
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setIsLoadingVehicles(true);

        // تحميل سجلات الصيانة
        const records = await getAllRecords();
        if (mounted) {
          setMaintenanceRecords(records);
          setFilteredRecords(records);
          setIsLoading(false);
        }

        // تحميل المركبات
        const vehicleData = await getAllVehicles();
        if (mounted) {
          setVehicles(vehicleData.filter(v => v.status === 'maintenance' || v.status === 'accident'));
          setIsLoadingVehicles(false);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error loading maintenance data:', error);
          toast.error('فشل في تحميل بيانات الصيانة');
          setIsLoading(false);
          setIsLoadingVehicles(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - تحميل مرة واحدة فقط

  // تطبيق الفلاتر على سجلات الصيانة
  useEffect(() => {
    if (!maintenanceRecords || maintenanceRecords.length === 0) {
      setFilteredRecords([]);
      return;
    }
    
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

  // دالة تحديث يدوي
  const handleManualRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsLoadingVehicles(true);

      const [records, vehicleData] = await Promise.all([
        getAllRecords(),
        getAllVehicles()
      ]);

      setMaintenanceRecords(records);
      setFilteredRecords(records);
      setVehicles(vehicleData.filter(v => v.status === 'maintenance' || v.status === 'accident'));
      
      toast.success('تم تحديث البيانات بنجاح');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('فشل في تحديث البيانات');
    } finally {
      setIsLoading(false);
      setIsLoadingVehicles(false);
    }
  }, [getAllRecords, getAllVehicles]);

  // خيارات المركبات مع memoization
  const vehicleOptions = useMemo(() => 
    vehicles?.map(vehicle => ({
      id: vehicle.id,
      label: `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`
    })) || [], 
    [vehicles]
  );

  // تصنيف سجلات الصيانة حسب الحالة مع memoization
  const { activeRecords, scheduledRecords, completedRecords } = useMemo(() => {
    const active = maintenanceRecords.filter(record => 
      record.status === 'in_progress' || record.status === 'scheduled'
    );
    
    const scheduled = maintenanceRecords.filter(record => 
      record.status === 'scheduled'
    );
    
    const completed = maintenanceRecords.filter(record => 
      record.status === 'completed'
    );

    return { activeRecords: active, scheduledRecords: scheduled, completedRecords: completed };
  }, [maintenanceRecords]);

  // إحصائيات التبويبات مع memoization
  const tabCounts = useMemo(() => ({
    active: activeRecords.length,
    scheduled: scheduledRecords.length,
    completed: completedRecords.length,
    total: maintenanceRecords.length
  }), [activeRecords.length, scheduledRecords.length, completedRecords.length, maintenanceRecords.length]);

  // معالجات الأحداث مع memoization
  const handleFilterChange = useCallback((newFilters: MaintenanceFilterOptions) => {
    setFilters(newFilters);
  }, []);

  const handleAddMaintenance = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  const handleEditMaintenance = useCallback((record: MaintenanceRecord) => {
    navigate(`/maintenance/${record.id}/edit`);
  }, [navigate]);

  const handleDeleteMaintenance = useCallback(async (id: string) => {
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
  }, [deleteMaintenanceRecord]);

  const handleVehicleCardClick = useCallback((vehicle: any) => {
    if (!vehicle.maintenance || vehicle.maintenance.length === 0) {
      setSelectedVehicleId(vehicle.id);
      setIsCreateDialogOpen(true);
    } else {
      navigate(`/maintenance/job/${vehicle.id}`);
    }
  }, [navigate]);

  // معالجات الإجراءات السريعة
  const handleEmergencyMaintenance = useCallback(() => {
    setIsCreateDialogOpen(true);
    toast.info('إضافة صيانة طارئة...');
  }, []);

  const handleAssignTechnician = useCallback(() => {
    toast.info('تعيين فني للصيانة...');
  }, []);

  const handlePostponeMaintenance = useCallback(() => {
    toast.info('تأجيل الصيانة المجدولة...');
  }, []);

  const handleRequestParts = useCallback(() => {
    toast.info('طلب قطع غيار...');
  }, []);

  const handleViewReports = useCallback(() => {
    navigate('/reports');
  }, [navigate]);

  const handleManageTeam = useCallback(() => {
    toast.info('إدارة فريق الصيانة...');
  }, []);

  // دالة مساعدة للحصول على مراحل Timeline
  const getSampleTimelineStages = useCallback((record: MaintenanceRecord) => {
    const stages = [
      { 
        name: 'مجدولة', 
        status: 'completed' as const, 
        date: record.scheduled_date ? new Date(record.scheduled_date).toLocaleDateString('ar-SA') : undefined,
        description: 'تم جدولة الصيانة'
      }
    ];

    if (record.status === 'in_progress' || record.status === 'completed') {
      stages.push({
        name: 'قيد التنفيذ',
        status: record.status === 'in_progress' ? 'current' as const : 'completed' as const,
        assignedTo: record.assigned_technician || 'فني أحمد',
        description: 'الصيانة قيد التنفيذ'
      });
    } else {
      stages.push({
        name: 'قيد التنفيذ',
        status: 'pending' as const,
        description: 'في انتظار البدء'
      });
    }

    if (record.status === 'completed') {
      stages.push({
        name: 'مكتملة',
        status: 'completed' as const,
        date: record.completion_date ? new Date(record.completion_date).toLocaleDateString('ar-SA') : undefined,
        description: 'تم إنجاز الصيانة بنجاح'
      });
    } else {
      stages.push({
        name: 'اختبار نهائي',
        status: 'pending' as const,
        description: 'فحص الجودة والاختبار'
      });
      stages.push({
        name: 'مكتملة',
        status: 'pending' as const,
        description: 'إتمام الصيانة وتسليم المركبة'
      });
    }

    return stages;
  }, []);

  // دالة للحصول على معلومات المركبة
  const getVehicleInfo = useCallback((vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return {
      make: vehicle?.make || 'غير محدد',
      model: vehicle?.model || 'غير محدد',
      licensePlate: vehicle?.license_plate || 'غير محدد'
    };
  }, [vehicles]);

  return (
    <PageContainer 
      title="إدارة الصيانة"
      description="نظام شامل لإدارة وتتبع جميع أنشطة صيانة المركبات"
      systemDate={new Date()}
      dir="rtl"
    >
      <div className="space-y-6" dir="rtl">
        <PageHeader
          title="إدارة الصيانة"
          subtitle="نظام شامل لإدارة وتتبع جميع أنشطة صيانة المركبات"
          icon={<Wrench className="w-6 h-6 text-blue-500" />}
          align="right"
          dir="rtl"
        />

        {/* Quick Actions */}
        <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center gap-4">
          <div className="flex gap-2 flex-row-reverse">
            <Button onClick={handleAddMaintenance} className="flex-row-reverse">
              <Plus className="h-4 w-4 ml-2" />
              إضافة صيانة جديدة
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setActiveTab('schedule')}
              className="flex-row-reverse"
            >
              <Calendar className="h-4 w-4 ml-2" />
              عرض الجدولة
            </Button>
            <Button 
              variant="outline" 
              onClick={handleManualRefresh}
              className="flex-row-reverse"
              disabled={isLoading}
            >
              <Clock className="h-4 w-4 ml-2" />
              {isLoading ? 'جاري التحديث...' : 'تحديث البيانات'}
            </Button>
          </div>
        </div>

        {/* نظام التنبيهات الذكية */}
        {(tabCounts.active > 3 || vehicles.length > 2) && (
          <Card className="border-l-4 border-l-orange-500 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 flex-row-reverse" dir="rtl">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
                <div className="flex-1 text-right">
                  <h4 className="font-medium text-orange-800">تنبيه: زيادة في أعمال الصيانة</h4>
                  <p className="text-sm text-orange-600">
                    لديك {tabCounts.active} مهمة صيانة نشطة و {vehicles.length} مركبة في الصيانة
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setActiveTab('active')}
                  className="flex-row-reverse"
                >
                  عرض التفاصيل
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* نظام تنبيهات الصيانة الوقائية */}
        {vehicles.some(v => v.mileage && v.mileage > 50000) && (
          <Card className="border-l-4 border-l-blue-500 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-row-reverse" dir="rtl">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <Clock className="h-6 w-6 text-blue-500" />
                  <div className="text-right">
                    <h4 className="font-medium text-blue-800">صيانة وقائية مطلوبة</h4>
                    <p className="text-sm text-blue-600">
                      {vehicles.filter(v => v.mileage && v.mileage > 50000).length} مركبات تحتاج صيانة وقائية
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => {
                    setActiveTab('schedule');
                    setIsCreateDialogOpen(true);
                  }}
                  className="flex-row-reverse"
                >
                  جدولة الآن
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs System */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-4 h-12" dir="rtl" style={{ direction: 'rtl' }}>
            {/* ترتيب التبويبات من اليمين لليسار: نظرة عامة، الصيانة النشطة، الجدولة، السجل */}
            <TabsTrigger value="overview" className="flex items-center gap-2 flex-row-reverse" style={{ order: 1 }}>
              <Wrench className="h-4 w-4" />
              <span>نظرة عامة</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2 flex-row-reverse" style={{ order: 2 }}>
              <AlertTriangle className="h-4 w-4" />
              <span>الصيانة النشطة</span>
              {tabCounts.active > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {tabCounts.active}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2 flex-row-reverse" style={{ order: 3 }}>
              <Calendar className="h-4 w-4" />
              <span>الجدولة</span>
              {tabCounts.scheduled > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {tabCounts.scheduled}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 flex-row-reverse" style={{ order: 4 }}>
              <CheckCircle className="h-4 w-4" />
              <span>السجل</span>
              <Badge variant="outline" className="text-xs">
                {tabCounts.completed}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <MaintenanceDashboard />
            
            {/* إضافة QuickActionsPanel */}
            <QuickActionsPanel
              onEmergencyMaintenance={handleEmergencyMaintenance}
              onAssignTechnician={handleAssignTechnician}
              onPostponeMaintenance={handlePostponeMaintenance}
              onRequestParts={handleRequestParts}
              onViewReports={handleViewReports}
              onManageTeam={handleManageTeam}
              urgentCount={activeRecords.filter(r => r.priority === 'urgent' || r.service_type?.includes('طارئ')).length}
              pendingAssignments={activeRecords.filter(r => !r.assigned_technician).length}
            />
            
            <MaintenanceFilters 
              onFilterChange={handleFilterChange}
              vehicleOptions={vehicleOptions}
            />

            <Card className="p-4">
              <CardHeader>
                <CardTitle className="text-right">المركبات في الصيانة</CardTitle>
              </CardHeader>
              <CardContent>
                <VehicleMaintenanceCards 
                  vehicles={vehicles || []}
                  isLoading={isLoadingVehicles}
                  onVehicleCardClick={handleVehicleCardClick}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Maintenance Tab */}
          <TabsContent value="active" className="space-y-6">
            {/* إضافة Timeline للصيانة النشطة */}
            {activeRecords.length > 0 && (
              <div className="grid gap-4">
                {activeRecords.slice(0, 2).map((record) => (
                  <MaintenanceTimeline
                    key={record.id}
                    stages={getSampleTimelineStages(record)}
                    vehicleInfo={getVehicleInfo(record.vehicle_id)}
                    maintenanceType={record.service_type || record.maintenance_type || 'صيانة عامة'}
                  />
                ))}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  الصيانة النشطة والمجدولة
                  <Badge variant="destructive">{activeRecords.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MaintenanceTable
                  records={activeRecords}
                  onEdit={handleEditMaintenance}
                  onDelete={handleDeleteMaintenance}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  الصيانة المجدولة
                  <Badge variant="secondary">{scheduledRecords.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MaintenanceTable
                  records={scheduledRecords}
                  onEdit={handleEditMaintenance}
                  onDelete={handleDeleteMaintenance}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  سجل الصيانة المكتملة
                  <Badge variant="outline">{completedRecords.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MaintenanceTable
                  records={completedRecords}
                  onEdit={handleEditMaintenance}
                  onDelete={handleDeleteMaintenance}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Maintenance Scheduling Wizard */}
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
      </div>
    </PageContainer>
  );
};

export default Maintenance;
