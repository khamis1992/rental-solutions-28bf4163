import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, FileDown, Printer, Send, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { 
  InvoiceTemplate, 
  fetchTemplates,
  processTemplate
} from '@/utils/invoiceTemplateUtils';
import TemplatePreview from './TemplatePreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InvoiceGeneratorProps {
  recordType: 'agreement' | 'payment' | 'customer';
  recordId?: string;
  onClose?: () => void;
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ 
  recordType, 
  recordId,
  onClose
}) => {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [recordData, setRecordData] = useState<Record<string, any>>({});
  
  useEffect(() => {
    loadTemplates();
    loadRecordData();
  }, [recordType, recordId]);
  
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const loadedTemplates = await fetchTemplates();
      
      const filteredTemplates = loadedTemplates.filter(template => {
        if (recordType === 'agreement') {
          return ['invoice', 'agreement'].includes(template.category);
        } else if (recordType === 'payment') {
          return ['receipt', 'invoice', 'reminder'].includes(template.category);
        } else {
          return ['statement'].includes(template.category);
        }
      });
      
      setTemplates(filteredTemplates);
      
      if (filteredTemplates.length > 0) {
        let defaultCategory = recordType === 'agreement' ? 'invoice' : 
                              recordType === 'payment' ? 'receipt' : 'statement';
        
        const defaultTemplate = filteredTemplates.find(t => t.category === defaultCategory && t.isDefault) || 
                                filteredTemplates.find(t => t.category === defaultCategory) ||
                                filteredTemplates[0];
                                
        setSelectedTemplateId(defaultTemplate.id);
      }
    } catch (error: any) {
      toast.error(`Failed to load templates: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const loadRecordData = async () => {
    if (!recordId) {
      setRecordData({
        companyName: "ALARAF CAR RENTAL",
        companyAddress: "Doha, Qatar",
        companyPhone: "+974 1234 5678",
        companyEmail: "info@alarafcarrental.com",
        
        agreementNumber: "AGR-12345",
        startDate: "2023-01-01",
        endDate: "2023-02-01",
        
        clientName: "Mohammed Ali",
        clientAddress: "West Bay, Doha, Qatar",
        customerEmail: "mali@example.com",
        customerPhone: "+974 5555 6666",
        
        vehicleMake: "Toyota",
        vehicleModel: "Land Cruiser",
        vehiclePlate: "12345-QAT",
        vehicleYear: "2022",
        
        invoiceNumber: "INV-2023-001",
        invoiceDate: new Date().toLocaleDateString(),
        dueDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
        amountDue: "3,500.00",
        paidAmount: "1,750.00",
        balanceAmount: "1,750.00",
        tax: "175.00",
        currency: "QAR",
        
        itemDescription: "Vehicle Rental Service",
        itemQuantity: "30 days",
        itemUnitPrice: "QAR 116.67/day",
        itemTotal: "QAR 3,500.00",
        
        paymentTerms: "Net 30 days"
      });
      return;
    }
    
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setRecordData({
        companyName: "ALARAF CAR RENTAL",
        companyAddress: "Doha, Qatar",
        companyPhone: "+974 1234 5678",
        companyEmail: "info@alarafcarrental.com",
        
        agreementNumber: `AGR-${recordId}`,
        startDate: "2023-01-01",
        endDate: "2023-02-01",
        
        clientName: "Mohammed Ali",
        clientAddress: "West Bay, Doha, Qatar",
        customerEmail: "mali@example.com",
        customerPhone: "+974 5555 6666",
        
        vehicleMake: "Toyota",
        vehicleModel: "Land Cruiser",
        vehiclePlate: "12345-QAT",
        vehicleYear: "2022",
        
        invoiceNumber: `INV-${recordId}`,
        invoiceDate: new Date().toLocaleDateString(),
        dueDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
        amountDue: "3,500.00",
        paidAmount: "1,750.00",
        balanceAmount: "1,750.00",
        tax: "175.00",
        currency: "QAR",
        
        itemDescription: "Vehicle Rental Service",
        itemQuantity: "30 days",
        itemUnitPrice: "QAR 116.67/day",
        itemTotal: "QAR 3,500.00",
        
        paymentTerms: "Net 30 days"
      });
    } catch (error: any) {
      toast.error(`Failed to load record data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const generateInvoice = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template");
      return;
    }
    
    try {
      setLoading(true);
      
      const template = templates.find(t => t.id === selectedTemplateId);
      if (!template) {
        throw new Error("Template not found");
      }
      
      const processedHtml = processTemplate(template.content, recordData);
      setGeneratedHtml(processedHtml);
      
      setPreviewOpen(true);
    } catch (error: any) {
      toast.error(`Failed to generate invoice: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const downloadInvoice = () => {
    if (!generatedHtml) {
      toast.error("No invoice generated yet");
      return;
    }
    
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${recordData.invoiceNumber || recordData.agreementNumber || Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Invoice downloaded");
  };
  
  const printInvoice = () => {
    if (!generatedHtml) {
      toast.error("No invoice generated yet");
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Could not open print window. Please check your popup settings.");
      return;
    }
    
    printWindow.document.write(generatedHtml);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
    };
  };
  
  const sendInvoice = () => {
    if (!generatedHtml) {
      toast.error("No invoice generated yet");
      return;
    }
    
    toast.success(`Invoice sent to ${recordData.customerEmail || 'customer'}`);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generate Invoice</CardTitle>
        <CardDescription>
          Create and send invoices for {recordType}s
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="template-select">Select Template</Label>
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This invoice will be generated using data from the {recordType} record.
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        
        <Button onClick={generateInvoice} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" /> Preview Invoice
            </>
          )}
        </Button>
      </CardFooter>
      
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="preview">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview">
              <div className="bg-gray-50 p-2 rounded-md">
                <TemplatePreview html={generatedHtml} />
              </div>
            </TabsContent>
            
            <TabsContent value="data">
              <div className="max-h-[500px] overflow-y-auto bg-gray-50 p-4 rounded-md">
                <pre className="text-xs">{JSON.stringify(recordData, null, 2)}</pre>
              </div>
            </TabsContent>
            
            <TabsContent value="html">
              <div className="max-h-[500px] overflow-y-auto bg-gray-50 p-4 rounded-md">
                <pre className="text-xs whitespace-pre-wrap break-all">{generatedHtml}</pre>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={downloadInvoice}>
              <FileDown className="mr-2 h-4 w-4" /> Download
            </Button>
            <Button variant="outline" onClick={printInvoice}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button onClick={sendInvoice}>
              <Send className="mr-2 h-4 w-4" /> Send Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default InvoiceGenerator;
