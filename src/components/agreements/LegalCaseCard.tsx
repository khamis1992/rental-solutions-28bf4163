
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalCase } from '@/types/legal-case';
import { supabase } from '@/integrations/supabase/client';
import { CalendarClock, Scale, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { useDateFormatter } from '@/lib/date-utils';

interface LegalCaseCardProps {
  agreementId: string;
}

export function LegalCaseCard({ agreementId }: LegalCaseCardProps) {
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  const { formatDate } = useDateFormatter();

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

        // Log the data to see what we're getting
        console.log('Legal cases data:', data);

        // Transform the data to match the LegalCase type
        if (data) {
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
        }
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
        return <Badge className="bg-yellow-500 text-white">{t('common.pending')}</Badge>;
      case 'active':
        return <Badge className="bg-blue-500 text-white">{t('common.active')}</Badge>;
      case 'closed':
        return <Badge className="bg-green-500 text-white">{t('common.completed')}</Badge>;
      case 'settled':
        return <Badge className="bg-indigo-500 text-white">{t('legal.settled', 'Settled')}</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const handleViewDetails = (caseId: string) => {
    toast.info(t('legal.caseDetails'));
    // Navigation to case details would go here
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('legal.cases')}</CardTitle>
          <CardDescription>{t('legal.associatedMatters')}</CardDescription>
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
          <CardTitle>{t('legal.cases')}</CardTitle>
          <CardDescription>{t('legal.associatedMatters')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p>{t('legal.noCases')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('legal.cases')}</CardTitle>
        <CardDescription>{t('legal.associatedMatters')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {legalCases.map((legalCase) => (
            <div 
              key={legalCase.id} 
              className="border rounded-md p-4 hover:border-primary/50 transition-colors"
            >
              <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} justify-between items-start mb-2`}>
                <div>
                  <h4 className="font-medium">{legalCase.title}</h4>
                  <p className="text-sm text-muted-foreground">Case #{legalCase.case_number}</p>
                </div>
                {getStatusBadge(legalCase.status)}
              </div>
              
              <p className="text-sm mb-3 line-clamp-2">{legalCase.description}</p>
              
              <div className={`flex flex-wrap gap-4 text-sm text-muted-foreground mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <CalendarClock className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                  <span>{t('common.date')}: {legalCase.hearing_date ? formatDate(new Date(legalCase.hearing_date)) : t('common.notProvided')}</span>
                </div>
                {legalCase.amount_claimed && (
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Scale className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    <span>{t('common.amount')}: ${legalCase.amount_claimed.toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => handleViewDetails(legalCase.id)}
              >
                <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('legal.viewDetails')}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
