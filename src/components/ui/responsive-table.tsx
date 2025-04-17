
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export interface Column<T> {
  header: React.ReactNode;
  accessorKey: keyof T | ((row: T) => React.ReactNode);
  cell?: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  className?: string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ResponsiveTable<T extends {}>({
  data,
  columns,
  keyField,
  className,
  onRowClick,
  isLoading = false,
  emptyMessage = "No data available"
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();
  
  // Filter columns for mobile view
  const visibleColumns = isMobile 
    ? columns.filter(col => !col.hideOnMobile)
    : columns;

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        {isMobile ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="p-4 space-y-2">
              {Array(2).fill(0).map((_, j) => (
                <div key={j} className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
              ))}
            </Card>
          ))
        ) : (
          <Table className={className}>
            <TableHeader>
              <TableRow>
                {columns.map((column, i) => (
                  <TableHead key={i} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full p-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map(row => {
          const key = String(row[keyField]);
          return (
            <Card 
              key={key}
              className={cn(
                "p-4",
                onRowClick && "cursor-pointer hover:bg-accent/5"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {visibleColumns.map((column, i) => {
                const accessorFn = typeof column.accessorKey === 'function'
                  ? column.accessorKey
                  : (r: T) => r[column.accessorKey as keyof T];
                
                const cellContent = column.cell 
                  ? column.cell(row) 
                  : accessorFn(row);

                return (
                  <div key={i} className="flex justify-between py-1 items-center">
                    <div className="text-sm font-medium">{column.header}</div>
                    <div className="text-sm">{cellContent}</div>
                  </div>
                );
              })}
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop table view
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((column, i) => (
            <TableHead key={i} className={column.className}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(row => {
          const key = String(row[keyField]);
          return (
            <TableRow 
              key={key}
              className={onRowClick ? "cursor-pointer hover:bg-accent/5" : undefined}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column, i) => {
                const accessorFn = typeof column.accessorKey === 'function'
                  ? column.accessorKey
                  : (r: T) => r[column.accessorKey as keyof T];
                
                const cellContent = column.cell 
                  ? column.cell(row) 
                  : accessorFn(row);

                return (
                  <TableCell key={i} className={column.className}>
                    {cellContent}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
