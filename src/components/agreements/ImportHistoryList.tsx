import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Loader2, FileUp, CheckCircle, AlertCircle, XCircle, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Database } from '@/types/database.types';
import { asPaymentId } from '@/utils/type-casting';

type ImportLog = Database['public']['Tables']['agreement_imports']['Row'];

export function ImportHistoryList() {
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImportLogs() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('agreement_imports')
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
  }, []);

  const getStatusBadge = (status: string, errorCount: number) => {
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
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-10" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 border rounded-md">
        <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium">Error fetching import history</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (importLogs.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium">No import history</h3>
        <p className="text-muted-foreground">Upload a CSV file to import agreements</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Records</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {importLogs.map((importLog) => (
            <TableRow key={importLog.id}>
              <TableCell className="font-medium">
                {importLog.original_file_name || importLog.file_name}
              </TableCell>
              <TableCell>
                {format(new Date(importLog.created_at), 'MMM d, yyyy h:mm a')}
              </TableCell>
              <TableCell>
                {getStatusBadge(importLog.status, importLog.error_count)}
              </TableCell>
              <TableCell>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="link" className="p-0 h-auto font-normal">
                      {importLog.processed_count}/{importLog.row_count}
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="flex justify-between">
                      <span>Total Records:</span>
                      <span>{importLog.row_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processed:</span>
                      <span className="text-green-600">{importLog.processed_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Errors:</span>
                      <span className="text-red-600">{importLog.error_count}</span>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </TableCell>
              <TableCell>
                {importLog.error_count > 0 && (
                  <Button variant="ghost" size="sm" className="h-8">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Errors
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
