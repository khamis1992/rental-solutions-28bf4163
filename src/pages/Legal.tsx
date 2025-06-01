import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  BarChart4, Users, AlertTriangle, FileText, Calendar, Shield, Bookmark, ClipboardList, Layers
} from 'lucide-react';
import LegalDashboard from '@/components/legal/LegalDashboard';
import LegalCaseManagement from '@/components/legal/LegalCaseManagement';
import LegalDocumentManager from '@/components/legal/LegalDocumentManager';
import ComplianceCalendar from '@/components/legal/ComplianceCalendar';
import { CustomerLegalObligations } from '@/components/legal/CustomerLegalObligations';
import LegalTemplateManager from '@/components/legal/LegalTemplateManager';
import LegalReportBuilder from '@/components/legal/LegalReportBuilder';

const Legal: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Sidebar navigation items
  const navItems = [
    { label: 'Dashboard', icon: <BarChart4 className="h-4 w-4 mr-2" />, tab: 'dashboard' },
    { label: 'Cases', icon: <AlertTriangle className="h-4 w-4 mr-2" />, tab: 'cases' },
    { label: 'Documents', icon: <FileText className="h-4 w-4 mr-2" />, tab: 'documents' },
    { label: 'Compliance', icon: <Shield className="h-4 w-4 mr-2" />, tab: 'compliance' },
    { label: 'Obligations', icon: <Users className="h-4 w-4 mr-2" />, tab: 'obligations' },
    { label: 'Templates', icon: <Bookmark className="h-4 w-4 mr-2" />, tab: 'templates' },
    { label: 'Reports', icon: <ClipboardList className="h-4 w-4 mr-2" />, tab: 'reports' },
  ];

  return (
    <PageContainer>
      <SectionHeader
        title="Legal Management"
        description="Manage legal documents, compliance, cases, and more."
        icon={Layers}
      />
      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3 lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-0">
              <nav className="flex flex-col">
                {navItems.map((item) => (
                  <Button
                    key={item.label}
                    variant={activeTab === item.tab ? 'secondary' : 'ghost'}
                    className="justify-start px-4 py-2 h-auto rounded-none border-l-2 border-l-transparent data-[active=true]:border-l-primary"
                    onClick={() => setActiveTab(item.tab)}
                    data-active={activeTab === item.tab}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>
        {/* Main Content */}
        <div className="col-span-12 md:col-span-9 lg:col-span-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsContent value="dashboard" className="mt-0 space-y-4">
              <LegalDashboard />
            </TabsContent>
            <TabsContent value="cases" className="mt-0 space-y-4">
              <LegalCaseManagement />
            </TabsContent>
            <TabsContent value="documents" className="mt-0 space-y-4">
              <LegalDocumentManager />
            </TabsContent>
            <TabsContent value="compliance" className="mt-0 space-y-4">
              <ComplianceCalendar />
            </TabsContent>
            <TabsContent value="obligations" className="mt-0 space-y-4">
              <CustomerLegalObligations />
            </TabsContent>
            <TabsContent value="templates" className="mt-0 space-y-4">
              <LegalTemplateManager />
            </TabsContent>
            <TabsContent value="reports" className="mt-0 space-y-4">
              <LegalReportBuilder />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageContainer>
  );
};

export default Legal;
