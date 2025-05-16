
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { asUUID } from '@/lib/uuid-helpers';
import { AgreementTrafficFineAnalytics } from '@/components/agreements/legal/AgreementTrafficFineAnalytics';

interface TrafficFine {
  id: string;
  license_plate: string;
  violation_date: string;
  fine_amount: number;
  payment_status: string;
  fine_type?: string;
  violation_number?: string;
  fine_location?: string;
}

interface AgreementTrafficFinesProps {
  agreementId: string;
}

export const AgreementTrafficFines: React.FC<AgreementTrafficFinesProps> = ({ agreementId }) => {
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTrafficFines = async () => {
    try {
      setIsLoading(true);

      // First, get the vehicle ID from the agreement
      const { data: leaseData, error: leaseError } = await supabase
        .from('leases')
        .select('vehicle_id')
        .eq('id', asUUID(agreementId) as any)
        .single();

      if (leaseError) {
        console.error('Error fetching lease:', leaseError);
        toast({
          title: 'Error',
          description: 'Failed to fetch agreement details',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (leaseData && leaseData.vehicle_id) {
        setVehicleId(leaseData.vehicle_id);
        
        // Get vehicle details to find the license plate
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('license_plate')
          .eq('id', leaseData.vehicle_id as any)
          .single();

        if (vehicleError) {
          console.error('Error fetching vehicle:', vehicleError);
          setIsLoading(false);
          return;
        }

        // Get traffic fines for this license plate
        if (vehicleData && vehicleData.license_plate) {
          const { data: finesData, error: finesError } = await supabase
            .from('traffic_fines')
            .select('*')
            .eq('license_plate', vehicleData.license_plate);

          if (finesError) {
            console.error('Error fetching fines:', finesError);
          } else {
            // Associate fines with this agreement if they aren't already
            if (finesData && finesData.length > 0) {
              for (const fine of finesData) {
                if (!fine.lease_id) {
                  // Update the fine to associate it with this agreement
                  await supabase
                    .from('traffic_fines')
                    .update({ agreement_id: agreementId } as any)
                    .eq('id', fine.id as any);
                }
              }
            }
            
            // Cast to ensure proper typing
            setFines(finesData as TrafficFine[] || []);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchTrafficFines:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (agreementId) {
      fetchTrafficFines();
    }
  }, [agreementId]);

  const handleMarkAsPaid = async (fineId: string) => {
    try {
      const { error } = await supabase
        .from('traffic_fines')
        .update({ payment_status: 'paid' } as any)
        .eq('id', fineId as any);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Traffic fine marked as paid',
      });

      // Update the local state
      setFines(fines.map(fine => 
        fine.id === fineId 
          ? { ...fine, payment_status: 'paid' } 
          : fine
      ));

    } catch (error) {
      console.error('Error marking fine as paid:', error);
      toast({
        title: 'Error',
        description: 'Failed to update fine status',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Traffic Fines</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchTrafficFines}
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <AgreementTrafficFineAnalytics fines={fines} />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : fines.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No traffic fines found for this vehicle.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>License Plate</TableHead>
                <TableHead>Fine Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fines.map((fine) => (
                <TableRow key={fine.id}>
                  <TableCell>
                    {fine.violation_date ? format(new Date(fine.violation_date), 'MMM dd, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>{fine.license_plate}</TableCell>
                  <TableCell>{fine.fine_type || 'General'}</TableCell>
                  <TableCell>{formatCurrency(fine.fine_amount || 0)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      fine.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {fine.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {fine.payment_status !== 'paid' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleMarkAsPaid(fine.id)}
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
