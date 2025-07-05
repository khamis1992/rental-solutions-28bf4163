
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ImportHistoryItem {
  id: string;
  imported_at: string;
  file_name: string;
  total_records: number;
  successful: number;
  failed: number;
  status: 'completed' | 'processing' | 'failed';
  error_message?: string;
  created_by?: string;
}

interface ImportHistoryListProps {
  items: ImportHistoryItem[];
  isLoading: boolean;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

export function ImportHistoryList({ items = [], isLoading }: ImportHistoryListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin w-6 h-6 border-t-2 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-gray-500">No import history available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Import History</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="p-4 border rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          >
            <div>
              <div className="font-medium">{item.file_name}</div>
              <div className="text-sm text-gray-500">
                Imported on {formatDate(item.imported_at)}
                {item.created_by && ` by ${item.created_by}`}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge>{item.total_records} records</Badge>
              <Badge variant="success">{item.successful} successful</Badge>
              <Badge variant={item.failed > 0 ? "destructive" : "secondary"}>{item.failed} failed</Badge>
              <Badge 
                variant={
                  item.status === 'completed' ? 'success' : 
                  item.status === 'processing' ? 'secondary' : 
                  'destructive'
                }
              >
                {item.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
