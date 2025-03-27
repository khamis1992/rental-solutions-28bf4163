
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gavel, FileText, AlertTriangle, Calendar } from 'lucide-react';
import LegalDocuments from './LegalDocuments';
import LegalCaseManagement from './LegalCaseManagement';
import ComplianceCalendar from './ComplianceCalendar';

const LegalDashboard = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold">Legal Management Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="documents" className="space-y-4">
            <TabsList className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TabsTrigger value="documents" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Legal Documents</span>
              </TabsTrigger>
              <TabsTrigger value="cases" className="flex items-center space-x-2">
                <Gavel className="h-4 w-4" />
                <span>Case Management</span>
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Compliance Calendar</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="documents" className="space-y-4">
              <LegalDocuments />
            </TabsContent>
            
            <TabsContent value="cases" className="space-y-4">
              <LegalCaseManagement />
            </TabsContent>
            
            <TabsContent value="compliance" className="space-y-4">
              <ComplianceCalendar />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegalDashboard;
