import React, { useState } from 'react';
import { useCarInstallments } from '@/hooks/use-car-installments';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { CarContractsList } from './CarContractsList';
import { ContractSummaryCards } from './ContractSummaryCards';
import { ContractDialog } from './ContractDialog';
import { ContractDetailDialog } from './ContractDetailDialog';
import { CarInstallmentContract } from '@/types/car-installment';
import { useLanguage } from '@/contexts/LanguageContext';
import { downloadCSV } from '@/utils/csv-utils';
import { useToast } from '@/hooks/use-toast';

const CarInstallmentContracts = () => {
  const {
    contracts,
    isLoading,
    summary,
    fetchContracts,
    createContract
  } = useCarInstallments();

  const { language } = useLanguage();
  const { toast } = useToast();

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

  const handleExportContracts = () => {
    if (!contracts || contracts.length === 0) {
      toast({
        title: language === 'ar' ? 'لا توجد عقود' : 'No Contracts',
        description: language === 'ar' ? 'لا توجد عقود لتصديرها' : 'No contracts available to export',
        variant: 'destructive',
      });
      return;
    }

    // Prepare contract data for export
    const exportData = contracts.map(contract => ({
      [language === 'ar' ? 'نوع السيارة' : 'Car Type']: contract.car_type,
      [language === 'ar' ? 'سنة الطراز' : 'Model Year']: contract.model_year,
      [language === 'ar' ? 'عدد السيارات' : 'Number of Cars']: contract.number_of_cars,
      [language === 'ar' ? 'سعر السيارة الواحدة' : 'Price per Car']: contract.price_per_car,
      [language === 'ar' ? 'إجمالي قيمة العقد' : 'Total Contract Value']: contract.total_contract_value,
      [language === 'ar' ? 'المبلغ المدفوع' : 'Amount Paid']: contract.amount_paid || 0,
      [language === 'ar' ? 'المبلغ المعلق' : 'Amount Pending']: contract.amount_pending,
      [language === 'ar' ? 'إجمالي الأقساط' : 'Total Installments']: contract.total_installments,
      [language === 'ar' ? 'الأقساط المتبقية' : 'Remaining Installments']: contract.remaining_installments,
      [language === 'ar' ? 'قيمة القسط' : 'Installment Value']: contract.installment_value,
      [language === 'ar' ? 'الفئة' : 'Category']: contract.category,
      [language === 'ar' ? 'المدفوعات المتأخرة' : 'Overdue Payments']: contract.overdue_payments || 0,
      [language === 'ar' ? 'تاريخ الإنشاء' : 'Created At']: new Date(contract.created_at).toLocaleDateString(),
    }));

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = language === 'ar' 
      ? `عقود_التقسيط_${date}.csv`
      : `car_installment_contracts_${date}.csv`;

    // Download CSV
    downloadCSV(exportData, filename);

    toast({
      title: language === 'ar' ? 'تم التصدير بنجاح' : 'Export Successful',
      description: language === 'ar' 
        ? `تم تصدير ${contracts.length} عقد بنجاح`
        : `Successfully exported ${contracts.length} contracts`,
    });
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className={`flex justify-between items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <h2 className={`text-2xl font-semibold mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
          {language === 'ar' ? 'عقود تقسيط السيارات' : 'Car Installment Contracts'}
        </h2>
        <div className={`flex gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Button 
            variant="outline" 
            onClick={handleExportContracts}
            disabled={!contracts || contracts.length === 0}
            className={language === 'ar' ? 'flex-row-reverse' : ''}
          >
            <Download className={language === 'ar' ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
            {language === 'ar' ? 'تصدير' : 'Export'}
          </Button>
          <Button onClick={handleAddContract} className={language === 'ar' ? 'flex-row-reverse' : ''}>
            <Plus className={language === 'ar' ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
            {language === 'ar' ? 'إضافة عقد' : 'Add Contract'}
          </Button>
        </div>
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
