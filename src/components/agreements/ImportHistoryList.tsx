
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

// Define proper type for import history items
interface ImportHistoryItem {
  id: string;
  file_name: string;
  status: string;
  total_records?: number;
  processed_records?: number;
  failed_records?: number;
  created_at: string;
}

export function ImportHistoryList() {
  const { data: imports, isLoading } = useQuery({
    queryKey: ['agreement-imports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agreement_imports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as ImportHistoryItem[];
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
                <Badge variant={item.status === 'completed' ? 'success' : item.status === 'failed' ? 'unpaid' : 'default'}>
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
