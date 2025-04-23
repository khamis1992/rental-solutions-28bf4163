
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Grid2x2, List, Table, Download, Printer, MoreHorizontal, RefreshCw } from 'lucide-react';

export type ViewType = 'grid' | 'list' | 'table';

interface ViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  view,
  onViewChange,
  onRefresh,
  onExport,
  onPrint
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted/50 rounded-md p-1 flex">
        <Button
          variant={view === 'grid' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onViewChange('grid')}
          title="Grid View"
        >
          <Grid2x2 className="h-4 w-4" />
        </Button>
        <Button
          variant={view === 'list' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onViewChange('list')}
          title="List View"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={view === 'table' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onViewChange('table')}
          title="Table View"
        >
          <Table className="h-4 w-4" />
        </Button>
      </div>
      
      {onRefresh && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          title="Refresh"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onExport && (
            <DropdownMenuItem onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </DropdownMenuItem>
          )}
          {onPrint && (
            <DropdownMenuItem onClick={onPrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ViewToggle;
