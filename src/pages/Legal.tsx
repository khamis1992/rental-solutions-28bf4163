
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Gavel, 
  ClipboardList, 
  AlertTriangle, 
  BarChart4, 
  FileText, 
  Calendar, 
  Shield, 
  Users, 
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import LegalDashboard from '@/components/legal/LegalDashboard';
import CustomerLegalObligations from '@/components/legal/CustomerLegalObligations';
import { useLegalCases } from '@/hooks/legal/useLegalCases';

const Legal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { legalCases, isLoading } = useLegalCases();
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    console.log(`Tab changed to: ${value}`);
  };
  
  const handleExportReport = () => {
    toast.success("Legal compliance report is being generated");
  };

  const handleNewCase = () => {
    navigate('/legal/cases/new');
  };
  
  // Calculate statistics
  const activeCases = !isLoading ? legalCases.filter(c => c.status === 'active').length : 0;
  const pendingCases = !isLoading ? legalCases.filter(c => c.status === 'pending').length : 0;
  const resolvedCases = !isLoading ? legalCases.filter(c => c.status === 'resolved').length : 0;
  const highPriorityCases = !isLoading ? legalCases.filter(c => c.priority === 'high').length : 0;
  
  return (
    <PageContainer 
      title="Legal Management" 
      description="Manage legal documents, compliance requirements, and legal cases" 
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportReport} className="flex items-center space-x-2">
            <ClipboardList className="h-4 w-4" />
            <span>Export Report</span>
          </Button>
          <Button onClick={handleNewCase} className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>New Case</span>
          </Button>
        </div>
      }
    >
      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Cases</p>
                <h3 className="text-2xl font-bold text-primary">{activeCases}</h3>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <Gavel className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-2">
              <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate('/legal/cases')}>
                View all active cases →
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <h3 className="text-2xl font-bold text-destructive">{highPriorityCases}</h3>
              </div>
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <div className="mt-2">
              <Button variant="link" className="p-0 h-auto text-xs text-destructive" onClick={() => navigate('/legal/cases?priority=high')}>
                View high priority cases →
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <h3 className="text-2xl font-bold text-amber-500">{pendingCases}</h3>
              </div>
              <div className="p-2 rounded-full bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="mt-2">
              <Button variant="link" className="p-0 h-auto text-xs text-amber-500" onClick={() => navigate('/legal/cases?status=pending')}>
                View pending cases →
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved Cases</p>
                <h3 className="text-2xl font-bold text-green-500">{resolvedCases}</h3>
              </div>
              <div className="p-2 rounded-full bg-green-500/10">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="mt-2">
              <Button variant="link" className="p-0 h-auto text-xs text-green-500" onClick={() => navigate('/legal/cases?status=resolved')}>
                View resolved cases →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Access Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="col-span-1 md:col-span-2 shadow hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <CardDescription>Common legal management tasks</CardDescription>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <Button variant="outline" className="justify-start h-auto py-3" onClick={handleNewCase}>
              <div className="flex items-center">
                <div className="p-1.5 rounded-full bg-primary/10 mr-3">
                  <Gavel className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">New Case</p>
                  <p className="text-xs text-muted-foreground">Create a new legal case</p>
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto py-3" onClick={() => navigate('/legal/documents')}>
              <div className="flex items-center">
                <div className="p-1.5 rounded-full bg-blue-500/10 mr-3">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Documents</p>
                  <p className="text-xs text-muted-foreground">Manage legal documents</p>
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto py-3" onClick={() => navigate('/legal/calendar')}>
              <div className="flex items-center">
                <div className="p-1.5 rounded-full bg-violet-500/10 mr-3">
                  <Calendar className="h-4 w-4 text-violet-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Calendar</p>
                  <p className="text-xs text-muted-foreground">Court dates & deadlines</p>
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto py-3" onClick={() => navigate('/legal/compliance')}>
              <div className="flex items-center">
                <div className="p-1.5 rounded-full bg-emerald-500/10 mr-3">
                  <Shield className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Compliance</p>
                  <p className="text-xs text-muted-foreground">Check compliance status</p>
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto py-3" onClick={() => navigate('/legal/reports')}>
              <div className="flex items-center">
                <div className="p-1.5 rounded-full bg-amber-500/10 mr-3">
                  <BarChart4 className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Reports</p>
                  <p className="text-xs text-muted-foreground">Generate legal reports</p>
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto py-3" onClick={() => setActiveTab('obligations')}>
              <div className="flex items-center">
                <div className="p-1.5 rounded-full bg-rose-500/10 mr-3">
                  <Users className="h-4 w-4 text-rose-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Obligations</p>
                  <p className="text-xs text-muted-foreground">Customer obligations</p>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
            <CardDescription>Recent legal alerts</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3 max-h-[180px] overflow-auto pr-1">
              <div className="flex items-start gap-3 p-2 bg-amber-50 rounded-md">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Contract breach alert</p>
                  <p className="text-xs text-muted-foreground">Customer #1254 missed payment deadline</p>
                  <p className="text-xs text-amber-500 mt-1">12 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-2 bg-blue-50 rounded-md">
                <Calendar className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Court date reminder</p>
                  <p className="text-xs text-muted-foreground">Case #LC-283 scheduled for hearing</p>
                  <p className="text-xs text-blue-500 mt-1">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-2 bg-emerald-50 rounded-md">
                <Shield className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Compliance update</p>
                  <p className="text-xs text-muted-foreground">All regulatory documents now up-to-date</p>
                  <p className="text-xs text-emerald-500 mt-1">Yesterday</p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate('/notifications?category=legal')}>
                View all notifications →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs 
        defaultValue="dashboard" 
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="bg-background grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center">
            <BarChart4 className="h-4 w-4 mr-2" />
            Legal Dashboard
          </TabsTrigger>
          <TabsTrigger value="obligations" className="flex items-center">
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
    </PageContainer>
  );
};

export default Legal;
