
import React, { useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const TrafficFineAnalytics = () => {
  const { trafficFines, isLoading, error } = useTrafficFines();
  
  const chartData = useMemo(() => {
    if (!trafficFines || trafficFines.length === 0) return [];
    
    // Group fines by month
    const finesByMonth: Record<string, { count: number; amount: number }> = {};
    
    trafficFines.forEach((fine) => {
      if (!fine.violationDate) return;
      
      const date = new Date(fine.violationDate);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!finesByMonth[monthYear]) {
        finesByMonth[monthYear] = { count: 0, amount: 0 };
      }
      
      finesByMonth[monthYear].count += 1;
      finesByMonth[monthYear].amount += fine.fineAmount;
    });
    
    // Convert to array for chart
    return Object.entries(finesByMonth).map(([name, data]) => ({
      name,
      count: data.count,
      amount: data.amount
    }));
  }, [trafficFines]);
  
  const statusData = useMemo(() => {
    if (!trafficFines || trafficFines.length === 0) return [];
    
    const statusCounts: Record<string, number> = {
      'paid': 0,
      'pending': 0,
      'disputed': 0
    };
    
    trafficFines.forEach((fine) => {
      const status = fine.paymentStatus || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [trafficFines]);
  
  const totalStats = useMemo(() => {
    if (!trafficFines || trafficFines.length === 0) {
      return { totalFines: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 };
    }
    
    const totalFines = trafficFines.length;
    const totalAmount = trafficFines.reduce((sum, fine) => sum + fine.fineAmount, 0);
    const paidAmount = trafficFines
      .filter(fine => fine.paymentStatus === 'paid')
      .reduce((sum, fine) => sum + fine.fineAmount, 0);
    const pendingAmount = trafficFines
      .filter(fine => fine.paymentStatus === 'pending')
      .reduce((sum, fine) => sum + fine.fineAmount, 0);
      
    return { totalFines, totalAmount, paidAmount, pendingAmount };
  }, [trafficFines]);
  
  const COLORS = ['#4ade80', '#f87171', '#facc15'];
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading traffic fines</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load traffic fines data"}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading analytics data...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalFines}</div>
            <p className="text-xs text-muted-foreground">All traffic violations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">Sum of all traffic fines</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Paid Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.paidAmount)}</div>
            <p className="text-xs text-muted-foreground">Revenue from traffic fines</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalStats.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">Uncollected fine payments</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fines by Month</CardTitle>
            <CardDescription>Monthly distribution of traffic fines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'amount' ? formatCurrency(value as number) : value, 
                        name === 'amount' ? 'Amount' : 'Count'
                      ]} 
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Number of Fines" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Fine Status Distribution</CardTitle>
            <CardDescription>Breakdown by payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} fines`, ""]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrafficFineAnalytics;
