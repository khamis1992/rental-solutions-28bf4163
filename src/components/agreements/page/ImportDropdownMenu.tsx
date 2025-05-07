
import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ImportDropdownMenuProps {
  setIsImportModalOpen: (open: boolean) => void;
}

export function ImportDropdownMenu({ setIsImportModalOpen }: ImportDropdownMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setIsImportModalOpen(true)}>
          Import from CSV
        </DropdownMenuItem>
        <DropdownMenuItem>Download Template</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
