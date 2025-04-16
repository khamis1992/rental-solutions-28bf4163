
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gavel, 
  AlertTriangle, 
  Calendar, 
  BarChart4, 
  ShieldAlert 
} from 'lucide-react';
import LegalCaseManagement from './LegalCaseManagement';
import ComplianceCalendar from './ComplianceCalendar';
import LegalRiskAssessment from './LegalRiskAssessment';
import ComplianceReporting from './ComplianceReporting';

const LegalDashboard = () => {
  const [activeTab, setActiveTab] = useState('cases');
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold">Legal Management Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="cases" 
            className="space-y-4"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <TabsTrigger value="cases" className="flex items-center space-x-2">
                <Gavel className="h-4 w-4" />
                <span>Case Management</span>
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Compliance Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4" />
                <span>Risk Assessment</span>
              </TabsTrigger>
              <TabsTrigger value="reporting" className="flex items-center space-x-2">
                <BarChart4 className="h-4 w-4" />
                <span>Compliance Reporting</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="cases" className="space-y-4">
              <LegalCaseManagement />
            </TabsContent>
            
            <TabsContent value="compliance" className="space-y-4">
              <ComplianceCalendar />
            </TabsContent>
            
            <TabsContent value="risk" className="space-y-4">
              <LegalRiskAssessment />
            </TabsContent>
            
            <TabsContent value="reporting" className="space-y-4">
              <ComplianceReporting />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegalDashboard;
