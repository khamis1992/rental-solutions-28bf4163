
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Clock, FileIcon, Download, AlertCircle } from 'lucide-react';
import { downloadCSV } from '@/utils/agreement-import-utils';

interface ImportHistoryListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportHistoryList({ open, onOpenChange }: ImportHistoryListProps) {
  const [imports, setImports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchImports = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('agreement_imports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        if (isMounted) {
          setImports(data || []);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching import history:', err);
        if (isMounted) {
          setError('Failed to load import history');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    if (open) {
      fetchImports();
    }
    
    return () => {
      isMounted = false;
    };
  }, [open]);
  
  const handleDownload = (fileName: string) => {
    try {
      downloadCSV(fileName);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'pending_replacement':
        return <Badge className="bg-purple-100 text-purple-800">Pending Replacement</Badge>;
      case 'reverted':
        return <Badge className="bg-gray-100 text-gray-800">Reverted</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (err) {
      return dateString;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import History</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 text-red-800 rounded-md mb-4">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}
        
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : imports.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No import history found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.original_file_name || item.file_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.processed_count > 0 && (
                          <span className="text-green-600">{item.processed_count} processed</span>
                        )}
                        {item.error_count > 0 && (
                          <span className="text-red-600 ml-2">{item.error_count} errors</span>
                        )}
                        {!item.processed_count && !item.error_count && "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownload(item.file_name)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
