import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileText, Loader2, Plus, MapPin, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { useTrafficFineQuery } from '@/hooks/use-traffic-fine-query';
import { TrafficFine } from '@/types/traffic-fine.types';
import { cn } from "@/lib/utils";

interface CustomerTrafficFinesProps {
  customerId: string;
}

const CustomerTrafficFines: React.FC<CustomerTrafficFinesProps> = ({ customerId }) => {
  const [error, setError] = useState<string | null>(null);
  const { getCustomerTrafficFines } = useTrafficFineQuery();
  const { data: trafficFines, isLoading, isError, error: queryError } = getCustomerTrafficFines(customerId);

  // Update error state if query fails
  React.useEffect(() => {
    if (isError && queryError) {
      setError(queryError instanceof Error ? queryError.message : 'An error occurred while fetching traffic fines');
    } else {
      setError(null);
    }
  }, [isError, queryError]);

  const getStatusBadge = (status: string) => {
    if (!status) return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", "border border-gray-200 text-gray-800")}>Unknown</div>;
    
    switch (status.toLowerCase()) {
      case 'paid':
        return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", "bg-green-500 text-white")}>Paid</div>;
      case 'pending':
        return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", "bg-yellow-500 text-white")}>Pending</div>;
      case 'disputed':
        return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", "bg-blue-500 text-white")}>Disputed</div>;
      default:
        return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", "border border-gray-200 text-gray-800")}>{status}</div>;
    }
  };

  const getValidationBadge = (status: string) => {
    if (!status) return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", "border border-gray-200 text-gray-800")}>Unknown</div>;
    
    switch (status.toLowerCase()) {
      case 'verified':
        return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", "bg-green-500 text-white")}>Verified</div>;
      case 'pending':
        return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", "bg-yellow-500 text-white")}>Pending</div>;
      case 'failed':
        return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", "bg-red-500 text-white")}>Failed</div>;
      default:
        return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", "border border-gray-200 text-gray-800")}>{status}</div>;
    }
  };

  const handleAddFine = () => {
    // Not implemented yet
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fines</CardTitle>
          <CardDescription>Loading traffic fines for this customer...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading traffic fines...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fines</CardTitle>
          <CardDescription>An error occurred</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-destructive">
            <AlertTriangle className="mr-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalFineAmount = trafficFines ? trafficFines.reduce((sum, fine) => 
    sum + (fine.fine_amount || 0), 0) : 0;
  const pendingFines = trafficFines ? trafficFines.filter(fine => 
    fine.status && fine.status.toLowerCase() !== "paid") : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Traffic Fines</h2>
          <p className="text-muted-foreground">
            Manage traffic fines associated with this customer
          </p>
        </div>
        <Button onClick={handleAddFine}>
          <Plus className="mr-2 h-4 w-4" /> Add Fine
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trafficFines ? trafficFines.length : 0}</div>
            <p className="text-xs text-muted-foreground">
              Total traffic fines recorded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fines</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingFines.length}</div>
            <p className="text-xs text-muted-foreground">
              Fines requiring payment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'QAR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(totalFineAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total amount for all fines
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Traffic Fine Records</CardTitle>
          <CardDescription>All traffic fines associated with this customer</CardDescription>
        </CardHeader>
        <CardContent>
          {trafficFines && trafficFines.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Violation</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trafficFines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell className="font-medium">{fine.license_plate || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                        {fine.violation_date ? formatDate(fine.violation_date) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-3 w-3 text-muted-foreground" />
                        {fine.violation_location || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>{fine.violation_type || 'N/A'}</TableCell>
                    <TableCell>
                      {fine.fine_amount ? (
                        new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'QAR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(fine.fine_amount)
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusBadge(fine.status || '')}</TableCell>
                    <TableCell>{getValidationBadge(fine.validation_status || '')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-48">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No traffic fines found for this customer</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerTrafficFines;
