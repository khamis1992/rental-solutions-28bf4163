
// Import the TrafficFine type
import { TrafficFine } from '@/types/traffic-fine';
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mapTrafficFineData } from '@/utils/traffic-fine-mapper';

interface CustomerTrafficFinesProps {
  customerId: string;
}

export function CustomerTrafficFines({ customerId }: CustomerTrafficFinesProps) {
  const { isLoading, trafficFines } = useTrafficFines();
  const [showLoader, setShowLoader] = useState(false);
  const [fines, setFines] = useState<TrafficFine[]>([]);

  useEffect(() => {
    // Filter fines to only show those related to this customer
    if (trafficFines) {
      const relatedFines = trafficFines
        .filter(fine => fine.customer_id === customerId)
        .map(mapTrafficFineData);
      setFines(relatedFines);
    }
  }, [trafficFines, customerId]);

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
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (fines.length === 0) {
    return (
      <div className="text-center p-12 border rounded-md bg-background">
        <p className="text-muted-foreground">
          No traffic fines found for this customer.
        </p>
        <Button variant="outline" className="mt-4" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted-foreground">
          Showing {fines.length} traffic fines
        </span>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Violation #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>License Plate</TableHead>
            <TableHead>Charge</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fines.map((fine) => (
            <TableRow key={fine.id}>
              <TableCell>{fine.violation_number}</TableCell>
              <TableCell>
                {fine.violation_date
                  ? format(new Date(fine.violation_date), "dd MMM yyyy")
                  : "N/A"}
              </TableCell>
              <TableCell>{fine.license_plate}</TableCell>
              <TableCell>{fine.violation_charge}</TableCell>
              <TableCell>
                {typeof fine.fine_amount === "number"
                  ? `QAR ${fine.fine_amount.toLocaleString()}`
                  : "N/A"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    fine.payment_status === "paid"
                      ? "success"
                      : fine.payment_status === "disputed"
                      ? "warning"
                      : "destructive"
                  }
                >
                  {fine.payment_status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
