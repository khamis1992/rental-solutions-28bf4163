
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Link, 
  Download, 
  Upload, 
  Plus, 
  FileUp, 
  MoreHorizontal, 
  FileDown,
  Printer 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from 'react-router-dom';

interface AgreementActionButtonsProps {
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  isEdgeFunctionAvailable: boolean;
}

export function AgreementActionButtons({ 
  isImportModalOpen, 
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            onClick={handleAddAgreement} 
            className="hidden sm:flex"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Agreement
          </Button>
        </TooltipTrigger>
        <TooltipContent>Create a new rental agreement</TooltipContent>
      </Tooltip>
      
      <Button 
        onClick={handleAddAgreement}
        size="icon" 
        className="sm:hidden"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            onClick={handleImportAgreements}
            disabled={!isEdgeFunctionAvailable}
            className="hidden sm:flex"
          >
            <FileUp className="mr-2 h-4 w-4" />
            Import
          </Button>
        </TooltipTrigger>
        <TooltipContent>Import agreements from CSV</TooltipContent>
      </Tooltip>

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
