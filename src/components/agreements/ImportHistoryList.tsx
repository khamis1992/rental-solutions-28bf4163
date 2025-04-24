
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Loader2, AlertTriangle, CheckCircle, MoreHorizontal, RefreshCw } from 'lucide-react';

interface ImportLog {
  id: string;
  filename: string;
  import_date: string;
  status: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  user_id?: string;
  created_at: string;
}

export const ImportHistoryList = () => {
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImportLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('agreement_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      // Type the data correctly before setting state
      if (data) {
        setImportLogs(data as ImportLog[]);
      } else {
        setImportLogs([]);
      }
    } catch (err) {
      console.error('Error fetching import logs:', err);
      setError('Failed to load import history');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchImportLogs();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span>Loading import history...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
        <span>{error}</span>
        <Button variant="ghost" size="sm" onClick={fetchImportLogs} className="ml-auto">
          <RefreshCw className="h-4 w-4 mr-1" /> Retry
        </Button>
      </div>
    );
  }
  
  if (importLogs.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">No import history found.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Import History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {importLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="flex items-center">
                  {log.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : log.status === 'processing' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                  )}
                  <span className="font-medium">{log.filename}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {format(new Date(log.import_date || log.created_at), 'PPP p')}
                </div>
              </div>
              <div className="text-sm">
                {log.successful_records}/{log.total_records} records
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
