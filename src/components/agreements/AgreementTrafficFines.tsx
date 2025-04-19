
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileCheck } from 'lucide-react';
import { hasData } from '@/utils/database-type-helpers';

export interface AgreementTrafficFinesProps {
  agreementId: string;
  startDate: string | Date | null;
  endDate: string | Date | null;
}

export function AgreementTrafficFines({ agreementId, startDate, endDate }: AgreementTrafficFinesProps) {
  const { toast } = useToast();
  const [trafficFines, setTrafficFines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (agreementId) {
      fetchTrafficFines();
    }
  }, [agreementId]);
  
  const fetchTrafficFines = async () => {
    try {
      setIsLoading(true);
      
      // Use string ID directly without type assertions
      const { data, error } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('lease_id', agreementId);
      
      if (error) {
        throw error;
      }
      
      setTrafficFines(data || []);
    } catch (error) {
      console.error('Error fetching traffic fines:', error);
      toast({
        title: 'Error',
        description: 'Could not load traffic fines data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  const columns = [
    {
      accessorKey: 'violation_number',
      header: 'Violation Number',
    },
    {
      accessorKey: 'violation_date',
      header: 'Date',
      cell: ({ row }: { row: any }) => {
        const dateString = row.original.violation_date;
        if (!dateString) return 'N/A';
        try {
          return format(new Date(dateString), 'MMM d, yyyy');
        } catch (error) {
          return dateString;
        }
      },
    },
    {
      accessorKey: 'license_plate',
      header: 'License Plate',
    },
    {
      accessorKey: 'fine_amount',
      header: 'Fine Amount',
      cell: ({ row }: { row: any }) => `QAR ${row.original.fine_amount?.toLocaleString() || '0'}`,
    },
    {
      accessorKey: 'violation_charge',
      header: 'Violation',
      cell: ({ row }: { row: any }) => row.original.violation_charge || 'N/A',
    },
    {
      accessorKey: 'payment_status',
      header: 'Status',
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.original.payment_status === 'paid' ? 'success' : 'destructive'}>
          {row.original.payment_status === 'paid' ? (
            <><FileCheck className="h-3 w-3 mr-1" /> PAID</>
          ) : (
            <><AlertTriangle className="h-3 w-3 mr-1" /> UNPAID</>
          )}
        </Badge>
      ),
    },
  ];
  
  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle>Traffic Fines</CardTitle>
        <CardDescription>Traffic violations during the rental period</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : trafficFines.length > 0 ? (
          <DataTable columns={columns} data={trafficFines} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No traffic fines found for this agreement.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
