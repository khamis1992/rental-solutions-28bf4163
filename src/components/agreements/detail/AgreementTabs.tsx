
// Import necessary components and utilities
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { PaymentHistory } from '@/components/agreements/PaymentHistory';
import { VehicleSection } from '@/components/agreements/VehicleSection';
import { AgreementTrafficFines } from '@/components/agreements/AgreementTrafficFines';
import { Badge } from '@/components/ui/badge';
import { Payment } from '@/types/payment-history.types';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { Lease } from '@/types/agreement-types';
import CustomerSection from '@/components/agreements/CustomerSection';

interface AgreementTabsProps {
  agreement: Lease;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  payments: any[];
  isLoadingPayments: boolean;
  rentAmount: number;
  contractAmount: number;
  onPaymentDeleted: (paymentId: string) => void;
  fetchPayments: () => void;
  updatePayment: (payment: Payment) => Promise<boolean>;
  addPayment: (payment: Partial<Payment>) => Promise<boolean>;
  isUpdatingHistoricalPayments?: boolean;
}

export const AgreementTabs = ({
  agreement,
  activeTab,
  setActiveTab,
  payments,
  isLoadingPayments,
  rentAmount,
  contractAmount,
  onPaymentDeleted,
  fetchPayments,
  updatePayment,
  addPayment,
  isUpdatingHistoricalPayments = false
}: AgreementTabsProps) => {
  // Function to handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Get lease start and end dates for validation
  const leaseStartDate = agreement.start_date ? new Date(agreement.start_date) : null;
  const leaseEndDate = agreement.end_date ? new Date(agreement.end_date) : null;
  
  return (
    <div className="mt-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">
            Payments
            {agreement.status === AgreementStatus.OVERDUE && (
              <Badge variant="destructive" className="ml-2">Overdue</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
          <TabsTrigger value="fines">Traffic Fines</TabsTrigger>
        </TabsList>
        
        {/* Overview tab content */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomerSection customerId={agreement.customer_id} />
            <VehicleSection vehicleId={agreement.vehicle_id} leaseId={agreement.id} />
          </div>
        </TabsContent>
        
        {/* Payments tab content */}
        <TabsContent value="payments">
          <Card>
            <PaymentHistory
              payments={payments}
              isLoading={isLoadingPayments}
              rentAmount={rentAmount}
              contractAmount={contractAmount}
              leaseId={agreement.id}
              onPaymentDeleted={onPaymentDeleted}
              onRecordPayment={addPayment}
              onEditPayment={updatePayment}
              onPaymentAdded={fetchPayments}
              leaseStartDate={leaseStartDate}
              leaseEndDate={leaseEndDate}
            />
          </Card>
        </TabsContent>
        
        {/* Vehicle tab content */}
        <TabsContent value="vehicle">
          <VehicleSection vehicleId={agreement.vehicle_id} leaseId={agreement.id} />
        </TabsContent>
        
        {/* Traffic Fines tab content */}
        <TabsContent value="fines">
          <AgreementTrafficFines agreementId={agreement.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
