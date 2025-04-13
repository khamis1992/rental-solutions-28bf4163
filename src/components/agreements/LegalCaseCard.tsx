
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
import { castDbId } from '@/lib/supabase-types'; // Using castDbId from supabase-helpers
import { getResponseData, hasData } from '@/utils/supabase-type-helpers';

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
        const leaseResponse = await supabase
          .from('leases')
          .select('customer_id')
          .eq('id', castDbId(agreementId))
          .single();

        if (!hasData(leaseResponse)) {
          console.error('Error fetching lease data:', leaseResponse.error);
          setIsLoading(false);
          return;
        }

        const customerId = leaseResponse.data.customer_id;
        if (!customerId) {
          console.log('No customer ID found for this agreement');
          setIsLoading(false);
          return;
        }

        // Fetch legal cases for the customer
        const casesResponse = await supabase
          .from('legal_cases')
          .select('*')
          .eq('customer_id', castDbId(customerId));

        if (!hasData(casesResponse)) {
          console.error('Error fetching legal cases:', casesResponse.error);
          setIsLoading(false);
          return;
        }

        const data = casesResponse.data;
        console.log('Legal cases data:', data);

        // Transform the data to match the LegalCase type
        const transformedData: LegalCase[] = data.map(item => {
          // Safely check if notes exists and ensure it's a string
          let notesValue = '';
          if ('notes' in item && item.notes !== null && item.notes !== undefined) {
            notesValue = String(item.notes); // Convert to string to ensure type compatibility
          }
          
          return {
            id: item.id,
            case_number: `CASE-${item.id.substring(0, 8)}`,
            title: item.description ? `Case regarding ${item.description.substring(0, 30)}...` : `Case regarding ${item.case_type || 'dispute'}`,
            description: item.description || '',
            customer_id: item.customer_id,
            customer_name: 'Customer', // Default value
            status: (item.status as 'pending' | 'active' | 'closed' | 'settled') || 'pending',
            hearing_date: item.escalation_date || null,
            court_location: '',
            assigned_attorney: item.assigned_to || '',
            opposing_party: '',
            case_type: (item.case_type as 'contract_dispute' | 'traffic_violation' | 'insurance_claim' | 'customer_complaint' | 'other') || 'other',
            documents: [],
            amount_claimed: item.amount_owed || 0,
            amount_settled: null,
            created_at: item.created_at,
            updated_at: item.updated_at,
            notes: notesValue
          };
        });

        setLegalCases(transformedData);
        setIsLoading(false);
      } catch (err) {
        console.error('Unexpected error fetching legal cases:', err);
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
