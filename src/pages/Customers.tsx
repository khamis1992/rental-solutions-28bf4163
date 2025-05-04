
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileUp, AlertTriangle, UserPlus } from 'lucide-react';
import { CustomerList } from '@/components/customers/CustomerList';
import { ImportHistoryList } from '@/components/customers/ImportHistoryList';
import { CSVImportModal } from '@/components/customers/CSVImportModal';
import { Button } from '@/components/ui/button';
import { CustomerSearchBar } from '@/components/customers/CustomerSearchBar';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';
import PageContainer from '@/components/layout/PageContainer';

const Customers = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const [searchParams, setSearchParams] = useState({
    query: '',
    status: 'all',
  });
  
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await checkEdgeFunctionAvailability('process-customer-imports', 2);
      setIsEdgeFunctionAvailable(available);
    };
    
    checkAvailability();
  }, []);

  const handleSearchChange = (query: string) => {
    setSearchParams(prev => ({ ...prev, query }));
  };

  const handleStatusChange = (status: string) => {
    setSearchParams(prev => ({ ...prev, status }));
  };

  return (
    <PageContainer 
      title="Customers" 
      description="Manage your customer database and track customer information"
      actions={
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2"
            disabled={!isEdgeFunctionAvailable}
          >
            {!isEdgeFunctionAvailable && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <FileUp className="h-4 w-4" />
            Import CSV
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link to="/customers/add">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Customer
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <CustomerSearchBar
            searchQuery={searchParams.query}
            status={searchParams.status}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
          />
          
          <div className="mt-6">
            <CustomerList searchParams={searchParams} />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Import History</h2>
          <ImportHistoryList />
        </div>
      </div>
      
      <CSVImportModal 
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportComplete={() => {
          // Refresh the customer list
        }}
      />
    </PageContainer>
  );
};

export default Customers;
