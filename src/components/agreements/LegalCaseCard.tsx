
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileCheck, Ban, Check } from 'lucide-react';
import { asLeaseIdColumn } from '@/utils/database-type-helpers';
import type { UUID } from '@/types/database-types';

interface LegalCaseCardProps {
  agreementId: string | UUID;
}

export default function LegalCaseCard({ agreementId }: LegalCaseCardProps) {
  const { toast } = useToast();
  const [legalCases, setLegalCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (agreementId) {
      fetchLegalCases();
    }
  }, [agreementId]);
  
  const fetchLegalCases = async () => {
    try {
      setIsLoading(true);
      
      const { data: agreement } = await supabase
        .from('leases')
        .select('customer_id')
        .eq('id', asLeaseIdColumn(agreementId))
        .single();

      if (agreement?.customer_id) {
        const { data, error } = await supabase
          .from('legal_cases')
          .select(`
            *,
            profiles:customer_id (
              full_name,
              email,
              phone_number
            )
          `)
          .eq('customer_id', agreement.customer_id);
        
        if (error) {
          throw error;
        }
        
        setLegalCases(data || []);
      }
    } catch (error) {
      console.error('Error fetching legal cases:', error);
      toast({
        title: 'Error',
        description: 'Could not load legal cases data',
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
      accessorKey: 'case_type',
      header: 'Type',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.original.status === 'resolved' ? 'success' : 'destructive'}>
          {row.original.status === 'resolved' ? (
            <><FileCheck className="h-3 w-3 mr-1" /> RESOLVED</>
          ) : (
            <><AlertTriangle className="h-3 w-3 mr-1" /> PENDING</>
          )}
        </Badge>
      ),
    },
    {
      accessorKey: 'amount_owed',
      header: 'Amount Owed',
      cell: ({ row }: { row: any }) => `QAR ${row.original.amount_owed?.toLocaleString() || '0'}`,
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }: { row: any }) => formatDate(row.original.created_at),
    }
  ];
  
  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle>Legal Cases</CardTitle>
        <CardDescription>Legal cases associated with this agreement</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : legalCases.length > 0 ? (
          <DataTable columns={columns} data={legalCases} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No legal cases found for this agreement.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
