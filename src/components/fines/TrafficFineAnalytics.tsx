
import React, { useMemo } from 'react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, PieChart } from '@/components/ui/charts';
import { 
  AlertTriangle, DollarSign, CheckCircle, XCircle 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TrafficFineAnalytics() {
  const { trafficFines, isLoading } = useTrafficFines();
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (!trafficFines || trafficFines.length === 0) {
      return {
        total: 0,
        paid: 0,
        pending: 0,
        disputed: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0
      };
    }
    
    const paid = trafficFines.filter(fine => fine.payment_status === 'paid').length;
    const pending = trafficFines.filter(fine => fine.payment_status === 'pending').length;
    const disputed = trafficFines.filter(fine => fine.payment_status === 'disputed').length;
    
    const totalAmount = trafficFines.reduce((sum, fine) => sum + (fine.fine_amount || 0), 0);
    const paidAmount = trafficFines
      .filter(fine => fine.payment_status === 'paid')
      .reduce((sum, fine) => sum + (fine.fine_amount || 0), 0);
    const pendingAmount = trafficFines
      .filter(fine => fine.payment_status === 'pending')
      .reduce((sum, fine) => sum + (fine.fine_amount || 0), 0);
    const disputedAmount = trafficFines
      .filter(fine => fine.payment_status === 'disputed')
      .reduce((sum, fine) => sum + (fine.fine_amount || 0), 0);
      
    return {
      total: trafficFines.length,
      paid,
      pending,
      disputed,
      totalAmount,
      paidAmount,
      pendingAmount,
      disputedAmount
    };
  }, [trafficFines]);
  
  // Prepare data for charts
  const monthlyData = useMemo(() => {
    if (!trafficFines || trafficFines.length === 0) return [];
    
    const monthlyMap = new Map();
    
    trafficFines.forEach(fine => {
      if (!fine.violation_date) return;
      
      const date = new Date(fine.violation_date);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const key = `${month} ${year}`;
      
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { month: key, count: 0, amount: 0 });
      }
      
      const entry = monthlyMap.get(key);
      entry.count += 1;
      entry.amount += (fine.fine_amount || 0);
    });
    
    return Array.from(monthlyMap.values());
  }, [trafficFines]);
  
  const statusData = useMemo(() => {
    return [
      { name: 'Paid', value: stats.paid, amount: stats.paidAmount },
      { name: 'Pending', value: stats.pending, amount: stats.pendingAmount },
      { name: 'Disputed', value: stats.disputed, amount: stats.disputedAmount }
    ];
  }, [stats]);
  
  const plateData = useMemo(() => {
    if (!trafficFines || trafficFines.length === 0) return [];
    
    const plateMap = new Map();
    
    trafficFines.forEach(fine => {
      if (!fine.license_plate) return;
      
      if (!plateMap.has(fine.license_plate)) {
        plateMap.set(fine.license_plate, { 
          plate: fine.license_plate, 
          count: 0, 
          amount: 0 
        });
      }
      
      const entry = plateMap.get(fine.license_plate);
      entry.count += 1;
      entry.amount += (fine.fine_amount || 0);
    });
    
    // Sort by count and take top 5
    return Array.from(plateMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [trafficFines]);
  
  if (isLoading) {
    return <div className="p-8 text-center">Loading analytics...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total amount: QAR {stats.totalAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold">{stats.paid}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Paid amount: QAR {stats.paidAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-red-500 mr-2" />
              <div className="text-2xl font-bold">{stats.pending}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Outstanding amount: QAR {stats.pendingAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Trend</TabsTrigger>
          <TabsTrigger value="status">By Status</TabsTrigger>
          <TabsTrigger value="vehicles">By Vehicle</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Fine Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <BarChart 
                  data={monthlyData}
                  xAxisKey="month"
                  barKeys={["count"]}
                  barColors={["#f59e0b"]}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="status" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Fines by Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center justify-center">
              <div className="h-64 w-64">
                <PieChart 
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  colors={["#22c55e", "#f97316", "#f43f5e"]}
                />
              </div>
              <div className="mt-4 md:mt-0 md:ml-8">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="w-4 h-4 rounded-full bg-green-500 mr-2"></span>
                    <span>Paid: {stats.paid} fines (QAR {stats.paidAmount.toLocaleString()})</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-4 h-4 rounded-full bg-orange-500 mr-2"></span>
                    <span>Pending: {stats.pending} fines (QAR {stats.pendingAmount.toLocaleString()})</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-4 h-4 rounded-full bg-rose-500 mr-2"></span>
                    <span>Disputed: {stats.disputed} fines (QAR {stats.disputedAmount.toLocaleString()})</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="vehicles" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Vehicles with Fines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <BarChart 
                  data={plateData}
                  xAxisKey="plate"
                  barKeys={["count"]}
                  barColors={["#3b82f6"]}
                />
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {plateData.map((item, index) => (
                  <div key={index} className="flex justify-between p-2 border rounded">
                    <div>
                      <Badge variant="outline">{item.plate}</Badge>
                      <span className="text-sm block mt-1">{item.count} fines</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold">QAR {item.amount.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">Total amount</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
