
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { handleSupabaseResponse } from "@/utils/supabase-helpers";

interface ImportHistoryItem {
  id: string;
  file_name: string;
  status: string;
  row_count: number;
  processed_count: number;
  error_count: number;
  created_at: string;
}

export function ImportHistoryList() {
  const [imports, setImports] = useState<ImportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchImports() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("agreement_imports")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);
        
        // Handle response safely
        const safeData = handleSupabaseResponse({ data, error });

        if (safeData) {
          setImports(safeData.map((item: any) => ({
            id: item.id,
            file_name: item.file_name,
            status: item.status,
            row_count: item.row_count,
            processed_count: item.processed_count,
            error_count: item.error_count,
            created_at: item.created_at
          })));
        }
      } catch (error) {
        console.error("Error fetching import history:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchImports();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "processing":
        return <Badge variant="warning">Processing</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div>Loading import history...</div>;
  }

  if (imports.length === 0) {
    return <div className="text-center py-8 text-gray-500">No import history found</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Recent Imports</h3>
      <div className="border rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {imports.map((imp) => (
              <tr key={imp.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{imp.file_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(imp.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {imp.processed_count} / {imp.row_count} {imp.error_count > 0 && <span className="text-red-500">({imp.error_count} errors)</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDistanceToNow(new Date(imp.created_at), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
