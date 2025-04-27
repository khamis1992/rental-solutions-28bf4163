
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, RefreshCw, FileX, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAgreementImports } from '@/hooks/use-agreement-imports';
import { Badge } from '@/components/ui/badge';
import { 
  HoverCard, 
  HoverCardTrigger, 
  HoverCardContent 
} from '@/components/ui/hover-card';

export interface ImportLog {
  id: string;
  file_name: string;
  original_file_name: string | null;
  status: string;
  created_at: string;
  processed_count: number;
  row_count: number;
  error_count: number;
  created_by: string | null;
}

export function ImportHistoryList() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { imports, isLoading, refetch } = useAgreementImports();
  
  const handleDelete = async (importId: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_agreements_by_import_id', { p_import_id: importId });
      
      if (error) throw error;
      
      toast.success('Import has been successfully reverted');
      refetch();
    } catch (error) {
      console.error('Error reverting import:', error);
      toast.error('Failed to revert import');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const typedImports = imports as ImportLog[] || [];
  
  return (
    <div className="space-y-4">
      {typedImports.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No import history available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {typedImports.map((importItem) => (
            <Card key={importItem.id}>
              <CardContent>
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{importItem.original_file_name || importItem.file_name}</p>
                    <p className="text-muted-foreground">{format(new Date(importItem.created_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                  <div>
                    {getStatusBadge(importItem.status, importItem.error_count)}
                  </div>
                </div>
                <div className="flex justify-between mt-2">
                  <div>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="link" className="p-0 h-auto font-normal">
                          {importItem.processed_count}/{importItem.row_count}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="flex justify-between">
                          <span>Total Records:</span>
                          <span>{importItem.row_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Processed:</span>
                          <span className="text-green-600">{importItem.processed_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Errors:</span>
                          <span className="text-red-600">{importItem.error_count}</span>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <div>
                    {importItem.error_count > 0 && (
                      <Button variant="ghost" size="sm" className="h-8">
                        <FileX className="h-3.5 w-3.5 mr-1" />
                        Errors
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="flex justify-end mt-4">
        <Button variant="outline" onClick={refetch} disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  );
}

function getStatusBadge(status: string, errorCount: number) {
  if (status === 'completed') {
    return errorCount > 0 
      ? <Badge variant="warning" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Completed with errors
        </Badge>
      : <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>;
  }
  if (status === 'failed') {
    return <Badge variant="destructive" className="flex items-center gap-1">
      <XCircle className="h-3 w-3" />
      Failed
    </Badge>;
  }
  return <Badge variant="outline" className="flex items-center gap-1">
    <Loader2 className="h-3 w-3 animate-spin" />
    Processing
  </Badge>;
}
