import React, { useState, useEffect } from 'react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, RefreshCw, AlertTriangle, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mapTrafficFineData } from '@/utils/traffic-fine-mapper';

export function TrafficFinesList() {
  const { trafficFines, isLoading, mutate, updatePaymentStatus } = useTrafficFines();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedFine, setSelectedFine] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter fines based on search term and status
  const filteredFines = trafficFines ? trafficFines.filter(fine => {
    const matchesSearch = 
      (fine.license_plate?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (fine.violation_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || fine.payment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];

  const handleStatusChange = (fineId: string, status: string) => {
    const fine = trafficFines?.find(f => f.id === fineId);
    if (fine) {
      setSelectedFine(fine);
      setNewStatus(status);
      setUpdateNotes('');
      setIsUpdateDialogOpen(true);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedFine || !newStatus) return;
    
    setIsUpdating(true);
    try {
      await updatePaymentStatus.mutateAsync({
        id: selectedFine.id,
        status: newStatus,
        notes: updateNotes
      });
      
      toast.success(`Fine status updated to ${newStatus}`);
      setIsUpdateDialogOpen(false);
    } catch (error) {
      console.error('Error updating fine status:', error);
      toast.error('Failed to update fine status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefresh = () => {
    // Pass an empty object if no arguments are expected
    // or pass the appropriate argument based on the function definition
    mutate({});
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'disputed':
        return <Badge className="bg-yellow-500">Disputed</Badge>;
      default:
        return <Badge className="bg-red-500">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by license plate or violation #"
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Traffic Fines</CardTitle>
          <CardDescription>
            {filteredFines.length} {filteredFines.length === 1 ? 'fine' : 'fines'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFines.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Violation #</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell>{fine.violation_number || 'N/A'}</TableCell>
                    <TableCell>{fine.license_plate}</TableCell>
                    <TableCell>
                      {fine.violation_date ? format(new Date(fine.violation_date), 'dd/MM/yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>QAR {fine.fine_amount?.toLocaleString() || 'N/A'}</TableCell>
                    <TableCell>{fine.location || 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(fine.payment_status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {fine.payment_status !== 'paid' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleStatusChange(fine.id, 'paid')}
                            className="text-green-600 hover:text-green-800 hover:bg-green-100"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Mark Paid
                          </Button>
                        )}
                        {fine.payment_status !== 'disputed' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleStatusChange(fine.id, 'disputed')}
                            className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Dispute
                          </Button>
                        )}
                        {fine.payment_status !== 'pending' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleStatusChange(fine.id, 'pending')}
                            className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reset
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No traffic fines found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Fine Status</DialogTitle>
            <DialogDescription>
              Change the status of the traffic fine for license plate {selectedFine?.license_plate}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add any notes about this status change"
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
