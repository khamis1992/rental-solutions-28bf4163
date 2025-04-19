import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  FileText, Download, Plus, PlayCircle, 
  Settings, Receipt, CreditCard 
} from 'lucide-react';

interface AgreementActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  onDownloadPdf: () => void;
  onGeneratePayment: () => void;
  onRunMaintenance: () => void;
  onGenerateDocument: () => void;
  onAddPayment: () => void; // Add this new prop
  isGeneratingPayment: boolean;
  isRunningMaintenance: boolean;
  status: string;
}

export function AgreementActions({
  onEdit,
  onDelete,
  onDownloadPdf,
  onGeneratePayment,
  onRunMaintenance,
  onGenerateDocument,
  onAddPayment, // Add this
  isGeneratingPayment,
  isRunningMaintenance,
  status,
}: AgreementActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button variant="secondary" size="sm" onClick={onEdit}>
        <Settings className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Button variant="destructive" size="sm" onClick={onDelete}>
        Delete
      </Button>
      <Button variant="ghost" size="sm" onClick={onDownloadPdf}>
        <Download className="h-4 w-4 mr-2" />
        Download PDF
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onGenerateDocument}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Generate Document
      </Button>
      <Button 
        variant="default" 
        size="sm" 
        onClick={onGeneratePayment}
        disabled={isGeneratingPayment}
        className="flex items-center gap-2"
      >
        <PlayCircle className="h-4 w-4" />
        {isGeneratingPayment ? 'Generating...' : 'Generate Payment'}
      </Button>
      <Button 
        variant="default" 
        size="sm" 
        onClick={onRunMaintenance}
        disabled={isRunningMaintenance}
        className="flex items-center gap-2"
      >
        <Receipt className="h-4 w-4" />
        {isRunningMaintenance ? 'Running...' : 'Run Maintenance'}
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onAddPayment}
        className="flex items-center gap-2"
      >
        <CreditCard className="h-4 w-4" />
        Record Payment
      </Button>
    </div>
  );
}
