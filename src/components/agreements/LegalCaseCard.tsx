
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Pencil, Plus, Info, Shield, AlertTriangle, Clock, BarChart2, Ban, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UUID } from '@/types/database-types';

interface LegalCaseCardProps {
  agreementId: string;
}

const LegalCaseCard: React.FC<LegalCaseCardProps> = ({ agreementId }) => {
  const { toast } = useToast();
  const [legalCases, setLegalCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customerData, setCustomerData] = useState<any>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!agreementId) return;
      
      try {
        const { data: agreementData, error: agreementError } = await supabase
          .from('leases')
          .select('customer_id')
          .eq('id', agreementId)
          .single();
        
        if (agreementError || !agreementData) {
          throw new Error('Failed to get customer ID from agreement');
        }
        
        // Get customer details
        const customerId = agreementData.customer_id;
        const { data: customerData, error: customerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', customerId)
          .single();
        
        if (customerError) throw customerError;
        setCustomerData(customerData);
        
        // Fetch legal cases for this customer
        const { data: cases, error: casesError } = await supabase
          .from('legal_cases')
          .select('*')
          .eq('customer_id', customerId);
        
        if (casesError) throw casesError;
        setLegalCases(cases || []);
      } catch (error) {
        console.error('Error fetching legal case data:', error);
        toast({
          title: "Error",
          description: "Failed to load legal case information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [agreementId, toast]);
  
  const handleCaseStatusUpdate = async (caseId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('legal_cases')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', caseId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Case status updated successfully",
      });
      
      // Refresh cases
      if (customerData?.id) {
        const { data, error: refreshError } = await supabase
          .from('legal_cases')
          .select('*')
          .eq('customer_id', customerData.id);
        
        if (!refreshError) {
          setLegalCases(data || []);
        }
      }
    } catch (error) {
      console.error('Error updating case status:', error);
      toast({
        title: "Error",
        description: "Failed to update case status",
        variant: "destructive",
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
            onClick={() => handleCaseStatusUpdate(row.original.id, 'resolved')}
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
          Legal cases associated with this agreement
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin h-6 w-6" />
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
