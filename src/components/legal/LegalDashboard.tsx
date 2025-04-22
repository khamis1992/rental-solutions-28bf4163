
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gavel, 
  FileText, 
  AlertTriangle 
} from 'lucide-react';
import LegalDocuments from './LegalDocuments';
import LegalCaseManagement from './LegalCaseManagement';

const LegalDashboard = () => {
  const [activeTab, setActiveTab] = useState('documents');
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold">Legal Management Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="documents" 
            className="space-y-4"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TabsTrigger value="documents" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Legal Documents</span>
              </TabsTrigger>
              <TabsTrigger value="cases" className="flex items-center space-x-2">
                <Gavel className="h-4 w-4" />
                <span>Case Management</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="documents" className="space-y-4">
              <LegalDocuments />
            </TabsContent>
            
            <TabsContent value="cases" className="space-y-4">
              <LegalCaseManagement />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegalDashboard;
