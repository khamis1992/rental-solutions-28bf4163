
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AgreementDocument } from '@/hooks/use-agreements';

interface AgreementDocumentsProps {
  agreementId: string;
  documents?: AgreementDocument[];
  isLoading: boolean;
  onUpload?: () => void;
}

const AgreementDocuments: React.FC<AgreementDocumentsProps> = ({ 
  agreementId, 
  documents = [],
  isLoading, 
  onUpload 
}) => {
  const [docs, setDocs] = useState<AgreementDocument[]>(documents);

  useEffect(() => {
    setDocs(documents);
  }, [documents]);

  const handleViewDocument = (url: string) => {
    window.open(url, '_blank');
  };

  const handleDownloadDocument = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div>Loading documents...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents</CardTitle>
        {onUpload && (
          <Button onClick={onUpload} size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No documents available for this agreement.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.document_type}</TableCell>
                  <TableCell>{doc.original_filename || 'Document'}</TableCell>
                  <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewDocument(doc.document_url)}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadDocument(doc.document_url, doc.original_filename || 'document')}>
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AgreementDocuments;
