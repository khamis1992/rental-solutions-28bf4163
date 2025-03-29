import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Agreement } from '@/types/agreement';
import { cn } from '@/lib/utils';
import { TrashIcon, PrinterIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentHistory } from "./PaymentHistory";
import { AgreementTrafficFines } from "./AgreementTrafficFines";


interface AgreementDetailProps {
  agreement: Agreement;
  durationMonths: number;
  onDelete: (id: string) => void;
  contractAmount: number | null;
  rentAmount: number | null;
  onPaymentDeleted: () => void;
}

export function AgreementDetail({ agreement, durationMonths, onDelete, contractAmount, rentAmount, onPaymentDeleted }: AgreementDetailProps) {
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agreement {agreement.agreement_number}</h2>
          <p className="text-muted-foreground">View and manage agreement details</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={`/agreements/edit/${agreement.id}`}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Edit Agreement
          </Link>
          <button onClick={handlePrint} className={cn(buttonVariants({ variant: 'outline' }))}>
            <PrinterIcon className="mr-2 h-4 w-4" /> Print
          </button>
          <button onClick={() => onDelete(agreement.id)} className={cn(buttonVariants({ variant: 'destructive' }))}>
            <TrashIcon className="mr-2 h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Customer details and contact information</CardDescription>
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
              <div>
                <p className="font-medium">Email</p>
                <p>{agreement.customers?.email || 'N/A'}</p>
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
              <div>
                <p className="font-medium">Color</p>
                <p>{agreement.vehicles?.color || 'N/A'}</p>
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
                  {format(new Date(agreement.start_date), "PPP")} to{" "}
                  {format(new Date(agreement.end_date), "PPP")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Duration: {durationMonths} {durationMonths === 1 ? 'month' : 'months'}
                </p>
              </div>
              <div>
                <p className="font-medium">Monthly Rent</p>
                <p>QAR {rentAmount ? rentAmount.toFixed(2) : 'Not set'}</p>
              </div>
              <div>
                <p className="font-medium">Total Contract Value</p>
                <p>QAR {contractAmount ? contractAmount.toFixed(2) : 'Not calculated'}</p>
              </div>
              <div>
                <p className="font-medium">Deposit Amount</p>
                <p>QAR {agreement.deposit_amount || 0}</p>
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
}