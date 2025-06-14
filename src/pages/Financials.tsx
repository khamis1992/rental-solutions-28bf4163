import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from '@/components/ui/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, FileText, BarChartBig, FileSpreadsheet, Printer } from "lucide-react";
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
  const { language } = useLanguage();
  
  const handleOpenInvoiceGenerator = (type: 'agreement' | 'payment' | 'customer') => {
    setInvoiceType(type);
    setInvoiceDialog(true);
  };
  
  return (
    <PageContainer>
      <PageHeader
        title={language === 'ar' ? "الإدارة المالية" : "Financial Management"}
        subtitle={language === 'ar' ? "إدارة المدفوعات والفواتير والتقارير المالية وعقود التقسيط" : "Manage payments, invoices, financial reporting and installment contracts"}
        icon={<PieChart className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {activeTab === "invoices" && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleOpenInvoiceGenerator('agreement')}
            className={`h-9 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
          >
            <Printer className={language === 'ar' ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
            {language === 'ar' ? "إنشاء فاتورة" : "Generate Invoice"}
          </Button>
        )}
      </PageHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList className="grid grid-cols-1 md:grid-cols-4 w-full">
          <TabsTrigger value="dashboard" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <BarChartBig className={language === 'ar' ? "h-4 w-4 ml-2" : "h-4 w-4 mr-2"} />
            {language === 'ar' ? "لوحة التحكم المالية" : "Financial Dashboard"}
          </TabsTrigger>
          <TabsTrigger value="invoices" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <FileText className={language === 'ar' ? "h-4 w-4 ml-2" : "h-4 w-4 mr-2"} />
            {language === 'ar' ? "قوالب الفواتير" : "Invoice Templates"}
          </TabsTrigger>
          <TabsTrigger value="payments" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <PieChart className={language === 'ar' ? "h-4 w-4 ml-2" : "h-4 w-4 mr-2"} />
            {language === 'ar' ? "إعدادات الدفع" : "Payment Settings"}
          </TabsTrigger>
          <TabsTrigger value="installments" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <FileSpreadsheet className={language === 'ar' ? "h-4 w-4 ml-2" : "h-4 w-4 mr-2"} />
            {language === 'ar' ? "عقود التقسيط" : "Installment Contracts"}
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
        <DialogContent className="max-w-3xl" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader className={language === 'ar' ? 'text-right' : 'text-left'}>
            <DialogTitle>{language === 'ar' ? "إنشاء فاتورة" : "Generate Invoice"}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? "إنشاء وتخصيص فاتورة من قالب" : "Create and customize an invoice from a template"}
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
