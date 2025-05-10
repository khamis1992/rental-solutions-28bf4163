import React, { useState } from 'react';
import { useCarInstallments } from '@/hooks/use-car-installments';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CarContractsList } from './CarContractsList';
import { ContractSummaryCards } from './ContractSummaryCards';
import { ContractDialog } from './ContractDialog';
import { ContractDetailDialog } from './ContractDetailDialog';
import { CarInstallmentContract } from '@/types/car-installment';

const CarInstallmentContracts = () => {
  const {
    contracts,
    isLoading,
    summary,
    fetchContracts,
    createContract
  } = useCarInstallments();

  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<CarInstallmentContract | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  const handleAddContract = () => {
    setIsContractDialogOpen(true);
  };

  const handleViewContract = (contract: CarInstallmentContract) => {
    setSelectedContract(contract);
    setIsDetailDialogOpen(true);
  };

  const handleContractSubmit = (data: Omit<CarInstallmentContract, 'id' | 'created_at' | 'updated_at'>) => {
    createContract(data);
    setIsContractDialogOpen(false);
  };

  const handleCloseContractDialog = () => {
    setIsContractDialogOpen(false);
  };

  const handleSearchChange = (value: string) => {
    setFilters({
      ...filters,
      search: value
    });
  };

  const handleStatusFilterChange = (value: string) => {
    setFilters({
      ...filters,
      status: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold mb-4">Car Installment Contracts</h2>
        <Button onClick={handleAddContract}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contract
        </Button>
      </div>

      <ContractSummaryCards 
        summary={summary} 
        isLoading={isLoading} 
      />

      <CarContractsList
        contracts={contracts || []}
        isLoading={isLoading}
        onContractClick={handleViewContract}
        filters={filters}
        onSearchChange={handleSearchChange}
        onStatusFilterChange={handleStatusFilterChange}
      />

      <ContractDialog
        open={isContractDialogOpen}
        onOpenChange={setIsContractDialogOpen}
        onSubmit={handleContractSubmit}
        onClose={handleCloseContractDialog}
      />

      {selectedContract && (
        <ContractDetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          contract={selectedContract}
        />
      )}
    </div>
  );
};

export default CarInstallmentContracts;
