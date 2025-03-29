import React from 'react';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrashIcon, PrinterIcon } from 'lucide-react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { useNavigate } from 'react-router-dom';
import { PaymentHistory } from "./PaymentHistory";
import { AgreementTrafficFines } from "./AgreementTrafficFines";

interface AgreementDetailProps {
  agreement: Agreement;
  onDelete: (id: string) => void;
  contractAmount: number | null;
  rentAmount: number | null;
  onPaymentDeleted: () => void;
}

export const AgreementDetail: React.FC<AgreementDetailProps> = ({
  agreement,
  onDelete,
  contractAmount,
  rentAmount,
  onPaymentDeleted,
}) => {
  const navigate = useNavigate();

  if (!agreement) {
    return (
      <Alert>
        <AlertDescription>Agreement details not available.</AlertDescription>
      </Alert>
    );
  }

  const durationMonths = Math.ceil(
    (new Date(agreement.end_date).getTime() - new Date(agreement.start_date).getTime()) / 
    (1000 * 60 * 60 * 24 * 30)
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agreement {agreement.agreement_number}</h2>
          <p className="text-muted-foreground">
            Created on {format(new Date(agreement.created_at), "PPP")}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handlePrint}>
            <PrinterIcon className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="destructive" onClick={() => onDelete(agreement.id)}>
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Customer and contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Name</p>
                <p>{agreement.customers?.full_name}</p>
              </div>
              <div>
                <p className="font-medium">Contact</p>
                <p>{agreement.customers?.phone_number}</p>
                <p>{agreement.customers?.email || 'No email provided'}</p>
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
                <p className="font-medium">Color</p>
                <p>{agreement.vehicles?.color}</p>
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

        <Card className="md:col-span-2">
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
                  <p className="text-sm text-muted-foreground">
                    Duration: {durationMonths} {durationMonths === 1 ? 'month' : 'months'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Payment Status</p>
                  <p className="capitalize">{agreement.payment_status}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Monthly Rent</p>
                  <p>{rentAmount ? `QAR ${rentAmount.toFixed(2)}` : 'Not set'}</p>
                </div>
                <div>
                  <p className="font-medium">Total Contract Amount</p>
                  <p>{contractAmount ? `QAR ${contractAmount.toFixed(2)}` : 'Not calculated'}</p>
                </div>
                <div>
                  <p className="font-medium">Deposit Amount</p>
                  <p>QAR {agreement.deposit_amount || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
          <PaymentHistory 
            payments={[]} 
            isLoading={false} 
            rentAmount={rentAmount}
            onPaymentDeleted={onPaymentDeleted}
            leaseStartDate={agreement.start_date}
            leaseEndDate={agreement.end_date}
          />
        </div>

        <div className="md:col-span-2">
          <AgreementTrafficFines 
            agreementId={agreement.id}
            startDate={agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date)}
            endDate={agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date)}
          />
        </div>
    </div>
  );
};