
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ImportHistoryItem } from '@/types/import-types';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { safeAsync } from '@/utils/error-handling';

export function ImportHistoryList() {
  const { data: imports, isLoading } = useQuery({
    queryKey: ['agreement-imports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agreement_imports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Safe casting with type transformation
      return (data || []).map(item => ({
        id: item.id,
        file_name: item.file_name,
        status: item.status as ImportHistoryItem['status'],
        total_records: item.row_count || 0,
        processed_records: item.processed_count || 0,
        failed_records: item.error_count || 0,
        created_at: item.created_at
      })) as ImportHistoryItem[];
    }
  });

  if (isLoading) {
    return <div>Loading import history...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total Records</TableHead>
            <TableHead>Processed</TableHead>
            <TableHead>Failed</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {imports?.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.file_name}</TableCell>
              <TableCell>
                <Badge variant={
                  item.status === 'completed' ? 'success' : 
                  item.status === 'failed' ? 'unpaid' : 'default'
                }>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>{item.total_records ?? 'N/A'}</TableCell>
              <TableCell>{item.processed_records ?? 'N/A'}</TableCell>
              <TableCell>{item.failed_records ?? 'N/A'}</TableCell>
              <TableCell>{format(new Date(item.created_at), 'MM/dd/yyyy HH:mm')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
