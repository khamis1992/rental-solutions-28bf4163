
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInMonths } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentList } from '@/components/payments/PaymentList';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { AgreementTrafficFines } from './AgreementTrafficFines';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Download, Edit, Printer, FilePlus } from 'lucide-react';

interface AgreementDetailProps {
  agreement: Agreement | null;
  onDelete: (id: string) => void;
  rentAmount: number | null;
  contractAmount: number | null;
  onPaymentDeleted: () => void;
  onDataRefresh: () => void;
}

export function AgreementDetail({ 
  agreement, 
  onDelete, 
  rentAmount,
  contractAmount,
  onPaymentDeleted,
  onDataRefresh
}: AgreementDetailProps) {
  const { price: dynamicPrice } = useDynamicPricing(agreement?.vehicle_id || '');
  const navigate = useNavigate();
  
  const handleDelete = useCallback((id: string) => {
    onDelete(id);
  }, [onDelete]);

  const { plans, calculateLateFee, calculateDynamicDeposit } = usePaymentPlans(agreement?.id || '');
  
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleLateFeeCalculation = async () => {
    if (!agreement) return;
    const daysLate = differenceInDays(new Date(), new Date(agreement.end_date));
    const lateFee = await calculateLateFee(daysLate, agreement.rent_amount);
    
    try {
      const { data, error } = await supabase
        .from('agreements')
        .update({ 
          late_fee_amount: lateFee,
          last_late_fee_calculation: new Date().toISOString()
        })
        .eq('id', agreement.id);
        
      if (error) throw error;
      toast.success('Late fee calculated and updated successfully');
      
    } catch (error) {
      console.error('Error updating late fee:', error);
      toast.error('Failed to update late fee');
    }
  };

  const handleDepositCalculation = async () => {
    if (!agreement?.vehicle_id) return;
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('value')
      .eq('id', agreement.vehicle_id)
      .single();
    
    const deposit = await calculateDynamicDeposit(vehicle?.value || 0, customerScore);
    // Update agreement with calculated deposit
  };

  const calculateDuration = useCallback((startDate: Date, endDate: Date) => {
    const months = differenceInMonths(endDate, startDate);
    return months;
  }, []);

  if (!agreement) {
    return (
      <Alert>
        <AlertDescription>Agreement details not available.</AlertDescription>
      </Alert>
    );
  }

  const duration = calculateDuration(
    new Date(agreement.start_date),
    new Date(agreement.end_date)
  );

  const formattedStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500 text-white ml-2">ACTIVE</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white ml-2">PENDING</Badge>;
      case 'closed':
        return <Badge className="bg-blue-500 text-white ml-2">CLOSED</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white ml-2">CANCELLED</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white ml-2">{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Agreement {agreement.agreement_number}
          {formattedStatus(agreement.status)}
        </h2>
        <p className="text-muted-foreground">
          Created on {format(new Date(agreement.created_at || new Date()), 'MMMM d, yyyy')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Details about the customer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Name</p>
                <p>{agreement.customers?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Email</p>
                <p>{agreement.customers?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Phone</p>
                <p>{agreement.customers?.phone_number || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>Details about the rented vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Vehicle</p>
                <p>{agreement.vehicles?.make} {agreement.vehicles?.model} ({agreement.vehicles?.year})</p>
              </div>
              <div>
                <p className="font-medium">License Plate</p>
                <p>{agreement.vehicles?.license_plate}</p>
              </div>
              <div>
                <p className="font-medium">Color</p>
                <p>{agreement.vehicles?.color || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agreement Details</CardTitle>
          <CardDescription>Rental terms and payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="font-medium">Rental Period</p>
                <p className="flex items-center">
                  {format(new Date(agreement.start_date), "MMMM d, yyyy")} to {format(new Date(agreement.end_date), "MMMM d, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">Duration: {duration} months</p>
              </div>
              
              <div>
                <p className="font-medium">Additional Drivers</p>
                <p>{agreement.additional_drivers?.length ? agreement.additional_drivers.join(', ') : 'None'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="font-medium">Monthly Rent Amount</p>
                <p className="font-semibold">QAR {rentAmount?.toLocaleString() || '0'}</p>
              </div>
              
              <div>
                <p className="font-medium">Total Contract Amount</p>
                <p className="font-semibold">QAR {contractAmount?.toLocaleString() || agreement.total_amount?.toLocaleString() || '0'}</p>
                <p className="text-xs text-muted-foreground">Monthly rent × {duration} months</p>
              </div>
              
              <div>
                <p className="font-medium">Deposit Amount</p>
                <p>QAR {agreement.deposit_amount?.toLocaleString() || '0'}</p>
              </div>
              
              <div>
                <p className="font-medium">Terms Accepted</p>
                <p>{agreement.terms_accepted ? 'Yes' : 'No'}</p>
              </div>
              
              <div>
                <p className="font-medium">Signature</p>
                <p>{agreement.signature_url ? 'Signed' : 'Not signed'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Button variant="outline" onClick={() => navigate(`/agreements/${agreement.id}/edit`)} className="print:hidden">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button variant="outline" onClick={handlePrint} className="print:hidden">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button variant="outline" className="print:hidden">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="default" className="print:hidden bg-blue-500 hover:bg-blue-600">
          <FilePlus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
        <div className="flex-grow"></div>
        <Button 
          variant="destructive"
          onClick={() => handleDelete(agreement.id)}
          className="print:hidden ml-auto"
        >
          Delete
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>View and manage payment records</CardDescription>
          </div>
          {rentAmount && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md flex items-center">
              <span className="text-sm font-medium">Missing 1 payment</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <PaymentList 
            agreementId={agreement.id} 
            onPaymentDeleted={onPaymentDeleted}
          />
        </CardContent>
      </Card>

      {/* Traffic Fines Section */}
      {agreement.start_date && agreement.end_date && (
        <Card>
          <CardHeader>
            <CardTitle>Traffic Fines</CardTitle>
            <CardDescription>Violations during the rental period</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-6 text-muted-foreground">
              No traffic fines recorded for this rental period.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
