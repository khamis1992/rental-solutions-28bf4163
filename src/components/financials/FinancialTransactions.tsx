import React, { useState } from 'react';
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
import { useLanguage } from '@/contexts/LanguageContext';

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

const FinancialTransactions: React.FC<FinancialTransactionsProps> = ({
  transactions,
  isLoading,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  filters,
  setFilters
}) => {
  const { language } = useLanguage();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleTypeChange = (value: string) => {
    setFilters(prev => ({ ...prev, transactionType: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFilters(prev => ({ ...prev, category: value }));
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setFilters(prev => ({ 
      ...prev, 
      dateFrom: date ? format(date, 'yyyy-MM-dd') : '' 
    }));
  };

  const handleDateToChange = (date: Date | undefined) => {
    setFilters(prev => ({ 
      ...prev, 
      dateTo: date ? format(date, 'yyyy-MM-dd') : '' 
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <Check className={language === 'ar' ? "h-3 w-3 ml-1" : "h-3 w-3 mr-1"} /> 
            {language === 'ar' ? 'مكتمل' : 'Completed'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className={language === 'ar' ? "h-3 w-3 ml-1" : "h-3 w-3 mr-1"} /> 
            {language === 'ar' ? 'معلق' : 'Pending'}
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800">
            <X className={language === 'ar' ? "h-3 w-3 ml-1" : "h-3 w-3 mr-1"} /> 
            {language === 'ar' ? 'فاشل' : 'Failed'}
          </Badge>
        );
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
      <Card dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <CardHeader className={language === 'ar' ? 'text-right' : 'text-left'}>
          <CardTitle>{language === 'ar' ? 'المعاملات' : 'Transactions'}</CardTitle>
          <CardDescription>{language === 'ar' ? 'جاري تحميل المعاملات...' : 'Loading transactions...'}</CardDescription>
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
    <Card dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader className={`flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
        <div>
          <CardTitle>{language === 'ar' ? 'المعاملات' : 'Transactions'}</CardTitle>
          <CardDescription>{language === 'ar' ? 'إدارة المعاملات المالية' : 'Manage your financial transactions'}</CardDescription>
        </div>
        <div className={`flex ${language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
          <Button variant="outline" onClick={() => setFilters({
            transactionType: '',
            category: '',
            dateFrom: '',
            dateTo: '',
            searchQuery: ''
          })} className={language === 'ar' ? 'flex-row-reverse' : ''}>
            <Filter className={language === 'ar' ? "h-4 w-4 ml-2" : "h-4 w-4 mr-2"} />
            {language === 'ar' ? 'مسح' : 'Clear'}
          </Button>
          <Button onClick={onAddTransaction} className={language === 'ar' ? 'flex-row-reverse' : ''}>
            <Plus className={language === 'ar' ? "h-4 w-4 ml-2" : "h-4 w-4 mr-2"} />
            {language === 'ar' ? 'إضافة معاملة' : 'Add Transaction'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400`} />
                <Input 
                  placeholder={language === 'ar' ? 'البحث في المعاملات...' : 'Search transactions...'} 
                  value={filters.searchQuery}
                  onChange={handleSearchChange}
                  className={language === 'ar' ? 'pr-10 text-right' : 'pl-10'}
                />
              </div>
            </div>
            
            <div className="w-full sm:w-auto">
              <Select value={filters.transactionType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={language === 'ar' ? 'نوع المعاملة' : 'Transaction Type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_types">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</SelectItem>
                  <SelectItem value="income">{language === 'ar' ? 'دخل' : 'Income'}</SelectItem>
                  <SelectItem value="expense">{language === 'ar' ? 'مصروف' : 'Expense'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto">
              <Select value={filters.category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={language === 'ar' ? 'الفئة' : 'Category'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_categories">{language === 'ar' ? 'جميع الفئات' : 'All Categories'}</SelectItem>
                  <SelectItem value="Rental">{language === 'ar' ? 'إيجار' : 'Rental'}</SelectItem>
                  <SelectItem value="Maintenance">{language === 'ar' ? 'صيانة' : 'Maintenance'}</SelectItem>
                  <SelectItem value="Insurance">{language === 'ar' ? 'تأمين' : 'Insurance'}</SelectItem>
                  <SelectItem value="Fuel">{language === 'ar' ? 'وقود' : 'Fuel'}</SelectItem>
                  <SelectItem value="Other">{language === 'ar' ? 'أخرى' : 'Other'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`w-[180px] justify-start font-normal ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}>
                    <CalendarIcon className={language === 'ar' ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                    {filters.dateFrom ? format(new Date(filters.dateFrom), 'PPP') : (language === 'ar' ? 'من تاريخ' : 'From Date')}
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
                  <Button variant="outline" className={`w-[180px] justify-start font-normal ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}>
                    <CalendarIcon className={language === 'ar' ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                    {filters.dateTo ? format(new Date(filters.dateTo), 'PPP') : (language === 'ar' ? 'إلى تاريخ' : 'To Date')}
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
                  <TableHead className={`w-[100px] ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    {language === 'ar' ? 'النوع' : 'Type'}
                  </TableHead>
                  <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                    {language === 'ar' ? 'التاريخ' : 'Date'}
                  </TableHead>
                  <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </TableHead>
                  <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                    {language === 'ar' ? 'الفئة' : 'Category'}
                  </TableHead>
                  <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                    {language === 'ar' ? 'المبلغ' : 'Amount'}
                  </TableHead>
                  <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </TableHead>
                  <TableHead className={language === 'ar' ? 'text-left' : 'text-right'}>
                    {language === 'ar' ? 'الإجراءات' : 'Actions'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className={`h-24 text-center ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {language === 'ar' ? 'لم يتم العثور على معاملات.' : 'No transactions found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                          {getTypeIcon(transaction.type)}
                          <span className={`capitalize ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>
                            {language === 'ar' ? (transaction.type === 'income' ? 'دخل' : 'مصروف') : transaction.type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                        {transaction.description}
                      </TableCell>
                      <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                        {language === 'ar' ? 
                          (transaction.category === 'Rental' ? 'إيجار' :
                           transaction.category === 'Maintenance' ? 'صيانة' :
                           transaction.category === 'Insurance' ? 'تأمين' :
                           transaction.category === 'Fuel' ? 'وقود' :
                           transaction.category === 'Other' ? 'أخرى' : transaction.category) 
                          : transaction.category}
                      </TableCell>
                      <TableCell className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'} ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        {`${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toLocaleString()}`}
                      </TableCell>
                      <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell className={language === 'ar' ? 'text-left' : 'text-right'}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">{language === 'ar' ? 'فتح القائمة' : 'Open menu'}</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'}>
                            <DropdownMenuItem onClick={() => onEditTransaction?.(transaction.id)} className={language === 'ar' ? 'flex-row-reverse' : ''}>
                              <Edit className={language === 'ar' ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                              <span>{language === 'ar' ? 'تعديل' : 'Edit'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDeleteTransaction?.(transaction.id)}
                              className={`text-red-600 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                            >
                              <Trash className={language === 'ar' ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                              <span>{language === 'ar' ? 'حذف' : 'Delete'}</span>
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
