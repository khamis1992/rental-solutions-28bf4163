import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AgreementDetailsCard } from './details/AgreementDetailsCard';
import { CustomerInformationCard } from './details/CustomerInformationCard';
import { VehicleInformationCard } from './details/VehicleInformationCard';
import { PaymentHistory } from './PaymentHistory';
import { AgreementTrafficFines } from './AgreementTrafficFines';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useNavigate } from 'react-router-dom';
import { AgreementActionButtons } from './details/AgreementActionButtons';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, CalendarIcon, InfoIcon } from 'lucide-react';
import { format } from 'date-fns';
import { LegalCaseCompactView } from '../legal/LegalCaseCompactView';
import { Agreement } from '@/types/agreement';
import { adaptAgreementToValidationSchema } from '@/utils/agreement-type-adapter';

const statusColor = {
  active: 'bg-green-500',
  expired: 'bg-amber-500',
  pending: 'bg-blue-500',
  cancelled: 'bg-red-500',
  draft: 'bg-slate-500',
  closed: 'bg-zinc-500',
  completed: 'bg-emerald-500',
};

interface AgreementDetailProps {
  agreement: Agreement;
  onEdit: () => void;
  onPaymentAdded?: () => void;
  isLoading?: boolean;
  error?: Error | null;
  rentAmount?: number | null;
  contractAmount?: number | null;
  onDelete?: (id: string) => void;
  onDataRefresh?: () => void;
  onPaymentDeleted?: () => void;
  onGenerateDocument?: () => void;
}

export function AgreementDetail({ 
  agreement, 
  onEdit, 
  onPaymentAdded, 
  isLoading = false, 
  error = null,
  rentAmount = 0,
  contractAmount = 0,
  onDelete,
  onDataRefresh,
  onPaymentDeleted,
  onGenerateDocument
}: AgreementDetailProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [showExpiredWarning, setShowExpiredWarning] = useState(false);
  
  // Check if agreement is expired
  useEffect(() => {
    if (agreement && agreement.end_date) {
      const endDate = agreement.end_date instanceof Date 
        ? agreement.end_date 
        : new Date(agreement.end_date);
      setShowExpiredWarning(endDate < new Date() && agreement.status === 'active');
    }
  }, [agreement]);

  // Calculate duration in months
  const calculateDuration = () => {
    if (!agreement.start_date || !agreement.end_date) return 0;
    
    const start = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
    const end = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);
    
    // Calculate months difference
    const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(1, monthsDiff); // Ensure minimum of 1 month
  };
  
  const duration = calculateDuration();

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading agreement details...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load agreement details: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!agreement || !agreement.id) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>
          The requested agreement could not be found.
        </AlertDescription>
      </Alert>
    );
  }

  const adaptedAgreement = adaptAgreementToValidationSchema(agreement);
  const startDate = agreement.start_date instanceof Date 
    ? agreement.start_date 
    : new Date(agreement.start_date);
  const endDate = agreement.end_date instanceof Date 
    ? agreement.end_date 
    : new Date(agreement.end_date);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Agreement {agreement.agreement_number || agreement.id}
          </h1>
          <div className="flex items-center space-x-2 mt-1">
            <Badge className={`${statusColor[agreement.status] || 'bg-slate-500'}`}>
              {agreement.status?.toUpperCase()}
            </Badge>
            <div className="text-sm text-muted-foreground flex items-center">
              <CalendarIcon className="mr-1 h-3 w-3" />
              {format(startDate, 'dd MMM yyyy')} - {format(endDate, 'dd MMM yyyy')}
            </div>
          </div>
        </div>
        
        <AgreementActionButtons 
          onEdit={onEdit}
          onDownloadPdf={() => console.log('Download PDF')}
          onDelete={() => onDelete && onDelete(agreement.id)}
          onGenerateDocument={onGenerateDocument || (() => {})}
        />
      </div>
      
      <Separator />
      
      {showExpiredWarning && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Agreement Expired</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>This agreement has passed its end date but is still marked as active.</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/agreements/${agreement.id}/edit`)}
            >
              Update Status
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="details">Agreement Details</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="trafficFines">Traffic Fines</TabsTrigger>
          <TabsTrigger value="legal">Legal Cases</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AgreementDetailsCard 
              agreement={adaptedAgreement} 
              duration={duration} 
              rentAmount={rentAmount} 
              contractAmount={contractAmount} 
            />
            <CustomerInformationCard 
              customer={agreement.customers || {}}
            />
          </div>
          <VehicleInformationCard 
            vehicle={agreement.vehicles || {}}
          />
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentHistory 
                payments={paymentData || []}
                isLoading={isLoadingPayments}
                rentAmount={rentAmount}
                contractAmount={contractAmount}
                leaseId={agreement.id}
                onPaymentDeleted={handleDeletePayment}
                onRecordPayment={addPaymentAndUpdate}
                onEditPayment={updatePaymentRecord}
                onPaymentAdded={refreshPayments}
                leaseStartDate={leaseStartDate}
                leaseEndDate={leaseEndDate}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trafficFines">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Traffic Fines</CardTitle>
            </CardHeader>
            <CardContent>
              <AgreementTrafficFines 
                agreementId={agreement.id} 
                startDate={startDate}
                endDate={endDate}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="legal">
          <LegalCaseCompactView 
            customerId={agreement.customer_id}
            agreementId={agreement.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
