import React, { useState } from 'react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Filter, Search, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';

export default function TrafficFinesReport() {
  const { trafficFines, isLoading, error } = useTrafficFines();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  
  // Filter fines based on search term, status filter, and only show assigned fines (with customerId)
  const filteredFines = trafficFines ? trafficFines.filter(fine => {
    // Only include fines that are assigned to customers (have a customerId)
    if (!fine.customerId) return false;
    
    const matchesSearch = searchTerm === '' || 
      (fine.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fine.customerName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fine.violationNumber?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === null || fine.paymentStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  }) : [];

  // Group fines by customer
  const finesByCustomer = React.useMemo(() => {
    const grouped: { [key: string]: typeof trafficFines } = {};
    
    if (filteredFines && filteredFines.length > 0) {
      filteredFines.forEach(fine => {
        const customerId = fine.customerId || '';
        if (!grouped[customerId]) {
          grouped[customerId] = [];
        }
        grouped[customerId].push(fine);
      });
    }
    
    return grouped;
  }, [filteredFines]);

  // Calculate statistics - only for assigned fines
  const statistics = React.useMemo(() => {
    if (!trafficFines) return { total: 0, paid: 0, pending: 0, disputed: 0, totalAmount: 0 };
    
    // Only include fines that are assigned to customers
    const assignedFines = trafficFines.filter(fine => fine.customerId);
    
    return {
      total: assignedFines.length,
      paid: assignedFines.filter(fine => fine.paymentStatus === 'paid').length,
      pending: assignedFines.filter(fine => fine.paymentStatus === 'pending').length,
      disputed: assignedFines.filter(fine => fine.paymentStatus === 'disputed').length,
      totalAmount: assignedFines.reduce((sum, fine) => sum + fine.fineAmount, 0)
    };
  }, [trafficFines]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="mr-1 h-3 w-3" /> Paid</Badge>;
      case 'disputed':
        return <Badge className="bg-amber-500 text-white"><AlertCircle className="mr-1 h-3 w-3" /> Disputed</Badge>;
      default:
        return <Badge className="bg-red-500 text-white"><X className="mr-1 h-3 w-3" /> Pending</Badge>;
    }
  };
  
  // Function to get report data for export - keeping this for potential future use
  const getReportData = () => {
    return filteredFines.map(fine => ({
      violationNumber: fine.violationNumber,
      licensePlate: fine.licensePlate,
      vehicleModel: fine.vehicleModel,
      violationDate: formatDate(fine.violationDate),
      location: fine.location || 'N/A',
      fineAmount: fine.fineAmount,
      status: fine.paymentStatus,
      customerName: fine.customerName || 'Unassigned',
      paymentDate: fine.paymentDate ? formatDate(fine.paymentDate) : 'N/A'
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-700">
        <h3 className="font-semibold flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" /> Error Loading Report
        </h3>
        <p className="mt-1">{error instanceof Error ? error.message : 'Failed to load traffic fines data'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-4">
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-4">
          {/* Search and filter controls */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search license plate, customer..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 items-center w-full md:w-auto">
            <Label className="flex items-center gap-2">
              <Filter className="h-4 w-4" /> Status:
            </Label>
            <select 
              className="p-2 border rounded-md" 
              onChange={(e) => setFilterStatus(e.target.value === 'all' ? null : e.target.value)}
              defaultValue="all"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary statistics */}
      <Card className="bg-muted/40">
        <CardHeader>
          <CardTitle>Traffic Fines Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-white rounded-md shadow-sm">
              <p className="text-sm text-muted-foreground">Total Fines</p>
              <p className="text-2xl font-bold">{statistics.total}</p>
            </div>
            <div className="p-4 bg-white rounded-md shadow-sm">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold text-green-600">{statistics.paid}</p>
            </div>
            <div className="p-4 bg-white rounded-md shadow-sm">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-red-600">{statistics.pending}</p>
            </div>
            <div className="p-4 bg-white rounded-md shadow-sm">
              <p className="text-sm text-muted-foreground">Disputed</p>
              <p className="text-2xl font-bold text-amber-600">{statistics.disputed}</p>
            </div>
            <div className="p-4 bg-white rounded-md shadow-sm">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(statistics.totalAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display fines grouped by customer */}
      {Object.keys(finesByCustomer).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No traffic fines found</p>
            <p className="text-muted-foreground text-sm">Try changing your search or filter criteria</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(finesByCustomer).map(([customerId, customerFines]) => (
          <Card key={customerId} className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-2">
              <CardTitle className="text-lg">
                {customerFines[0].customerName || 'Customer Name Not Available'}
                <Badge variant="outline" className="ml-3">
                  {customerFines.length} {customerFines.length === 1 ? 'Fine' : 'Fines'}
                </Badge>
              </CardTitle>
              {customerFines[0].leaseId && (
                <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-2 gap-2">
                  <span>Agreement ID: {customerFines[0].leaseId || 'N/A'}</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Violation #</TableHead>
                      <TableHead>License Plate</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerFines.map((fine) => (
                      <TableRow key={fine.id}>
                        <TableCell className="font-medium">{fine.violationNumber}</TableCell>
                        <TableCell>{fine.licensePlate}</TableCell>
                        <TableCell>{formatDate(fine.violationDate)}</TableCell>
                        <TableCell>{fine.location || 'N/A'}</TableCell>
                        <TableCell>{formatCurrency(fine.fineAmount)}</TableCell>
                        <TableCell>{getStatusBadge(fine.paymentStatus)}</TableCell>
                        <TableCell>
                          {fine.paymentDate ? formatDate(fine.paymentDate) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-2 text-right">
                <p className="text-sm text-muted-foreground">
                  Total: {formatCurrency(customerFines.reduce((sum, fine) => sum + fine.fineAmount, 0))}
                </p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
