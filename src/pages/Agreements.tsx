
import React, { Suspense, useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import AgreementList from '@/components/agreements/AgreementList';
import { ImportHistoryList } from '@/components/agreements/ImportHistoryList';
import { CSVImportModal } from '@/components/agreements/CSVImportModal';
import { Loader2, Search, X, FileUp, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useAgreements } from '@/hooks/use-agreements';
import { checkEdgeFunctionAvailability } from '@/utils/agreement-import-utils';
import { toast } from 'sonner';

const Agreements = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const { setSearchParams } = useAgreements();
  
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await checkEdgeFunctionAvailability();
      setIsEdgeFunctionAvailable(available);
      if (!available) {
        toast.error("CSV import feature is unavailable. Please try again later or contact support.", {
          duration: 6000,
        });
      }
    };
    
    checkAvailability();
  }, []);
  
  const handleSearchChange = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);

  const clearSearch = () => {
    setSearchQuery('');
  };
  
  const handleImportComplete = () => {
    // Reset search params to show all agreements and refresh the list
    setSearchParams({ 
      query: '', 
      status: 'all' 
    });
  };

  return (
    <PageContainer 
      title="Rental Agreements" 
      description="Manage customer rental agreements and contracts"
      actions={
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
      }
    >
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by customer name or vehicle license plate..."
            className="w-full pl-9 pr-9"
            onChange={(e) => handleSearchChange(e.target.value)}
            value={searchQuery}
          />
          {searchQuery && (
            <button 
              className="absolute right-2.5 top-2.5"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>
      
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading agreements...</span>
        </div>
      }>
        <AgreementList searchQuery={searchQuery} />
      </Suspense>
      
      <div className="mt-8">
        <ImportHistoryList />
      </div>
      
      <CSVImportModal 
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportComplete={handleImportComplete}
      />
    </PageContainer>
  );
};

export default Agreements;
