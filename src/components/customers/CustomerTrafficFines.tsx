import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { AlertCircle, Check, Clock, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { formatCurrency } from '@/lib/utils';

interface TrafficFine {
  id: string;
  amount: number;
  date: string;
  status: string;
  // ... other properties
}

export function CustomerTrafficFines({ customerId }: { customerId: string }) {
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const { fines, isLoading, error } = useTrafficFines(customerId);
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge variant="success" className="flex items-center gap-1"><Check size={12} /> Paid</Badge>;
      case 'pending':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock size={12} /> Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle size={12} /> Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
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
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-800">Error loading traffic fines</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Traffic Fines</CardTitle>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <FileText size={14} />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        {fines && fines.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Fine Number</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fines.map((fine) => (
                <TableRow key={fine.id}>
                  <TableCell>{format(new Date(fine.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{fine.reference_number}</TableCell>
                  <TableCell>{fine.vehicle?.license_plate || 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(fine.amount)}</TableCell>
                  <TableCell>{getStatusBadge(fine.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No traffic fines found for this customer.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
