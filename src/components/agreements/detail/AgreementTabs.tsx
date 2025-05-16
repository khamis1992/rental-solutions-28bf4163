
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BarChart, FileText, User, Gavel } from 'lucide-react';
import { PaymentHistory } from '@/components/agreements/PaymentHistory';
import { AgreementTrafficFines } from '@/components/agreements/AgreementTrafficFines';
import { AgreementTrafficFineAnalytics } from '@/components/agreements/legal/AgreementTrafficFineAnalytics';
import { LegalCaseCard } from '@/components/agreements/LegalCaseCard';
import { CustomerSection } from '@/components/agreements/CustomerSection';
import { VehicleSection } from '@/components/agreements/VehicleSection';
import { useNavigate } from 'react-router-dom';
import { Payment } from '@/types/payment-types.unified';

interface AgreementTabsProps {
  agreement: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  payments: any[];
  isLoadingPayments: boolean;
  rentAmount: number | null;
  contractAmount: number | null;
  onPaymentDeleted: (paymentId: string) => void;
  fetchPayments: () => void;
  updatePayment: (params: { id: string; data: any }) => Promise<any>;
  addPayment: (payment: any) => Promise<any>;
  isUpdatingHistoricalPayments: boolean;
}

export function AgreementTabs({
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
  isUpdatingHistoricalPayments
}: AgreementTabsProps) {
  const navigate = useNavigate();

  return (
    <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid grid-cols-4">
        <TabsTrigger value="overview" className="flex gap-2">
          <FileText className="h-4 w-4" /> Overview
        </TabsTrigger>
        <TabsTrigger value="payments" className="flex gap-2">
          <BarChart className="h-4 w-4" /> Payments
          {isUpdatingHistoricalPayments && <span className="ml-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse"></span>}
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
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Track payments and financial transactions for this agreement</CardDescription>
          </CardHeader>
          <CardContent>
            {Array.isArray(payments) && 
              <PaymentHistory 
                payments={payments}
                isLoading={isLoadingPayments} 
                rentAmount={rentAmount} 
                contractAmount={agreement?.total_amount || null}
                onPaymentDeleted={onPaymentDeleted}
                leaseStartDate={agreement.start_date}
                leaseEndDate={agreement.end_date}
                onRecordPayment={(payment) => {
                  if (payment && agreement.id) {
                    const fullPayment = {
                      ...payment,
                      lease_id: agreement.id,
                      status: 'completed'
                    };
                    addPayment(fullPayment);
                    fetchPayments();
                  }
                }}
                onPaymentUpdated={async (payment) => {
                  if (!payment.id) return false;
                  try {
                    await updatePayment({
                      id: payment.id,
                      data: payment
                    });
                    fetchPayments();
                    toast.success('Payment updated successfully');
                    return true;
                  } catch (error) {
                    console.error('Error updating payment:', error);
                    toast.error('Failed to update payment');
                    return false;
                  }
                }}
                leaseId={agreement.id}
              />
            }
          </CardContent>
        </Card>
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
          <AgreementTrafficFineAnalytics 
            agreementId={agreement.id} 
            startDate={new Date(agreement.start_date)} 
            endDate={new Date(agreement.end_date)} 
          />
        )}
        
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
}

// Add missing imports
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
