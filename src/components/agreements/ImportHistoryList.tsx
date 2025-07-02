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
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">لم يتم العثور على سجلات استيراد.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">مكتمل</Badge>;
      case 'processing':
        return <Badge variant="warning">قيد المعالجة</Badge>;
      case 'failed':
        return <Badge variant="destructive">فشل</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium">{item.file_name}</h3>
              <p className="text-sm text-gray-500">{formatDate(item.imported_at)}</p>
            </div>
            <div className="flex space-x-2">
              {getStatusBadge(item.status)}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">إجمالي السجلات:</span>
              <span className="ml-2 font-medium">{item.total_records}</span>
            </div>
            <div>
              <span className="text-gray-500">نجح:</span>
              <span className="ml-2 font-medium text-green-600">{item.successful}</span>
            </div>
            <div>
              <span className="text-gray-500">فشل:</span>
              <span className="ml-2 font-medium text-red-600">{item.failed}</span>
            </div>
          </div>
          
          {item.error_message && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {item.error_message}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}