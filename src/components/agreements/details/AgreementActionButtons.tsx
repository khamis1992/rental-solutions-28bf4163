
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Edit, Trash2 } from 'lucide-react';

interface AgreementActionButtonsProps {
  onEdit: () => void;
  onDownloadPdf: () => void;
  onGenerateDocument: () => void;
  onDelete: () => void;
  isGeneratingPdf: boolean;
}

export const AgreementActionButtons: React.FC<AgreementActionButtonsProps> = ({
  onEdit,
  onDownloadPdf,
  onGenerateDocument,
  onDelete,
  isGeneratingPdf
}) => {
  return (
    <div className="flex space-x-2">
      <Button onClick={onEdit} variant="outline" size="sm">
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Button 
        onClick={onDownloadPdf} 
        variant="outline" 
        size="sm"
        disabled={isGeneratingPdf}
      >
        <Download className="h-4 w-4 mr-2" />
        {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
      </Button>
      <Button onClick={onGenerateDocument} variant="outline" size="sm">
        <FileText className="h-4 w-4 mr-2" />
        Generate Document
      </Button>
      <Button onClick={onDelete} variant="destructive" size="sm">
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
    </div>
  );
};
