
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Download, Eye, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { downloadCSV } from '@/utils/agreement-import-utils';

interface ImportLog {
  id: string;
  file_name: string;
  original_file_name: string;
  created_at: string;
  status: string;
  row_count: number;
  processed_count: number;
  error_count: number;
}

export function ImportHistoryList() {
  const [imports, setImports] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchImportHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agreement_imports')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setImports(data || []);
    } catch (error) {
      console.error('Error fetching import history:', error);
      toast.error('Failed to load import history');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchImportHistory();
  }, []);
  
  const handleViewErrors = async (importId: string) => {
    try {
      const { data, error } = await supabase
        .from('agreement_import_errors')
        .select('*')
        .eq('import_log_id', importId);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Download errors as CSV
        downloadCSV(data, `import-errors-${importId}`);
      } else {
        toast.info('No errors found for this import');
      }
    } catch (error) {
      console.error('Error fetching import errors:', error);
      toast.error('Failed to download error details');
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Import History</CardTitle>
        <Button onClick={fetchImportHistory} variant="outline" size="sm">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading import history...</div>
        ) : imports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No import history found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead className="text-right">Processed</TableHead>
                <TableHead className="text-right">Errors</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((importLog) => (
                <TableRow key={importLog.id}>
                  <TableCell className="font-medium">{importLog.original_file_name}</TableCell>
                  <TableCell>{format(new Date(importLog.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        importLog.status === 'completed' ? 'default' :
                        importLog.status === 'processing' ? 'secondary' :
                        importLog.status === 'failed' ? 'destructive' : 'outline'
                      }
                    >
                      {importLog.status.charAt(0).toUpperCase() + importLog.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{importLog.row_count}</TableCell>
                  <TableCell className="text-right">{importLog.processed_count}</TableCell>
                  <TableCell className="text-right">{importLog.error_count}</TableCell>
                  <TableCell className="text-right">
                    {importLog.error_count > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewErrors(importLog.id)}
                        title="Download error details"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Errors
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
