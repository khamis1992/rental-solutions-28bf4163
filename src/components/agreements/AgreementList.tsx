import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import VehicleStatusBadge from './VehicleStatusBadge';
import AgreementFilters from './AgreementFilters';
import CSVImportModal from './CSVImportModal';
import ImportHistoryList from './ImportHistoryList';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eq } from '@/lib/database-helpers';
import { useAgreements } from '@/hooks/use-agreements';
import { DataTable } from '@/components/ui/data-table';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  Download,
  FileText,
  MoreHorizontal,
  PlusCircle,
  Upload,
} from 'lucide-react';
import AgreementStats from './AgreementStats';
import { Input } from '@/components/ui/input';
import { SchemaName } from '@/lib/database-types';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { ContainsNull } from '@/types/database-types';

interface OverduePayment {
  id: string;
  agreement_id: string;
  due_date: string;
  amount_due: number;
  currency: string;
}

interface PaymentRecord {
  id: string;
  agreement_id: string;
  payment_date: string;
  amount_paid: number;
  currency: string;
}

interface ImportHistoryRecord {
  id: string;
  filename: string;
  import_date: string;
  status: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
}

interface ImportRevertRecord {
  id: string;
  import_id: string;
  reverted_at: string;
}

interface TrafficFine {
  id: string;
  agreement_id: string;
  fine_date: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
}

const AgreementList = () => {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isCSVImportModalOpen, setIsCSVImportModalOpen] = useState(false);
  const [isImportHistoryOpen, setIsImportHistoryOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    agreements,
    isLoading: isLoadingAgreements,
    isError: isErrorAgreements,
  } = useAgreements();
  const { rentAmount, isLoading: isLoadingRent } = useRentAmount();

  const handleOpenCSVImportModal = () => {
    setIsCSVImportModalOpen(true);
  };

  const handleCloseCSVImportModal = () => {
    setIsCSVImportModalOpen(false);
  };

  const handleOpenImportHistory = () => {
    setIsImportHistoryOpen(true);
  };

  const handleCloseImportHistory = () => {
    setIsImportHistoryOpen(false);
  };

  const columns: ColumnDef<any>[] = React.useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
      },
      {
        accessorKey: 'customer_id',
        header: 'Customer ID',
      },
      {
        accessorKey: 'vehicle_id',
        header: 'Vehicle ID',
      },
      {
        accessorKey: 'start_date',
        header: 'Start Date',
        cell: ({ row }) => format(new Date(row.getValue('start_date')), 'PPP'),
      },
      {
        accessorKey: 'end_date',
        header: 'End Date',
        cell: ({ row }) => format(new Date(row.getValue('end_date')), 'PPP'),
      },
      {
        accessorKey: 'rental_rate',
        header: 'Rental Rate',
      },
      {
        accessorKey: 'currency',
        header: 'Currency',
      },
      {
        accessorKey: 'status',
        header: 'Status',
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const agreement = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigate(`/agreements/${agreement.id}`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate(`/agreements/edit/${agreement.id}`)}
                >
                  Edit Agreement
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    deleteMutation.mutate(agreement.id);
                  }}
                >
                  Delete Agreement
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link to={`/agreements/${agreement.id}`}>
                    Download Agreement
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [navigate]
  );

  const table = useReactTable({
    data: agreements || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  // Fix the type safety issues with string parameters by using the appropriate helper functions
  const fetchOverduePayments = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('overdue_payments')
      .select('*')
      .order('due_date', { ascending: false });
      
    if (error) throw error;
    return data as OverduePayment[];
  };

  const fetchPaymentHistory = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('unified_payments')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as PaymentRecord[];
  };

  const fetchImportHistory = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('agreement_import_history')
      .select('*')
      .order('import_date', { ascending: false });
      
    if (error) throw error;
    return data as ImportHistoryRecord[];
  };

  const fetchImportReverts = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('agreement_import_reverts')
      .select('*')
      .order('reverted_at', { ascending: false });
      
    if (error) throw error;
    return data as ImportRevertRecord[];
  };

  const fetchTrafficFines = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('traffic_fines')
      .select('*')
      .order('fine_date', { ascending: false });
      
    if (error) throw error;
    return data as TrafficFine[];
  };

  const fetchTrafficFineHistory = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('traffic_fines')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as TrafficFine[];
  };

  const {
    data: overduePayments,
    isLoading: isLoadingOverduePayments,
    isError: isErrorOverduePayments,
    refetch: refetchOverduePayments,
  } = useQuery({
    queryKey: ['overduePayments'],
    queryFn: fetchOverduePayments,
  });

  const {
    data: paymentHistory,
    isLoading: isLoadingPaymentHistory,
    isError: isErrorPaymentHistory,
    refetch: refetchPaymentHistory,
  } = useQuery({
    queryKey: ['paymentHistory'],
    queryFn: fetchPaymentHistory,
  });

  const {
    data: importHistory,
    isLoading: isLoadingImportHistory,
    isError: isErrorImportHistory,
    refetch: refetchImportHistory,
  } = useQuery({
    queryKey: ['importHistory'],
    queryFn: fetchImportHistory,
  });

  const {
    data: importReverts,
    isLoading: isLoadingImportReverts,
    isError: isErrorImportReverts,
    refetch: refetchImportReverts,
  } = useQuery({
    queryKey: ['importReverts'],
    queryFn: fetchImportReverts,
  });

  const {
    data: trafficFines,
    isLoading: isLoadingTrafficFines,
    isError: isErrorTrafficFines,
    refetch: refetchTrafficFines,
  } = useQuery({
    queryKey: ['trafficFines'],
    queryFn: fetchTrafficFines,
  });

  const {
    data: trafficFineHistory,
    isLoading: isLoadingTrafficFineHistory,
    isError: isErrorTrafficFineHistory,
    refetch: refetchTrafficFineHistory,
  } = useQuery({
    queryKey: ['trafficFineHistory'],
    queryFn: fetchTrafficFineHistory,
  });

  // Update the mutation functions to use proper type handling
  const deleteOverduePayment = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('overdue_payments')
      .delete()
      .match({ id });
      
    if (error) throw error;
  };

  const deletePaymentRecord = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('unified_payments')
      .delete()
      .match({ id });
      
    if (error) throw error;
  };

  const deleteImportRecord = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('agreement_import_history')
      .delete()
      .match({ id });
      
    if (error) throw error;
  };

  const revertImport = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('agreement_import_reverts')
      .insert([{ import_id: id }]);
      
    if (error) throw error;
  };

  const deleteTrafficFine = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('traffic_fines')
      .delete()
      .match({ id });
      
    if (error) throw error;
  };

  const payTrafficFine = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('traffic_fines')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .match({ id });
      
    if (error) throw error;
  };

  const deleteAgreement = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('leases')
      .delete()
      .match({ id });
      
    if (error) throw error;
  };

  const overduePaymentDeleteMutation = useMutation(deleteOverduePayment, {
    onSuccess: () => {
      toast({
        title: 'Overdue Payment Record Deleted',
      });
      queryClient.invalidateQueries({ queryKey: ['overduePayments'] });
    },
    onError: (error) => {
      toast({
        title: 'Something went wrong',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const paymentRecordDeleteMutation = useMutation(deletePaymentRecord, {
    onSuccess: () => {
      toast({
        title: 'Payment Record Deleted',
      });
      queryClient.invalidateQueries({ queryKey: ['paymentHistory'] });
    },
    onError: (error) => {
      toast({
        title: 'Something went wrong',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const importRecordDeleteMutation = useMutation(deleteImportRecord, {
    onSuccess: () => {
      toast({
        title: 'Import Record Deleted',
      });
      queryClient.invalidateQueries({ queryKey: ['importHistory'] });
    },
    onError: (error) => {
      toast({
        title: 'Something went wrong',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const importRevertMutation = useMutation(revertImport, {
    onSuccess: () => {
      toast({
        title: 'Import Reverted',
      });
      queryClient.invalidateQueries({ queryKey: ['importReverts'] });
    },
    onError: (error) => {
      toast({
        title: 'Something went wrong',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const trafficFineDeleteMutation = useMutation(deleteTrafficFine, {
    onSuccess: () => {
      toast({
        title: 'Traffic Fine Deleted',
      });
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      toast({
        title: 'Something went wrong',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const trafficFinePayMutation = useMutation(payTrafficFine, {
    onSuccess: () => {
      toast({
        title: 'Traffic Fine Paid',
      });
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      toast({
        title: 'Something went wrong',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation(deleteAgreement, {
    onSuccess: () => {
      toast({
        title: 'Agreement deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      toast({
        title: 'Something went wrong',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <AgreementStats />
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Agreements</h2>
        <div>
          <Input
            placeholder="Search agreements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md mr-4"
          />
          <Button variant="outline" onClick={handleOpenCSVImportModal}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={() => navigate('/agreements/add')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Agreement
          </Button>
        </div>
      </div>

      <DataTable table={table} />

      <CSVImportModal
        open={isCSVImportModalOpen}
        onClose={handleCloseCSVImportModal}
      />

      <Separator className="my-4" />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Overdue Payments</h2>
      </div>

      {isLoadingOverduePayments ? (
        <p>Loading overdue payments...</p>
      ) : isErrorOverduePayments ? (
        <p>Error fetching overdue payments.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agreement ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {overduePayments && overduePayments.length > 0 ? (
                overduePayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.agreement_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.due_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.amount_due}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          overduePaymentDeleteMutation.mutate(payment.id);
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    No overdue payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Separator className="my-4" />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Payment History</h2>
      </div>

      {isLoadingPaymentHistory ? (
        <p>Loading payment history...</p>
      ) : isErrorPaymentHistory ? (
        <p>Error fetching payment history.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agreement ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paymentHistory && paymentHistory.length > 0 ? (
                paymentHistory.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.agreement_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.payment_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.amount_paid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          paymentRecordDeleteMutation.mutate(payment.id);
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    No payment history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Separator className="my-4" />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Import History</h2>
        <Button variant="outline" onClick={handleOpenImportHistory}>
          View Import History
        </Button>
      </div>

      <ImportHistoryList
        open={isImportHistoryOpen}
        onClose={handleCloseImportHistory}
      />

      <Separator className="my-4" />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Traffic Fines</h2>
      </div>

      {isLoadingTrafficFines ? (
        <p>Loading traffic fines...</p>
      ) : isErrorTrafficFines ? (
        <p>Error fetching traffic fines.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agreement ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fine Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trafficFines && trafficFines.length > 0 ? (
                trafficFines.map((fine) => (
                  <tr key={fine.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {fine.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {fine.agreement_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {fine.fine_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {fine.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {fine.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {fine.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {fine.status === 'pending' ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            trafficFinePayMutation.mutate(fine.id);
                          }}
                        >
                          Pay
                        </Button>
                      ) : (
                        <Badge variant="outline">Paid</Badge>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => {
                          trafficFineDeleteMutation.mutate(fine.id);
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    No traffic fines found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AgreementList;
