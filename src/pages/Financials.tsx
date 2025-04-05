
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartPieIcon, FileText, BarChartBig, FileSpreadsheet, Printer } from "lucide-react";
import FinancialDashboard from "@/components/financials/FinancialDashboard";
import PaymentGatewaySettings from "@/components/payments/PaymentGatewaySettings";
import InvoiceTemplateEditor from "@/components/invoices/InvoiceTemplateEditor";
import CarInstallmentContracts from "@/components/financials/car-installments/CarInstallmentContracts";
import InvoiceGenerator from "@/components/invoices/InvoiceGenerator";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";

const Financials = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'agreement' | 'payment' | 'customer'>('agreement');
  
  const handleOpenInvoiceGenerator = (type: 'agreement' | 'payment' | 'customer') => {
    setInvoiceType(type);
    setInvoiceDialog(true);
  };
  
  return (
    <PageContainer>
      <SectionHeader 
        title="Financial Management" 
        description="Manage payments, invoices, financial reporting and installment contracts" 
        icon={ChartPieIcon}
        actions={
          activeTab === "invoices" && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleOpenInvoiceGenerator('agreement')}
              className="h-9"
            >
              <Printer className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
          )
        }
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-1 md:grid-cols-4 w-full">
          <TabsTrigger value="dashboard" className="flex items-center">
            <BarChartBig className="h-4 w-4 mr-2" />
            Financial Dashboard
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Invoice Templates
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center">
            <ChartPieIcon className="h-4 w-4 mr-2" />
            Payment Settings
          </TabsTrigger>
          <TabsTrigger value="installments" className="flex items-center">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Installment Contracts
          </TabsTrigger>
        </TabsList>
        
        {/* Use conditional rendering instead of forceMount with boolean expressions */}
        <TabsContent value="dashboard" className="space-y-6">
          {activeTab === "dashboard" && <FinancialDashboard />}
        </TabsContent>
        
        <TabsContent value="invoices" className="space-y-6">
          {activeTab === "invoices" && <InvoiceTemplateEditor />}
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-6">
          {activeTab === "payments" && <PaymentGatewaySettings />}
        </TabsContent>
        
        <TabsContent value="installments" className="space-y-6">
          {activeTab === "installments" && <CarInstallmentContracts />}
        </TabsContent>
      </Tabs>
      
      <Dialog open={invoiceDialog} onOpenChange={setInvoiceDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Create and customize an invoice from a template
            </DialogDescription>
          </DialogHeader>
          
          <InvoiceGenerator 
            recordType={invoiceType}
            recordId="12345"
            onClose={() => setInvoiceDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default Financials;
