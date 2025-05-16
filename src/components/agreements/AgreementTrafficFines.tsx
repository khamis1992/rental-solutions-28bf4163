
import React, { useState, useEffect } from 'react';
import { useTrafficFineService } from '@/hooks/services/useTrafficFineService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, BarChart } from 'lucide-react';
import { TrafficFine } from '@/types/traffic-fine';

export interface AgreementTrafficFinesProps {
  leaseId?: string;
  vehicleId?: string;
  startDate?: Date; 
  endDate?: Date;
}

export function AgreementTrafficFines({
  leaseId,
  vehicleId,
  startDate,
  endDate
}: AgreementTrafficFinesProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  
  const {
    trafficFines,
    isLoading,
    error,
    totalPages,
    refetch
  } = useTrafficFineService({
    leaseId,
    vehicleId,
    page: currentPage,
    pageSize
  });

  // Refetch when agreement ID changes
  useEffect(() => {
    refetch();
  }, [leaseId, vehicleId, refetch]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fines</CardTitle>
        </CardHeader>
        <CardContent>Loading traffic fines...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-red-500">
            <AlertCircle className="mr-2" />
            Error loading traffic fines: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const fines = trafficFines || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Traffic Fines</CardTitle>
            <CardDescription>
              Violations associated with this agreement
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <BarChart className="mr-2 h-4 w-4" />
            View Analysis
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {fines.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No traffic fines found for this agreement
          </div>
        ) : (
          <div className="space-y-4">
            {fines.map((fine: TrafficFine) => (
              <div key={fine.id} className="border rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <div className="font-medium">
                    {fine.violation_charge || 'Traffic Violation'}
                  </div>
                  <Badge variant={fine.payment_status === 'paid' ? 'success' : 'destructive'}>
                    {fine.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Date: {fine.violation_date ? new Date(fine.violation_date).toLocaleDateString() : 'Unknown'}
                </div>
                <div className="text-sm mb-2">
                  <span>Fine Amount: </span>
                  <span className="font-semibold">{fine.fine_amount || 0} QAR</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Location: {fine.fine_location || 'Not specified'}
                </div>
                {fine.validation_status !== 'verified' && (
                  <div className="mt-2 text-amber-500 text-xs flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Validation pending
                  </div>
                )}
              </div>
            ))}

            {/* Pagination UI if needed */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center px-2">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
