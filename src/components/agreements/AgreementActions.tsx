
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar, Clock, Edit, Download, File, FilePlus, MoreHorizontal, Trash2 } from 'lucide-react';

interface AgreementActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  onDownloadPdf: () => void;
  onGeneratePayment: () => void;
  onRunMaintenance: () => void;
  onGenerateDocument: () => void;
  isGeneratingPayment?: boolean;
  isRunningMaintenance?: boolean;
  isGeneratingPdf?: boolean;
  status: string;
}

export function AgreementActions({
  onEdit,
  onDelete,
  onDownloadPdf,
  onGeneratePayment,
  onRunMaintenance,
  onGenerateDocument,
  isGeneratingPayment = false,
  isRunningMaintenance = false,
  isGeneratingPdf = false,
  status
}: AgreementActionsProps) {
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = status.toLowerCase() === 'active';
  
  return (
    <div className="print:hidden">
      {/* Desktop actions */}
      <div className="hidden md:flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        
        <Button variant="outline" size="sm" onClick={onDownloadPdf} disabled={isGeneratingPdf}>
          <Download className="mr-2 h-4 w-4" />
          {isGeneratingPdf ? 'Generating...' : 'Agreement Copy'}
        </Button>
        
        <Button variant="outline" size="sm" onClick={onGenerateDocument}>
          <FilePlus className="mr-2 h-4 w-4" />
          Generate Document
        </Button>
        
        {isActive && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onGeneratePayment}
            disabled={isGeneratingPayment}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            {isGeneratingPayment ? "Generating..." : "Generate Payment Schedule"}
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={onRunMaintenance}
          disabled={isRunningMaintenance}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          {isRunningMaintenance ? "Running..." : "Run Payment Maintenance"}
        </Button>
        
        <div className="flex-grow"></div>
        
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
      
      {/* Mobile actions */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          
          <Popover open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="grid gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start" 
                  onClick={() => {
                    onDownloadPdf();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isGeneratingPdf}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isGeneratingPdf ? 'Generating...' : 'Download Agreement Copy'}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start"
                  onClick={() => {
                    onGenerateDocument();
                    setMobileMenuOpen(false);
                  }}
                >
                  <FilePlus className="mr-2 h-4 w-4" />
                  Generate Document
                </Button>
                
                {isActive && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="justify-start"
                    onClick={() => {
                      onGeneratePayment();
                      setMobileMenuOpen(false);
                    }}
                    disabled={isGeneratingPayment}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {isGeneratingPayment ? "Generating..." : "Generate Payment Schedule"}
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    onRunMaintenance();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isRunningMaintenance}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {isRunningMaintenance ? "Running..." : "Run Payment Maintenance"}
                </Button>
                
                <hr className="my-2" />
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    onDelete();
                    setMobileMenuOpen(false);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Agreement
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
