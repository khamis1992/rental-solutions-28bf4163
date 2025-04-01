
import { useState } from 'react';
import { CustomerList } from '@/components/customers/CustomerList';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import { CSVImportModal } from '@/components/customers/CSVImportModal';
import { ImportHistoryList } from '@/components/customers/ImportHistoryList';
import { useCustomers } from '@/hooks/use-customers';

const Customers = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { searchParams, setSearchParams } = useCustomers();
  
  const handleImportComplete = () => {
    // Reset search params to show all customers and refresh the list
    setSearchParams({ 
      query: '', 
      status: 'all' 
    });
  };
  
  return (
    <PageContainer
      title="Customers"
      description="View and manage your customer database."
      actions={
        <Button 
          variant="outline" 
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center gap-2"
        >
          <FileUp className="h-4 w-4" />
          Import CSV
        </Button>
      }
    >
      <div className="space-y-8">
        <CustomerList />
        
        <ImportHistoryList />
        
        <CSVImportModal 
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          onImportComplete={handleImportComplete}
        />
      </div>
    </PageContainer>
  );
};

export default Customers;
