
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, X, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { TrafficFine, useTrafficFines } from '@/hooks/use-traffic-fines';

interface CustomerTrafficFinesProps {
  customerId: string;
}

const CustomerTrafficFines: React.FC<CustomerTrafficFinesProps> = ({ customerId }) => {
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [loading, setLoading] = useState(true);
  const { trafficFines, isLoading, payTrafficFine, disputeTrafficFine } = useTrafficFines();
  
  useEffect(() => {
    if (!isLoading && trafficFines && customerId) {
      // Filter fines by customer ID
      const customerFines = trafficFines.filter(fine => fine.customerId === customerId);
      setFines(customerFines);
      setLoading(false);
    }
  }, [isLoading, trafficFines, customerId]);
  
  const handlePayFine = (id: string) => {
    payTrafficFine.mutate({ id });
  };

  const handleDisputeFine = (id: string) => {
    disputeTrafficFine.mutate({ id });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 text-white border-green-600"><CheckCircle className="mr-1 h-3 w-3" /> Paid</Badge>;
      case 'disputed':
        return <Badge className="bg-amber-500 text-white border-amber-600"><AlertTriangle className="mr-1 h-3 w-3" /> Disputed</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-red-500 text-white border-red-600"><X className="mr-1 h-3 w-3" /> Pending</Badge>;
    }
  };

  // Calculate statistics
  const pendingFines = fines.filter(fine => fine.paymentStatus === 'pending');
  const pendingAmount = pendingFines.reduce((sum, fine) => sum + fine.fineAmount, 0);
  const totalAmount = fines.reduce((sum, fine) => sum + fine.fineAmount, 0);
  
  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Traffic Fines</CardTitle>
          <CardDescription>Loading customer traffic fines...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading traffic fines...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Traffic Fines</h2>
          <p className="text-muted-foreground">
            All traffic fines associated with this customer's vehicles
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fines.length}</div>
            <p className="text-xs text-muted-foreground">
              All traffic violations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fines</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingFines.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(pendingAmount)} pending payment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Total fine amount
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Traffic Fine Records</CardTitle>
          <CardDescription>All traffic violations associated with this customer</CardDescription>
        </CardHeader>
        <CardContent>
          {fines.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Violation #</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4 text-warning" />
                        {fine.violationNumber}
                      </div>
                    </TableCell>
                    <TableCell>{fine.licensePlate}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(fine.violationDate)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{fine.location || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(fine.fineAmount)}</TableCell>
                    <TableCell>
                      {getStatusBadge(fine.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {fine.paymentStatus !== 'paid' && (
                          <Button 
                            size="sm" 
                            onClick={() => handlePayFine(fine.id)}
                            disabled={fine.paymentStatus === 'paid'}
                            variant="outline"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" /> Pay
                          </Button>
                        )}
                        {fine.paymentStatus !== 'disputed' && fine.paymentStatus !== 'paid' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleDisputeFine(fine.id)}
                            variant="outline"
                          >
                            <X className="h-3 w-3 mr-1" /> Dispute
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No traffic fines found for this customer.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerTrafficFines;
