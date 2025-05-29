import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgreements } from '@/hooks/use-agreements';
import { usePaymentService } from '@/hooks/services/usePaymentService';
import { useMaintenance } from '@/hooks/use-maintenance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/utils';
import { MaintenanceRecord } from '@/types/maintenance.types';

const CustomerPortal: React.FC = () => {
  const { user } = useAuth();
  const { agreements, isLoading } = useAgreements({ customer_id: user?.id });
  const [selectedAgreement, setSelectedAgreement] = useState<any | null>(null);

  const paymentService = usePaymentService(selectedAgreement?.id);
  const maintenance = useMaintenance();

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const [requestDescription, setRequestDescription] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const submitPayment = async () => {
    if (!selectedAgreement) return;
    setPaymentSubmitting(true);
    try {
      await paymentService.recordPayment({
        lease_id: selectedAgreement.id,
        amount: Number(paymentAmount),
        payment_date: new Date().toISOString(),
        payment_method: paymentMethod,
        status: 'completed'
      });
      setPaymentAmount('');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const submitServiceRequest = async () => {
    if (!selectedAgreement) return;
    setRequestSubmitting(true);
    try {
      const maintenanceData: MaintenanceRecord = {
        vehicle_id: selectedAgreement.vehicle_id,
        service_type: 'Service Request',
        maintenance_type: 'SERVICE_REQUEST',
        status: 'scheduled',
        description: requestDescription,
        scheduled_date: new Date().toISOString(),
        agreement_id: selectedAgreement.id
      };
      await maintenance.createMaintenanceRecord(maintenanceData);
      setRequestDescription('');
    } finally {
      setRequestSubmitting(false);
    }
  };

  if (!user) {
    return <div className="p-4">Please sign in to view your portal.</div>;
  }

  return (
    <div className="p-4 space-y-4">
      {selectedAgreement ? (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setSelectedAgreement(null)}>
            Back
          </Button>
          <h2 className="text-xl font-bold">
            Agreement {selectedAgreement.agreement_number || selectedAgreement.id}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatDate(selectedAgreement.start_date)} -{' '}
            {formatDate(selectedAgreement.end_date)}
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentService.isLoading ? (
                <p>Loading payments...</p>
              ) : paymentService.payments.length ? (
                <ul className="space-y-1 text-sm">
                  {paymentService.payments.map(p => (
                    <li key={p.id} className="flex justify-between">
                      <span>{formatDate(p.payment_date)}</span>
                      <span>{formatCurrency(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No payments recorded.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Make a Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                type="number"
                placeholder="Amount"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
              />
              <Input
                placeholder="Payment method"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              />
              <Button
                onClick={submitPayment}
                disabled={paymentSubmitting || !paymentAmount}
              >
                Pay
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                placeholder="Describe the issue..."
                value={requestDescription}
                onChange={e => setRequestDescription(e.target.value)}
              />
              <Button
                onClick={submitServiceRequest}
                disabled={requestSubmitting || !requestDescription}
              >
                Submit Request
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-2">
          <h1 className="text-xl font-bold mb-2">Your Agreements</h1>
          {isLoading ? (
            <p>Loading...</p>
          ) : agreements.length ? (
            agreements.map(a => (
              <Card
                key={a.id}
                onClick={() => setSelectedAgreement(a)}
                className="p-4 cursor-pointer"
              >
                <div className="font-medium">
                  {a.agreement_number || a.id}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(a.start_date)} - {formatDate(a.end_date)}
                </div>
              </Card>
            ))
          ) : (
            <p>No agreements found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerPortal;
