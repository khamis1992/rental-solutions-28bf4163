import React, { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Add generic constraint to ensure keyof T values can be rendered
type ResponsiveTableProps<T extends Record<string, React.ReactNode>> = {
  data: T[];
  columns: {
    header: string;
    accessor: keyof T;
    cell?: (item: T) => ReactNode;
    className?: string;
  }[];
  isLoading?: boolean;
  emptyMessage?: string;
  sortable?: boolean;
  initialSortField?: keyof T;
  initialSortDirection?: 'asc' | 'desc';
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  showHeader?: boolean;
  responsive?: boolean;
  className?: string;
};

export function ResponsiveTable<T extends Record<string, React.ReactNode>>({ 
  data,
  columns,
  isLoading = false,
  emptyMessage = "No data available",
  sortable = false,
  initialSortField,
  initialSortDirection = 'asc',
  onRowClick,
  rowClassName,
  showHeader = true,
  responsive = true,
  className
}: ResponsiveTableProps<T>) {
  const [sortField, setSortField] = React.useState<keyof T | undefined>(initialSortField);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(initialSortDirection);

  const handleSort = (accessor: keyof T) => {
    if (!sortable) return;
    
    if (sortField === accessor) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(accessor);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortable || !sortField) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === bValue) return 0;
      
      // Handle different types of values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' 
          ? aValue.getTime() - bValue.getTime() 
          : bValue.getTime() - aValue.getTime();
      }
      
      // Default comparison for other types
      const valA = String(aValue);
      const valB = String(bValue);
      
      return sortDirection === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    });
  }, [data, sortField, sortDirection, sortable]);

  // Fix the ReactNode type error at line 126
  const renderCellContent = (item: T, accessor: keyof T, cell?: (item: T) => ReactNode): ReactNode => {
    if (cell) {
      return cell(item);
    }
    // Cast the value as ReactNode to fix the type error
    return item[accessor] as ReactNode;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Standard table for larger screens
  if (!responsive) {
    return (
      <Table className={className}>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead 
                  key={index} 
                  className={cn(
                    column.className,
                    sortable && "cursor-pointer select-none"
                  )}
                  onClick={sortable ? () => handleSort(column.accessor) : undefined}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {sortable && sortField === column.accessor && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {sortedData.map((item, rowIndex) => (
            <TableRow 
              key={rowIndex}
              className={cn(
                rowClassName && rowClassName(item),
                onRowClick && "cursor-pointer hover:bg-muted/50"
              )}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex} className={column.className}>
                  {renderCellContent(item, column.accessor, column.cell)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  // Responsive card-like layout for smaller screens
  return (
    <div className={cn("space-y-4", className)}>
      {sortedData.map((item, rowIndex) => (
        <div 
          key={rowIndex}
          className={cn(
            "border rounded-lg p-4 bg-card",
            rowClassName && rowClassName(item),
            onRowClick && "cursor-pointer hover:bg-muted/50"
          )}
          onClick={onRowClick ? () => onRowClick(item) : undefined}
        >
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="py-2 flex justify-between items-start border-b last:border-0">
              <span className="font-medium text-sm text-muted-foreground">{column.header}</span>
              <div className={cn("text-right", column.className)}>
                {renderCellContent(item, column.accessor, column.cell)}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
