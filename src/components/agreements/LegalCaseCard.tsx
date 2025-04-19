
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Check, Clock, Ban, AlertTriangle } from 'lucide-react';
import { asTableId } from '@/utils/database-type-helpers';

interface LegalCaseCardProps {
  agreementId: string;
}

const LegalCaseCard: React.FC<LegalCaseCardProps> = ({ agreementId }) => {
  const { toast } = useToast();
  const [legalCases, setLegalCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  
  // Fetch legal cases related to this agreement
  useEffect(() => {
    const fetchLegalCases = async () => {
      try {
        setIsLoading(true);
        // First get the lease to find the customer_id
        const leaseResponse = await supabase
          .from('leases')
          .select('customer_id')
          .eq('id', asTableId(agreementId))
          .single();
        
        if (!leaseResponse.data || leaseResponse.error) {
          console.error("Could not find lease:", leaseResponse.error);
          return;
        }
        
        // Then fetch legal cases for that customer
        const { data: customerData, error: customerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', leaseResponse.data.customer_id)
          .single();
          
        if (customerError) {
          console.error("Error fetching customer:", customerError);
        } else {
          setCustomer(customerData);
        }
          
        // Get legal cases for this customer
        const { data: casesData, error: casesError } = await supabase
          .from('legal_cases')
          .select('*')
          .eq('customer_id', leaseResponse.data.customer_id);
          
        if (casesError) {
          console.error("Error fetching legal cases:", casesError);
          toast({
            title: 'Error',
            description: 'Could not load legal cases',
            variant: 'destructive'
          });
        } else {
          setLegalCases(casesData || []);
        }
      } catch (error) {
        console.error("Error in legal cases fetch:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (agreementId) {
      fetchLegalCases();
    }
  }, [agreementId, toast]);
  
  const handleResolveCase = async (id: string) => {
    try {
      const updateData = {
        status: 'resolved',
        resolution_notes: 'Case closed by admin',
        resolution_date: new Date().toISOString(),
      };
      
      // Use as any to bypass type checking for now
      const { error } = await supabase
        .from('legal_cases')
        .update(updateData as any)
        .eq('id', asTableId(id));
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setLegalCases(prevCases => 
        prevCases.map(c => c.id === id ? { ...c, ...updateData } : c)
      );
      
      toast({
        title: 'Success',
        description: 'Case has been resolved',
      });
    } catch (error) {
      console.error('Error resolving case:', error);
      toast({
        title: 'Error',
        description: 'Could not resolve the case',
        variant: 'destructive',
      });
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending_reminder':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending Reminder</Badge>;
      case 'awaiting_response':
        return <Badge variant="warning" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Awaiting Response</Badge>;
      case 'escalated':
        return <Badge variant="destructive" className="flex items-center gap-1"><Ban className="h-3 w-3" /> Escalated</Badge>;
      case 'resolved':
        return <Badge variant="success" className="flex items-center gap-1"><Check className="h-3 w-3" /> Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
      cell: ({ row }: { row: any }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'amount_owed',
      header: 'Amount Owed',
      cell: ({ row }: { row: any }) => `QAR ${row.original.amount_owed?.toLocaleString() || '0'}`,
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }: { row: any }) => format(new Date(row.original.created_at), 'MMM d, yyyy'),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => (
        row.original.status !== 'resolved' ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleResolveCase(row.original.id)}
          >
            Resolve
          </Button>
        ) : null
      ),
    },
  ];
  
  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle>Legal Cases</CardTitle>
        <CardDescription>
          {customer?.full_name ? `Legal cases for ${customer.full_name}` : 'Legal cases for this agreement'}
        </CardDescription>
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
};

export default LegalCaseCard;
