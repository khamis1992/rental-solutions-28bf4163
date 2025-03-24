
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Languages } from 'lucide-react';
import { generateLegalCustomerReport } from '@/utils/legalReportUtils';
import { useToast } from '@/hooks/use-toast';
import { CustomerObligation } from './CustomerLegalObligations';

const TrafficReportTab: React.FC = () => {
  const { toast } = useToast();
  const [language, setLanguage] = useState<'english' | 'arabic'>('english');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      // Example data - in real app this would come from actual data
      const customerId = "example-id";
      const customerName = "John Smith";
      const sampleObligations: CustomerObligation[] = [
        {
          id: "ob1",
          customerId: "example-id",
          customerName: "John Smith",
          description: "Unpaid rental fee",
          dueDate: new Date(),
          amount: 1500,
          status: "Overdue",
          obligationType: "payment",
          daysOverdue: 30,
          urgency: "high",
          agreementId: "agr-123"
        }
      ];

      const doc = await generateLegalCustomerReport(
        customerId, 
        customerName, 
        sampleObligations,
        language
      );
      
      // Save the PDF
      doc.save(`legal-report-${customerName}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Report Generated",
        description: "Legal report was successfully generated",
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Report Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Traffic Violation Reports</CardTitle>
        <CardDescription>
          Create official reports for traffic violations and legal obligations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Language</label>
            <Select value={language} onValueChange={(value: 'english' | 'arabic') => setLanguage(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="arabic">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={handleGenerateReport} 
          disabled={isGenerating}
          className="w-full md:w-auto"
        >
          {isGenerating ? (
            <>Generating...</>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Sample Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TrafficReportTab;
