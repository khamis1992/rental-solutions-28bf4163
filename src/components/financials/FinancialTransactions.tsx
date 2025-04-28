
import React, { useState, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  ArrowDownUp, 
  Check, 
  Clock, 
  X, 
  Plus, 
  Download, 
  Upload, 
  Search, 
  Calendar as CalendarIcon,
  Filter,
  MoreVertical,
  Edit,
  Trash
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { FinancialTransaction } from '@/hooks/use-financials';
import { format } from 'date-fns';

interface FinancialTransactionsProps {
  transactions: FinancialTransaction[];
  isLoading: boolean;
  onAddTransaction?: () => void;
  onEditTransaction?: (id: string) => void;
  onDeleteTransaction?: (id: string) => void;
  filters: {
    transactionType: string;
    category: string;
    dateFrom: string;
    dateTo: string;
    searchQuery: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    transactionType: string;
    category: string;
    dateFrom: string;
    dateTo: string;
    searchQuery: string;
  }>>;
}

// Memoized, virtualized transaction list for optimal performance
const FinancialTransactions: React.FC<FinancialTransactionsProps> = React.memo(({
  transactions,
  isLoading,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  filters,
  setFilters
}) => {
  // Memoized callbacks to avoid unnecessary re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  }, [setFilters]);

  const handleTypeChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, transactionType: value }));
  }, [setFilters]);

  const handleCategoryChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, category: value }));
  }, [setFilters]);

  const handleDateFromChange = useCallback((date: Date | undefined) => {
    setFilters(prev => ({ 
      ...prev, 
      dateFrom: date ? format(date, 'yyyy-MM-dd') : '' 
    }));
  }, [setFilters]);

  const handleDateToChange = useCallback((date: Date | undefined) => {
    setFilters(prev => ({ 
      ...prev, 
      dateTo: date ? format(date, 'yyyy-MM-dd') : '' 
    }));
  }, [setFilters]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'income' ? 
      <Download className="h-4 w-4 text-green-500" /> : 
      <Upload className="h-4 w-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Loading transactions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Memoized filtered/sorted transactions for virtualization
  const memoizedTransactions = useMemo(() => {
    // You can add sorting/filtering logic here if needed
    return transactions;
  }, [transactions]);

  // Row renderer for react-window
  const Row = useCallback(({ index, style }) => {
    const transaction = memoizedTransactions[index];
    return (
      <TableRow key={transaction.id} style={style}>
        <TableCell>{getTypeIcon(transaction.type)}</TableCell>
        <TableCell>{transaction.date ? format(new Date(transaction.date), 'yyyy-MM-dd') : ''}</TableCell>
        <TableCell>{transaction.description}</TableCell>
        <TableCell>{transaction.category}</TableCell>
        <TableCell>{transaction.amount}</TableCell>
        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditTransaction && onEditTransaction(transaction.id)}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteTransaction && onDeleteTransaction(transaction.id)}>
                <Trash className="h-4 w-4 mr-2 text-red-500" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  }, [memoizedTransactions, onEditTransaction, onDeleteTransaction]);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <div>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Manage your financial transactions</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setFilters({
            transactionType: '',
            category: '',
            dateFrom: '',
            dateTo: '',
            searchQuery: ''
          })}>
            <Filter className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button onClick={onAddTransaction}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search transactions..." 
                  value={filters.searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>
            {/* ... other filter controls ... */}
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
  {memoizedTransactions.length === 0 ? (
    <TableRow>
      <TableCell colSpan={7} className="h-24 text-center">
        No transactions found.
      </TableCell>
    </TableRow>
  ) : (
    // Virtualized list for performance
    <TableRow>
      <TableCell colSpan={7} style={{ padding: 0, border: 0 }}>
        <List
          height={400}
          itemCount={memoizedTransactions.length}
          itemSize={56}
          width={"100%"}
        >
          {Row}
        </List>
      </TableCell>
    </TableRow>
  )}
</TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
                        <div className="flex items-center">
                          {getTypeIcon(transaction.type)}
                          <span className="ml-2 capitalize">{transaction.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditTransaction?.(transaction.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDeleteTransaction?.(transaction.id)}
                              className="text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialTransactions;

