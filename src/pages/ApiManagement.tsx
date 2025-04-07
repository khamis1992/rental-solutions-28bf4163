
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { FileCode, Key } from "lucide-react";
import ApiDocumentation from "@/components/api/ApiDocumentation";
import ApiKeyManagement from "@/components/api/ApiKeyManagement";

const ApiManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('keys');

  return (
    <PageContainer>
      <SectionHeader
        title="API Management"
        description="Manage API keys and explore documentation for third-party integrations"
        icon={FileCode}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md mb-4">
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Documentation
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="keys" className="space-y-6">
          <ApiKeyManagement />
        </TabsContent>
        
        <TabsContent value="docs" className="space-y-6">
          <ApiDocumentation />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default ApiManagement;
