
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gavel } from 'lucide-react';
import LegalDocuments from '@/components/legal/LegalDocuments';
import ComplianceTracking from '@/components/legal/ComplianceTracking';
import CustomerLegalObligations from '@/components/legal/CustomerLegalObligations';

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
      
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3 mb-8">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="cases">Legal Cases</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents" className="mt-0">
          <LegalDocuments />
        </TabsContent>
        
        <TabsContent value="compliance" className="mt-0">
          <ComplianceTracking />
        </TabsContent>
        
        <TabsContent value="cases" className="mt-0">
          <CustomerLegalObligations />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Legal;
