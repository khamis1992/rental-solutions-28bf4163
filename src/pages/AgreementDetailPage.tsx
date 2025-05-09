
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreement } from '@/hooks/use-agreement';
import { usePayments } from '@/hooks/use-payments';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { formatAgreementDuration } from '@/utils/agreement-formatter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, ArrowLeft, Calendar, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PaymentHistory } from '@/components/agreements/PaymentHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AgreementTrafficFines } from '@/components/agreements/AgreementTrafficFines';
import { ReassignmentHistoryItem } from '@/components/agreements/ReassignmentHistoryItem';
import { AgreementDetailApi } from '@/services/AgreementDetailApi';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import { Customer } from '@/types/customer';
import { Vehicle } from '@/types/vehicle';
import { Payment } from '@/types/payment';
import { PaymentFormData } from '@/components/agreements/PaymentEntryForm';

// Define a type for the agreement status badge variant mappings
type StatusVariantMap = Record<AgreementStatus, "default" | "outline" | "secondary" | "destructive">;

const AgreementDetailPage: React.FC = () => {
  const { id: agreementId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Initialize with a null check and default empty string
  const id = agreementId ?? '';
  
  const { agreement, isLoading, error, refetch } = useAgreement(id);
  const { payments, isLoadingPayments, recordPayment, deletePayment, rentAmount } = usePayments(id);

  // Memoize contract amount from agreement's total_amount
  const contractAmount = agreement?.total_amount || 0;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (agreement) {
      // Set customer from agreement
      if (agreement.customers) {
        setCustomer(agreement.customers);
      }
      
      // Set vehicle from agreement
      if (agreement.vehicles) {
        setVehicle(agreement.vehicles);
      }
    }
  }, [agreement]);

  const handleBack = () => {
    navigate('/agreements');
  };

  const handleEdit = () => {
    navigate(`/agreements/${id}/edit`);
  };

  const handleRecordPayment = async (payment: Partial<PaymentFormData>) => {
    try {
      await recordPayment(payment);
      toast.success("Payment recorded successfully");
      setIsPaymentDialogOpen(false);
      refetch(); // Refresh agreement data
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    }
  };

  const handleDeletePayment = async () => {
    try {
      await deletePayment();
      toast.success("Payment deleted successfully");
      refetch(); // Refresh agreement data
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    }
  };

  const generateDocument = async () => {
    try {
      toast.info("Generating agreement document...");
      // In a real implementation, this would call an API to generate the document
      setTimeout(() => {
        toast.success("Document generated successfully");
      }, 1500);
    } catch (error) {
      toast.error("Failed to generate document");
    }
  };

  // Helper to render status badge with appropriate color
  const getStatusBadgeVariant = (status?: AgreementStatus): "default" | "outline" | "secondary" | "destructive" => {
    if (!status) return "default";
    
    const variantMap: StatusVariantMap = {
      [AgreementStatus.DRAFT]: "outline",
      [AgreementStatus.PENDING]: "secondary",
      [AgreementStatus.ACTIVE]: "default",
      [AgreementStatus.EXPIRED]: "outline",
      [AgreementStatus.CANCELLED]: "destructive",
      [AgreementStatus.CLOSED]: "outline"
    };
    
    return variantMap[status] || "default";
  };

  if (isLoading) {
    return (
      <PageContainer title="Agreement Details" isLoading>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </PageContainer>
    );
  }

  if (error || !agreement) {
    return (
      <PageContainer title="Agreement Details">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error?.message || "Failed to load agreement details"}
          </AlertDescription>
        </Alert>
        <Button onClick={handleBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Agreements
        </Button>
      </PageContainer>
    );
  }

  const {
    agreement_number,
    status,
    start_date,
    end_date,
    rent_amount,
    deposit_amount,
    notes
  } = agreement;

  return (
    <PageContainer
      title={`Agreement ${agreement_number}`}
      description="View agreement details and payment history"
      backLink="/agreements"
    >
      <div className="space-y-6">
        {/* Agreement header with actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              Agreement {agreement_number}
            </h1>
            <Badge variant={getStatusBadgeVariant(status as AgreementStatus)}>
              {status || 'Unknown Status'}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={generateDocument}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Document
            </Button>
            <Button onClick={handleEdit}>Edit Agreement</Button>
          </div>
        </div>
        
        <Separator />
        
        {/* Main content area with tabs */}
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="fines">Traffic Fines</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Agreement Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Agreement Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <p className="text-sm font-medium">Agreement Number</p>
                    <p className="text-sm">{agreement_number}</p>
                    
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm">{status || 'N/A'}</p>
                    
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-sm">{formatDate(start_date) || 'N/A'}</p>
                    
                    <p className="text-sm font-medium">End Date</p>
                    <p className="text-sm">{formatDate(end_date) || 'N/A'}</p>
                    
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm">{formatAgreementDuration(start_date, end_date) || 'N/A'}</p>
                    
                    <p className="text-sm font-medium">Rent Amount</p>
                    <p className="text-sm">{formatCurrency(rent_amount || 0)}</p>
                    
                    <p className="text-sm font-medium">Contract Total</p>
                    <p className="text-sm">{formatCurrency(contractAmount)}</p>
                    
                    <p className="text-sm font-medium">Deposit Amount</p>
                    <p className="text-sm">{formatCurrency(deposit_amount || 0)}</p>
                  </div>
                  
                  {notes && (
                    <div className="pt-2">
                      <p className="text-sm font-medium">Notes</p>
                      <p className="text-sm mt-1 p-2 bg-gray-50 rounded-md">{notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Customer Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customer ? (
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm">{customer.full_name || 'N/A'}</p>
                      
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm">{customer.email || 'N/A'}</p>
                      
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm">{customer.phone_number || 'N/A'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No customer information available.</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Vehicle Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vehicle ? (
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-sm font-medium">Make & Model</p>
                      <p className="text-sm">{`${vehicle.make} ${vehicle.model}` || 'N/A'}</p>
                      
                      <p className="text-sm font-medium">Year</p>
                      <p className="text-sm">{vehicle.year || 'N/A'}</p>
                      
                      <p className="text-sm font-medium">License Plate</p>
                      <p className="text-sm">{vehicle.license_plate || 'N/A'}</p>
                      
                      <p className="text-sm font-medium">Color</p>
                      <p className="text-sm">{vehicle.color || 'N/A'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No vehicle information available.</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Vehicle Transfer History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vehicle Transfer History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReassignmentHistoryItem
                    agreementId={id}
                    isOriginalVehicle={true}
                    vehicleName={`${vehicle?.make || ''} ${vehicle?.model || ''}`}
                    licensePlate={vehicle?.license_plate || ''}
                    date={start_date}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="payments">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Payment History</h2>
                <Button onClick={() => setIsPaymentDialogOpen(true)}>
                  Record Payment
                </Button>
              </div>
              
              <PaymentHistory
                payments={payments}
                isLoading={isLoadingPayments}
                rentAmount={rentAmount}
                contractAmount={contractAmount}
                onPaymentDeleted={handleDeletePayment}
                leaseStartDate={start_date}
                leaseEndDate={end_date}
                onRecordPayment={handleRecordPayment}
                leaseId={id}
              />
              
              <PaymentEntryDialog 
                open={isPaymentDialogOpen} 
                onOpenChange={setIsPaymentDialogOpen}
                onSubmit={handleRecordPayment}
                leaseId={id}
                agreementNumber={agreement_number}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="fines">
            <AgreementTrafficFines agreementId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default AgreementDetailPage;
