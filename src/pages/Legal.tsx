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
  Clock,
  Bookmark,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import LegalDashboard from '@/components/legal/LegalDashboard';
// Import the named export from the CustomerLegalObligations.tsx file
import { CustomerLegalObligations } from '@/components/legal/CustomerLegalObligations';
import { useLegalCaseQuery } from '@/hooks/use-legal-case-query';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

const Legal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { getLegalCases } = useLegalCaseQuery();
  const { data: legalCases, isLoading } = getLegalCases({});
  
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

  // Shortcuts for the sidebar
  const shortcuts = [
    { 
      icon: <Gavel className="h-4 w-4 mr-2" />,
      label: "New Legal Case", 
      action: handleNewCase 
    },
    { 
      icon: <AlertTriangle className="h-4 w-4 mr-2" />,
      label: "High Priority Cases", 
      action: () => navigate('/legal/cases?priority=high')
    },
    { 
      icon: <Clock className="h-4 w-4 mr-2" />,
      label: "Recent Activity", 
      action: () => navigate('/legal/activity')
    },
    { 
      icon: <Shield className="h-4 w-4 mr-2" />,
      label: "Compliance Calendar", 
      action: () => navigate('/legal/compliance')
    },
    { 
      icon: <Bookmark className="h-4 w-4 mr-2" />,
      label: "Saved Templates", 
      action: () => navigate('/legal/templates')
    }
  ];
  
  return (
    <PageContainer 
      title="Legal Management" 
      description="Manage legal documents, compliance requirements, and legal cases" 
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportReport} className="flex items-center space-x-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Export Report</span>
          </Button>
          <Button onClick={handleNewCase} className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">New Case</span>
          </Button>
        </div>
      }
    >
      {/* Breadcrumbs Navigation */}
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/legal">Legal</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar Navigation */}
        <div className="col-span-12 md:col-span-3 lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-0">
              <nav className="flex flex-col">
                <Button 
                  variant={activeTab === 'dashboard' ? "secondary" : "ghost"} 
                  className="justify-start px-4 py-2 h-auto rounded-none border-l-2 border-l-transparent data-[active=true]:border-l-primary"
                  onClick={() => handleTabChange('dashboard')}
                  data-active={activeTab === 'dashboard'}
                >
                  <BarChart4 className="h-4 w-4 mr-2" />
                  <span>Dashboard</span>
                </Button>
                <Button 
                  variant={activeTab === 'obligations' ? "secondary" : "ghost"} 
                  className="justify-start px-4 py-2 h-auto rounded-none border-l-2 border-l-transparent data-[active=true]:border-l-primary"
                  onClick={() => handleTabChange('obligations')}
                  data-active={activeTab === 'obligations'}
                >
                  <Users className="h-4 w-4 mr-2" />
                  <span>Obligations</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start px-4 py-2 h-auto rounded-none border-l-2 border-l-transparent"
                  onClick={() => navigate('/legal/cases')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>Cases</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start px-4 py-2 h-auto rounded-none border-l-2 border-l-transparent"
                  onClick={() => navigate('/legal/documents')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Documents</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start px-4 py-2 h-auto rounded-none border-l-2 border-l-transparent"
                  onClick={() => navigate('/legal/calendar')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Calendar</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start px-4 py-2 h-auto rounded-none border-l-2 border-l-transparent"
                  onClick={() => navigate('/legal/compliance')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Compliance</span>
                </Button>
              </nav>
            </CardContent>
          </Card>
          
          {/* Shortcuts Card */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-sm mb-3">Shortcuts</h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <Button 
                    key={index} 
                    variant="ghost" 
                    size="sm"
                    className="w-full justify-start"
                    onClick={shortcut.action}
                  >
                    {shortcut.icon}
                    <span>{shortcut.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      
        {/* Main Content Area */}
        <div className="col-span-12 md:col-span-9 lg:col-span-10">
          <Tabs 
            defaultValue="dashboard" 
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-4"
          >
            <TabsContent value="dashboard" className="mt-0 space-y-4">
              <SectionHeader 
                title="Legal Dashboard" 
                description="Overview of all legal matters and activities" 
                icon={BarChart4} 
              />
              <LegalDashboard />
            </TabsContent>
            
            <TabsContent value="obligations" className="mt-0 space-y-4">
              <SectionHeader 
                title="Customer Obligations" 
                description="Manage and track customer legal obligations" 
                icon={Users} 
              />
              <CustomerLegalObligations />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageContainer>
  );
};

export default Legal;
