
import React, { useState, useEffect, useCallback } from 'react';
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
  const [showLoader, setShowLoader] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Wrap the hook in error handling
  let hookData;
  try {
    hookData = useTrafficFines();
  } catch (error) {
    console.error('Error in useTrafficFines hook:', error);
    hookData = { isLoading: false, trafficFines: [] };
  }

  const { isLoading: hookIsLoading, trafficFines } = hookData;

  // Update showLoader only when the hook's loading state changes
  useEffect(() => {
    try {
      setShowLoader(hookIsLoading);
      setHasError(false);
    } catch (error) {
      console.error('Error in useEffect:', error);
      setHasError(true);
      setShowLoader(false);
    }
  }, [hookIsLoading]);

  // Memoize handleRefresh to prevent recreation on each render
  const handleRefresh = useCallback(async () => {
    try {
      setShowLoader(true);
      setHasError(false);
      // Wait a moment for visual feedback
      setTimeout(() => {
        setShowLoader(false);
      }, 1000);
    } catch (error) {
      console.error('Error in handleRefresh:', error);
      setHasError(true);
      setShowLoader(false);
    }
  }, []);

  // Memoize the filtered fines to prevent recalculation on each render
  const filteredFines = React.useMemo(() => {
    try {
      if (!trafficFines || !Array.isArray(trafficFines)) {
        console.log('No traffic fines data or invalid format:', trafficFines);
        return [];
      }
      
      console.log('Total traffic fines:', trafficFines.length);
      console.log('Filtering for agreement:', agreementId);
      console.log('Date range:', { startDate, endDate });
      
      const filtered = trafficFines.filter(fine => {
        try {
          // Check if fine is assigned to this lease/agreement
          const isAssignedToLease = fine.leaseId === agreementId;
          
          if (!isAssignedToLease) {
            return false;
          }
          
          // Check date range
          if (!fine.violationDate) {
            console.log('Fine without violation date:', fine);
            return false;
          }
          
          // Ensure violationDate is a Date object
          const violationDate = fine.violationDate instanceof Date 
            ? fine.violationDate 
            : new Date(fine.violationDate);
          
          const isInDateRange = violationDate >= startDate && violationDate <= endDate;
          
          console.log('Fine check:', {
            fineId: fine.id,
            leaseId: fine.leaseId,
            violationDate: violationDate.toISOString(),
            isAssignedToLease,
            isInDateRange
          });
          
          return isInDateRange;
        } catch (error) {
          console.error('Error processing fine:', error, fine);
          return false;
        }
      });
      
      console.log('Filtered fines count:', filtered.length);
      return filtered;
    } catch (error) {
      console.error('Error filtering fines:', error);
      setHasError(true);
      return [];
    }
  }, [trafficFines, agreementId, startDate, endDate]);

  // Error boundary rendering
  if (hasError) {
    return (
      <div className="space-y-4">
        <p className="text-center py-4 text-red-500">
          There was an error loading traffic fines data.
        </p>
        <div className="flex justify-center">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (showLoader) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filteredFines.length === 0) {
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
            {filteredFines.map((fine) => {
              try {
                const violationDate = fine.violationDate instanceof Date 
                  ? fine.violationDate 
                  : new Date(fine.violationDate);
                
                return (
                  <tr key={fine.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      {fine.violationDate 
                        ? format(violationDate, 'dd MMM yyyy') 
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
                );
              } catch (error) {
                console.error('Error rendering fine row:', error, fine);
                return (
                  <tr key={fine.id || Math.random()} className="border-b">
                    <td colSpan={5} className="py-3 px-4 text-center text-red-500">
                      Error displaying fine data
                    </td>
                  </tr>
                );
              }
            })}
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
