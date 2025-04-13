
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { CheckIcon, Clock, FileWarning, UserCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { handleResponseData, hasData } from '@/utils/supabase-type-helpers';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface LegalCaseCardProps {
  caseId: string;
}

interface LegalCase {
  id: string;
  status: string;
  case_type: string;
  amount_owed: number;
  customer_id: string;
  escalation_date: string | null;
  assigned_to: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: string;
  full_name: string;
}

const LegalCaseCard: React.FC<LegalCaseCardProps> = ({ caseId }) => {
  const [legalCase, setLegalCase] = useState<LegalCase | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLegalCase = async () => {
      const { data: caseData, error: caseError } = await supabase
        .from('legal_cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (caseError) {
        console.error('Error fetching legal case:', caseError);
        setIsLoading(false);
        return;
      }

      if (caseData) {
        setLegalCase(caseData as LegalCase);

        // Fetch customer data
        const { data: customerData, error: customerError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', caseData.customer_id)
          .single();

        if (customerError) {
          console.error('Error fetching customer:', customerError);
        } else {
          setCustomer(customerData as Customer);
        }
      }

      setIsLoading(false);
    };

    fetchLegalCase();
  }, [caseId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_reminder':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending Reminder</Badge>;
      case 'pending_escalation':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Pending Escalation</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolved</Badge>;
      case 'escalated':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Escalated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = () => {
    navigate(`/legal/${caseId}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!legalCase) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Case Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The legal case could not be found or has been removed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{legalCase.case_type} Case</CardTitle>
            <CardDescription className="mt-1">
              {legalCase.description || 'No description provided'}
            </CardDescription>
          </div>
          {getStatusBadge(legalCase.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-2">
        <div className="flex items-center gap-2">
          <UserCircle2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {customer?.full_name || 'Unknown Customer'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FileWarning className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Amount Owed: {formatCurrency(legalCase.amount_owed || 0)}
          </span>
        </div>
        {legalCase.escalation_date && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Escalation Date: {format(new Date(legalCase.escalation_date), 'dd/MM/yyyy')}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="outline" size="sm" className="w-full" onClick={handleViewDetails}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LegalCaseCard;
