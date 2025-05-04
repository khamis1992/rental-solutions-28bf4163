
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileUp, AlertTriangle, FilePlus } from 'lucide-react';

interface AgreementActionButtonsProps {
  isImportModalOpen: boolean;
  setIsImportModalOpen: (isOpen: boolean) => void;
  isEdgeFunctionAvailable: boolean;
}

export const AgreementActionButtons: React.FC<AgreementActionButtonsProps> = ({
  isImportModalOpen,
  setIsImportModalOpen,
  isEdgeFunctionAvailable
}) => {
  return (
    <div className="flex items-center gap-2 w-full md:w-auto">
      <Button 
        variant="outline" 
        onClick={() => setIsImportModalOpen(true)}
        className="flex items-center gap-2"
        disabled={!isEdgeFunctionAvailable}
      >
        {!isEdgeFunctionAvailable && (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        )}
        <FileUp className="h-4 w-4" />
        Import CSV
      </Button>
      <Button asChild className="bg-primary hover:bg-primary/90">
        <Link to="/agreements/add">
          <FilePlus className="h-4 w-4 mr-2" />
          New Agreement
        </Link>
      </Button>
    </div>
  );
};
