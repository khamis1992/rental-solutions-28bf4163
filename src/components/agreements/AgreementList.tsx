import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAgreements } from '@/hooks/use-agreements';
import { Link } from 'react-router-dom';
import { CustomButton } from '@/components/ui/custom-button';
import { Edit, Trash2, Eye, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Agreement } from '@/lib/validation-schemas/agreement';

const PAGE_SIZE = 10;

export function AgreementList() {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    agreements,
    loading: isLoading,
    error,
    totalCount,
    deleteAgreement,
    searchParams,
    setSearchParams,
  } = useAgreements({
    query: searchQuery,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const onOpenDeleteDialog = (id: string) => {
    setDeletingId(id);
    setOpenDeleteDialog(true);
  };

  const onCloseDeleteDialog = () => {
    setDeletingId(null);
    setOpenDeleteDialog(false);
  };
  
  const handleDelete = async (agreement: Agreement) => {
    if (!agreement) return;

    try {
      setDeletingId(agreement.id);
      
      // Use a simple approach to avoid deep type instantiation
      const result = await deleteAgreement.mutateAsync(agreement.id);
      
      if (result) {
        toast.success(`Agreement ${agreement.agreement_number || '#' + agreement.id} deleted successfully`);
        onCloseDeleteDialog();
      }
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'message' in error ? 
        error.message : 'An unknown error occurred';
      toast.error(`Failed to delete agreement: ${errorMessage}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSearchParams({ ...searchParams, query });
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setSearchParams({ ...searchParams, status });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPlaceholderRow = () => (
    <TableRow>
      <TableCell><Skeleton className="w-[100px] h-4" /></TableCell>
      <TableCell><Skeleton className="w-[100px] h-4" /></TableCell>
      <TableCell><Skeleton className="w-[50px] h-4" /></TableCell>
      <TableCell><Skeleton className="w-[50px] h-4" /></TableCell>
      <TableCell><Skeleton className="w-[100px] h-4" /></TableCell>
      <TableCell className="text-right"><Skeleton className="w-[150px] h-4" /></TableCell>
    </TableRow>
  );

  const renderTable = () => {
    if (isLoading) {
      return (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agreement #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(PAGE_SIZE).fill(null).map((_, i) => (
                <React.Fragment key={i}>
                  {renderPlaceholderRow()}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center p-4 border rounded-lg bg-red-50 text-red-800">
          <AlertCircle className="mr-2 h-4 w-4" />
          <p>{String(error)}</p>
        </div>
      );
    }
    
    const paginatedAgreements = agreements.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agreement #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAgreements.map((agreement) => (
              <TableRow key={agreement.id}>
                <TableCell className="font-medium">{agreement.agreement_number}</TableCell>
                <TableCell>{agreement.customer_name}</TableCell>
                <TableCell>{agreement.license_plate}</TableCell>
                <TableCell>{agreement.status}</TableCell>
                <TableCell>{formatDate(agreement.start_date)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/agreements/${agreement.id}`}>
                      <CustomButton variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </CustomButton>
                    </Link>
                    <Link to={`/agreements/edit/${agreement.id}`}>
                      <CustomButton variant="ghost" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </CustomButton>
                    </Link>
                    <CustomButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenDeleteDialog(agreement.id)}
                      disabled={deletingId === agreement.id}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </CustomButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {agreements.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No agreements found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-2 mb-4">
        <Input
          type="text"
          placeholder="Search agreements..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="md:w-1/3"
        />
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderTable()}

      {agreements.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this agreement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCloseDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  const agreementToDelete = agreements.find(agreement => agreement.id === deletingId);
                  if (agreementToDelete) {
                    handleDelete(agreementToDelete);
                  }
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
