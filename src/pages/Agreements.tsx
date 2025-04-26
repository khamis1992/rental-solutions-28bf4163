import React, { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementList } from '@/components/agreements/AgreementList';
import { ImportHistoryList } from '@/components/agreements/ImportHistoryList';
import { CSVImportModal } from '@/components/agreements/CSVImportModal';
import { Button } from '@/components/ui/button';
import { useAgreements } from '@/hooks/use-agreements';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';
import { toast } from 'sonner';
import { runPaymentScheduleMaintenanceJob } from '@/lib/supabase';
import { SystemReportDialog, ReportOptions } from '@/components/agreements/SystemReportDialog';
import { generateSystemReport } from '@/utils/system-report-utils';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileUp, 
  AlertTriangle, 
  FileText,
  Filter, 
  Search,
  FilePlus, 
  RefreshCw, 
  BarChart4, 
  
} from 'lucide-react';
import { AgreementStats } from '@/components/agreements/AgreementStats';
import { AgreementFilters } from '@/components/agreements/AgreementFilters';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { asTableId } from '@/utils/type-casting';

const Agreements = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSystemReportOpen, setIsSystemReportOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { agreements, setSearchParams, searchParams } = useAgreements();
  const [showFilters, setShowFilters] = useState(false);
  
  React.useEffect(() => {
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
      const available = await checkEdgeFunctionAvailability('process-agreement-imports');
      setIsEdgeFunctionAvailable(available);
      if (!available) {
        toast.error("CSV import feature is unavailable. Please try again later or contact support.", {
          duration: 6000,
        });
      }
    };
    
    checkAvailability();
  }, []);
  
  React.useEffect(() => {
    const runMaintenanceJob = async () => {
      try {
        console.log("Running automatic payment schedule maintenance check");
        await runPaymentScheduleMaintenanceJob();
      } catch (error) {
        console.error("Error running payment maintenance job:", error);
        // We don't show a toast here since this is a background task
      }
    };
    
    const timer = setTimeout(() => {
      runMaintenanceJob();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleImportComplete = () => {
    setSearchParams({ 
      status: 'all' 
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleApplySearch = () => {
    setSearchParams(prev => ({ ...prev, query: searchQuery }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApplySearch();
    }
  };

  const handleFilterChange = (filters: Record<string, any>) => {
    setSearchParams(prev => ({ ...prev, ...filters }));
  };
  
  const handleGenerateSystemReport = async (options: ReportOptions) => {
    if (!agreements || agreements.length === 0) {
      toast.error("No agreements available to generate report");
      return;
    }

    try {
      setIsGeneratingReport(true);
      toast.info("Generating system-wide agreement report...");
      
      const filteredAgreements = options.statusFilter.length > 0 
        ? agreements.filter(a => options.statusFilter.includes(a.status))
        : agreements;
        
      if (filteredAgreements.length === 0) {
        toast.warning("No agreements match the selected filters");
        setIsGeneratingReport(false);
        return;
      }
      
      const agreementIds = filteredAgreements.map(a => a.id);
      
      // Fetch payments for the selected agreements
      let payments = [];
      for (const id of agreementIds) {
        if (id) {
          const { data: paymentData, error: paymentsError } = await supabase
            .from('unified_payments')
            .select('*')
            .eq('lease_id', asTableId('unified_payments', id as string));
          
          if (paymentsError) {
            console.error("Error fetching payments:", paymentsError);
          } else if (paymentData) {
            payments = [...payments, ...paymentData];
          }
        }
      }
      
      console.log(`Fetched ${payments.length} payments for ${filteredAgreements.length} agreements`);
      
      // Convert Date fields to proper Date objects
      const processedAgreements = filteredAgreements.map(agreement => ({
        ...agreement,
        start_date: new Date(agreement.start_date),
        end_date: new Date(agreement.end_date),
        created_at: new Date(agreement.created_at),
        updated_at: new Date(agreement.updated_at)
      }));
      
      const doc = await generateSystemReport(
        processedAgreements,
        payments,
        { 
          dateRange: options.dateRange,
          statusFilter: options.statusFilter.join(',')
        }
      );
      
      const filename = `rental-agreements-system-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast.success("System report generated successfully");
      setIsSystemReportOpen(false);
    } catch (error) {
      console.error("Error generating system report:", error);
      toast.error("Failed to generate system report: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const activeFilters = Object.entries(searchParams || {})
    .filter(([key, value]) => key !== 'status' && value !== undefined && value !== '');

  return (
    <PageContainer 
      title="Rental Agreements" 
      description="Manage customer rental agreements and contracts"
    >
      <div className="mb-6">
        <AgreementStats />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-grow max-w-md relative">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search agreements, customers, or vehicles..." 
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-16"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleApplySearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
            >
              Search
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="ml-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={() => setIsSystemReportOpen(true)}
            className="flex items-center gap-1"
          >
            <FileText className="h-4 w-4 mr-1" />
            System Report
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1"
            disabled={!isEdgeFunctionAvailable}
          >
            {!isEdgeFunctionAvailable && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <FileUp className="h-4 w-4" />
            Import CSV
          </Button>
          
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map(([key, value]) => (
            <Badge 
              key={key} 
              variant="outline" 
              className="flex gap-1 items-center px-3 py-1"
            >
              <span className="font-medium">{key}:</span> {value}
              <button 
                className="ml-1 rounded-full hover:bg-muted p-0.5"
                onClick={() => {
                  setSearchParams(prev => {
                    const newParams = { ...prev };
                    delete newParams[key];
                    return newParams;
                  });
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </Badge>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSearchParams({ status: 'all' })}
            className="text-xs h-7 px-2"
          >
            Clear All
          </Button>
        </div>
      )}

      {showFilters && (
        <Card className="mb-6 p-4">
          <AgreementFilters onFilterChange={handleFilterChange} currentFilters={searchParams} />
        </Card>
      )}
      
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="text-lg font-medium">Loading agreements...</span>
          </div>
        </div>
      }>
        <AgreementList />
      </Suspense>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart4 className="h-5 w-5 mr-2" />
          Import History
        </h2>
        <ImportHistoryList />
      </div>
      
      <CSVImportModal 
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportComplete={handleImportComplete}
      />
      
      <SystemReportDialog
        open={isSystemReportOpen}
        onOpenChange={setIsSystemReportOpen}
        onGenerate={handleGenerateSystemReport}
        isGenerating={isGeneratingReport}
      />
    </PageContainer>
  );
};

export default Agreements;
