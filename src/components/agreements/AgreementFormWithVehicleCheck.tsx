
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PaymentWarningSection } from './vehicle-assignment/PaymentWarningSection';
import { formatDate } from '@/lib/date-utils';

interface AgreementFormWithVehicleCheckProps {
  onSubmit: (data: any) => Promise<void> | void;
  isSubmitting: boolean;
  standardTemplateExists?: boolean;
  isCheckingTemplate?: boolean;
}

// A selection of the most important options for agreements
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'in_negotiation', label: 'In Negotiation' },
  { value: 'expired', label: 'Expired' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'breached', label: 'Breached' },
  { value: 'renewed', label: 'Renewed' },
];

const paymentFrequencyOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'one_time', label: 'One Time' },
];

const agreementTypeOptions = [
  { value: 'lease', label: 'Lease' },
  { value: 'rental', label: 'Rental' },
  { value: 'service', label: 'Service' },
  { value: 'sales', label: 'Sales' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other' },
];

// Define the actual component with a minimal implementation
const AgreementFormWithVehicleCheck: React.FC<AgreementFormWithVehicleCheckProps> = ({ 
  onSubmit, 
  isSubmitting, 
  standardTemplateExists = false, 
  isCheckingTemplate = false 
}) => {
  const [formData, setFormData] = React.useState({
    agreement_type: 'lease',
    status: 'pending',
    payment_frequency: 'monthly',
  });
  
  const [acknowledgedPayments, setAcknowledgedPayments] = React.useState(false);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = React.useState(false);
  
  const mockPendingPayments = [
    {
      id: '1',
      amount: 500,
      status: 'pending',
      due_date: new Date().toISOString(),
    }
  ];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(formData);
  };

  if (isCheckingTemplate) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p>Checking template availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Agreement Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Agreement type and status would go here */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Agreement Type
                  </label>
                  <select 
                    className="w-full border rounded px-3 py-2" 
                    value={formData.agreement_type}
                    onChange={(e) => setFormData({...formData, agreement_type: e.target.value})}
                  >
                    {agreementTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <select 
                    className="w-full border rounded px-3 py-2"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Payment Frequency
                </label>
                <select 
                  className="w-full border rounded px-3 py-2"
                  value={formData.payment_frequency}
                  onChange={(e) => setFormData({...formData, payment_frequency: e.target.value})}
                >
                  {paymentFrequencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setIsPaymentHistoryOpen(!isPaymentHistoryOpen)}
                className="mb-4"
              >
                {isPaymentHistoryOpen ? 'Hide' : 'Show'} Payment Schedule
              </Button>
              
              <PaymentWarningSection
                pendingPayments={mockPendingPayments}
                acknowledgedPayments={acknowledgedPayments}
                onAcknowledgePayments={setAcknowledgedPayments}
                isPaymentHistoryOpen={isPaymentHistoryOpen}
                formatDate={(date) => formatDate(new Date(date))}
              />
            </div>
          </CardContent>
        </Card>

        {!standardTemplateExists && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Agreement template not found. Some features may be limited.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="mr-2" size="sm" /> : null}
            {isSubmitting ? 'Saving...' : 'Save Agreement'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AgreementFormWithVehicleCheck;
