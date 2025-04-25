
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCcw, FilePlus, Check, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function ImportHistoryList() {
  const [imports, setImports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    fetchImports();
  }, []);

  const fetchImports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agreement_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw new Error(error.message);
      setImports(data || []);
    } catch (error) {
      console.error('Error fetching import history:', error);
      toast.error('Failed to load import history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevertImport = async (importId: string) => {
    if (!confirm('Are you sure you want to revert this import? All imported agreements will be permanently deleted.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.rpc('delete_agreements_by_import_id', {
        p_import_id: importId
      });
      
      if (error) throw new Error(error.message);
      
      toast.success(`Successfully reverted import. ${data?.deleted_count || 0} agreements were deleted.`);
      fetchImports();
    } catch (error) {
      console.error('Error reverting import:', error);
      toast.error('Failed to revert import');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><Check className="mr-1 h-3 w-3" /> Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Failed</Badge>;
      case 'reverted':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><AlertTriangle className="mr-1 h-3 w-3" /> Reverted</Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="mr-1 h-3 w-3" /> {status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>File Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Records</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex items-center justify-center">
                  <RefreshCcw className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading import history...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : imports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center">
                  <FilePlus className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No imports found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            imports.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell>{item.original_file_name || item.file_name}</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell>
                  {item.processed_count}/{item.row_count || 0}{' '}
                  {item.error_count > 0 && (
                    <span className="text-destructive ml-2">({item.error_count} errors)</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {item.status === 'completed' && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleRevertImport(item.id)} 
                      disabled={isDeleting || item.status === 'reverted'}
                    >
                      {isDeleting ? <RefreshCcw className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                      Revert Import
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
