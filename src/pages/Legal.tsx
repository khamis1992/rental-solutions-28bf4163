
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Gavel, Scale, ClipboardList, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LegalDashboard from '@/components/legal/LegalDashboard';
import CustomerLegalObligations from '@/components/legal/CustomerLegalObligations';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Legal = () => {
  const navigate = useNavigate();
  
  const handleTabChange = (value: string) => {
    // This ensures we don't refresh the page when changing tabs
    console.log(`Tab changed to: ${value}`);
  };
  
  const handleExportReport = () => {
    toast.success("Legal compliance report is being generated");
  };

  const handleNewCase = () => {
    // Make sure this path matches exactly with the router path
    navigate('/legal/cases/new');
    console.log("Navigating to new case page");
  };
  
  return <PageContainer 
    title="Legal Management" 
    description="Manage legal documents, compliance requirements, and legal cases" 
    actions={<div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportReport} className="flex items-center space-x-2">
            <ClipboardList className="h-4 w-4" />
            <span>Export Report</span>
          </Button>
          <Button onClick={handleNewCase} className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>New Case</span>
          </Button>
        </div>}
  >
      <SectionHeader title="Legal Management" description="Track and manage all legal aspects of your fleet operations" icon={Gavel} />
      
      <Tabs defaultValue="dashboard" className="space-y-4" onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-1 md:grid-cols-2 w-full">
          <TabsTrigger value="dashboard">
            <Scale className="h-4 w-4 mr-2" />
            Legal Dashboard
          </TabsTrigger>
          
          <TabsTrigger value="obligations">
            <Gavel className="h-4 w-4 mr-2" />
            Customer Obligations
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <LegalDashboard />
        </TabsContent>
        
        <TabsContent value="obligations" className="space-y-4">
          <CustomerLegalObligations />
        </TabsContent>
      </Tabs>
    </PageContainer>;
};

export default Legal;
