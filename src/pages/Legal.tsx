
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Gavel, FileText, Download } from 'lucide-react';
import CustomerLegalObligations from '@/components/legal/CustomerLegalObligations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LANGUAGES } from '@/utils/reportConstants';

const Legal = () => {
  const handleTabChange = (value: string) => {
    // This ensures we don't refresh the page when changing tabs
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
          <CustomerLegalObligations />
        </TabsContent>
        
        <TabsContent value="reportSettings" className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Report Language Settings</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Legal reports can be generated in multiple languages. The default language is {LANGUAGES.ENGLISH}.
            </p>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="english" 
                  name="reportLanguage" 
                  value={LANGUAGES.ENGLISH} 
                  defaultChecked 
                />
                <label htmlFor="english">English</label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="arabic" 
                  name="reportLanguage" 
                  value={LANGUAGES.ARABIC} 
                />
                <label htmlFor="arabic">Arabic (العربية)</label>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Legal;
