
import React, { useState, useEffect } from "react";
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
import { useTranslation } from "@/contexts/TranslationContext";
import { useTranslation as useI18nTranslation } from "react-i18next";
import { getDirectionalClasses } from "@/utils/rtl-utils";

const Financials = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'agreement' | 'payment' | 'customer'>('agreement');
  const { t } = useI18nTranslation();
  const { isRTL, translateText } = useTranslation();
  
  const handleOpenInvoiceGenerator = (type: 'agreement' | 'payment' | 'customer') => {
    setInvoiceType(type);
    setInvoiceDialog(true);
  };
  
  return (
    <PageContainer>
      <SectionHeader 
        title={t('financials.title', 'Financial Management')}
        description={t('financials.description', 'Manage payments, invoices, financial reporting and installment contracts')}
        icon={ChartPieIcon}
        actions={
          activeTab === "invoices" && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleOpenInvoiceGenerator('agreement')}
              className="h-9"
            >
              <Printer className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {t('agreements.generateDocument', 'Generate Invoice')}
            </Button>
          )
        }
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid grid-cols-1 md:grid-cols-4 w-full ${isRTL ? 'rtl-tabs' : ''}`}>
          <TabsTrigger value="dashboard" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <BarChartBig className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('financials.dashboard', 'Financial Dashboard')}
          </TabsTrigger>
          <TabsTrigger value="invoices" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('invoices.templates', 'Invoice Templates')}
          </TabsTrigger>
          <TabsTrigger value="payments" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <ChartPieIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('payments.settings', 'Payment Settings')}
          </TabsTrigger>
          <TabsTrigger value="installments" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <FileSpreadsheet className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('financials.installments', 'Installment Contracts')}
          </TabsTrigger>
        </TabsList>
        
        {/* Use conditional rendering for better performance */}
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
            <DialogTitle>{t('invoices.generate', 'Generate Invoice')}</DialogTitle>
            <DialogDescription>
              {t('invoices.createCustomize', 'Create and customize an invoice from a template')}
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
