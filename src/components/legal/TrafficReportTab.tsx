
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Languages, AlertCircle } from 'lucide-react';
import { generateLegalCustomerReport } from '@/utils/legalReportUtils';
import { useToast } from '@/hooks/use-toast';
import { CustomerObligation } from './CustomerLegalObligations';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TrafficReportTab: React.FC = () => {
  const { toast } = useToast();
  const [language, setLanguage] = useState<'english' | 'arabic'>('english');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setHasError(false);

    try {
      // Example data - in real app this would come from actual data
      const customerId = "example-id";
      const customerName = language === 'arabic' ? "محمد عبدالله" : "John Smith";
      
      // Sample obligations with Arabic text if Arabic language is selected
      const sampleObligations: CustomerObligation[] = [
        {
          id: "ob1",
          customerId: "example-id",
          customerName: language === 'arabic' ? "محمد عبدالله" : "John Smith",
          description: language === 'arabic' 
            ? "رسوم إيجار غير مدفوعة" 
            : "Unpaid rental fee",
          dueDate: new Date(),
          amount: 1500,
          status: language === 'arabic' ? "متأخر" : "Overdue",
          obligationType: "payment",
          daysOverdue: 30,
          urgency: "high",
          agreementId: "agr-123"
        },
        {
          id: "ob2",
          customerId: "example-id",
          customerName: language === 'arabic' ? "محمد عبدالله" : "John Smith",
          description: language === 'arabic' 
            ? "مخالفة مرورية - تجاوز السرعة المسموحة" 
            : "Traffic violation - Speeding",
          dueDate: new Date(),
          amount: 500,
          status: language === 'arabic' ? "معلق" : "Pending",
          obligationType: "traffic_fine",
          daysOverdue: 5,
          urgency: "medium",
          agreementId: "agr-123"
        }
      ];

      // Generate PDF document
      const doc = await generateLegalCustomerReport(
        customerId, 
        customerName, 
        sampleObligations,
        language
      );
      
      // Save the PDF with appropriate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = language === 'arabic' 
        ? `تقرير-قانوني-${customerName}-${timestamp}.pdf`
        : `legal-report-${customerName}-${timestamp}.pdf`;
        
      doc.save(filename);
      
      toast({
        title: language === 'arabic' ? "تم إنشاء التقرير" : "Report Generated",
        description: language === 'arabic' 
          ? "تم إنشاء التقرير القانوني بنجاح" 
          : "Legal report was successfully generated",
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      setHasError(true);
      
      toast({
        title: language === 'arabic' ? "فشل إنشاء التقرير" : "Report Generation Failed",
        description: error instanceof Error 
          ? error.message 
          : (language === 'arabic' ? "حدث خطأ غير معروف" : "Unknown error occurred"),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {language === 'arabic' ? "إنشاء تقارير المخالفات المرورية" : "Generate Traffic Violation Reports"}
        </CardTitle>
        <CardDescription>
          {language === 'arabic' 
            ? "إنشاء تقارير رسمية للمخالفات المرورية والالتزامات القانونية" 
            : "Create official reports for traffic violations and legal obligations"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {language === 'arabic' ? "حدث خطأ" : "Error"}
            </AlertTitle>
            <AlertDescription>
              {language === 'arabic' 
                ? "حدث خطأ أثناء إنشاء التقرير. يرجى المحاولة مرة أخرى." 
                : "There was an error generating the report. Please try again."}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === 'arabic' ? "لغة التقرير" : "Report Language"}
            </label>
            <Select 
              value={language} 
              onValueChange={(value: 'english' | 'arabic') => {
                setLanguage(value);
                setHasError(false);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={language === 'arabic' ? "اختر اللغة" : "Select language"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="arabic">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-col space-y-2">
          <Button 
            onClick={handleGenerateReport} 
            disabled={isGenerating}
            className="w-full md:w-auto"
          >
            {isGenerating ? (
              language === 'arabic' ? "جاري الإنشاء..." : "Generating..."
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {language === 'arabic' ? "إنشاء تقرير نموذجي" : "Generate Sample Report"}
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground">
            {language === 'arabic' 
              ? "سيتم إنشاء تقرير نموذجي مع بيانات توضيحية" 
              : "This will generate a sample report with demonstration data"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficReportTab;
