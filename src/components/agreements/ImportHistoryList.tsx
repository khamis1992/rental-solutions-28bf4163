
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapDbToImportHistory } from '@/utils/type-adapters';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const ImportHistoryList: React.FC = () => {
  const { data: imports, isLoading } = useQuery({
    queryKey: ['agreement-imports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agreement_imports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data?.map(mapDbToImportHistory) || [];
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
                <Badge variant={item.status === 'completed' ? 'success' : item.status === 'failed' ? 'destructive' : 'default'}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>{item.row_count ?? 'N/A'}</TableCell>
              <TableCell>{item.processed_count ?? 'N/A'}</TableCell>
              <TableCell>{item.error_count ?? 'N/A'}</TableCell>
              <TableCell>{format(new Date(item.created_at), 'MM/dd/yyyy HH:mm')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
