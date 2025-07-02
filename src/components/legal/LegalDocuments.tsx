import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocumentList from '@/components/documents/DocumentList';
import AILegalLetterGenerator from './AILegalLetterGenerator';
import { DocumentEntityType } from '@/types/document.types';
import { Brain, FileText } from 'lucide-react';

const LegalDocuments = () => {
  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-right">إدارة القوالب القانونية</CardTitle>
          <CardDescription className="text-right">
            إدارة القوالب القانونية والسياسات والنماذج مع الذكاء الاصطناعي
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="ai-generator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai-generator" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            مولد الخطابات بالذكاء الاصطناعي
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            الوثائق والقوالب
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ai-generator">
          <AILegalLetterGenerator />
        </TabsContent>
        
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">الوثائق القانونية</CardTitle>
              <CardDescription className="text-right">
            إدارة القوالب القانونية والسياسات والنماذج
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentList 
            showUploadButton={true}
            showSearch={true}
            showFilters={false}
            entityType={DocumentEntityType.LEGAL_CASE}
          />
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LegalDocuments;
