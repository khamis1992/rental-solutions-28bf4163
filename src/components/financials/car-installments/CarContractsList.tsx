
// @ts-nocheck
/* eslint-disable */
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CarInstallmentContract, ContractFilters } from '@/types/car-installment';
import { formatCurrency } from '@/lib/utils';

import { Eye, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CarContractsListProps {
  contracts: CarInstallmentContract[];
  isLoading: boolean;
  onContractClick: (contract: CarInstallmentContract) => void;
  filters: ContractFilters;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}

export const CarContractsList: React.FC<CarContractsListProps> = ({
  contracts,
  isLoading,
  onContractClick,
  filters,
  onSearchChange,
  onStatusFilterChange
}) => {
  const { language } = useLanguage();

  // Calculate payment progress percentage
  const getProgressPercentage = (contract: CarInstallmentContract) => {
    if (contract.total_contract_value === 0) return 0;
    return Math.round((contract.amount_paid / contract.total_contract_value) * 100);
  };

  // Get color based on progress and overdue status
  const getProgressColor = (contract: CarInstallmentContract) => {
    if (contract.overdue_payments > 0) return 'bg-red-500';
    const progress = getProgressPercentage(contract);
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-emerald-500';
    if (progress >= 25) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  return (
    <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className={`flex flex-col md:flex-row gap-4 ${language === 'ar' ? 'md:flex-row-reverse' : ''}`}>
        <div className="flex-1">
          <div className="relative">
            <Search className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${language === 'ar' ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={language === 'ar' ? 'البحث بنوع السيارة...' : 'Search by car type...'}
              value={filters.search}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full ${language === 'ar' ? 'pr-10 text-right' : 'pl-10'}`}
            />
          </div>
        </div>
        <div className="w-full md:w-64">
          <Select 
            value={filters.status || 'all'} 
            onValueChange={onStatusFilterChange}
          >
            <SelectTrigger className={language === 'ar' ? 'text-right' : 'text-left'}>
              <SelectValue placeholder={language === 'ar' ? 'تصفية حسب الحالة' : 'Filter by status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'جميع العقود' : 'All Contracts'}
              </SelectItem>
              <SelectItem value="active" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'نشط' : 'Active'}
              </SelectItem>
              <SelectItem value="completed" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'مكتمل' : 'Completed'}
              </SelectItem>
              <SelectItem value="overdue" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'متأخر' : 'Overdue'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-16 bg-muted rounded"></div>
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div className="rounded-md bg-muted p-8 text-center">
          <p className={`text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? 'لم يتم العثور على عقود' : 'No contracts found'}
          </p>
          {filters.search && (
            <p className={`text-sm text-muted-foreground mt-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {language === 'ar' ? 'حاول تعديل معايير البحث أو التصفية' : 'Try adjusting your search or filter criteria'}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'اسم العقد' : 'Contract Name'}
                </TableHead>
                <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'السنة' : 'Year'}
                </TableHead>
                <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'السيارات' : 'Cars'}
                </TableHead>
                <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'السعر/سيارة' : 'Price/Car'}
                </TableHead>
                <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'القيمة الإجمالية' : 'Total Value'}
                </TableHead>
                <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'التقدم' : 'Progress'}
                </TableHead>
                <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'معلق' : 'Pending'}
                </TableHead>
                <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'الأقساط' : 'Installments'}
                </TableHead>
                <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'الإجراءات' : 'Actions'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className={`font-medium ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    {contract.car_type}
                  </TableCell>
                  <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                    {contract.model_year}
                  </TableCell>
                  <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                    {contract.number_of_cars}
                  </TableCell>
                  <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                    {formatCurrency(contract.price_per_car)}
                  </TableCell>
                  <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                    {formatCurrency(contract.total_contract_value)}
                  </TableCell>
                  <TableCell className="w-48">
                    <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <Progress
                        value={getProgressPercentage(contract)}
                        className={`h-2 ${getProgressColor(contract)}`}
                      />
                      <span className="text-xs w-12">
                        {getProgressPercentage(contract)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                    {formatCurrency(contract.amount_pending)}
                  </TableCell>
                  <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                    <span className={contract.overdue_payments > 0 ? 'text-red-500 font-semibold' : ''}>
                      {contract.total_installments - contract.remaining_installments} / {contract.total_installments}
                      {contract.overdue_payments > 0 && ` (${contract.overdue_payments} ${language === 'ar' ? 'متأخر' : 'overdue'})`}
                    </span>
                  </TableCell>
                  <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onContractClick(contract)}
                      className={language === 'ar' ? 'flex-row-reverse' : ''}
                    >
                      <Eye className={`h-4 w-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                      {language === 'ar' ? 'عرض' : 'View'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
