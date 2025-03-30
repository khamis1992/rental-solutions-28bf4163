
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface AgreementTrafficFinesProps {
  agreementId: string;
  startDate: Date;
  endDate: Date;
}

export function AgreementTrafficFines({ agreementId, startDate, endDate }: AgreementTrafficFinesProps) {
  const { isLoading, trafficFines, getTrafficFines } = useTrafficFines();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const loadFines = async () => {
      if (agreementId) {
        setShowLoader(true);
        await getTrafficFines({ agreementId });
        setShowLoader(false);
      }
    };
    
    loadFines();
  }, [agreementId, getTrafficFines]);

  const handleRefresh = async () => {
    setShowLoader(true);
    await getTrafficFines({ agreementId, forceRefresh: true });
    setShowLoader(false);
  };

  if (isLoading || showLoader) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!trafficFines || trafficFines.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-center py-4 text-muted-foreground">
          No traffic fines recorded for this rental period.
        </p>
        <div className="flex justify-center">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            Check for new fines
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Location</th>
              <th className="text-left py-3 px-4">Violation</th>
              <th className="text-right py-3 px-4">Amount</th>
              <th className="text-right py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {trafficFines.map((fine) => (
              <tr key={fine.id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4">
                  {fine.violation_date 
                    ? format(new Date(fine.violation_date), 'dd MMM yyyy') 
                    : 'N/A'}
                </td>
                <td className="py-3 px-4">{fine.fine_location || 'N/A'}</td>
                <td className="py-3 px-4">{fine.violation_charge || 'N/A'}</td>
                <td className="py-3 px-4 text-right">
                  {fine.fine_amount 
                    ? `QAR ${fine.fine_amount.toLocaleString()}` 
                    : 'N/A'}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    fine.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {fine.payment_status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center pt-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Showing {trafficFines.length} fine{trafficFines.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <Button onClick={handleRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>
    </div>
  );
}
