import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { 
  Calendar, 
  Car, 
  User, 
  FileText, 
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaymentHistory } from './PaymentHistory';
import TrafficFinesByLicense from '../fines/TrafficFinesByLicense';
import { usePayment } from '@/hooks/use-payment';
import { usePaymentGeneration } from '@/hooks/payments/use-payment-generation';
import { PaymentEntryDialog } from '@/components/payments/PaymentEntryDialog';

const AgreementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [agreement, setAgreement] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { 
    payments, 
    isLoading: paymentsLoading,
    handlePaymentSubmit: hookHandlePayment
  } = usePayment(id);
  
  const {
    refreshTrigger,
    refreshAgreementData,
    handleSpecialAgreementPayments,
    isProcessing
  } = usePaymentGeneration(agreement, id);

  useEffect(() => {
    if (id) {
      fetchAgreementDetails();
    }
  }, [id, refreshTrigger]);

  const fetchAgreementDetails = async () => {
    setLoading(true);
    try {
      // Fetch agreement details
      const { data: agreementData, error: agreementError } = await supabase
        .from('leases')
        .select('*')
        .eq('id', id)
        .single();

      if (agreementError) throw agreementError;
      setAgreement(agreementData);

      // Fetch customer details
      if (agreementData.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', agreementData.customer_id)
          .single();

        if (customerError) throw customerError;
        setCustomer(customerData);
      }

      // Fetch vehicle details
      if (agreementData.vehicle_id) {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', agreementData.vehicle_id)
          .single();

        if (vehicleError) throw vehicleError;
        setVehicle(vehicleData);
      }
    } catch (error) {
      console.error('Error fetching agreement details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load agreement details"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (
    amount: number, 
    paymentDate: Date, 
    notes?: string, 
    paymentMethod?: string, 
    referenceNumber?: string, 
    includeLatePaymentFee?: boolean, 
    isPartialPayment?: boolean
  ) => {
    if (!agreement?.id) return;
    
    try {
      // Record the payment in the database
      const { error } = await supabase.from('unified_payments').insert({
        lease_id: agreement.id,
        amount: amount,
        payment_date: paymentDate.toISOString(),
        status: 'completed',
        description: notes,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        // Add any other fields needed
      });

      if (error) throw error;

      toast({
        title: 'Payment recorded successfully',
        description: `Payment of ${amount} was recorded.`,
      });
      
      // Refresh payments data
      fetchPayments();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to record payment',
        description: 'There was an error recording the payment. Please try again.',
      });
    }
  };

  const fetchPayments = async () => {
    // This function will be called to refresh payment data
    refreshAgreementData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold">Agreement Not Found</h2>
        <p className="text-muted-foreground">The requested agreement could not be found.</p>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'expired':
        return 'destructive';
      case 'terminated':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agreement Details</h1>
          <p className="text-muted-foreground">
            {agreement.agreement_number || `Agreement #${id?.substring(0, 8)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(agreement.status)}>
            {agreement.status || 'Unknown'}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Agreement
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Generate Invoice
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash className="mr-2 h-4 w-4" />
                Delete Agreement
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="fines">Traffic Fines</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customer ? (
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium">{customer.full_name}</p>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      Customer since {customer.created_at ? format(new Date(customer.created_at), 'MMM d, yyyy') : 'N/A'}
                    </div>
                    <div className="flex items-center text-sm">
                      <AlertTriangle className="mr-2 h-4 w-4 text-muted-foreground" />
                      ID Verification: {customer.id_verified ? 'Verified' : 'Not Verified'}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No customer information available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Car className="mr-2 h-5 w-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vehicle ? (
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium">{vehicle.make} {vehicle.model} {vehicle.year}</p>
                      <p className="text-sm text-muted-foreground">License Plate: {vehicle.license_plate}</p>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                      Insurance Status: {vehicle.insurance_status || 'Unknown'}
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      Last Maintenance: {vehicle.last_maintenance_date ? format(new Date(vehicle.last_maintenance_date), 'MMM d, yyyy') : 'N/A'}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No vehicle information available</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Agreement Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Rental Information</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span>{agreement.start_date ? format(new Date(agreement.start_date), 'MMM d, yyyy') : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date:</span>
                      <span>{agreement.end_date ? format(new Date(agreement.end_date), 'MMM d, yyyy') : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rent Amount:</span>
                      <span>{agreement.rent_amount ? `QAR ${agreement.rent_amount.toFixed(2)}` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deposit Amount:</span>
                      <span>{agreement.deposit_amount ? `QAR ${agreement.deposit_amount.toFixed(2)}` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Additional Details</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Frequency:</span>
                      <span>{agreement.payment_frequency || 'Monthly'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Late Fee:</span>
                      <span>{agreement.daily_late_fee ? `QAR ${agreement.daily_late_fee.toFixed(2)}/day` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created On:</span>
                      <span>{agreement.created_at ? format(new Date(agreement.created_at), 'MMM d, yyyy') : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span>{agreement.updated_at ? format(new Date(agreement.updated_at), 'MMM d, yyyy') : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="font-medium mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">
                  {agreement.notes || 'No additional notes for this agreement.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Payment History</h2>
            <Button onClick={() => setPaymentDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </div>
          
          <PaymentHistory 
            payments={payments || []}
            isLoading={paymentsLoading}
            rentAmount={agreement?.rent_amount}
            contractAmount={agreement?.contract_amount}
            leaseId={id as string}
            leaseStartDate={agreement?.start_date}
            leaseEndDate={agreement?.end_date}
            onRecordPayment={(payment) => handleSpecialAgreementPayments(payment)}
            onPaymentDeleted={fetchPayments}
            onPaymentUpdated={async () => {
              fetchPayments();
              return true;
            }}
          />
        </TabsContent>

        <TabsContent value="fines" className="space-y-4">
          <h2 className="text-xl font-semibold">Traffic Fines</h2>
          {vehicle && <TrafficFinesByLicense licensePlate={vehicle.license_plate} />}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <h2 className="text-xl font-semibold">Documents</h2>
          <p className="text-muted-foreground">No documents available for this agreement.</p>
        </TabsContent>
      </Tabs>

      <PaymentEntryDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        rentAmount={agreement?.rent_amount}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  );
};

export default AgreementDetail;
