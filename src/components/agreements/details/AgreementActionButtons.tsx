
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Edit, FilePlus } from 'lucide-react';

interface AgreementActionButtonsProps {
  onEdit: () => void;
  onDownloadPdf: () => void;
  onGenerateDocument: () => void;
  onDelete: () => void;
  isGeneratingPdf: boolean;
}

export function AgreementActionButtons({
  onEdit,
  onDownloadPdf,
  onGenerateDocument,
  onDelete,
  isGeneratingPdf
}: AgreementActionButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-4 print:hidden">
      <Button variant="outline" onClick={onEdit}>
        <Edit className="mr-2 h-4 w-4" />
        Edit
      </Button>
      
      <Button variant="outline" onClick={onDownloadPdf} disabled={isGeneratingPdf}>
        <Download className="mr-2 h-4 w-4" />
        {isGeneratingPdf ? 'Generating...' : 'Agreement Copy'}
      </Button>

      <Button variant="outline" onClick={onGenerateDocument}>
        <FilePlus className="mr-2 h-4 w-4" />
        Generate Document
      </Button>

      <div className="flex-grow"></div>

      <Button variant="destructive" onClick={onDelete} className="ml-auto">
        Delete
      </Button>
    </div>
  );
}

