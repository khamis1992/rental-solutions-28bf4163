
import React, { useState, useEffect } from 'react';
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
  const { isLoading, trafficFines } = useTrafficFines();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    // Initial loading state is managed by the hook
    setShowLoader(isLoading);
  }, [isLoading]);

  const handleRefresh = async () => {
    setShowLoader(true);
    // Wait a moment for visual feedback
    setTimeout(() => {
      setShowLoader(false);
    }, 1000);
  };

  if (isLoading || showLoader) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Filter traffic fines for this agreement if needed
  const filteredFines = trafficFines ? trafficFines.filter(fine => 
    fine.leaseId === agreementId
  ) : [];

  if (!filteredFines || filteredFines.length === 0) {
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
            {filteredFines.map((fine) => (
              <tr key={fine.id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4">
                  {fine.violationDate 
                    ? format(new Date(fine.violationDate), 'dd MMM yyyy') 
                    : 'N/A'}
                </td>
                <td className="py-3 px-4">{fine.location || 'N/A'}</td>
                <td className="py-3 px-4">{fine.violationCharge || 'N/A'}</td>
                <td className="py-3 px-4 text-right">
                  {fine.fineAmount 
                    ? `QAR ${fine.fineAmount.toLocaleString()}` 
                    : 'N/A'}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    fine.paymentStatus === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {fine.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
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
            Showing {filteredFines.length} fine{filteredFines.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <Button onClick={handleRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>
    </div>
  );
}
