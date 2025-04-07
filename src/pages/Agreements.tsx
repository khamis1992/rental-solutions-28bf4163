
import React, { Suspense, useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementList } from '@/components/agreements/AgreementList';
import { ImportHistoryList } from '@/components/agreements/ImportHistoryList';
import { CSVImportModal } from '@/components/agreements/CSVImportModal';
import { Loader2, Search, X, FileUp, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useAgreements } from '@/hooks/use-agreements';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';
import { toast } from 'sonner';
import { runPaymentScheduleMaintenanceJob } from '@/lib/supabase';

const Agreements = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const { setSearchParams } = useAgreements();
  
  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      const cachedStatus = sessionStorage.getItem('edge_function_available_process-agreement-imports');
      if (cachedStatus) {
        try {
          const { available, timestamp } = JSON.parse(cachedStatus);
          const now = Date.now();
          if (now - timestamp < 60 * 60 * 1000) {
            setIsEdgeFunctionAvailable(available);
            return;
          }
        } catch (e) {
          console.warn('Error parsing cached edge function status:', e);
        }
      }
    }
    
    const checkAvailability = async () => {
      try {
        const available = await checkEdgeFunctionAvailability('process-agreement-imports');
        setIsEdgeFunctionAvailable(available);
        if (!available) {
          toast.error("CSV import feature is unavailable. Please try again later or contact support.", {
            duration: 6000,
          });
        }
      } catch (error) {
        console.error("Error checking edge function availability:", error);
        setIsEdgeFunctionAvailable(false);
      }
    };
    
    checkAvailability();
  }, []);
  
  // Run payment schedule maintenance job silently on page load
  useEffect(() => {
    const runMaintenanceJob = async () => {
      try {
        console.log("Running automatic payment schedule maintenance check");
        await runPaymentScheduleMaintenanceJob();
      } catch (error) {
        console.error("Error running payment maintenance job:", error);
        // We don't show a toast here since this is a background task
      }
    };
    
    // Run after a 3-second delay to allow other initial page operations to complete
    const timer = setTimeout(() => {
      runMaintenanceJob();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleSearchChange = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);

  const clearSearch = () => {
    setSearchQuery('');
  };
  
  const handleImportComplete = () => {
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
