
import React, { useMemo, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
// Using public asset as demonstration
const heroImg = '/og-image.png';
// TODO: Ensure react-window is installed
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
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
import ExpenseRow from './ExpenseRow';
import ExpenseStatusBadge from './ExpenseStatusBadge';
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
  Upload, 
  Search, 
  Calendar as CalendarIcon,
  Filter,
  MoreVertical,
  Edit,
  Trash,
  RefreshCw
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { FinancialTransaction } from '@/hooks/use-financials';
import { format } from 'date-fns';

interface ExpensesListProps {
  expenses: FinancialTransaction[];
  isLoading: boolean;
  onAddExpense?: () => void;
  onEditExpense?: (id: string) => void;
  onDeleteExpense?: (id: string) => void;
  filters: {
    category: string;
    dateFrom: string;
    dateTo: string;
    searchQuery: string;
    recurringOnly: boolean;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    category: string;
    dateFrom: string;
    dateTo: string;
    searchQuery: string;
    recurringOnly: boolean;
  }>>;
}

const ExpensesList: React.FC<ExpensesListProps> = React.memo(({
  expenses,
  isLoading,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  filters,
  setFilters
}) => {
  // Memoize filtered expenses
  const memoizedExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (filters.category && filters.category !== 'all_categories' && exp.category !== filters.category) return false;
      if (filters.recurringOnly && !exp.is_recurring) return false;
      if (filters.dateFrom && new Date(exp.date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(exp.date) > new Date(filters.dateTo)) return false;
      if (filters.searchQuery && !(
        exp.description?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        exp.category?.toLowerCase().includes(filters.searchQuery.toLowerCase())
      )) return false;
      return true;
    });
  }, [expenses, filters]);

  // Memoize callbacks
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
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

  const handleRecurringOnlyChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      recurringOnly: value === 'recurring'
    }));
  }, [setFilters]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRecurringBadge = (isRecurring: boolean) => {
    if (isRecurring) {
      return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="h-3 w-3 mr-1" /> Recurring</Badge>;
    }
    return null;
  };

  // Virtualized row renderer
  const Row = useCallback(({ index, style }: ListChildComponentProps) => {
    const expense = memoizedExpenses[index];
    return (
      <TableRow style={style} key={expense.id}>
        <TableCell>{expense.date ? format(new Date(expense.date), 'dd/MM/yyyy') : 'N/A'}</TableCell>
        <TableCell className="max-w-[200px] truncate">{expense.description || '-'}</TableCell>
        <TableCell>{expense.category || '-'}</TableCell>
        <TableCell>{expense.amount?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</TableCell>
        <TableCell>{getStatusBadge(expense.status)}</TableCell>
        <TableCell>{getRecurringBadge(expense.is_recurring)}</TableCell>
        <TableCell className="text-right">
          {onEditExpense && (
            <Button variant="ghost" size="sm" onClick={() => onEditExpense(expense.id)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDeleteExpense && (
            <Button variant="ghost" size="sm" onClick={() => onDeleteExpense(expense.id)}>
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  }, [memoizedExpenses, onEditExpense, onDeleteExpense]);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
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

  const handleRecurringOnlyChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      recurringOnly: value === 'recurring'
    }));
  }, [setFilters]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRecurringBadge = (isRecurring: boolean) => {
    if (isRecurring) {
      return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="h-3 w-3 mr-1" /> Recurring</Badge>;
    }
    return null;
  };

  const memoizedExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (filters.category && filters.category !== 'all_categories' && exp.category !== filters.category) return false;
      if (filters.recurringOnly && !exp.is_recurring) return false;
      if (filters.dateFrom && new Date(exp.date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(exp.date) > new Date(filters.dateTo)) return false;
      if (filters.searchQuery && !(
        exp.description?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        exp.category?.toLowerCase().includes(filters.searchQuery.toLowerCase())
      )) return false;
      return true;
    });
  }, [expenses, filters]);

  const Row = useCallback(({ index, style }: ListChildComponentProps) => {
    const expense = memoizedExpenses[index];
    return (
      <TableRow style={style} key={expense.id}>
        <TableCell>{expense.date ? format(new Date(expense.date), 'dd/MM/yyyy') : 'N/A'}</TableCell>
        <TableCell className="max-w-[200px] truncate">{expense.description || '-'}</TableCell>
        <TableCell>{expense.category || '-'}</TableCell>
        <TableCell>{expense.amount?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</TableCell>
        <TableCell>{getStatusBadge(expense.status)}</TableCell>
        <TableCell>{getRecurringBadge(expense.is_recurring)}</TableCell>
        <TableCell className="text-right">
          {onEditExpense && (
            <Button variant="ghost" size="sm" onClick={() => onEditExpense(expense.id)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDeleteExpense && (
            <Button variant="ghost" size="sm" onClick={() => onDeleteExpense(expense.id)}>
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  }, [memoizedExpenses, onEditExpense, onDeleteExpense]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>Loading expenses...</CardDescription>
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

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <img src={heroImg} alt="Expenses" style={{maxWidth: 200, marginBottom: 16}} />
        <div>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>Manage your business expenses</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setFilters({
            category: '',
            dateFrom: '',
            dateTo: '',
            searchQuery: '',
            recurringOnly: false
          })}>
            <Filter className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button onClick={onAddExpense}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
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
                  placeholder="Search expenses..." 
                  value={filters.searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-auto">
              <Select value={filters.category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_categories">All Categories</SelectItem>
                  <SelectItem value="Salary">Salary</SelectItem>
                  <SelectItem value="Rent">Rent</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Insurance">Insurance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto">
              <Select 
                value={filters.recurringOnly ? 'recurring' : 'all'} 
                onValueChange={handleRecurringOnlyChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Expense Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Expenses</SelectItem>
                  <SelectItem value="recurring">Recurring Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(new Date(filters.dateFrom), 'PPP') : 'From Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                    onSelect={handleDateFromChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(new Date(filters.dateTo), 'PPP') : 'To Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                    onSelect={handleDateToChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
  {memoizedExpenses.length === 0 ? (
    <TableRow>
      <TableCell colSpan={7} className="h-24 text-center">
        No expenses found.
      </TableCell>
    </TableRow>
  ) : (
    memoizedExpenses.map((expense) => (
      <ExpenseRow expense={expense} key={expense.id} />
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

export default ExpensesList;

