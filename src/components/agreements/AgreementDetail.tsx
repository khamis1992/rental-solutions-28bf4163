
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentList } from '@/components/payments/PaymentList';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { AgreementTrafficFines } from './AgreementTrafficFines';

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
  const navigate = useNavigate();
  
  const handleDelete = useCallback((id: string) => {
    onDelete(id);
  }, [onDelete]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (!agreement) {
    return (
      <Alert>
        <AlertDescription>Agreement details not available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agreement {agreement.agreement_number}</h2>
          <p className="text-muted-foreground">
            Created on {format(new Date(agreement.created_at), 'PPP')}
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <Button variant="outline" onClick={handlePrint} className="print:hidden">
            Print
          </Button>
          <Button 
            variant="default" 
            onClick={() => navigate(`/agreements/${agreement.id}/edit`)}
            className="print:hidden"
          >
            Edit
          </Button>
          <Button 
            variant="destructive"
            onClick={() => handleDelete(agreement.id)}
            className="print:hidden"
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Customer contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Name</p>
                <p>{agreement.customers?.full_name}</p>
              </div>
              <div>
                <p className="font-medium">Phone</p>
                <p>{agreement.customers?.phone_number}</p>
              </div>
              <div>
                <p className="font-medium">Driver License</p>
                <p>{agreement.customers?.driver_license}</p>
              </div>
              {agreement.customers?.email && (
                <div>
                  <p className="font-medium">Email</p>
                  <p>{agreement.customers.email}</p>
                </div>
              )}
              {agreement.customers?.nationality && (
                <div>
                  <p className="font-medium">Nationality</p>
                  <p>{agreement.customers.nationality}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>Vehicle details and specifications</CardDescription>
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
                <p className="font-medium">VIN</p>
                <p>{agreement.vehicles?.vin}</p>
              </div>
              {agreement.vehicles?.color && (
                <div>
                  <p className="font-medium">Color</p>
                  <p>{agreement.vehicles.color}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rental Terms</CardTitle>
          <CardDescription>Rental terms and payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="font-medium">Rental Period</p>
                <p>
                  {format(new Date(agreement.start_date), "PPP")} to {format(new Date(agreement.end_date), "PPP")}
                </p>
              </div>
              <div>
                <p className="font-medium">Status</p>
                <p className="capitalize">{agreement.status}</p>
              </div>
              {agreement.deposit_amount > 0 && (
                <div>
                  <p className="font-medium">Security Deposit</p>
                  <p>QAR {agreement.deposit_amount}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Monthly Rent</p>
                <p>{rentAmount ? `QAR ${rentAmount}` : 'Not set'}</p>
              </div>
              <div>
                <p className="font-medium">Total Contract Amount</p>
                <p>QAR {contractAmount || agreement.total_amount}</p>
              </div>
              {agreement.notes && (
                <div>
                  <p className="font-medium">Notes</p>
                  <p className="whitespace-pre-wrap">{agreement.notes}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Payment history and transactions</CardDescription>
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
        <AgreementTrafficFines
          agreementId={agreement.id}
          startDate={new Date(agreement.start_date)}
          endDate={new Date(agreement.end_date)}
        />
      )}
    </div>
  );
}
