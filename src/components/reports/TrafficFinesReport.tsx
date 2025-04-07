
import React, { useState, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  UserCheck, 
  DollarSign, 
  FileText,
  Loader2
} from 'lucide-react';

const TrafficFinesReport = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { trafficFines, isLoading, error } = useTrafficFines();
  
  // Filter fines to only show those assigned to customers
  const assignedFines = useMemo(() => {
    if (!trafficFines) return [];
    return trafficFines.filter(fine => fine.customerId && fine.customerName);
  }, [trafficFines]);
  
  // Further filter by search query
  const filteredFines = useMemo(() => {
    if (!assignedFines) return [];
    if (!searchQuery.trim()) return assignedFines;
    
    return assignedFines.filter(fine => 
      (fine.violationNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (fine.licensePlate?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (fine.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (fine.violationCharge?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
  }, [assignedFines, searchQuery]);
  
  // Calculate metrics
  const totalFines = filteredFines.length;
  const totalAmount = filteredFines.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const paidFines = filteredFines.filter(fine => fine.paymentStatus === 'paid');
  const paidAmount = paidFines.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const pendingAmount = totalAmount - paidAmount;
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 text-white border-green-600"><CheckCircle className="mr-1 h-3 w-3" /> Paid</Badge>;
      case 'disputed':
        return <Badge className="bg-amber-500 text-white border-amber-600"><AlertTriangle className="mr-1 h-3 w-3" /> Disputed</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-red-500 text-white border-red-600"><AlertTriangle className="mr-1 h-3 w-3" /> Pending</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load traffic fines data.</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Assigned Fines"
          value={totalFines.toString()}
          description={`Total: ${formatCurrency(totalAmount)}`}
          icon={FileText}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Paid Fines"
          value={paidFines.length.toString()}
          description={`Amount: ${formatCurrency(paidAmount)}`}
          icon={CheckCircle}
          iconColor="text-green-500"
        />
        <StatCard
          title="Pending Amount"
          value={formatCurrency(pendingAmount)}
          description={`From ${filteredFines.length - paidFines.length} unpaid fines`}
          icon={DollarSign}
          iconColor="text-amber-500"
        />
      </div>

      {/* Fines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Traffic Fines</CardTitle>
          <CardDescription>
            Traffic violations assigned to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, violation number, license plate..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {filteredFines.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {assignedFines.length === 0 ? 
                "No traffic fines have been assigned to customers." : 
                "No results match your search criteria."}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Violation #</TableHead>
                    <TableHead>License Plate</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden md:table-cell">Violation</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFines.map((fine) => (
                    <TableRow key={fine.id}>
                      <TableCell className="font-medium">
                        {fine.customerName || 'Unknown'}
                      </TableCell>
                      <TableCell>{fine.violationNumber}</TableCell>
                      <TableCell>{fine.licensePlate}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDate(fine.violationDate)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                        {fine.violationCharge || 'N/A'}
                      </TableCell>
                      <TableCell>{formatCurrency(fine.fineAmount)}</TableCell>
                      <TableCell>{getStatusBadge(fine.paymentStatus)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground mt-4">
            Showing {filteredFines.length} {filteredFines.length === 1 ? 'fine' : 'fines'}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrafficFinesReport;
