import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PageContainer from '@/components/layout/PageContainer';
import {
  Copy,
  Download,
  FileUp, AlertTriangle, FilePlus, RefreshCw, BarChart4, Filter, Search
} from 'lucide-react';
import AgreementStats from '@/components/agreements/AgreementStats';
import { AgreementFilters } from '@/components/agreements/AgreementFilters';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAgreements } from '@/hooks/use-agreements';
import { formatCurrency } from '@/lib/utils';
import { AGREEMENT_STATUSES } from '@/types/database-common';
import { useDataHandler } from '@/hooks/use-data-handler';
import { useDownload } from '@/hooks/use-download';
import { useUpload } from '@/hooks/use-upload';
import { useReactTable } from '@/hooks/use-react-table';
import { ColumnDef } from '@tanstack/react-table';

const AgreementsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getAgreements } = useAgreements();
  const [agreements, setAgreements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [totalAgreements, setTotalAgreements] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRefetching, setIsRefetching] = useState(false);
  const { handleDownload } = useDownload();
  const { handleFileUpload } = useUpload();
  const { handleOperation } = useDataHandler({
    showSuccessToast: true,
    showErrorToast: true,
    successMessage: 'Agreements refetched successfully',
    onError: (error) => {
      toast({
        title: 'Error refetching agreements',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'agreement_number',
      header: 'Agreement #',
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
    },
    {
      accessorKey: 'vehicle_license_plate',
      header: 'Vehicle',
    },
    {
      accessorKey: 'start_date',
      header: 'Start Date',
    },
    {
      accessorKey: 'end_date',
      header: 'End Date',
    },
    {
      accessorKey: 'rent_amount',
      header: 'Rent Amount',
      cell: ({ row }) => formatCurrency(row.original.rent_amount),
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              {/* <MoreHorizontal className="h-4 w-4" /> */}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate(`/agreements/${row.original.id}`)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/edit-agreement/${row.original.id}`)}>
              Edit Agreement
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Delete Agreement
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const { table, Header, Row } = useReactTable({
    columns,
    data: agreements,
    currentPage,
    pageSize,
    total: totalAgreements,
    onPageChange: (page) => setCurrentPage(page),
    onPageSizeChange: (size) => setPageSize(size),
  });

  useEffect(() => {
    fetchAgreements();
  }, [searchQuery, filters, currentPage, pageSize]);

  const fetchAgreements = async () => {
    setIsLoading(true);
    try {
      const response = await getAgreements({
        search: searchQuery,
        filters: filters,
        page: currentPage,
        pageSize: pageSize,
      });

      if (response.success && response.data) {
        setAgreements(response.data.items);
        setTotalAgreements(response.data.total);
      } else {
        toast({
          title: 'Error fetching agreements',
          description: response.message || 'Failed to load agreements.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Unexpected error',
        description: 'An unexpected error occurred while fetching agreements.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRefetch = async () => {
    setIsRefetching(true);
    await handleOperation(async () => {
      return await getAgreements({
        search: searchQuery,
        filters: filters,
        page: currentPage,
        pageSize: pageSize,
      });
    });
    setIsRefetching(false);
  };

  const handleDownloadAgreements = async () => {
    await handleDownload({
      url: '/api/download-agreements',
      filename: 'agreements.csv',
      toast: toast,
    });
  };

  const handleUploadAgreements = async (file: File) => {
    await handleFileUpload({
      url: '/api/upload-agreements',
      file: file,
      toast: toast,
    });
  };

  return (
    <PageContainer
      title="Agreements"
      description="Manage rental agreements and track their status"
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Input
            type="search"
            placeholder="Search agreements..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <Button onClick={handleRefetch} disabled={isRefetching}>
            Refetch <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
          </Button>
        </div>
        <div className="flex items-center space-x-2 mt-2 md:mt-0">
          <Button variant="outline" onClick={handleDownloadAgreements}>
            Download <Download className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline">
            Upload <FileUp className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={() => navigate('/create-agreement')}>
            Create Agreement <FilePlus className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <AgreementStats />

      <AgreementFilters onChange={handleFiltersChange} />

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <Table>
          <TableCaption>A list of your recent agreements.</TableCaption>
          <TableHeader>
            {columns.map((column) => (
              <TableHead key={column.accessorKey || column.id}>
                {column.header}
              </TableHead>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                <TableRow>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                </TableRow>
              </>
            ) : agreements.length > 0 ? (
              agreements.map((agreement) => (
                <TableRow key={agreement.id}>
                  <TableCell>{agreement.agreement_number}</TableCell>
                  <TableCell>{agreement.customer_name}</TableCell>
                  <TableCell>{agreement.vehicle_license_plate}</TableCell>
                  <TableCell>{agreement.start_date}</TableCell>
                  <TableCell>{agreement.end_date}</TableCell>
                  <TableCell>{formatCurrency(agreement.rent_amount)}</TableCell>
                  <TableCell>{agreement.status}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          {/* <MoreHorizontal className="h-4 w-4" /> */}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate(`/agreements/${agreement.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/edit-agreement/${agreement.id}`)}>
                          Edit Agreement
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          Delete Agreement
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No agreements found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            {/* Pagination controls */}
          </TableFooter>
        </Table>
      </div>
    </PageContainer>
  );
};

export default AgreementsPage;
