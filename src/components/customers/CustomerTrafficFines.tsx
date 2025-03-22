
import { useState, useEffect } from 'react';
import { useTrafficFines, TrafficFine } from '@/hooks/use-traffic-fines';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, Check, Clock } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface CustomerTrafficFinesProps {
  customerId: string;
}

export function CustomerTrafficFines({ customerId }: CustomerTrafficFinesProps) {
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrafficFines = async () => {
      try {
        setLoading(true);
        
        // Get leases directly from the leases table for this customer
        const { data: leases, error: leasesError } = await supabase
          .from('leases')
          .select('id')
          .eq('customer_id', customerId);
          
        if (leasesError) {
          throw new Error(leasesError.message);
        }
        
        if (!leases || leases.length === 0) {
          setFines([]);
          return;
        }
        
        const leaseIds = leases.map(lease => lease.id);
        
        // Then fetch traffic fines associated with these agreements
        const { data: trafficFines, error: finesError } = await supabase
          .from('traffic_fines')
          .select('*')
          .in('lease_id', leaseIds)
          .order('violation_date', { ascending: false });
          
        if (finesError) {
          throw new Error(finesError.message);
        }
        
        // Transform the data to match the TrafficFine interface
        const formattedFines: TrafficFine[] = (trafficFines || []).map(fine => ({
          id: fine.id,
          violationNumber: fine.violation_number,
          licensePlate: fine.license_plate,
          vehicleModel: fine.vehicle_model,
          violationDate: new Date(fine.violation_date),
          fineAmount: fine.fine_amount,
          violationCharge: fine.violation_charge,
          paymentStatus: fine.payment_status,
          location: fine.location || '',
          vehicleId: fine.vehicle_id,
          paymentDate: fine.payment_date ? new Date(fine.payment_date) : undefined
        }));
        
        setFines(formattedFines);
      } catch (err) {
        console.error('Error fetching traffic fines:', err);
        setError('Failed to load traffic fines');
      } finally {
        setLoading(false);
      }
    };

    fetchTrafficFines();
  }, [customerId]);

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">Loading traffic fines...</div>;
  }

  if (error) {
    return <div className="py-4 text-center text-destructive">{error}</div>;
  }

  if (fines.length === 0) {
    return <div className="py-4 text-center text-muted-foreground">No traffic fines found for this customer.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Violation #</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Violation</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fines.map((fine) => (
          <TableRow key={fine.id}>
            <TableCell className="font-medium">{fine.violationNumber}</TableCell>
            <TableCell>{fine.licensePlate}</TableCell>
            <TableCell>{fine.violationDate.toLocaleDateString()}</TableCell>
            <TableCell>{fine.violationCharge}</TableCell>
            <TableCell>{formatCurrency(fine.fineAmount)}</TableCell>
            <TableCell>
              <Badge
                variant={
                  fine.paymentStatus === 'paid' ? 'success' : 
                  fine.paymentStatus === 'disputed' ? 'warning' : 
                  'destructive'
                }
                className="capitalize"
              >
                {fine.paymentStatus}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
