
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Gavel, 
  AlertTriangle, 
  BarChart4, 
  ShieldAlert 
} from 'lucide-react';
import LegalCaseManagement from './LegalCaseManagement';
import LegalRiskAssessment from './LegalRiskAssessment';
import ComplianceReporting from './ComplianceReporting';

const LegalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cases');
  
  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold flex items-center">
            <Gavel className="h-5 w-5 mr-2 text-primary" />
            Legal Management Console
          </CardTitle>
          <CardDescription>
            Monitor and manage all legal aspects of your operation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="cases" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/50 p-1">
              <TabsTrigger value="cases" className="flex items-center justify-center space-x-2 data-[state=active]:bg-white">
                <Gavel className="h-4 w-4" />
                <span>Case Management</span>
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center justify-center space-x-2 data-[state=active]:bg-white">
                <ShieldAlert className="h-4 w-4" />
                <span>Risk Assessment</span>
              </TabsTrigger>
              <TabsTrigger value="reporting" className="flex items-center justify-center space-x-2 data-[state=active]:bg-white">
                <BarChart4 className="h-4 w-4" />
                <span>Compliance Reporting</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="cases" className="space-y-4">
              <LegalCaseManagement />
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
