
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';

interface TrafficFine {
  id: string;
  violation_date: string;
  fine_amount: number;
  fine_type: string;
  violation_number: string;
  payment_status: string;
  license_plate: string;
  fine_location: string;
  violation_charge: string;
}

interface CustomerTrafficFinesProps {
  customerId: string;
}

export const CustomerTrafficFines: React.FC<CustomerTrafficFinesProps> = ({ customerId }) => {
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrafficFines = async () => {
      try {
        // Instead of directly querying by customer_id which doesn't exist,
        // First, get the lease IDs associated with this customer
        const { data: leases, error: leaseError } = await supabase
          .from('leases')
          .select('id')
          .eq('customer_id', customerId);

        if (leaseError) {
          throw leaseError;
        }

        if (!leases || leases.length === 0) {
          // No leases found for this customer
          setFines([]);
          setIsLoading(false);
          return;
        }

        // Then use these lease IDs to find related traffic fines
        const leaseIds = leases.map(lease => lease.id);
        const { data, error } = await supabase
          .from('traffic_fines')
          .select('*')
          .in('lease_id', leaseIds);

        if (error) {
          throw error;
        }

        setFines(data || []);
      } catch (error) {
        console.error('Error fetching traffic fines:', error);
        setError('Failed to load traffic fines');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrafficFines();
  }, [customerId]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (fines.length === 0) {
    return <p className="text-center py-6 text-muted-foreground">No traffic fines found for this customer.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Violation Date</TableHead>
          <TableHead>Violation Number</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>License Plate</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fines.map((fine) => (
          <TableRow key={fine.id}>
            <TableCell>{new Date(fine.violation_date).toLocaleDateString()}</TableCell>
            <TableCell>{fine.violation_number}</TableCell>
            <TableCell>{fine.fine_type || fine.violation_charge || 'Unknown'}</TableCell>
            <TableCell>{fine.fine_location || 'Unknown'}</TableCell>
            <TableCell>{fine.license_plate}</TableCell>
            <TableCell>{formatCurrency(fine.fine_amount)}</TableCell>
            <TableCell>{getStatusBadge(fine.payment_status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
