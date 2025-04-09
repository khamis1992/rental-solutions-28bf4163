
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { format } from 'date-fns';
import { Loader2, AlertTriangle } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const TrafficFineReport = () => {
  const { trafficFines, isLoading, error } = useTrafficFines();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFines = useMemo(() => {
    if (!trafficFines) return [];
    
    if (!searchQuery.trim()) return trafficFines;
    
    const query = searchQuery.toLowerCase();
    return trafficFines.filter(fine => 
      (fine.licensePlate && fine.licensePlate.toLowerCase().includes(query)) ||
      (fine.customerName && fine.customerName.toLowerCase().includes(query)) ||
      (fine.violationNumber && fine.violationNumber.toLowerCase().includes(query)) ||
      (fine.location && fine.location.toLowerCase().includes(query))
    );
  }, [trafficFines, searchQuery]);

  // Group fines by customer for statistics
  const customerFines = useMemo(() => {
    const groupedByCustomer = {};
    
    if (!filteredFines || filteredFines.length === 0) return [];
    
    filteredFines.forEach(fine => {
      const customerName = fine.customerName || 'Unassigned';
      
      if (!groupedByCustomer[customerName]) {
        groupedByCustomer[customerName] = {
          name: customerName,
          count: 0,
          totalAmount: 0,
          paid: 0,
          pending: 0
        };
      }
      
      groupedByCustomer[customerName].count++;
      groupedByCustomer[customerName].totalAmount += Number(fine.fineAmount) || 0;
      
      if (fine.paymentStatus === 'paid') {
        groupedByCustomer[customerName].paid++;
      } else {
        groupedByCustomer[customerName].pending++;
      }
    });
    
    return Object.values(groupedByCustomer);
  }, [filteredFines]);

  // Status distribution data for pie chart
  const statusDistribution = useMemo(() => {
    if (!filteredFines || filteredFines.length === 0) return [];
    
    const counts = {
      paid: 0,
      pending: 0,
      disputed: 0
    };
    
    filteredFines.forEach(fine => {
      if (counts[fine.paymentStatus]) {
        counts[fine.paymentStatus]++;
      } else {
        counts.pending++;
      }
    });
    
    return [
      { name: 'Paid', value: counts.paid, color: '#22c55e' },
      { name: 'Pending', value: counts.pending, color: '#eab308' },
      { name: 'Disputed', value: counts.disputed, color: '#ef4444' }
    ];
  }, [filteredFines]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading traffic fine data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        <AlertTriangle className="h-8 w-8 mr-2" />
        <span>Error loading traffic fine data</span>
      </div>
    );
  }

  if (!filteredFines || filteredFines.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md bg-muted/20">
        <p>No traffic fines data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="flex justify-end mb-4">
        <Input
          placeholder="Search by license plate, customer name..."
          className="max-w-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Overview statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredFines.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredFines.reduce((sum, fine) => sum + (Number(fine.fineAmount) || 0), 0).toLocaleString('en-US', {
                style: 'currency',
                currency: 'QAR'
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {filteredFines.filter(fine => fine.paymentStatus === 'paid').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {filteredFines.filter(fine => fine.paymentStatus !== 'paid').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        {/* Customer fines distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Fines by Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={customerFines.slice(0, 10)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'totalAmount') return [`QAR ${value}`, 'Total Amount'];
                      return [value, name === 'count' ? 'Fine Count' : name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Fine Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Fine Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
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
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed traffic fines table */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fine Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Violation Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Violation</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell>
                      {fine.violationDate ? format(new Date(fine.violationDate), 'dd MMM yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>{fine.customerName || 'Unassigned'}</TableCell>
                    <TableCell>{fine.licensePlate || 'N/A'}</TableCell>
                    <TableCell>{fine.violationCharge || 'N/A'}</TableCell>
                    <TableCell>{fine.location || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      {fine.fineAmount ? `QAR ${Number(fine.fineAmount).toLocaleString()}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={
                        fine.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : fine.paymentStatus === 'disputed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }>
                        {fine.paymentStatus === 'paid' ? 'Paid' : 
                         fine.paymentStatus === 'disputed' ? 'Disputed' : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrafficFineReport;
