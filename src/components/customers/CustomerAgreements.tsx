
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface CustomerAgreementsProps {
  customerId: string;
}

const CustomerAgreements: React.FC<CustomerAgreementsProps> = ({ customerId }) => {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgreements = async () => {
      if (!customerId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('leases')
          .select(`
            id,
            agreement_number,
            start_date,
            end_date,
            status,
            rent_amount,
            total_amount,
            vehicles (id, make, model, license_plate)
          `)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setAgreements(data as any[]);
      } catch (err) {
        console.error('Error fetching agreements:', err);
        setError('Failed to load agreement data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAgreements();
  }, [customerId]);

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'pending':
      case 'pending_payment':
        return <Badge className="bg-amber-500">Pending</Badge>;
      case 'closed':
        return <Badge className="bg-blue-500">Closed</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500">Expired</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading agreements...</span>
      </div>
    );
  }
  
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  if (agreements.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No agreements found for this customer.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-sm">Agreement #</th>
            <th className="px-4 py-3 text-left font-medium text-sm">Vehicle</th>
            <th className="px-4 py-3 text-left font-medium text-sm">Period</th>
            <th className="px-4 py-3 text-left font-medium text-sm">Amount</th>
            <th className="px-4 py-3 text-left font-medium text-sm">Status</th>
            <th className="px-4 py-3 text-right font-medium text-sm"></th>
          </tr>
        </thead>
        <tbody>
          {agreements.map((agreement) => (
            <tr key={agreement.id} className="border-t hover:bg-muted/50">
              <td className="px-4 py-3 font-medium">{agreement.agreement_number}</td>
              <td className="px-4 py-3">
                {agreement.vehicles ? 
                  `${agreement.vehicles.make} ${agreement.vehicles.model} (${agreement.vehicles.license_plate})` : 
                  'N/A'}
              </td>
              <td className="px-4 py-3">
                {agreement.start_date && agreement.end_date ? 
                  `${formatDate(agreement.start_date)} - ${formatDate(agreement.end_date)}` : 
                  'N/A'}
              </td>
              <td className="px-4 py-3">
                {formatCurrency(agreement.total_amount || agreement.rent_amount || 0)}
              </td>
              <td className="px-4 py-3">
                {getStatusBadge(agreement.status)}
              </td>
              <td className="px-4 py-3 text-right">
                <Button 
                  variant="ghost" 
                  size="sm"
                  asChild
                >
                  <Link to={`/agreements/${agreement.id}`} className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" /> 
                    View
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerAgreements;
