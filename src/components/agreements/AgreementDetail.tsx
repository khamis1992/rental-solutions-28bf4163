import React from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { differenceInMonths } from 'date-fns';
import { AgreementTrafficFines } from './AgreementTrafficFines';
import { PaymentHistory } from "./PaymentHistory";


interface AgreementDetailProps {
  agreement: Agreement;
  onDelete: (id: string) => void;
  contractAmount: number | null;
  rentAmount: number | null;
  onPaymentDeleted: () => void;
}

export function AgreementDetail({ agreement, onDelete, contractAmount, rentAmount, onPaymentDeleted }: AgreementDetailProps) {
  const navigate = useNavigate();

  if (!agreement) {
    return (
      <Alert>
        <AlertDescription>Agreement details not available.</AlertDescription>
      </Alert>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const durationMonths = differenceInMonths(
    new Date(agreement.end_date),
    new Date(agreement.start_date)
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agreement {agreement.agreement_number}</h2>
          <p className="text-muted-foreground">
            Status: <span className="capitalize">{agreement.status}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handlePrint}>Print</Button>
          <Button variant="outline" onClick={() => navigate(`/agreements/${agreement.id}/edit`)}>
            Edit
          </Button>
          <Button variant="destructive" onClick={() => onDelete(agreement.id)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Customer details and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Name</p>
                <p>{agreement.customers?.full_name}</p>
              </div>
              <div>
                <p className="font-medium">Phone</p>
                <p>{agreement.customers?.phone_number || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">License</p>
                <p>{agreement.customers?.driver_license || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
            <CardDescription>Vehicle information and specifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Make & Model</p>
                <p>{agreement.vehicles?.make} {agreement.vehicles?.model}</p>
              </div>
              <div>
                <p className="font-medium">License Plate</p>
                <p>{agreement.vehicles?.license_plate}</p>
              </div>
              <div>
                <p className="font-medium">Year</p>
                <p>{agreement.vehicles?.year}</p>
              </div>
              <div>
                <p className="font-medium">Color</p>
                <p>{agreement.vehicles?.color}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rental Terms</CardTitle>
            <CardDescription>Rental terms and payment information</CardDescription>
          </CardHeader>
          <CardContent>
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
                <p className="font-medium">Monthly Rent</p>
                <p>{rentAmount ? `QAR ${rentAmount.toLocaleString()}` : 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Total Contract Amount</p>
                <p>{contractAmount ? `QAR ${contractAmount.toLocaleString()}` : 'Calculating...'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <AgreementTrafficFines 
            agreementId={agreement.id}
            startDate={agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date)}
            endDate={agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date)}
          />
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
      </div>
    </div>
  );
}