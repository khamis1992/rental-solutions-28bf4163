
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentList } from '@/components/payments/PaymentList';
import { Agreement } from '@/lib/validation-schemas/agreement';

interface AgreementDetailProps {
  agreement: Agreement | null;
  onDelete: (id: string) => void;
  rentAmount: number | null;
  onPaymentDeleted: () => void;
}

export function AgreementDetail({ 
  agreement, 
  onDelete, 
  rentAmount,
  onPaymentDeleted
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agreement {agreement.agreement_number}</h2>
          <p className="text-muted-foreground">
            Created on {format(new Date(agreement.created_at), 'PPP')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handlePrint}>
            Print
          </Button>
          <Button 
            variant="default" 
            onClick={() => navigate(`/agreements/${agreement.id}/edit`)}
          >
            Edit
          </Button>
          <Button 
            variant="destructive"
            onClick={() => handleDelete(agreement.id)}
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
            </div>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Monthly Rent</p>
                <p>{rentAmount ? `QAR ${rentAmount}` : 'Not set'}</p>
              </div>
              <div>
                <p className="font-medium">Total Contract Amount</p>
                <p>QAR {agreement.total_amount}</p>
              </div>
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
    </div>
  );
}
