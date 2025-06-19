
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileText, Loader2, Plus, MapPin, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface TrafficFine {
  id: string;
  violation_date: string;
  fine_location: string;
  violation_charge: string;
  fine_amount: number;
  payment_status: string;
  validation_status: string;
  license_plate: string;
  vehicle_id: string | null;
  lease_id: string | null;
}

interface CustomerTrafficFinesProps {
  customerId: string;
}

const CustomerTrafficFines: React.FC<CustomerTrafficFinesProps> = ({ customerId }) => {
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrafficFines = async () => {
      if (!customerId) {
        setError("No customer ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Fetching traffic fines for customer ID:", customerId);
        
        // First get all leases for this customer
        const { data: leases, error: leaseError } = await supabase
          .from('leases')
          .select('id')
          .eq('customer_id', customerId);
        
        if (leaseError) {
          console.error("Error fetching leases:", leaseError);
          setError(leaseError.message);
          setIsLoading(false);
          return;
        }
        
        const leaseIds = leases?.map(lease => lease.id) || [];
        
        if (leaseIds.length === 0) {
          console.log("No leases found for customer");
          setTrafficFines([]);
          setIsLoading(false);
          return;
        }
        
        // Now get traffic fines for these leases
        const { data: fines, error: finesError } = await supabase
          .from('traffic_fines')
          .select('*')
          .in('lease_id', leaseIds);
          
        if (finesError) {
          console.error("Error fetching traffic fines:", finesError);
          setError(finesError.message);
          setIsLoading(false);
          return;
        }
        
        console.log(`Found ${fines?.length || 0} traffic fines`);
        setTrafficFines(fines || []);
        
      } catch (error: any) {
        console.error("Unexpected error fetching traffic fines:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrafficFines();
  }, [customerId]);

  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'disputed':
        return <Badge className="bg-blue-500">Disputed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getValidationBadge = (status: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch (status.toLowerCase()) {
      case 'verified':
        return <Badge className="bg-green-500">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddFine = () => {
    // Not implemented yet
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fines</CardTitle>
          <CardDescription>Loading traffic fines for this customer...</CardDescription>
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fines</CardTitle>
          <CardDescription>An error occurred</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-destructive">
            <AlertTriangle className="mr-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalFineAmount = trafficFines.reduce((sum, fine) => sum + (fine.fine_amount || 0), 0);
  const pendingFines = trafficFines.filter(fine => 
    fine.payment_status && fine.payment_status.toLowerCase() !== "paid"
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Traffic Fines</h2>
          <p className="text-muted-foreground">
            Manage traffic fines associated with this customer
          </p>
        </div>
        <Button onClick={handleAddFine}>
          <Plus className="mr-2 h-4 w-4" /> Add Fine
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trafficFines.length}</div>
            <p className="text-xs text-muted-foreground">
              Total traffic fines recorded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fines</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingFines.length}</div>
            <p className="text-xs text-muted-foreground">
              Fines requiring payment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'QAR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(totalFineAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total amount for all fines
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Traffic Fine Records</CardTitle>
          <CardDescription>All traffic fines associated with this customer</CardDescription>
        </CardHeader>
        <CardContent>
          {trafficFines.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Violation</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trafficFines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell className="font-medium">{fine.license_plate || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                        {fine.violation_date ? formatDate(fine.violation_date) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-3 w-3 text-muted-foreground" />
                        {fine.fine_location || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>{fine.violation_charge || 'N/A'}</TableCell>
                    <TableCell>
                      {fine.fine_amount ? (
                        new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'QAR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(fine.fine_amount)
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusBadge(fine.payment_status || '')}</TableCell>
                    <TableCell>{getValidationBadge(fine.validation_status || '')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-48">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No traffic fines found for this customer</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerTrafficFines;
