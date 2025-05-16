
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Spinner } from '@/components/ui/spinner';
import { asUUID } from '@/lib/uuid-helpers';
import { TrafficFine } from '@/types/traffic-fine';

export interface AgreementTrafficFinesProps {
  agreementId: string;
  startDate: Date;
  endDate: Date;
}

export function AgreementTrafficFines({ 
  agreementId, 
  startDate, 
  endDate 
}: AgreementTrafficFinesProps) {
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrafficFines = async () => {
      if (!agreementId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const formattedStartDate = startDate.toISOString();
        const formattedEndDate = endDate.toISOString();
        
        // First, get the vehicle_id from the agreement
        const { data: agreementData, error: agreementError } = await supabase
          .from('leases')
          .select('vehicle_id')
          .eq('id', asUUID(agreementId))
          .single();
        
        if (agreementError) {
          console.error('Error fetching agreement vehicle:', agreementError);
          setError('Failed to fetch agreement information');
          setIsLoading(false);
          return;
        }
        
        if (!agreementData || !agreementData.vehicle_id) {
          setError('No vehicle associated with this agreement');
          setIsLoading(false);
          return;
        }
        
        // Now get traffic fines for this vehicle within the date range
        const { data: finesData, error: finesError } = await supabase
          .from('traffic_fines')
          .select('*, vehicle:vehicles(license_plate, make, model)')
          .eq('vehicle_id', agreementData.vehicle_id)
          .gte('fine_date', formattedStartDate)
          .lte('fine_date', formattedEndDate);
        
        if (finesError) {
          console.error('Error fetching traffic fines:', finesError);
          setError('Failed to fetch traffic fines');
          setIsLoading(false);
          return;
        }
        
        // Associate these fines with the agreement if not already associated
        const finesWithAgreement = finesData || [];
        
        for (const fine of finesWithAgreement) {
          if (fine && !fine.agreement_id) {
            const { error: updateError } = await supabase
              .from('traffic_fines')
              .update({ agreement_id: asUUID(agreementId) } as any)
              .eq('id', fine.id);
              
            if (updateError) {
              console.error('Error associating fine with agreement:', updateError);
            }
          }
        }
        
        setTrafficFines(finesWithAgreement as unknown as TrafficFine[]);
      } catch (err) {
        console.error('Unexpected error fetching traffic fines:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrafficFines();
  }, [agreementId, startDate, endDate]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'appealing':
        return <Badge variant="secondary">Appealing</Badge>;
      case 'cancelled':
        return <Badge>Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleMarkAsPaid = async (fineId: string) => {
    try {
      const { error } = await supabase
        .from('traffic_fines')
        .update({ payment_status: 'paid' } as any)
        .eq('id', asUUID(fineId));
        
      if (error) {
        throw error;
      }
      
      setTrafficFines(prevFines => 
        prevFines.map(fine => 
          fine.id === fineId ? {...fine, payment_status: 'paid'} : fine
        )
      );
      
      toast.success('Fine marked as paid');
    } catch (err) {
      console.error('Error updating fine status:', err);
      toast.error('Failed to update fine status');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-6"><Spinner /></div>;
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (trafficFines.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No traffic fines found for this agreement period.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Fine #</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trafficFines.map((fine) => (
          <TableRow key={fine.id}>
            <TableCell>{format(new Date(fine.fine_date), 'MMM dd, yyyy')}</TableCell>
            <TableCell>{fine.fine_number}</TableCell>
            <TableCell>QAR {fine.amount?.toLocaleString() || 0}</TableCell>
            <TableCell>{getStatusBadge(fine.payment_status)}</TableCell>
            <TableCell>
              {fine.vehicle?.license_plate || fine.license_plate || 'N/A'}
              <span className="block text-xs text-muted-foreground">
                {fine.vehicle?.make || fine.vehicle_make} {fine.vehicle?.model || fine.vehicle_model}
              </span>
            </TableCell>
            <TableCell>
              {fine.payment_status !== 'paid' ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleMarkAsPaid(fine.id)}
                >
                  Mark as Paid
                </Button>
              ) : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
