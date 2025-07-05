
import React, { useEffect, useState } from 'react';
import { useMaintenance } from '@/hooks/use-maintenance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MaintenanceType, MaintenanceStatus } from '@/lib/validation-schemas/maintenance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MaintenanceReport = () => {
  const { getAllRecords } = useMaintenance();
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getAllRecords();
        setMaintenanceData(data || []);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-64" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load maintenance data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Process data for status chart
  const statusData = Object.values(MaintenanceStatus).map(status => {
    const count = maintenanceData.filter(item => item.status === status).length;
    return {
      name: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count
    };
  }).filter(item => item.value > 0);

  // Process data for maintenance type chart
  const typeData = Object.values(MaintenanceType).map(type => {
    const count = maintenanceData.filter(item => item.maintenance_type === type).length;
    return {
      name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: count
    };
  }).filter(item => item.count > 0);

  // Calculate cost by maintenance type
  const costByType = Object.values(MaintenanceType).map(type => {
    const records = maintenanceData.filter(item => item.maintenance_type === type);
    const totalCost = records.reduce((sum, item) => sum + (item.cost || 0), 0);
    return {
      name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      cost: totalCost
    };
  }).filter(item => item.cost > 0);

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="text-right">تحليل الصيانة</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" dir="rtl">
          <TabsList className="mb-4">
            <TabsTrigger value="status">توزيع الحالات</TabsTrigger>
            <TabsTrigger value="type">أنواع الصيانة</TabsTrigger>
            <TabsTrigger value="cost">تحليل التكاليف</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4">
            <div className="h-[300px]">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} سجل`, 'العدد']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  لا توجد بيانات صيانة متاحة
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="type" className="space-y-4">
            <div className="h-[300px]">
              {typeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={typeData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}`, 'عدد السجلات']} />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="عدد السجلات" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  لا توجد بيانات صيانة متاحة
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="cost" className="space-y-4">
            <div className="h-[300px]">
              {costByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={costByType}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => {
                        return [`${typeof value === 'number' ? value.toFixed(2) : value} ر.ق`, 'التكلفة'];
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="cost" fill="#82ca9d" name="إجمالي التكلفة" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  لا توجد بيانات تكلفة متاحة
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 text-sm text-muted-foreground text-right">
          إجمالي السجلات: {maintenanceData.length} | 
          مكتملة: {maintenanceData.filter(item => item.status === MaintenanceStatus.COMPLETED).length} | 
          قيد التنفيذ: {maintenanceData.filter(item => item.status === MaintenanceStatus.IN_PROGRESS).length} | 
          مجدولة: {maintenanceData.filter(item => item.status === MaintenanceStatus.SCHEDULED).length}
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceReport;
