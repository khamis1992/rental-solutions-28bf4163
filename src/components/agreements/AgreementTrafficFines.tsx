
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

type TrafficFine = {
  id: string;
  license_plate: string;
  violation_date: string;
  violation_number: string;
  fine_amount: number;
  payment_status: string;
  payment_date: string | null;
};

interface AgreementTrafficFinesProps {
  agreementId: string;
  startDate?: Date;
  endDate?: Date;
}

export default function AgreementTrafficFines({ agreementId, startDate, endDate }: AgreementTrafficFinesProps) {
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrafficFines = async () => {
      if (!agreementId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('traffic_fines')
          .select('*')
          .eq('lease_id', agreementId);
        
        if (error) throw error;
        setTrafficFines(data as unknown as TrafficFine[]);
      } catch (err) {
        console.error('Error fetching traffic fines:', err);
        setError('Failed to load traffic fines data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrafficFines();
  }, [agreementId]);
  
  if (loading) {
    return <div>Loading traffic fines...</div>;
  }
  
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  if (trafficFines.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No traffic fines found for this agreement.</p>
        </CardContent>
      </Card>
    );
  }
  
  const formatPaymentStatus = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge variant="success">Paid</Badge>;
      case 'disputed':
        return <Badge variant="warning">Disputed</Badge>;
      case 'pending':
        return <Badge variant="destructive">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-md p-4 border">
          <span className="text-sm text-muted-foreground">Total Fines</span>
          <p className="text-2xl font-bold">{trafficFines.length}</p>
        </div>
        <div className="bg-card rounded-md p-4 border">
          <span className="text-sm text-muted-foreground">Total Amount</span>
          <p className="text-2xl font-bold">
            {formatCurrency(trafficFines.reduce((sum, fine) => sum + fine.fine_amount, 0))}
          </p>
        </div>
        <div className="bg-card rounded-md p-4 border">
          <span className="text-sm text-muted-foreground">Paid</span>
          <p className="text-2xl font-bold">
            {formatCurrency(trafficFines
              .filter(fine => fine.payment_status === 'completed')
              .reduce((sum, fine) => sum + fine.fine_amount, 0))}
          </p>
        </div>
        <div className="bg-card rounded-md p-4 border">
          <span className="text-sm text-muted-foreground">Pending</span>
          <p className="text-2xl font-bold">
            {formatCurrency(trafficFines
              .filter(fine => fine.payment_status !== 'completed')
              .reduce((sum, fine) => sum + fine.fine_amount, 0))}
          </p>
        </div>
      </div>
      
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full table-auto">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left">Violation #</th>
              <th className="px-4 py-2 text-left">License Plate</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Amount</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {trafficFines.map((fine) => (
              <tr key={fine.id} className="border-t hover:bg-muted/50">
                <td className="px-4 py-2">
                  <div className="flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                    {fine.violation_number}
                  </div>
                </td>
                <td className="px-4 py-2">{fine.license_plate}</td>
                <td className="px-4 py-2">
                  {fine.violation_date ? format(new Date(fine.violation_date), 'MMM d, yyyy') : 'N/A'}
                </td>
                <td className="px-4 py-2">{formatCurrency(fine.fine_amount)}</td>
                <td className="px-4 py-2">{formatPaymentStatus(fine.payment_status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
