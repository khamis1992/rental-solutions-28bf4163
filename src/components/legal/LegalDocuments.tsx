import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import DocumentList from '@/components/documents/DocumentList';
import { DocumentEntityType } from '@/types/document.types';

const LegalDocuments = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Legal Documents</CardTitle>
          <CardDescription>
            Manage legal templates, policies, and forms
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
