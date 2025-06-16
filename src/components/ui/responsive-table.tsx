import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface ResponsiveTableColumn<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
  mobileShow?: boolean; // Show in mobile card view
  mobilePrimary?: boolean; // Primary info in mobile view
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  mobileCardClassName?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  onRowClick,
  className,
  emptyMessage = "No data available",
  keyExtractor,
  isLoading = false,
  mobileCardClassName
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item) => {
          const key = keyExtractor(item);
          const primaryColumn = columns.find(col => col.mobilePrimary);
          const visibleColumns = columns.filter(col => col.mobileShow !== false);

          return (
            <Card
              key={key}
              className={cn(
                "cursor-pointer hover:shadow-md transition-shadow",
                mobileCardClassName
              )}
              onClick={() => onRowClick?.(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    {primaryColumn && (
                      <div className="font-medium text-base">
                        {primaryColumn.accessor(item)}
                      </div>
                    )}
                    <div className="space-y-1">
                      {visibleColumns
                        .filter(col => !col.mobilePrimary)
                        .map((column) => (
                          <div
                            key={column.key}
                            className="text-sm text-muted-foreground flex items-center gap-2"
                          >
                            <span className="font-medium">{column.header}:</span>
                            <span>{column.accessor(item)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  {onRowClick && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "text-left font-medium text-muted-foreground py-3 px-4",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const key = keyExtractor(item);
            return (
              <tr
                key={key}
                className={cn(
                  "border-b hover:bg-muted/50 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("py-3 px-4", column.className)}
                  >
                    {column.accessor(item)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Example usage with types
interface ExampleData {
  id: string;
  name: string;
  status: string;
  date: string;
}

export const ResponsiveTableExample = () => {
  const data: ExampleData[] = [
    { id: '1', name: 'Item 1', status: 'active', date: '2024-01-01' },
    { id: '2', name: 'Item 2', status: 'inactive', date: '2024-01-02' },
  ];

  const columns: ResponsiveTableColumn<ExampleData>[] = [
    {
      key: 'name',
      header: 'Name',
      accessor: (item) => item.name,
      mobilePrimary: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (item) => (
        <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      accessor: (item) => item.date,
      mobileShow: false, // Hide on mobile
    },
  ];

  return (
    <ResponsiveTable
      data={data}
      columns={columns}
      keyExtractor={(item) => item.id}
      onRowClick={(item) => console.log('Clicked:', item)}
      emptyMessage="No items found"
    />
  );
};
