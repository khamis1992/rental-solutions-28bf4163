
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const COLORS = ['#ef4444', '#f59e0b', '#10b981'];
const STATUS_COLORS: Record<string, string> = {
  pending: '#ef4444',
  disputed: '#f59e0b',
  paid: '#10b981'
};

const TrafficFineAnalytics = () => {
  const { trafficFines, isLoading } = useTrafficFines();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Prepare data for the status distribution chart
  const statusDistribution = [
    { name: 'Pending', value: 0 },
    { name: 'Disputed', value: 0 },
    { name: 'Paid', value: 0 }
  ];

  trafficFines?.forEach(fine => {
    switch (fine.paymentStatus) {
      case 'pending':
        statusDistribution[0].value += 1;
        break;
      case 'disputed':
        statusDistribution[1].value += 1;
        break;
      case 'paid':
        statusDistribution[2].value += 1;
        break;
    }
  });

  // Calculate financial metrics
  const totalFineAmount = trafficFines?.reduce((sum, fine) => sum + fine.fineAmount, 0) || 0;
  const pendingAmount = trafficFines?.filter(fine => fine.paymentStatus === 'pending')
    .reduce((sum, fine) => sum + fine.fineAmount, 0) || 0;
  const paidAmount = trafficFines?.filter(fine => fine.paymentStatus === 'paid')
    .reduce((sum, fine) => sum + fine.fineAmount, 0) || 0;
  const disputedAmount = trafficFines?.filter(fine => fine.paymentStatus === 'disputed')
    .reduce((sum, fine) => sum + fine.fineAmount, 0) || 0;

  // Prepare data for financial chart
  const financialData = [
    { name: 'Pending', amount: pendingAmount },
    { name: 'Disputed', amount: disputedAmount },
    { name: 'Paid', amount: paidAmount }
  ];

  // Prepare data for monthly trend
  const monthlyData: Record<string, { month: string, count: number, amount: number }> = {};
  
  trafficFines?.forEach(fine => {
    const date = new Date(fine.violationDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthName,
        count: 0,
        amount: 0
      };
    }
    
    monthlyData[monthKey].count += 1;
    monthlyData[monthKey].amount += fine.fineAmount;
  });
  
  // Convert to array and sort by date
  const monthlyTrend = Object.values(monthlyData).sort((a, b) => {
    return a.month.localeCompare(b.month);
  });

  // Get top vehicles with most fines
  const vehicleFines: Record<string, { count: number, amount: number }> = {};
  
  trafficFines?.forEach(fine => {
    if (fine.licensePlate) {
      if (!vehicleFines[fine.licensePlate]) {
        vehicleFines[fine.licensePlate] = {
          count: 0,
          amount: 0
        };
      }
      
      vehicleFines[fine.licensePlate].count += 1;
      vehicleFines[fine.licensePlate].amount += fine.fineAmount;
    }
  });
  
  const topVehicles = Object.entries(vehicleFines)
    .map(([licensePlate, data]) => ({
      licensePlate,
      count: data.count,
      amount: data.amount
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trafficFines?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Worth {formatCurrency(totalFineAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              From {statusDistribution[0].value} fines
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidAmount)}</div>
            <p className="text-xs text-muted-foreground">
              From {statusDistribution[2].value} fines
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disputed Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(disputedAmount)}</div>
            <p className="text-xs text-muted-foreground">
              From {statusDistribution[1].value} fines
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Fine Status Distribution</CardTitle>
            <CardDescription>
              Distribution of traffic fines by payment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} fines`, 'Count']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Financial Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>
              Distribution of fine amounts by payment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={financialData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${formatCurrency(value)}`, 'Amount']} />
                  <Legend />
                  <Bar dataKey="amount" name="Amount">
                    {financialData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
          <CardDescription>
            Traffic fine count and amount by month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyTrend}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="#ef4444" />
                <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'count') return [`${value} fines`, 'Count'];
                    return [`${formatCurrency(value)}`, 'Amount'];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="Fine Count" fill="#ef4444" />
                <Bar yAxisId="right" dataKey="amount" name="Fine Amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Vehicles */}
      <Card>
        <CardHeader>
          <CardTitle>Top Vehicles with Traffic Fines</CardTitle>
          <CardDescription>
            Vehicles with the most traffic violations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">License Plate</th>
                  <th className="text-left py-2 px-4">Violations</th>
                  <th className="text-left py-2 px-4">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {topVehicles.length > 0 ? (
                  topVehicles.map((vehicle, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4">{vehicle.licensePlate}</td>
                      <td className="py-2 px-4">{vehicle.count}</td>
                      <td className="py-2 px-4">{formatCurrency(vehicle.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-4">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrafficFineAnalytics;
