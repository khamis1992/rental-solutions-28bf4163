import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { revertAgreementImport, fixImportedAgreementDates } from '@/lib/supabase';

export function ImportHistoryList() {
  const [importLogs, setImportLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReverting, setIsReverting] = useState(false);
  const [fixingImport, setFixingImport] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImportLogs() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('customer_import_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setImportLogs(data || []);
      } catch (err) {
        console.error('Error fetching import logs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch import history');
      } finally {
        setIsLoading(false);
      }
    }

    fetchImportLogs();
    
    // Set up real-time subscription for import logs
    const subscription = supabase
      .channel('customer_import_logs_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'customer_import_logs' 
      }, (payload) => {
        fetchImportLogs();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper function to format status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'completed_with_errors':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Completed with errors</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">{status}</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleRevert = async (importId: string) => {
    if (!confirm("Are you sure you want to revert this import? This will delete all agreements created by this import.")) {
      return;
    }
    
    setIsReverting(true);
    try {
      const result = await revertAgreementImport(importId);
      if (result.success) {
        toast.success(result.message);
        refetchAgreementImports();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error reverting import:", error);
      toast.error("Failed to revert import");
    } finally {
      setIsReverting(false);
    }
  };

  const handleFixImportDates = async (importItem: AgreementImport) => {
    try {
      setFixingImport(importItem.id);
      const result = await fixImportedAgreementDates(importItem.id);
      
      if (result.success) {
        toast.success(result.message);
        refetchAgreementImports();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error fixing import dates:", error);
      toast.error("Failed to fix date formats");
    } finally {
      setFixingImport(null);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Import History</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2 border-b last:border-0">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-3 w-[200px]" />
                </div>
                <Skeleton className="h-6 w-[80px]" />
              </div>
            ))}
          </div>
        ) : importLogs.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No import history available yet
          </div>
        ) : (
          <div className="space-y-4">
            {importLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-2 border-b last:border-0">
                <div>
                  <div className="font-medium">{log.original_file_name || log.file_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(log.created_at)} • 
                    {log.processed_count > 0 && ` ${log.processed_count} processed`}
                    {log.error_count > 0 && ` • ${log.error_count} errors`}
                  </div>
                </div>
                {getStatusBadge(log.status)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
