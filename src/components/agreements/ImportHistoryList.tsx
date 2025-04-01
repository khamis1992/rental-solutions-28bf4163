
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileText,
  ChevronDown,
  ChevronRight,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Textarea } from "@/components/ui/textarea";

export function ImportHistoryList() {
  const [imports, setImports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openImportId, setOpenImportId] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<Record<string, any[]>>({});
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);
  const [revertReason, setRevertReason] = useState('');
  const [isReverting, setIsReverting] = useState(false);

  useEffect(() => {
    fetchImports();
    
    // Set up real-time subscription for imports
    const channel = supabase
      .channel('agreement-imports-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agreement_imports',
      }, () => {
        fetchImports();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchImports = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('agreement_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      setImports(data || []);
    } catch (err) {
      console.error('Error fetching imports:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchImportErrors = async (importId: string) => {
    try {
      if (importErrors[importId]) {
        return; // Already fetched
      }
      
      const { data, error } = await supabase
        .from('agreement_import_errors')
        .select('*')
        .eq('import_log_id', importId)
        .order('row_number', { ascending: true });

      if (error) {
        throw error;
      }

      setImportErrors(prev => ({
        ...prev,
        [importId]: data || []
      }));
    } catch (err) {
      console.error('Error fetching import errors:', err);
    }
  };

  const handleToggleImport = (importId: string) => {
    if (openImportId === importId) {
      setOpenImportId(null);
    } else {
      setOpenImportId(importId);
      fetchImportErrors(importId);
    }
  };

  const handleRevertImport = async () => {
    if (!selectedImportId) return;
    
    try {
      setIsReverting(true);
      
      // Call the function to delete agreements
      const { data, error } = await supabase.rpc('delete_agreements_by_import_id', {
        p_import_id: selectedImportId
      });

      if (error) {
        throw error;
      }
      
      // Log the revert operation
      if (data.success) {
        await supabase.from('agreement_import_reverts').insert({
          import_id: selectedImportId,
          deleted_count: data.deleted_count,
          reason: revertReason.trim() || 'No reason provided'
        });
        
        toast.success(`Successfully reverted import. ${data.deleted_count} agreements deleted.`);
        fetchImports(); // Refresh the list
      } else {
        toast.error(`Failed to revert import: ${data.message}`);
      }
    } catch (err) {
      console.error('Error reverting import:', err);
      toast.error(`Error reverting import: ${err.message}`);
    } finally {
      setIsReverting(false);
      setRevertDialogOpen(false);
      setSelectedImportId(null);
      setRevertReason('');
    }
  };

  const openRevertDialog = (importId: string) => {
    setSelectedImportId(importId);
    setRevertDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-amber-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'reverted':
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" className="capitalize">Completed</Badge>;
      case 'processing':
        return <Badge variant="warning" className="capitalize">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="capitalize">Failed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="capitalize">Pending</Badge>;
      case 'reverted':
        return <Badge variant="secondary" className="capitalize bg-blue-100 text-blue-800">Reverted</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize">{status}</Badge>;
    }
  };

  const canRevertImport = (importItem: any): boolean => {
    // Only allow reverting completed or failed imports with errors
    return (
      (importItem.status === 'completed' || importItem.status === 'failed') && 
      importItem.error_count > 0 &&
      importItem.status !== 'reverted'
    );
  };

  if (isLoading && imports.length === 0) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span>Loading import history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6 text-destructive">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span>Failed to load import history: {error}</span>
      </div>
    );
  }

  if (imports.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border">
      <h3 className="p-4 font-medium">Recent Agreement Imports</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>File Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Records</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {imports.map((importItem) => (
            <React.Fragment key={importItem.id}>
              <TableRow>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleToggleImport(importItem.id)}
                  >
                    {openImportId === importItem.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{importItem.original_file_name}</div>
                </TableCell>
                <TableCell>
                  {format(new Date(importItem.created_at), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(importItem.status)}
                    {getStatusBadge(importItem.status)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center">
                    <span className="text-green-600 font-medium">{importItem.processed_count}</span>
                    <span className="mx-1 text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{importItem.row_count || 0}</span>
                    {importItem.error_count > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {importItem.error_count} errors
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {canRevertImport(importItem) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openRevertDialog(importItem.id)}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Revert</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0">
                  <Collapsible
                    open={openImportId === importItem.id}
                    onOpenChange={(open) => {
                      if (open) handleToggleImport(importItem.id);
                      else setOpenImportId(null);
                    }}
                  >
                    <CollapsibleContent className="px-4 pb-4">
                      {importItem.status === 'failed' && importItem.errors && (
                        <div className="mb-4 p-3 bg-destructive/10 rounded-md">
                          <div className="font-medium mb-1 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1 text-destructive" /> 
                            Import Error
                          </div>
                          <p className="text-sm text-destructive">
                            {typeof importItem.errors === 'string' ? importItem.errors : 
                             importItem.errors.message || JSON.stringify(importItem.errors)}
                          </p>
                        </div>
                      )}
                      
                      {importErrors[importItem.id]?.length > 0 ? (
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Row</TableHead>
                                <TableHead>Error</TableHead>
                                <TableHead>Customer ID</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {importErrors[importItem.id].map((error) => (
                                <TableRow key={error.id}>
                                  <TableCell>{error.row_number}</TableCell>
                                  <TableCell className="text-destructive">
                                    {error.error_message}
                                  </TableCell>
                                  <TableCell>
                                    {error.customer_identifier || 'N/A'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        importItem.error_count > 0 && (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Loading error details...</span>
                          </div>
                        )
                      )}
                      
                      {importItem.error_count === 0 && (
                        <div className="p-4 text-center text-muted-foreground">
                          No errors found
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>

      <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revert Agreement Import</DialogTitle>
            <DialogDescription>
              This will delete all agreements created with errors during this import. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <label className="text-sm font-medium">Reason for reverting (optional)</label>
              <Textarea
                placeholder="Enter reason for reverting this import"
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevertDialogOpen(false)}
              disabled={isReverting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRevertImport}
              disabled={isReverting}
            >
              {isReverting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reverting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revert Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
