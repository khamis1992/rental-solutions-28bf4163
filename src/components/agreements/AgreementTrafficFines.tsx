
import React, { useState, useEffect } from 'react';
import { useTrafficFineService } from '@/hooks/services/useTrafficFineService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrafficFine } from '@/types/traffic-fine';

interface PaginatedTrafficFineResult {
  items: TrafficFine[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

interface AgreementTrafficFinesProps {
  leaseId: string;
  vehicleId?: string;
  className?: string;
}

export const AgreementTrafficFines: React.FC<AgreementTrafficFinesProps> = ({
  leaseId,
  vehicleId,
  className = '',
}) => {
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // Use the traffic fine service
  const trafficFineService = useTrafficFineService();
  
  // Fetch traffic fines
  useEffect(() => {
    const fetchFines = async () => {
      try {
        setIsLoading(true);
        
        const filters = { lease_id: leaseId };
        if (vehicleId) {
          Object.assign(filters, { vehicle_id: vehicleId });
        }
        
        const result = await trafficFineService.getTrafficFines({
          page: currentPage,
          pageSize: 5,
          filters
        });
        
        if (result && Array.isArray(result.items)) {
          setFines(result.items);
          setTotalPages(result.totalPages || 1);
        } else if (Array.isArray(result)) {
          // Handle if the result is just an array
          setFines(result);
          setTotalPages(1);
        } else {
          setFines([]);
        }
      } catch (error) {
        console.error('Error fetching traffic fines:', error);
        setFines([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFines();
  }, [leaseId, vehicleId, currentPage, trafficFineService]);
  
  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'overdue': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Traffic Fines</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading traffic fines...</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Traffic Fines</CardTitle>
      </CardHeader>
      <CardContent>
        {fines.length === 0 ? (
          <p className="text-muted-foreground">No traffic fines found for this agreement.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Violation Date</TableHead>
                  <TableHead>Fine Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell>{new Date(fine.violation_date || '').toLocaleDateString()}</TableCell>
                    <TableCell>{fine.fine_amount} QAR</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(fine.payment_status || '')}>
                        {fine.payment_status || 'Unknown'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-2 py-1">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
};
