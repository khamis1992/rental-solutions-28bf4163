
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Gavel, FileText, Scale } from 'lucide-react';
import CustomerLegalObligations from '@/components/legal/CustomerLegalObligations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Legal = () => {
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
      
      <Tabs defaultValue="obligations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="obligations">
            <FileText className="h-4 w-4 mr-2" />
            Obligations
          </TabsTrigger>
          <TabsTrigger value="compliance" disabled>
            <Scale className="h-4 w-4 mr-2" />
            Compliance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="obligations" className="space-y-4">
          <CustomerLegalObligations />
        </TabsContent>
        
        <TabsContent value="compliance">
          {/* Placeholder for future compliance tracking functionality */}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Legal;
