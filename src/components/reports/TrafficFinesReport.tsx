
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
import { Button } from '@/components/ui/button';
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
  Loader2,
  BarChart2 
} from 'lucide-react';
import { calculateFinesMetrics, groupFinesByCustomer } from '@/utils/traffic-fines-report-utils';

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
      (fine.violationCharge?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (fine.location?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
  }, [assignedFines, searchQuery]);
  
  // Calculate metrics
  const metrics = useMemo(() => {
    return calculateFinesMetrics(filteredFines);
  }, [filteredFines]);
  
  // Group fines by customer for better visualization
  const groupedFines = useMemo(() => {
    return groupFinesByCustomer(filteredFines);
  }, [filteredFines]);
  
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Assigned Fines"
          value={metrics.totalFines.toString()}
          description={`Total: ${formatCurrency(metrics.totalAmount)}`}
          icon={FileText}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Paid Fines"
          value={metrics.paidFines.toString()}
          description={`Amount: ${formatCurrency(metrics.paidAmount)}`}
          icon={CheckCircle}
          iconColor="text-green-500"
        />
        <StatCard
          title="Pending Fines"
          value={metrics.pendingFines.toString()}
          description={`Amount: ${formatCurrency(metrics.pendingAmount)}`}
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
        <StatCard
          title="Payment Rate"
          value={`${metrics.paymentRate}%`}
          description="Collection efficiency"
          icon={BarChart2}
          iconColor="text-purple-500"
        />
      </div>

      {/* Fines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Traffic Fines</CardTitle>
          <CardDescription>
            Traffic violations assigned to customers by date, amount and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, violation number, license plate, location..."
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
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
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
                      <TableCell className="hidden lg:table-cell max-w-[150px] truncate">
                        {fine.location || 'N/A'}
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
      
      {/* Customer-Grouped Fines Section */}
      {Object.keys(groupedFines).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fines by Customer</CardTitle>
            <CardDescription>
              Traffic violations grouped by customer account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {Object.entries(groupedFines).map(([customerName, fines]) => (
                <div key={customerName} className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <UserCheck className="h-5 w-5 mr-2 text-blue-500" />
                      <h3 className="font-medium text-lg">{customerName}</h3>
                    </div>
                    <Badge variant="outline">
                      {fines.length} {fines.length === 1 ? 'Fine' : 'Fines'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-semibold">
                        {formatCurrency(fines.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Paid</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(fines.filter(f => f.paymentStatus === 'paid')
                          .reduce((sum, fine) => sum + (fine.fineAmount || 0), 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="font-semibold text-red-500">
                        {formatCurrency(fines.filter(f => f.paymentStatus !== 'paid')
                          .reduce((sum, fine) => sum + (fine.fineAmount || 0), 0))}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 mt-2">
                    {fines.map(fine => (
                      <div key={fine.id} className="p-3 border bg-card rounded-md text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{fine.violationNumber}</span>
                          {getStatusBadge(fine.paymentStatus)}
                        </div>
                        <p className="text-muted-foreground truncate mb-1">
                          {fine.violationCharge || 'Unknown Violation'}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">{formatDate(fine.violationDate)}</span>
                          <span className="font-semibold">{formatCurrency(fine.fineAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrafficFinesReport;
