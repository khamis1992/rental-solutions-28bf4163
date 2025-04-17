
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CustomerTrafficFinesProps {
  customerId: string;
}

const CustomerTrafficFines: React.FC<CustomerTrafficFinesProps> = ({ customerId }) => {
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFines = async () => {
      if (!customerId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('traffic_fines')
          .select('*')
          .eq('customer_id', customerId);
        
        if (error) throw error;
        setFines(data as any[]);
      } catch (err) {
        console.error('Error fetching traffic fines:', err);
        setError('Failed to load traffic fines data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFines();
  }, [customerId]);

  const formatPaymentStatus = (status: string) => {
    switch(status) {
      case 'completed':
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'disputed':
        return <Badge variant="warning">Disputed</Badge>;
      case 'pending':
        return <Badge variant="destructive">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No traffic fines found for this customer.</p>
        </CardContent>
      </Card>
    );
  }

  const totalAmount = fines.reduce((sum, fine) => sum + (fine.fine_amount || 0), 0);
  const paidAmount = fines
    .filter(fine => fine.payment_status === 'completed' || fine.payment_status === 'paid')
    .reduce((sum, fine) => sum + (fine.fine_amount || 0), 0);
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-md p-4 border">
          <span className="text-sm text-muted-foreground">Total Fines</span>
          <p className="text-2xl font-bold">{fines.length}</p>
        </div>
        <div className="bg-card rounded-md p-4 border">
          <span className="text-sm text-muted-foreground">Total Amount</span>
          <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-card rounded-md p-4 border">
          <span className="text-sm text-muted-foreground">Pending Amount</span>
          <p className="text-2xl font-bold">{formatCurrency(pendingAmount)}</p>
        </div>
      </div>
      
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-sm">Violation #</th>
              <th className="px-4 py-3 text-left font-medium text-sm">License Plate</th>
              <th className="px-4 py-3 text-left font-medium text-sm">Date</th>
              <th className="px-4 py-3 text-left font-medium text-sm">Location</th>
              <th className="px-4 py-3 text-left font-medium text-sm">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {fines.map((fine) => (
              <tr key={fine.id} className="border-t hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                    {fine.violation_number}
                  </div>
                </td>
                <td className="px-4 py-3">{fine.license_plate}</td>
                <td className="px-4 py-3">
                  {fine.violation_date ? formatDate(fine.violation_date) : 'N/A'}
                </td>
                <td className="px-4 py-3">{fine.location || fine.fine_location || 'N/A'}</td>
                <td className="px-4 py-3">{formatCurrency(fine.fine_amount || 0)}</td>
                <td className="px-4 py-3">{formatPaymentStatus(fine.payment_status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerTrafficFines;
