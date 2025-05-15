
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useTrafficFineService } from '@/hooks/services/useTrafficFineService';
import { Badge } from '@/components/ui/badge';

interface AgreementTrafficFinesProps {
  agreementId: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

// Define a type for the paginated result
export interface PaginatedTrafficFineResult {
  data: any[];
  meta?: {
    totalPages: number;
    currentPage: number;
    totalItems: number;
  }
}

export function AgreementTrafficFines({ 
  agreementId,
  startDate,
  endDate 
}: AgreementTrafficFinesProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const trafficFineService = useTrafficFineService();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [trafficFines, setTrafficFines] = useState<any[]>([]);

  useEffect(() => {
    fetchTrafficFines();
  }, [agreementId, currentPage]);

  const fetchTrafficFines = async () => {
    setIsLoading(true);
    try {
      const result = await trafficFineService.getTrafficFines({
        leaseId: agreementId,
        page: currentPage,
        pageSize: 5
      });

      if (Array.isArray(result)) {
        // Handle array response
        setTrafficFines(result);
        setTotalPages(1); // No pagination info available
      } else if (result && 'data' in result) {
        // Handle paginated response
        setTrafficFines(result.data || []);
        setTotalPages(result.meta?.totalPages || 1);
      } else {
        // Handle unexpected response format
        setTrafficFines([]);
        setTotalPages(1);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching traffic fines:', err);
      setError(err instanceof Error ? err : new Error('Failed to load traffic fines'));
    } finally {
      setIsLoading(false);
    }
  };

  // Status badge renderer
  const renderStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'disputed':
        return <Badge variant="warning">Disputed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Traffic Fines</CardTitle>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Add Fine
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center">Loading traffic fines...</div>
        ) : error ? (
          <div className="py-4 text-center text-red-500">{error.message}</div>
        ) : trafficFines.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            No traffic fines recorded for this agreement.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {trafficFines.map((fine) => (
                <div 
                  key={fine.id} 
                  className="border rounded-md p-3 bg-slate-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <Label>Violation #{fine.violationNumber || 'Unknown'}</Label>
                      <p className="text-sm mt-1">{fine.violationCharge || 'No description available'}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {fine.violationDate ? new Date(fine.violationDate).toLocaleDateString() : 'Date unknown'} 
                        {fine.location ? ` • ${fine.location}` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(fine.fineAmount || 0)}</div>
                      {renderStatusBadge(fine.paymentStatus)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Simple pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="py-2 px-3 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
