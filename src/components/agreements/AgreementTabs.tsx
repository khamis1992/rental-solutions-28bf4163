
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BarChart, User, Gavel } from 'lucide-react';
import CustomerSection from './CustomerSection';
import VehicleSection from './VehicleSection';
import { PaymentHistory } from './PaymentHistory';
import { AgreementTrafficFines } from './AgreementTrafficFines';
import LegalCaseCard from './LegalCaseCard';
import { Agreement } from '@/lib/validation-schemas/agreement';

interface AgreementTabsProps {
  agreement: Agreement;
  activeTab: string;
  onTabChange: (value: string) => void;
  payments: any[];
  isLoadingPayments: boolean;
  rentAmount: number | null;
  onPaymentDeleted: () => void;
  fetchPayments: () => void;
}

const AgreementTabs = ({
  agreement,
  activeTab,
  onTabChange,
  payments,
  isLoadingPayments,
  rentAmount,
  onPaymentDeleted,
  fetchPayments
}: AgreementTabsProps) => {
  return (
    <Tabs defaultValue="overview" value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <TabsList className="grid grid-cols-4">
        <TabsTrigger value="overview" className="flex gap-2">
          <FileText className="h-4 w-4" /> Overview
        </TabsTrigger>
        <TabsTrigger value="payments" className="flex gap-2">
          <BarChart className="h-4 w-4" /> Payments
        </TabsTrigger>
        <TabsTrigger value="details" className="flex gap-2">
          <User className="h-4 w-4" /> Customer & Vehicle
        </TabsTrigger>
        <TabsTrigger value="legal" className="flex gap-2">
          <Gavel className="h-4 w-4" /> Legal & Compliance
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Agreement Summary</CardTitle>
            <CardDescription>Key details about the rental agreement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Customer</h3>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p>{agreement.customers?.full_name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground mt-2 mb-1">Contact</p>
                  <p>{agreement.customers?.phone_number || 'N/A'}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Rental Period</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {agreement.start_date && format(new Date(agreement.start_date), "MMMM d, yyyy")} to {agreement.end_date && format(new Date(agreement.end_date), "MMMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Vehicle</h3>
                  <p className="text-sm text-muted-foreground mb-1">Details</p>
                  <p>{agreement.vehicles?.make} {agreement.vehicles?.model} ({agreement.vehicles?.year || 'N/A'})</p>
                  <p className="text-sm text-muted-foreground mt-2 mb-1">License Plate</p>
                  <p>{agreement.vehicles?.license_plate || 'N/A'}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Additional Information</h3>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="whitespace-pre-line">{agreement.notes || 'No notes'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="payments" className="space-y-6">
        {Array.isArray(payments) && <PaymentHistory 
          payments={payments}
          isLoading={isLoadingPayments} 
          rentAmount={rentAmount} 
          onPaymentDeleted={() => {
            onPaymentDeleted();
            fetchPayments();
          }} 
          leaseStartDate={agreement.start_date} 
          leaseEndDate={agreement.end_date} 
        />}
      </TabsContent>
      
      <TabsContent value="details" className="space-y-6">
        {agreement?.customers && (
          <CustomerSection 
            customer={agreement.customers} 
            onEdit={() => navigate(`/customers/${agreement.customer_id}/edit`)}
          />
        )}
        
        {agreement?.vehicles && (
          <VehicleSection 
            vehicle={agreement.vehicles}
            onViewDetails={() => navigate(`/vehicles/${agreement.vehicle_id}`)}
          />
        )}
      </TabsContent>
      
      <TabsContent value="legal" className="space-y-6">
        {agreement.start_date && agreement.end_date && (
          <Card>
            <CardHeader>
              <CardTitle>Traffic Fines</CardTitle>
              <CardDescription>Violations during the rental period</CardDescription>
            </CardHeader>
            <CardContent>
              <AgreementTrafficFines 
                agreementId={agreement.id} 
                startDate={new Date(agreement.start_date)} 
                endDate={new Date(agreement.end_date)} 
              />
            </CardContent>
          </Card>
        )}
        
        {agreement.id && <LegalCaseCard agreementId={agreement.id} />}
      </TabsContent>
    </Tabs>
  );
};

export default AgreementTabs;
