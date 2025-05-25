import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface ImportRecord {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
}

export function ImportHistoryList() {
  const [importHistory, setImportHistory] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Mock data for demonstration
    const mockData: ImportRecord[] = [
      {
        id: '1',
        fileName: 'customers_01_01_2024.csv',
        status: 'completed',
        createdAt: '2024-01-01T12:00:00Z',
      },
      {
        id: '2',
        fileName: 'customers_01_02_2024.csv',
        status: 'failed',
        createdAt: '2024-01-02T14:30:00Z',
      },
      {
        id: '3',
        fileName: 'customers_01_03_2024.csv',
        status: 'completed',
        createdAt: '2024-01-03T16:45:00Z',
      },
    ];

    setLoading(true);
    // Simulate fetching data from an API
    setTimeout(() => {
      setImportHistory(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Import History</h2>
      {loading ? (
        <p>Loading import history...</p>
      ) : (
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">File Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Imported At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {importHistory.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.fileName}</TableCell>
                  <TableCell>{record.status}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDate(record.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {importHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No import history found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
