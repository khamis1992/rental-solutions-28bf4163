import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Gavel, FileText, Scale, RefreshCcw, Cpu } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LegalDashboard from '@/components/legal/LegalDashboard';
import CustomerLegalObligations from '@/components/legal/CustomerLegalObligations';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { runAgreementStatusCheck } from '@/utils/agreement-status-checker';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const Legal = () => {
  const navigate = useNavigate();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  
  const handleTabChange = (value: string) => {
    console.log(`Tab changed to: ${value}`);
  };
  
  const handleExportReport = () => {
    toast.success("Legal compliance report is being generated");
  };
  
  const handleCheckAgreementStatus = async () => {
    setIsCheckingStatus(true);
    try {
      await runAgreementStatusCheck();
    } finally {
      setIsCheckingStatus(false);
    }
  };
  
  return <PageContainer 
    title="Legal Management" 
    description="Manage legal documents and compliance requirements" 
    actions={
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          onClick={handleCheckAgreementStatus} 
          disabled={isCheckingStatus}
          className="flex items-center space-x-2"
        >
          <Cpu className="h-4 w-4" />
          <span>{isCheckingStatus ? "Checking..." : "AI Status Check"}</span>
        </Button>
        <Button variant="outline" onClick={handleExportReport} className="flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span>Export Report</span>
        </Button>
        <Button onClick={() => navigate('/legal/cases/new')} className="flex items-center space-x-2">
          <Scale className="h-4 w-4" />
          <span>New Case</span>
        </Button>
      </div>
    }
  >
    <SectionHeader 
      title="Legal Management" 
      description="Track and manage legal aspects of your fleet operations" 
      icon={Gavel} 
    />
    
    <div className="mb-4 flex items-center">
      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
        <Cpu className="h-3 w-3" />
        AI-powered status management enabled
      </Badge>
      <Button 
        variant="ghost" 
        size="sm" 
        className="ml-2 h-6 text-xs" 
        onClick={() => setIsMaintenanceDialogOpen(true)}
      >
        <RefreshCcw className="h-3 w-3 mr-1" />
        Run maintenance
      </Button>
    </div>
    
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
    
    <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agreement Status Maintenance</DialogTitle>
          <DialogDescription>
            Run comprehensive AI-powered maintenance checks on all agreements to ensure proper status assignment.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            This operation will:
          </p>
          <ul className="list-disc pl-5 mt-2 text-sm space-y-1 text-muted-foreground">
            <li>Check for conflicting vehicle assignments</li>
            <li>Identify expired agreements that need status update</li>
            <li>Analyze payment history to detect potential issues</li>
            <li>Generate AI-powered status recommendations</li>
            <li>Automatically fix high-confidence issues</li>
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setIsMaintenanceDialogOpen(false);
              handleCheckAgreementStatus();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Run Maintenance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </PageContainer>;
};

export default Legal;
