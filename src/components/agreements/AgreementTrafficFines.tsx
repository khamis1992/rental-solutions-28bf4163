
import React, { useEffect, useState } from 'react';
import { useTrafficFineService } from '@/hooks/services/useTrafficFineService';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { PaginatedTrafficFineResult, TrafficFine } from '@/types/traffic-fine';

interface AgreementTrafficFinesProps {
  agreementId: string;
  startDate?: Date;
  endDate?: Date;
}

export const AgreementTrafficFines: React.FC<AgreementTrafficFinesProps> = ({ 
  agreementId,
  startDate,
  endDate 
}) => {
  const trafficFineService = useTrafficFineService();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);

  useEffect(() => {
    const fetchTrafficFines = async () => {
      try {
        setIsLoading(true);
        const fines = await trafficFineService.getTrafficFines();
        
        // Handle different return types safely
        const finesArray = Array.isArray(fines) 
          ? fines 
          : (fines as PaginatedTrafficFineResult)?.data || [];
        
        setTrafficFines(finesArray);
        setError(null);
      } catch (err) {
        console.error("Error fetching traffic fines:", err);
        setError(err instanceof Error ? err.message : 'Failed to load traffic fines');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrafficFines();
  }, [agreementId, trafficFineService]);

  if (isLoading) {
    return <div>Loading traffic fines...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Filter unpaid fines - safely handle potential different return types
  const unpaidFines = trafficFines.filter(fine => 
    fine.payment_status === 'pending' || fine.payment_status === 'overdue'
  );

  const hasFines = trafficFines.length > 0;
  const hasUnpaidFines = unpaidFines.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Traffic Violations</CardTitle>
            <CardDescription>Recent traffic violations for this agreement</CardDescription>
          </div>
          {hasUnpaidFines && (
            <Badge variant="destructive">{unpaidFines.length} Unpaid</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasFines ? (
          <div className="text-center py-4 text-muted-foreground">
            No traffic violations found for this agreement.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Violation</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trafficFines.map((fine: TrafficFine) => (
                <TableRow key={fine.id}>
                  <TableCell>
                    {fine.violation_date && format(new Date(fine.violation_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{fine.fine_location || 'Unknown'}</TableCell>
                  <TableCell>{fine.violation_charge || 'Traffic Violation'}</TableCell>
                  <TableCell>{formatCurrency(fine.fine_amount)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={fine.payment_status === 'completed' ? 'outline' : 'destructive'}
                    >
                      {fine.payment_status === 'completed' ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
