// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Document as DocumentType } from '@/types/document.types';

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
    <div className="flex flex-col space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {document.file_name} ({(document.file_size / 1024).toFixed(2)} كيلوبايت)
          </p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="ml-2 h-4 w-4" /> تحميل
          </Button>
          {document.public_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={document.public_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="ml-2 h-4 w-4" /> فتح
              </a>
            </Button>
          )}
        </div>
      </div>
      
      <div className="border rounded-md p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">جاري تحميل الوثيقة...</p>
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
                  معاينة غير متاحة لهذا النوع من الملفات.
                </p>
                <p className="text-sm text-muted-foreground">
                  يرجى تحميل الملف لعرض محتوياته.
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
