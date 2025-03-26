
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, UserPlus, StarIcon, Repeat2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/hooks/use-customers';

const CustomerReport = () => {
  const { customers, isLoading } = useCustomers();
  
  // Calculate customer metrics from real data
  const totalCustomers = customers.length;
  
  // Get customers created in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const newCustomers = customers.filter(customer => {
    const createdDate = customer.created_at ? new Date(customer.created_at) : null;
    return createdDate && createdDate > thirtyDaysAgo;
  }).length;
  
  // Calculate customer segments based on status
  const activeCustomers = customers.filter(customer => customer.status === 'active').length;
  const inactiveCustomers = customers.filter(customer => customer.status === 'inactive').length;
  const blacklistedCustomers = customers.filter(customer => customer.status === 'blacklisted').length;
  const pendingCustomers = customers.filter(customer => customer.status === 'pending_review').length;
  
  // Prepare data for customer segments chart
  const customerSegmentData = [
    { name: 'Active', value: activeCustomers, color: '#3b82f6' },
    { name: 'Inactive', value: inactiveCustomers, color: '#22c55e' },
    { name: 'Blacklisted', value: blacklistedCustomers, color: '#f59e0b' },
    { name: 'Pending Review', value: pendingCustomers, color: '#8b5cf6' },
  ].filter(segment => segment.value > 0);
  
  // Get most recent customers
  const topCustomers = [...customers]
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5)
    .map(customer => ({
      id: customer.id,
      name: customer.full_name,
      status: customer.status || 'active',
      email: customer.email,
      phone: customer.phone,
      driverLicense: customer.driver_license,
      createdAt: customer.created_at ? new Date(customer.created_at).toISOString().split('T')[0] : 'N/A',
    }));

  // Calculate retention rate (active customers as percentage of total)
  const retentionRate = totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0;
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading customer data...</div>;
  }

  // Show empty state when no data is available
  if (totalCustomers === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Users className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium">No customer data available</h3>
        <p className="text-sm text-gray-500 mt-2">Add customers to see analytics and reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center mb-6">
        <img 
          src="/lovable-uploads/737e8bf3-01cb-4104-9d28-4e2775eb9efd.png" 
          alt="Alaraf Car Rental" 
          className="h-10 mr-4" 
        />
        <h2 className="text-xl font-bold">Customer Analytics Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Customers" 
          value={totalCustomers.toString()} 
          trend={newCustomers}
          trendLabel="new this month"
          icon={Users}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="New Customers" 
          value={newCustomers.toString()} 
          trend={Math.round((newCustomers / (totalCustomers || 1)) * 100)}
          trendLabel="% of total"
          icon={UserPlus}
          iconColor="text-green-500"
        />
        <StatCard 
          title="Active Customers" 
          value={`${activeCustomers}`} 
          trend={Math.round((activeCustomers / (totalCustomers || 1)) * 100)}
          trendLabel="% of total"
          icon={StarIcon}
          iconColor="text-amber-500"
        />
        <StatCard 
          title="Retention Rate" 
          value={`${retentionRate}%`} 
          trend={0}
          trendLabel="based on active customers"
          icon={Repeat2}
          iconColor="text-indigo-500"
        />
      </div>

      {customerSegmentData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerSegmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {customerSegmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} customers`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {topCustomers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email || 'N/A'}</TableCell>
                    <TableCell>{customer.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <CustomerStatusBadge status={customer.status} />
                    </TableCell>
                    <TableCell>{customer.createdAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-gray-500">No customer data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CustomerStatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800',
    'blacklisted': 'bg-red-100 text-red-800',
    'pending_review': 'bg-purple-100 text-purple-800',
  };

  return (
    <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
      {status.replace('_', ' ')}
    </Badge>
  );
};

export default CustomerReport;
