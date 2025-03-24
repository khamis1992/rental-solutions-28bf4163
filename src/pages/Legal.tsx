
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Gavel, FileText, Download, Globe } from 'lucide-react';
import CustomerLegalObligations from '@/components/legal/CustomerLegalObligations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LANGUAGES } from '@/utils/reportConstants';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ReportLanguage } from '@/utils/legalReportUtils';

const Legal = () => {
  const [reportLanguage, setReportLanguage] = useState<ReportLanguage>(LANGUAGES.ENGLISH);
  const { toast } = useToast();

  const handleLanguageChange = (value: ReportLanguage) => {
    setReportLanguage(value);
    
    // Show toast notification when language is changed
    toast({
      title: "Report language updated",
      description: `Reports will now be generated in ${value === LANGUAGES.ARABIC ? 'Arabic' : 'English'}`,
      duration: 3000
    });
  };

  const handleTabChange = (value: string) => {
    console.log(`Tab changed to: ${value}`);
  };

  return (
    <PageContainer
      title="Legal Management"
      description="Manage legal documents, compliance requirements, and legal cases"
    >
      <SectionHeader
        title="Legal Management"
        description="Track and manage all legal aspects of your fleet operations"
        icon={Gavel}
      />
      
      <Tabs defaultValue="obligations" className="space-y-4" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="obligations">
            <FileText className="h-4 w-4 mr-2" />
            Obligations
          </TabsTrigger>
          <TabsTrigger value="reportSettings">
            <Download className="h-4 w-4 mr-2" />
            Report Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="obligations" className="space-y-4">
          <CustomerLegalObligations language={reportLanguage} />
        </TabsContent>
        
        <TabsContent value="reportSettings" className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center mb-4">
              <Globe className="h-5 w-5 mr-2 text-blue-500" />
              <h3 className="text-lg font-semibold">Report Language Settings</h3>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Legal reports can be generated in multiple languages. Select your preferred language below.
            </p>
            
            <RadioGroup 
              defaultValue={reportLanguage} 
              value={reportLanguage} 
              onValueChange={handleLanguageChange as (value: string) => void}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={LANGUAGES.ENGLISH} id="english" />
                <Label htmlFor="english" className="font-medium">English</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={LANGUAGES.ARABIC} id="arabic" />
                <Label htmlFor="arabic" className="font-medium">Arabic (العربية)</Label>
              </div>
            </RadioGroup>
            
            <Alert className="mt-6 bg-amber-50 text-amber-800 border border-amber-200">
              <AlertDescription>
                <div className="flex items-center">
                  <span className="text-sm">
                    Arabic reports require proper font support. If you encounter display issues, please contact IT support.
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-auto text-xs"
                    onClick={() => window.open('https://helpdesk.alarafcarrental.com', '_blank')}
                  >
                    Contact Support
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Legal;
