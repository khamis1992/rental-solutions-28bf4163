
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CarInstallmentContract, ContractFilters } from '@/types/car-installment';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

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
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by car type..."
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-64">
          <Select 
            value={filters.status || 'all'} 
            onValueChange={onStatusFilterChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contracts</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
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
          <p className="text-muted-foreground">No contracts found</p>
          {filters.search && (
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your search or filter criteria
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract Name</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Cars</TableHead>
                <TableHead>Price/Car</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Installments</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.car_type}</TableCell>
                  <TableCell>{contract.model_year}</TableCell>
                  <TableCell>{contract.number_of_cars}</TableCell>
                  <TableCell>{formatCurrency(contract.price_per_car)}</TableCell>
                  <TableCell>{formatCurrency(contract.total_contract_value)}</TableCell>
                  <TableCell className="w-48">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={getProgressPercentage(contract)}
                        className="h-2"
                        indicatorClassName={getProgressColor(contract)}
                      />
                      <span className="text-xs w-12">
                        {getProgressPercentage(contract)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(contract.amount_pending)}</TableCell>
                  <TableCell>
                    <span className={contract.overdue_payments > 0 ? 'text-red-500 font-semibold' : ''}>
                      {contract.total_installments - contract.remaining_installments} / {contract.total_installments}
                      {contract.overdue_payments > 0 && ` (${contract.overdue_payments} overdue)`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onContractClick(contract)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
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
