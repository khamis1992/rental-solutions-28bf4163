
import React from 'react';
import { Agreement } from '@/types/agreement';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { flexRender, useReactTable, getCoreRowModel, getSortedRowModel, SortingState } from '@tanstack/react-table';
import { AgreementPagination } from '@/components/ui/agreement-pagination';
import { getAgreementColumns } from './columns';

interface TableContentProps {
  agreements: Agreement[];
  isLoading: boolean;
  compact?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    totalCount: number;
    handlePageChange: (page: number) => void;
  };
}

export function TableContent({
  agreements,
  isLoading,
  compact = false,
  pagination
}: TableContentProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns = React.useMemo(
    () => getAgreementColumns(compact),
    [compact]
  );

  const table = useReactTable({
    data: agreements || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading agreements...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th 
                    key={header.id} 
                    className="h-10 px-2 text-left align-middle font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-2 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  No agreements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && (
        <div className="flex flex-col items-center justify-center mt-4 py-2 border-t">
          <AgreementPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.handlePageChange}
          />
          <div className="text-sm text-muted-foreground text-center mt-2">
            Showing {agreements.length} of {pagination.totalCount} agreements
          </div>
        </div>
      )}
    </div>
  );
}
