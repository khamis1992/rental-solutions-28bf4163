

import { TooltipWrapper } from '@/components/ui/TooltipWrapper';
import { 
  Plus, 
  FileUp, 
  MoreHorizontal, 
  FileDown,
  Printer 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';

interface AgreementActionButtonsProps {
  setIsImportModalOpen: (open: boolean) => void;
  isEdgeFunctionAvailable: boolean;
}

export function AgreementActionButtons({ 
  setIsImportModalOpen, 
  isEdgeFunctionAvailable 
}: AgreementActionButtonsProps) {
  const navigate = useNavigate();

  const handleAddAgreement = () => {
    navigate('/agreements/add');
  };

  const handleImportAgreements = () => {
    if (!isEdgeFunctionAvailable) {
      alert('Import feature is currently unavailable. Please try again later.');
      return;
    }
    setIsImportModalOpen(true);
  };

  const handleExportAgreements = () => {
    // This would be implemented based on the backend capabilities
    console.log('Export agreements');
  };

  return (
    <div className="flex items-center space-x-2">
      <TooltipWrapper content="Create a new rental agreement.">
        <Button 
          onClick={handleAddAgreement} 
          className="hidden sm:flex"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Agreement
        </Button>
      </TooltipWrapper>
      
      <Button 
        onClick={handleAddAgreement}
        size="icon" 
        className="sm:hidden"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <TooltipWrapper content="Import agreements from a file.">
        <Button 
          variant="outline" 
          onClick={handleImportAgreements}
          disabled={!isEdgeFunctionAvailable}
          className="hidden sm:flex"
        >
          <FileUp className="mr-2 h-4 w-4" />
          Import
        </Button>
      </TooltipWrapper>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem 
              onClick={handleExportAgreements}
              className="cursor-pointer"
            >
              <FileDown className="mr-2 h-4 w-4" />
              <span>Export to CSV</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="cursor-pointer">
              <Printer className="mr-2 h-4 w-4" />
              <span>Print Agreements</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={handleImportAgreements} 
              className="sm:hidden cursor-pointer"
              disabled={!isEdgeFunctionAvailable}
            >
              <FileUp className="mr-2 h-4 w-4" />
              <span>Import CSV</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
