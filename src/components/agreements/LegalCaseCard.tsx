
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalCase } from '@/types/legal-case';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CalendarClock, Scale, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface LegalCaseCardProps {
  agreementId: string;
}

export function LegalCaseCard({ agreementId }: LegalCaseCardProps) {
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLegalCases = async () => {
      if (!agreementId) return;

      try {
        setIsLoading(true);
        // Find customer_id first
        const { data: leaseData, error: leaseError } = await supabase
          .from('leases')
          .select('customer_id')
          .eq('id', agreementId)
          .single();

        if (leaseError) {
          console.error('Error fetching lease data:', leaseError);
          return;
        }

        if (!leaseData?.customer_id) {
          console.log('No customer ID found for this agreement');
          return;
        }

        // Fetch legal cases for the customer
        const { data, error } = await supabase
          .from('legal_cases')
          .select('*')
          .eq('customer_id', leaseData.customer_id);

        if (error) {
          console.error('Error fetching legal cases:', error);
          return;
        }

        // Transform the data to match the LegalCase type
        const transformedData: LegalCase[] = (data || []).map(item => ({
          id: item.id,
          case_number: item.case_number || `CASE-${item.id.substring(0, 8)}`,
          title: item.title || `Case regarding ${item.case_type || 'dispute'}`,
          description: item.description || '',
          customer_id: item.customer_id,
          customer_name: item.customer_name || 'Customer',
          status: item.status || 'pending',
          hearing_date: item.hearing_date || item.escalation_date || null,
          court_location: item.court_location,
          assigned_attorney: item.assigned_attorney || item.assigned_to,
          opposing_party: item.opposing_party,
          case_type: item.case_type || 'other',
          documents: item.documents,
          amount_claimed: item.amount_owed || 0,
          amount_settled: item.amount_settled,
          created_at: item.created_at,
          updated_at: item.updated_at,
          notes: item.notes
        }));

        setLegalCases(transformedData);
      } catch (err) {
        console.error('Unexpected error fetching legal cases:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLegalCases();
  }, [agreementId]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case 'active':
        return <Badge className="bg-blue-500 text-white">Active</Badge>;
      case 'closed':
        return <Badge className="bg-green-500 text-white">Closed</Badge>;
      case 'settled':
        return <Badge className="bg-indigo-500 text-white">Settled</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const handleViewDetails = (caseId: string) => {
    toast.info("Case details functionality coming soon");
    // Navigation to case details would go here
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Cases</CardTitle>
          <CardDescription>Associated legal matters</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (legalCases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Cases</CardTitle>
          <CardDescription>Associated legal matters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p>No legal cases associated with this agreement.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal Cases</CardTitle>
        <CardDescription>Associated legal matters</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {legalCases.map((legalCase) => (
            <div 
              key={legalCase.id} 
              className="border rounded-md p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{legalCase.title}</h4>
                  <p className="text-sm text-muted-foreground">Case #{legalCase.case_number}</p>
                </div>
                {getStatusBadge(legalCase.status)}
              </div>
              
              <p className="text-sm mb-3 line-clamp-2">{legalCase.description}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center">
                  <CalendarClock className="h-4 w-4 mr-1" />
                  <span>Hearing: {legalCase.hearing_date ? format(new Date(legalCase.hearing_date), 'MMM d, yyyy') : 'Not scheduled'}</span>
                </div>
                {legalCase.amount_claimed && (
                  <div className="flex items-center">
                    <Scale className="h-4 w-4 mr-1" />
                    <span>Claim: ${legalCase.amount_claimed.toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => handleViewDetails(legalCase.id)}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
