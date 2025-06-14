import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import DocumentList from '@/components/documents/DocumentList';
import { DocumentEntityType } from '@/types/document.types';

const LegalDocuments = () => {
  return (
    <div className="space-y-6" dir="rtl">
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
    </div>
  );
};

export default LegalDocuments;
