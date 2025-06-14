
import React, { useState, useEffect } from 'react';
import { Document as DocumentType } from '@/types/document.types';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ExternalLink } from 'lucide-react';
import { useDocumentsEnhanced } from '@/hooks/use-documents-enhanced';

export interface DocumentViewerProps {
  document: DocumentType;
  onClose?: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { downloadDocumentFile } = useDocumentsEnhanced();
  
  const isImage = document.file_type.startsWith('image/');
  const isPdf = document.file_type === 'application/pdf';
  const isText = document.file_type.startsWith('text/');
  const isOffice = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint'
  ].includes(document.file_type);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleDownload = () => {
    downloadDocumentFile(document);
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {document.file_name} ({(document.file_size / 1024).toFixed(2)} KB)
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
          {document.public_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={document.public_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Open
              </a>
            </Button>
          )}
        </div>
      </div>
      
      <div className="border rounded-md overflow-hidden bg-muted/20 min-h-[400px] flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading document...</p>
          </div>
        ) : (
          <>
            {isImage && document.public_url && (
              <img 
                src={document.public_url} 
                alt={document.title} 
                className="max-w-full max-h-[600px] object-contain"
              />
            )}
            
            {isPdf && document.public_url && (
              <iframe
                src={`${document.public_url}#toolbar=0`}
                className="w-full h-[600px]"
                title={document.title}
              />
            )}
            
            {!isImage && !isPdf && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-muted-foreground mb-2">
                  Preview not available for this file type.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please download the file to view its contents.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
