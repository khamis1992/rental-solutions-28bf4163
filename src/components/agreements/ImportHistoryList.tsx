import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Loader2, 
  Trash2, 
  FileDown, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { downloadCSV } from '@/utils/agreement-import-utils';

interface ImportHistoryListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportLog {
  id: string;
  created_at: string;
  file_name: string;
  original_file_name: string;
  user_id: string;
  status: string;
  processed: number;
  errors: number;
  reverted: boolean;
}

export function ImportHistoryList({ open, onOpenChange }: ImportHistoryListProps) {
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReverting, setIsReverting] = useState(false);
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchImportLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agreement_imports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching import logs:', error);
        toast.error(`Failed to fetch import logs: ${(error as { message: string }).message || 'Unknown error'}`);
      } else {
        setImportLogs(data || []);
      }
    } catch (error) {
      console.error('Error in fetchImportLogs:', error);
      toast.error(`An error occurred: ${(error as { message: string }).message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchImportLogs();
    }
  }, [open]);

  const handleDownloadErrors = async (importId: string, fileName: string) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('agreement-import-errors')
        .download(`${importId}.json`);
      
      if (error) {
        console.error('Error downloading errors:', error);
        toast.error(`Failed to download errors: ${(error as { message: string }).message || 'Unknown error'}`);
        return;
      }
      
      if (data) {
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `errors-${fileName}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error in handleDownloadErrors:', error);
      toast.error(`An error occurred: ${(error as { message: string }).message || 'Unknown error'}`);
    }
  };

  const handleRevertImport = async (importId: string) => {
    setIsReverting(true);
    setSelectedImportId(importId);
    
    try {
      const { data, error } = await supabase.functions.invoke('revert-agreement-import', {
        body: { importId },
      });
      
      if (error) {
        console.error('Error reverting import:', error);
        toast.error(`Failed to revert import: ${(error as { message: string }).message || 'Unknown error'}`);
      } else {
        toast.success('Import revert initiated successfully. Please refresh to see updated data.');
        fetchImportLogs();
      }
    } catch (error) {
      console.error('Error in handleRevertImport:', error);
      toast.error(`An error occurred: ${(error as { message: string }).message || 'Unknown error'}`);
    } finally {
      setIsReverting(false);
      setSelectedImportId(null);
    }
  };

  const handleDeleteImport = async (importId: string) => {
    try {
      const { error } = await supabase
        .from('agreement_imports')
        .delete()
        .eq('id', importId);
    
      if (error) {
        console.error('Error deleting import:', error);
        toast.error(`Failed to delete import: ${(error as { message: string }).message || 'Unknown error'}`);
        return;
      }
    
      toast.success('Import deleted successfully');
      fetchImportLogs();
    } catch (error) {
      console.error('Error in handleDeleteImport:', error);
      toast.error(`An error occurred: ${(error as { message: string }).message || 'Unknown error'}`);
    }
  };

  const confirmDelete = async () => {
    if (selectedImportId) {
      await handleDeleteImport(selectedImportId);
      setIsDeleteDialogOpen(false);
      setSelectedImportId(null);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleDownloadCSV = async (fileName: string) => {
    downloadCSV(fileName);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[90%] md:max-w-[75%] lg:max-w-[66%] xl:max-w-[50%]">
        <DialogHeader>
          <DialogTitle>Agreement Import History</DialogTitle>
          <DialogDescription>
            View the history of agreement imports and manage previous imports.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-lg font-medium">Loading import history...</p>
            </div>
          ) : importLogs.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>No import history found.</AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Import Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Errors</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.original_file_name}</TableCell>
                      <TableCell>
                        {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell>
                        {log.status === 'completed' ? (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            Completed
                          </div>
                        ) : log.status === 'pending' ? (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            Processing
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                            Failed
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{log.processed}</TableCell>
                      <TableCell>{log.errors}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadCSV(log.file_name)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            CSV
                          </Button>
                          {log.errors > 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadErrors(log.id, log.file_name)}
                            >
                              <FileDown className="h-4 w-4 mr-2" />
                              Errors
                            </Button>
                          )}
                          {!log.reverted && log.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isReverting && selectedImportId === log.id}
                              onClick={() => handleRevertImport(log.id)}
                            >
                              {isReverting && selectedImportId === log.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Reverting...
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Revert
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedImportId(log.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this import log? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
