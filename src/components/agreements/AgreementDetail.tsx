
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentList } from '@/components/payments/PaymentList';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { FilePenLine, Printer, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

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
            Created on {agreement.created_at ? formatDate(agreement.created_at) : 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button 
            variant="default" 
            onClick={() => navigate(`/agreements/${agreement.id}/edit`)}
          >
            <FilePenLine className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="destructive"
            onClick={() => handleDelete(agreement.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
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
                <p>{agreement.customers?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Phone</p>
                <p>{agreement.customers?.phone_number || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Driver License</p>
                <p>{agreement.customers?.driver_license || 'N/A'}</p>
              </div>
              {agreement.customers?.nationality && (
                <div>
                  <p className="font-medium">Nationality</p>
                  <p>{agreement.customers.nationality}</p>
                </div>
              )}
              {agreement.customers?.address && (
                <div>
                  <p className="font-medium">Address</p>
                  <p>{agreement.customers.address}</p>
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
                <p>{agreement.vehicles?.license_plate || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">VIN</p>
                <p>{agreement.vehicles?.vin || 'N/A'}</p>
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
                  {formatDate(agreement.start_date)} to {formatDate(agreement.end_date)}
                </p>
              </div>
              <div>
                <p className="font-medium">Status</p>
                <p className="capitalize">{agreement.status}</p>
              </div>
              {agreement.daily_late_fee !== undefined && agreement.daily_late_fee > 0 && (
                <div>
                  <p className="font-medium">Daily Late Fee</p>
                  <p>QAR {agreement.daily_late_fee}</p>
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
                <p>QAR {agreement.total_amount}</p>
              </div>
              {agreement.deposit_amount && agreement.deposit_amount > 0 && (
                <div>
                  <p className="font-medium">Deposit Amount</p>
                  <p>QAR {agreement.deposit_amount}</p>
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

      {agreement.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Additional information about this agreement</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{agreement.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
