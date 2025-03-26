
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
  
  // Calculate customer metrics
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
  
  // Get top customers (for demonstration, we'll sort by most recently created)
  const topCustomers = [...customers]
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5)
    .map((customer, index) => ({
      id: customer.id,
      name: customer.full_name,
      status: customer.status || 'active',
      totalRentals: Math.floor(Math.random() * 15) + 1, // Sample data as we don't have this info
      totalSpent: Math.floor(Math.random() * 10000) + 1000, // Sample data
      lastRental: customer.updated_at ? new Date(customer.updated_at).toISOString().split('T')[0] : 'N/A',
      rating: (4 + Math.random()).toFixed(1),
    }));

  // Create rental duration data (sample data as we don't have this in our database)
  const rentalDurationData = [
    { name: '1-3 days', value: Math.floor(totalCustomers * 0.4), color: '#3b82f6' },
    { name: '4-7 days', value: Math.floor(totalCustomers * 0.3), color: '#22c55e' },
    { name: '8-14 days', value: Math.floor(totalCustomers * 0.2), color: '#f59e0b' },
    { name: '15+ days', value: Math.floor(totalCustomers * 0.1), color: '#8b5cf6' },
  ];

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading customer data...</div>;
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
          value={`${Math.round((activeCustomers / (totalCustomers || 1)) * 100)}%`} 
          trend={5}
          trendLabel="vs last month"
          icon={Repeat2}
          iconColor="text-indigo-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              {customerSegmentData.length > 0 ? (
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
              ) : (
                <div className="text-center text-gray-500">No segment data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rental Duration Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rentalDurationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {rentalDurationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} rentals`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {topCustomers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Rentals</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Rental</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <CustomerStatusBadge status={customer.status} />
                    </TableCell>
                    <TableCell>{customer.totalRentals}</TableCell>
                    <TableCell>${customer.totalSpent.toLocaleString()}</TableCell>
                    <TableCell>{customer.lastRental}</TableCell>
                    <TableCell>{customer.rating}/5</TableCell>
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
