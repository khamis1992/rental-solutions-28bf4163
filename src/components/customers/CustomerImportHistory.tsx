import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Download, Eye, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface ImportHistory {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: string[];
}

export function CustomerImportHistory() {
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImport, setSelectedImport] = useState<ImportHistory | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  useEffect(() => {
    // Fetch import history
    const fetchImportHistory = async () => {
      setLoading(true);
      try {
        // Replace with actual API call
        const response = await fetch('/api/customer-imports');
        const data = await response.json();
        setImportHistory(data);
      } catch (error) {
        console.error('Error fetching import history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImportHistory();
  }, []);

  const handleViewDetails = (importItem: ImportHistory) => {
    setSelectedImport(importItem);
    setShowDetailsModal(true);
  };

  const handleDeleteImport = (importItem: ImportHistory) => {
    setSelectedImport(importItem);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedImport) return;
    
    try {
      // Replace with actual API call
      await fetch(`/api/customer-imports/${selectedImport.id}`, {
        method: 'DELETE',
      });
      
      // Remove from state
      setImportHistory(importHistory.filter(item => item.id !== selectedImport.id));
      setShowDeleteModal(false);
      setSelectedImport(null);
    } catch (error) {
      console.error('Error deleting import:', error);
    }
  };

  const downloadErrorReport = async (importId: string) => {
    try {
      // Replace with actual API call
      const response = await fetch(`/api/customer-imports/${importId}/errors`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import-errors-${importId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading error report:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'processing':
        return <Badge variant="warning">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'partial':
        return <Badge variant="outline">Partial Success</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import History</CardTitle>
      </CardHeader>
      <CardContent>
        {importHistory.length === 0 ? (
          <Alert>
            <AlertDescription>No import history found.</AlertDescription>
          </Alert>
        ) : (
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
              {importHistory.map((importItem) => (
                <TableRow key={importItem.id}>
                  <TableCell>{importItem.fileName}</TableCell>
                  <TableCell>{format(new Date(importItem.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{getStatusBadge(importItem.status)}</TableCell>
                  <TableCell>
                    {importItem.recordsProcessed} processed
                    <br />
                    <span className="text-green-600">{importItem.recordsSucceeded} succeeded</span>
                    {importItem.recordsFailed > 0 && (
                      <span className="text-red-600"> • {importItem.recordsFailed} failed</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(importItem)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      {importItem.recordsFailed > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadErrorReport(importItem.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Errors
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteImport(importItem)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Details</DialogTitle>
            </DialogHeader>
            {selectedImport && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">File Name</p>
                    <p>{selectedImport.fileName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p>{format(new Date(selectedImport.createdAt), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p>{getStatusBadge(selectedImport.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Records Processed</p>
                    <p>{selectedImport.recordsProcessed}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Records Succeeded</p>
                    <p className="text-green-600">{selectedImport.recordsSucceeded}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Records Failed</p>
                    <p className="text-red-600">{selectedImport.recordsFailed}</p>
                  </div>
                </div>

                {selectedImport.errors && selectedImport.errors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Errors</p>
                    <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 rounded">
                      <ul className="list-disc list-inside">
                        {selectedImport.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-600">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              {selectedImport && selectedImport.recordsFailed > 0 && (
                <Button onClick={() => downloadErrorReport(selectedImport.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Error Report
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this import record? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
