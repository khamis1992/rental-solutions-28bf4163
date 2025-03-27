
import { useState, useEffect } from 'react';
import { TrafficFine, TrafficFineStatusType } from '@/hooks/use-traffic-fines';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { AlertTriangle, Check, Clock } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
        
        if (!customerId) {
          throw new Error("Invalid customer ID");
        }
        
        // Step 1: First find all leases associated with this customer using explicit join syntax
        // This avoids the "relationship not found" error by not relying on implicit joins
        const { data: leases, error: leasesError } = await supabase
          .from('leases')
          .select('id')
          .eq('customer_id', customerId);
          
        if (leasesError) {
          console.error("Error fetching customer leases:", leasesError);
          throw new Error(leasesError.message);
        }
        
        // If customer has no leases, return empty array
        if (!leases || leases.length === 0) {
          console.log(`No leases found for customer ${customerId}`);
          setFines([]);
          setLoading(false);
          return;
        }
        
        // Extract the lease IDs
        const leaseIds = leases.map(lease => lease.id);
        console.log(`Found ${leaseIds.length} leases for customer ${customerId}`, leaseIds);
        
        // Step 2: Fetch traffic fines associated with these lease IDs
        const { data: trafficFines, error: finesError } = await supabase
          .from('traffic_fines')
          .select(`
            id,
            violation_number,
            license_plate,
            violation_date,
            fine_amount,
            violation_charge,
            payment_status,
            fine_location,
            vehicle_id,
            lease_id,
            payment_date
          `)
          .in('lease_id', leaseIds)
          .order('violation_date', { ascending: false });
          
        if (finesError) {
          console.error("Error fetching traffic fines:", finesError);
          throw new Error(finesError.message);
        }
        
        console.log(`Found ${trafficFines?.length || 0} traffic fines`);
        
        // Transform the data to match the TrafficFine interface
        const formattedFines: TrafficFine[] = (trafficFines || []).map(fine => ({
          id: fine.id,
          violationNumber: fine.violation_number || `TF-${Math.floor(Math.random() * 10000)}`,
          licensePlate: fine.license_plate,
          vehicleModel: undefined,
          violationDate: new Date(fine.violation_date),
          fineAmount: fine.fine_amount,
          violationCharge: fine.violation_charge,
          paymentStatus: fine.payment_status as TrafficFineStatusType,
          location: fine.fine_location || '',
          vehicleId: fine.vehicle_id,
          paymentDate: fine.payment_date ? new Date(fine.payment_date) : undefined,
          customerId: customerId,
          leaseId: fine.lease_id
        }));
        
        setFines(formattedFines);
      } catch (err) {
        console.error('Error fetching traffic fines:', err);
        setError(err instanceof Error ? err.message : 'Failed to load traffic fines');
        toast.error('Failed to load traffic fines');
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
    return <div className="py-4 text-center text-muted-foreground">{error}</div>;
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
            <TableCell>{formatDate(fine.violationDate)}</TableCell>
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
