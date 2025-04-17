
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TrafficFine = {
  id: string;
  license_plate: string;
  violation_date: string;
  violation_number: string;
  fine_amount: number;
  payment_status: string;
  payment_date: string | null;
  fine_location?: string;
  violation_charge?: string;
};

interface CustomerTrafficFinesProps {
  customerId: string;
}

export default function CustomerTrafficFines({ customerId }: CustomerTrafficFinesProps) {
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFines = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get all leases for this customer
        const { data: leases, error: leaseError } = await supabase
          .from('leases')
          .select('id')
          .eq('customer_id', customerId);
        
        if (leaseError) throw leaseError;
        
        if (!leases || leases.length === 0) {
          setFines([]);
          return;
        }
        
        // Get all traffic fines for these leases
        const leaseIds = leases.map(lease => lease.id);
        const { data: finesData, error: finesError } = await supabase
          .from('traffic_fines')
          .select('*')
          .in('lease_id', leaseIds);
        
        if (finesError) throw finesError;
        
        // Cast the response data to our TrafficFine type
        setFines(finesData as unknown as TrafficFine[]);
      } catch (err) {
        console.error('Error fetching traffic fines:', err);
        setError('Failed to load traffic fines');
        toast.error('Failed to load traffic fines');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFines();
  }, [customerId]);

  const getTotalAmount = () => {
    return fines.reduce((total, fine) => total + fine.fine_amount, 0);
  };

  const getPaidAmount = () => {
    return fines
      .filter(fine => fine.payment_status === 'completed')
      .reduce((total, fine) => total + fine.fine_amount, 0);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading traffic fines...</span>
      </div>
    );
  }
  
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  if (fines.length === 0) {
    return <p>No traffic fines found for this customer.</p>;
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Traffic Fines</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Total Fines</div>
            <div className="text-2xl font-bold">{fines.length}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Total Amount</div>
            <div className="text-2xl font-bold">{formatCurrency(getTotalAmount())}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Paid Amount</div>
            <div className="text-2xl font-bold">{formatCurrency(getPaidAmount())}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Plate</TableHead>
                <TableHead>Violation Date</TableHead>
                <TableHead>Violation #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fines.map((fine) => (
                <TableRow key={fine.id}>
                  <TableCell>{fine.license_plate}</TableCell>
                  <TableCell>
                    {fine.violation_date ? format(new Date(fine.violation_date), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <AlertTriangle className="mr-2 h-4 w-4 text-warning" />
                      {fine.violation_number}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(fine.fine_amount)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={fine.payment_status === 'completed' ? 'success' : 
                              fine.payment_status === 'disputed' ? 'warning' : 'destructive'}
                    >
                      {fine.payment_status === 'completed' ? 'Paid' : 
                       fine.payment_status === 'disputed' ? 'Disputed' : 'Pending'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
