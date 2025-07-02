
import { Agreement } from '@/types/agreement';
import { getAgreementColumns } from './AgreementTableColumns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useReactTable, flexRender, getCoreRowModel } from '@tanstack/react-table';
import { Pagination } from '@/components/ui/pagination';

interface AgreementTableProps {
  agreements: Agreement[];
  isLoading: boolean;
  deleteAgreement: (id: string) => void;
  pagination?: {
    page: number;
    totalPages: number;
    totalCount: number;
    handlePageChange: (page: number) => void;
  };
}

const AgreementTable: React.FC<AgreementTableProps> = ({
  agreements,
  isLoading,
  deleteAgreement,
  pagination
}) => {
  const columns = React.useMemo(() => getAgreementColumns(deleteAgreement), [deleteAgreement]);

  const table = useReactTable({
    data: agreements,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Mobile-optimized loading state */}
        <div className="block md:hidden space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        
        {/* Desktop loading state */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((_, index) => (
                  <TableHead key={index}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (!agreements || agreements.length === 0) {
    return (
      <div className="text-center py-8">
        <Info className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد اتفاقيات</h3>
        <p className="mt-1 text-sm text-gray-500">لم يتم العثور على أي اتفاقيات.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {agreements.map((agreement) => (
          <div key={agreement.id} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-primary">
                {agreement.agreement_number || `AG-${agreement.id?.substring(0, 8)}`}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                agreement.status === 'active' ? 'bg-green-100 text-green-800' :
                agreement.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {agreement.status === 'active' ? 'نشط' : 
                 agreement.status === 'pending' ? 'معلق' : 
                 agreement.status}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">العميل:</span>
                <span className="font-medium">{agreement.customers?.full_name || 'غير متوفر'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">المركبة:</span>
                <span className="font-medium">
                  {agreement.vehicles ? 
                    `${agreement.vehicles.make} ${agreement.vehicles.model} (${agreement.vehicles.license_plate})` :
                    'غير متوفر'
                  }
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">مبلغ الإيجار:</span>
                <span className="font-medium text-green-600">
                  {agreement.rent_amount ? `${agreement.rent_amount.toLocaleString()} ر.ق` : 'غير متوفر'}
                </span>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button 
                className="text-primary text-sm font-medium touch-friendly px-4 py-2 rounded border border-primary hover:bg-primary hover:text-white transition-colors"
                onClick={() => window.location.href = `/agreements/${agreement.id}`}
              >
                عرض التفاصيل
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View - Enhanced for mobile */}
      <div className="hidden md:block">
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch border rounded-lg">
          <Table className="min-w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    لا توجد نتائج.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default AgreementTable;
