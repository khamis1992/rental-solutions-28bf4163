import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useTrafficFines } from '@/hooks/use-traffic-fines';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AgreementTrafficFinesProps {
  agreementId: string;
  startDate: Date;
  endDate: Date;
}

export function AgreementTrafficFines({ agreementId, startDate, endDate }: AgreementTrafficFinesProps) {
  const { isLoading: hookIsLoading, trafficFines } = useTrafficFines();
  const [showLoader, setShowLoader] = useState(false);

  // Update showLoader only when the hook's loading state changes
  useEffect(() => {
    setShowLoader(hookIsLoading);
  }, [hookIsLoading]);

  // Memoize handleRefresh to prevent recreation on each render
  const handleRefresh = useCallback(async () => {
    setShowLoader(true);
    // Wait a moment for visual feedback
    setTimeout(() => {
      setShowLoader(false);
    }, 1000);
  }, []);

  // Memoize the filtered fines to prevent recalculation on each render
  const filteredFines = React.useMemo(() => {
    if (!trafficFines || !Array.isArray(trafficFines)) {
      console.log('No traffic fines data or invalid format:', trafficFines);
      return [];
    }
    
    console.log('Total traffic fines:', trafficFines.length);
    console.log('Filtering for agreement:', agreementId);
    console.log('Date range:', { startDate, endDate });
    
    const filtered = trafficFines.filter(fine => {
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
    });
    
    console.log('Filtered fines count:', filtered.length);
    return filtered;
  }, [trafficFines, agreementId, startDate, endDate]);

  if (showLoader) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filteredFines.length === 0) {
    return (
      <div className="space-y-4" dir="rtl">
        <p className="text-center py-4 text-muted-foreground">
          لم يتم تسجيل أي مخالفات مرورية خلال فترة الإيجار هذه.
        </p>
        <div className="flex justify-center">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            البحث عن مخالفات جديدة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-right py-3 px-4">التاريخ</th>
              <th className="text-right py-3 px-4">الموقع</th>
              <th className="text-right py-3 px-4">المخالفة</th>
              <th className="text-right py-3 px-4">المبلغ</th>
              <th className="text-right py-3 px-4">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filteredFines.map((fine: any) => {
              const violationDate = fine.violationDate instanceof Date 
                ? fine.violationDate 
                : new Date(fine.violationDate);
              
              return (
                <tr key={fine.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 text-right">
                    {fine.violationDate 
                      ? format(violationDate, 'dd MMM yyyy') 
                      : 'غير محدد'}
                  </td>
                  <td className="py-3 px-4 text-right">{fine.location || 'غير محدد'}</td>
                  <td className="py-3 px-4 text-right">{fine.violationCharge || 'غير محدد'}</td>
                  <td className="py-3 px-4 text-right">
                    {fine.fineAmount 
                      ? `${fine.fineAmount.toLocaleString('en-US')} ر.ق` 
                      : 'غير محدد'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      fine.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {fine.paymentStatus === 'paid' ? 'مدفوع' : 'معلق'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center pt-4">
        <div>
          <p className="text-sm text-muted-foreground">
            عرض {filteredFines.length} مخالفة{filteredFines.length !== 1 ? '' : ''}
          </p>
        </div>
        
        <Button onClick={handleRefresh} variant="outline" size="sm">
          تحديث
        </Button>
      </div>
    </div>
  );
}
