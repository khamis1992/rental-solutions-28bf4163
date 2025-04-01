
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';

export function ImportHistoryList() {
  const [imports, setImports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openImportId, setOpenImportId] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<Record<string, any[]>>({});

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
      default:
        return <Badge variant="secondary" className="capitalize">{status}</Badge>;
    }
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
              </TableRow>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="p-0">
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
    </div>
  );
}
