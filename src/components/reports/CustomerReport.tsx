
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, UserPlus, StarIcon, Repeat2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const CustomerReport = () => {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Customers" 
          value="547" 
          trend={12}
          trendLabel="vs last month"
          icon={Users}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="New Customers" 
          value="38" 
          trend={8}
          trendLabel="vs last month"
          icon={UserPlus}
          iconColor="text-green-500"
        />
        <StatCard 
          title="Customer Satisfaction" 
          value="4.7/5" 
          trend={0.2}
          trendLabel="vs last month"
          icon={StarIcon}
          iconColor="text-amber-500"
        />
        <StatCard 
          title="Repeat Customers" 
          value="64%" 
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
              {topCustomersData.map((customer) => (
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
        </CardContent>
      </Card>
    </div>
  );
};

const CustomerStatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800',
    'vip': 'bg-purple-100 text-purple-800',
  };

  return (
    <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
      {status}
    </Badge>
  );
};

const customerSegmentData = [
  { name: 'Business', value: 187, color: '#3b82f6' },
  { name: 'Leisure', value: 294, color: '#22c55e' },
  { name: 'Long-term', value: 66, color: '#f59e0b' },
];

const rentalDurationData = [
  { name: '1-3 days', value: 203, color: '#3b82f6' },
  { name: '4-7 days', value: 156, color: '#22c55e' },
  { name: '8-14 days', value: 98, color: '#f59e0b' },
  { name: '15+ days', value: 43, color: '#8b5cf6' },
];

const topCustomersData = [
  { id: 1, name: 'John Smith', status: 'vip', totalRentals: 17, totalSpent: 8750, lastRental: '2023-08-10', rating: 4.9 },
  { id: 2, name: 'Sarah Johnson', status: 'active', totalRentals: 12, totalSpent: 6420, lastRental: '2023-07-28', rating: 4.7 },
  { id: 3, name: 'Michael Brown', status: 'vip', totalRentals: 15, totalSpent: 7850, lastRental: '2023-08-05', rating: 4.8 },
  { id: 4, name: 'Emily Davis', status: 'active', totalRentals: 9, totalSpent: 4320, lastRental: '2023-08-12', rating: 4.5 },
  { id: 5, name: 'David Wilson', status: 'inactive', totalRentals: 7, totalSpent: 3640, lastRental: '2023-06-18', rating: 4.2 },
];

export default CustomerReport;
