import React from 'react';
import { Agreement } from '@/types/agreement';
import { getAgreementColumns } from './AgreementTableColumns';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import AgreementRow from './AgreementRow';
import { Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useReactTable, flexRender, getCoreRowModel } from '@tanstack/react-table';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedAgreementTableProps {
  agreements: Agreement[];
  isLoading: boolean;
  rowSelection: Record<string, boolean>;
  setRowSelection: (selection: Record<string, boolean>) => void;
  deleteAgreement: (id: string) => void;
  height?: number;
  rowHeight?: number;
}

export function VirtualizedAgreementTable({
  agreements,
  isLoading,
  rowSelection,
  setRowSelection,
  deleteAgreement,
  height = 400,
  rowHeight = 56,
}: VirtualizedAgreementTableProps) {
  const columns = React.useMemo(
    () => getAgreementColumns(deleteAgreement),
    [deleteAgreement]
  );

  const handleRowSelect = React.useCallback(
    (id: string, checked: boolean) => {
      setRowSelection({ ...rowSelection, [id]: checked });
    },
    [setRowSelection, rowSelection]
  );

  const table = useReactTable({
    data: agreements || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  });

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!agreements?.length) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <p>No agreements found.</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  // Virtualized list rendering
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null :
                    flexRender(header.column.columnDef.header, header.getContext())
                  }
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          <List
            height={height}
            itemCount={table.getRowModel().rows.length}
            itemSize={rowHeight}
            width={"100%"}
          >
            {({ index, style }) => {
              const row = table.getRowModel().rows[index];
              return (
                <div style={style} key={row.id}>
                  <AgreementRow
                    agreement={row.original}
                    onDelete={deleteAgreement}
                    isSelected={row.getIsSelected()}
                    onSelect={handleRowSelect}
                  />
                </div>
              );
            }}
          </List>
        </TableBody>
      </Table>
    </div>
  );
}

export default VirtualizedAgreementTable;
