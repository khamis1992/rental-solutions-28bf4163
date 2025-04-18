
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CalendarDays, User, Car, CreditCard, 
  ClipboardList, FileText, ChevronLeft, 
  Phone, Mail, MapPin
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PaymentHistory } from './PaymentHistory';
import { LegalCaseCard } from './LegalCaseCard';
import { AgreementTrafficFines } from './AgreementTrafficFines';
import { AgreementActions } from './AgreementActions';
import { AgreementTabs } from './AgreementTabs';
import { AgreementSummaryHeader } from './AgreementSummaryHeader';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { useAgreement } from '@/hooks/use-agreements';
import { supabase } from '@/integrations/supabase/client';

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { agreement, isLoading: isAgreementLoading, error: agreementError, refetch: refetchAgreement } = useAgreement(id);
  const { rentAmount, isLoading: isRentAmountLoading } = useRentAmount(id);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [legalCases, setLegalCases] = useState<any[]>([]);
  const [isLoadingLegalCases, setIsLoadingLegalCases] = useState(true);

  // Fetch payments when agreement ID changes or after a payment is deleted
  useEffect(() => {
    if (id) {
      fetchPayments();
      fetchLegalCases();
    }
  }, [id]);

  const fetchPayments = async () => {
    setIsLoadingPayments(true);
    try {
      // Assuming you have a supabase client and unified_payments table
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', id)
        .order('due_date', { ascending: false });
      
      if (error) throw error;
      
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error fetching payments',
        description: 'Could not load payment history for this agreement',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const fetchLegalCases = async () => {
    setIsLoadingLegalCases(true);
    try {
      const { data, error } = await supabase
        .from('legal_cases')
        .select('*')
        .eq('agreement_id', id);
      
      if (error) throw error;
      
      setLegalCases(data || []);
    } catch (error) {
      console.error('Error fetching legal cases:', error);
    } finally {
      setIsLoadingLegalCases(false);
    }
  };

  const handlePaymentDeleted = () => {
    fetchPayments();
    // Optionally refetch the agreement to update any related data
    refetchAgreement();
  };

  if (isAgreementLoading || !agreement) {
    return <div className="flex items-center justify-center h-96">Loading agreement details...</div>;
  }

  if (agreementError) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-xl font-semibold mb-4">Error Loading Agreement</h2>
        <p className="text-gray-500 mb-4">{agreementError.message}</p>
        <Button onClick={() => refetchAgreement()}>Try Again</Button>
      </div>
    );
  }

  const dateFormat = (date: string | Date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" className="gap-2" asChild>
          <a href="/agreements">
            <ChevronLeft className="h-4 w-4" /> Back to Agreements
          </a>
        </Button>
      </div>

      {/* Header with summary info */}
      <AgreementSummaryHeader agreement={agreement} rentAmount={rentAmount} />

      {/* Content with tabs */}
      <AgreementTabs 
        agreement={agreement}
        payments={payments}
        isLoadingPayments={isLoadingPayments}
        rentAmount={rentAmount}
        onPaymentDeleted={handlePaymentDeleted}
        onRefreshPayments={fetchPayments}
      >
        {/* Overview content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Customer Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <Avatar className="h-10 w-10 bg-primary/10">
                  <AvatarFallback className="text-primary">
                    {agreement.customers?.full_name ? agreement.customers.full_name.charAt(0) : 'C'}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Name</span>
                  </div>
                  <p className="text-sm mt-1">{agreement.customers?.full_name || 'N/A'}</p>
                </div>
                
                {agreement.customers?.phone_number && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">Phone</span>
                    </div>
                    <p className="text-sm mt-1">{agreement.customers.phone_number}</p>
                  </div>
                )}
                
                {agreement.customers?.email && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">Email</span>
                    </div>
                    <p className="text-sm mt-1">{agreement.customers.email}</p>
                  </div>
                )}
                
                {agreement.customers?.address && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Address</span>
                    </div>
                    <p className="text-sm mt-1">{agreement.customers.address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Vehicle Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Vehicle Details</h3>
                <Car className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Make</div>
                    <p className="text-sm">{agreement.vehicles?.make || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Model</div>
                    <p className="text-sm">{agreement.vehicles?.model || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Year</div>
                    <p className="text-sm">{agreement.vehicles?.year || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Color</div>
                    <p className="text-sm">{agreement.vehicles?.color || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Plate</div>
                    <p className="text-sm">{agreement.vehicles?.license_plate || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">VIN</div>
                    <p className="text-sm truncate">{agreement.vehicles?.vin || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Agreement Details */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Agreement Details</h3>
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Agreement #</div>
                    <p className="text-sm">{agreement.agreement_number}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Status</div>
                    <p className="text-sm">
                      <Badge variant={agreement.status === 'active' ? 'success' : 'secondary'}>
                        {agreement.status.toUpperCase()}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Start Date</div>
                    <p className="text-sm">{dateFormat(agreement.start_date)}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">End Date</div>
                    <p className="text-sm">{dateFormat(agreement.end_date)}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Rent Amount</div>
                    <p className="text-sm">QAR {rentAmount?.toLocaleString() || agreement.rent_amount?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Deposit</div>
                    <p className="text-sm">QAR {agreement.deposit_amount?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Payment history */}
        <PaymentHistory 
          payments={payments || []}
          isLoadingPayments={isLoadingPayments}
          onPaymentDeleted={handlePaymentDeleted}
          onRefreshPayments={fetchPayments}
          agreementId={id}
        />
        
        {/* Legal cases */}
        <LegalCaseCard 
          agreementId={id} 
        />
        
        {/* Traffic fines */}
        <AgreementTrafficFines 
          agreementId={id}
        />
      </AgreementTabs>
    </div>
  );
};

export default AgreementDetailPage;
