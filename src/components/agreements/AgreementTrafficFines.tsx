
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AgreementTrafficFinesProps {
  agreementId: string;
  startDate: Date;
  endDate: Date;
}

export function AgreementTrafficFines({ agreementId, startDate, endDate }: AgreementTrafficFinesProps) {
  const { isLoading, trafficFines, error } = useTrafficFines();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Since refetch is not available in the hook, we'll use window.location.reload()
      // as a temporary solution until the hook is updated with proper refetch capability
      toast.success('Refreshing traffic fines data...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error('Failed to refresh traffic fines');
      console.error('Error refreshing traffic fines:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading || isRefreshing) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        <p>Error loading traffic fines</p>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2 mt-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    );
  }

  // Filter traffic fines for this agreement
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
          <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
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
        
        <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
