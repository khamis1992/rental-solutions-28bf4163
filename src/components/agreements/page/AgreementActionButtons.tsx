
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CSVImportModal } from '../CSVImportModal';

interface AgreementActionButtonsProps {
  onNewAgreement: () => void;
  onImport?: () => void;
  onExport?: () => void;
}

const AgreementActionButtons = ({ 
  onNewAgreement,
  onImport,
  onExport 
}: AgreementActionButtonsProps) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImport = () => {
    setIsImportModalOpen(true);
    onImport?.();
  };

  return (
    <div className="flex gap-2">
      <Button onClick={onNewAgreement}>
        New Agreement
      </Button>
      
      <Button variant="outline" onClick={handleImport}>
        Import
      </Button>
      
      <Button variant="outline" onClick={onExport}>
        Export
      </Button>

      <CSVImportModal 
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
      />
    </div>
  );
};

export default AgreementActionButtons;
