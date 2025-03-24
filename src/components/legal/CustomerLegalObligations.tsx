
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Download, FileText } from 'lucide-react';
import { fetchLegalObligations } from './LegalObligationsService';
import { jsPDF } from 'jspdf';
import { generateLegalCustomerReport } from '@/utils/legalReportUtils';
import { ReportLanguage } from '@/utils/legalReportUtils';
import { useToast } from '@/hooks/use-toast';
import { LANGUAGES } from '@/utils/reportConstants';

export interface CustomerObligation {
  id: string;
  amount: number;
  description: string;
  dueDate: Date | string;
  status: 'pending' | 'resolved' | 'Overdue Payment' | 'Unpaid Fine' | 'Legal Case';
  obligationType?: 'traffic_fine' | 'payment' | 'legal_case' | 'other';
  daysOverdue?: number;
  customerId?: string;
  customerName?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  agreementId?: string;
  agreementNumber?: string;
  lateFine?: number;
}

// Define these for exports to LegalObligationsService
export type ObligationType = 'traffic_fine' | 'payment' | 'legal_case' | 'other';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

interface CustomerLegalObligationsProps {
  language?: ReportLanguage;
}

const CustomerLegalObligations: React.FC<CustomerLegalObligationsProps> = ({ 
  language = LANGUAGES.ENGLISH 
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [obligations, setObligations] = useState<CustomerObligation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock customer options
  const customerOptions = [
    { id: '1', name: 'Ahmed Al-Mansoor' },
    { id: '2', name: 'Sarah Johnson' },
    { id: '3', name: 'Mohammed Al-Thani' },
  ];

  const handleCustomerSelect = async (customerId: string) => {
    setSelectedCustomer(customerId);
    setIsLoading(true);
    
    try {
      const result = await fetchLegalObligations();
      if (result.error) {
        console.error('Error fetching obligations:', result.error);
        toast({
          title: "Error",
          description: "Failed to load legal obligations",
          variant: "destructive",
        });
        setObligations([]);
      } else {
        // Filter obligations for the selected customer
        const customerObligations = result.obligations.filter(
          obligation => obligation.customerId === customerId
        );
        setObligations(customerObligations);
      }
    } catch (error) {
      console.error('Error fetching obligations:', error);
      toast({
        title: "Error",
        description: "Failed to load legal obligations",
        variant: "destructive",
      });
      setObligations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Please select a customer first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const selectedCustomerObj = customerOptions.find(c => c.id === selectedCustomer);
      
      if (!selectedCustomerObj) {
        throw new Error("Selected customer not found");
      }
      
      setIsLoading(true);
      toast({
        title: "Generating report",
        description: `Creating ${language === LANGUAGES.ARABIC ? 'Arabic' : 'English'} legal report...`,
      });
      
      const pdf: jsPDF = await generateLegalCustomerReport(
        selectedCustomer, 
        selectedCustomerObj.name, 
        obligations,
        language
      );
      
      // Save the PDF file
      pdf.save(`legal_report_${selectedCustomer}_${new Date().getTime()}.pdf`);
      
      toast({
        title: "Success",
        description: "Legal report was generated successfully",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate the legal report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Legal Obligations
        </CardTitle>
        <CardDescription>
          View and manage legal obligations for customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Customer</label>
          <Select value={selectedCustomer} onValueChange={handleCustomerSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customerOptions.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCustomer && (
          <>
            {obligations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {obligations.map(obligation => (
                    <TableRow key={obligation.id}>
                      <TableCell className="capitalize">
                        {obligation.obligationType?.replace('_', ' ') || 'Other'}
                      </TableCell>
                      <TableCell>{obligation.description}</TableCell>
                      <TableCell>
                        {obligation.dueDate instanceof Date 
                          ? obligation.dueDate.toLocaleDateString() 
                          : (typeof obligation.dueDate === 'string' ? new Date(obligation.dueDate).toLocaleDateString() : 'N/A')}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'QAR' }).format(obligation.amount)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          obligation.status === 'pending' || 
                          obligation.status === 'Overdue Payment' || 
                          obligation.status === 'Unpaid Fine'
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {obligation.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center p-8 border rounded-md border-dashed">
                <div className="flex flex-col items-center text-center">
                  <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900">No obligations found</h3>
                  <p className="text-sm text-gray-500 max-w-md mt-1">
                    This customer has no pending legal obligations in our system.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedCustomer && obligations.length > 0 && 
            `Total: ${obligations.length} obligation${obligations.length !== 1 ? 's' : ''}`
          }
        </div>
        <Button 
          onClick={handleGenerateReport}
          disabled={!selectedCustomer || obligations.length === 0 || isLoading}
        >
          <Download className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CustomerLegalObligations;
