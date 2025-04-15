
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { asCustomerId } from '@/utils/database-type-helpers';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

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

export function CustomerTrafficFines({ customerId }: CustomerTrafficFinesProps) {
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
          .eq('customer_id', asCustomerId(customerId));
        
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>License Plate</TableHead>
            <TableHead>Violation Date</TableHead>
            <TableHead>Violation #</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fines.map((fine) => (
            <TableRow key={fine.id}>
              <TableCell>{fine.license_plate}</TableCell>
              <TableCell>
                {fine.violation_date ? format(new Date(fine.violation_date), 'MMM d, yyyy') : 'N/A'}
              </TableCell>
              <TableCell>{fine.violation_number}</TableCell>
              <TableCell>{formatCurrency(fine.fine_amount)}</TableCell>
              <TableCell>
                <Badge
                  variant={fine.payment_status === 'completed' ? 'outline' : 'secondary'}
                >
                  {fine.payment_status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={fine.payment_status === 'completed'}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
