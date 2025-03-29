
import React from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartPieIcon, CreditCard, FileText, BarChartBig, FileSpreadsheet } from "lucide-react";
import FinancialDashboard from "@/components/financials/FinancialDashboard";
import PaymentGatewaySettings from "@/components/payments/PaymentGatewaySettings";
import InvoiceTemplateEditor from "@/components/invoices/InvoiceTemplateEditor";
import CarInstallmentContracts from "@/components/financials/car-installments/CarInstallmentContracts";

const Financials = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Financial Management"
        description="Manage payments, invoices, financial reporting and installment contracts"
        icon={ChartPieIcon}
      />
      
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid grid-cols-1 md:grid-cols-5 w-full">
          <TabsTrigger value="dashboard" className="flex items-center">
            <BarChartBig className="h-4 w-4 mr-2" />
            Financial Dashboard
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Invoice Templates
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment Gateway
          </TabsTrigger>
          <TabsTrigger value="installments" className="flex items-center">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Installment Contracts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <FinancialDashboard />
        </TabsContent>
        
        <TabsContent value="invoices" className="space-y-6">
          <InvoiceTemplateEditor />
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-6">
          <PaymentGatewaySettings />
        </TabsContent>
        
        <TabsContent value="installments" className="space-y-6">
          <CarInstallmentContracts />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Financials;
