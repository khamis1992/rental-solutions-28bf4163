
import { useState } from 'react';
import {
  useReactTable as useTanstackTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  TableOptions
} from '@tanstack/react-table';

interface ReactTableOptions<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  currentPage?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function useReactTable<T>({
  columns,
  data,
  currentPage = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  onPageSizeChange
}: ReactTableOptions<T>) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const tableOptions: TableOptions<T> = {
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize
      }
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: Boolean(onPageChange),
    pageCount: Math.ceil(total / pageSize)
  };

  const table = useTanstackTable(tableOptions);

  const Header = ({ children }: { children: React.ReactNode }) => {
    return <div className="flex items-center justify-between py-4">{children}</div>;
  };

  const Row = ({ children }: { children: React.ReactNode }) => {
    return <div className="flex items-center space-x-4 py-2">{children}</div>;
  };

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      table.setPageIndex(newPage - 1);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    } else {
      table.setPageSize(newSize);
    }
  };

  return {
    table,
    Header,
    Row,
    currentPage,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    setGlobalFilter,
    handlePageChange,
    handlePageSizeChange
  };
}
