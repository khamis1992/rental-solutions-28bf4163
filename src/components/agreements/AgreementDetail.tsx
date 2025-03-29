
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInMonths, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { formatCurrency } from '@/lib/utils';

interface AgreementDetailProps {
  agreement: Agreement;
  onDelete: (id: string) => void;
  contractAmount: number | null;
  rentAmount: number | null;
  onPaymentDeleted: () => void;
}

export function AgreementDetail({ 
  agreement, 
  onDelete, 
  contractAmount, 
  rentAmount, 
  onPaymentDeleted 
}: AgreementDetailProps) {
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
            <CardDescription>Details about the customer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Name</p>
                <p>{agreement.customers?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Contact</p>
                <p>{agreement.customers?.phone_number || 'N/A'}</p>
                <p>{agreement.customers?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Driver License</p>
                <p>{agreement.customers?.driver_license || 'N/A'}</p>
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
                <p>{agreement.vehicles?.year} {agreement.vehicles?.make} {agreement.vehicles?.model}</p>
              </div>
              <div>
                <p className="font-medium">License Plate</p>
                <p>{agreement.vehicles?.license_plate || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">VIN</p>
                <p>{agreement.vehicles?.vin || 'N/A'}</p>
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
                    {format(new Date(agreement.start_date), "PPP")} to{" "}
                    {format(new Date(agreement.end_date), "PPP")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {durationMonths} {durationMonths === 1 ? 'month' : 'months'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Monthly Rent</p>
                  <p>{rentAmount ? formatCurrency(rentAmount) : 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Total Contract Amount</p>
                  <p>{contractAmount ? formatCurrency(contractAmount) : 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium">Agreement Status</p>
                  <p className="capitalize">{agreement.status}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
