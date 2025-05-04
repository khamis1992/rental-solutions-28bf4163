
import React, { useState } from 'react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { 
  Search, RefreshCw, Check, AlertCircle, Receipt, FileText 
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function TrafficFinesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { 
    trafficFines, 
    isLoading, 
    updateTrafficFineStatus, 
    validateTrafficFine,
    refetchTrafficFines
  } = useTrafficFines();
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };
  
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  const handleMarkAsPaid = async (fineId: string) => {
    try {
      await updateTrafficFineStatus(fineId, 'paid');
      toast.success('Traffic fine marked as paid');
    } catch (error) {
      toast.error('Failed to update traffic fine status');
    }
  };
  
  const handleValidate = async (fineId: string, licensePlate: string) => {
    try {
      const result = await validateTrafficFine(fineId, licensePlate);
      if (result.isValid) {
        toast.success('Validation completed successfully');
      } else {
        toast.error('Validation failed');
      }
    } catch (error) {
      toast.error('Failed to validate traffic fine');
    }
  };

  // Filter the fines based on search term and status filter
  const filteredFines = trafficFines.filter(fine => {
    const matchesSearch = 
      fine.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.violation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || fine.payment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Pagination logic
  const totalPages = Math.ceil(filteredFines.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedFines = filteredFines.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Traffic Fines</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => refetchTrafficFines('all')}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by license plate or fine number"
            value={searchTerm}
            onChange={handleSearch}
            className="pl-8"
          />
        </div>
        <Select 
          value={statusFilter} 
          onValueChange={handleStatusChange}
        >
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
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>License Plate</TableHead>
              <TableHead>Violation Date</TableHead>
              <TableHead>Fine Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Validation</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto" />
                  <span className="block mt-2">Loading traffic fines...</span>
                </TableCell>
              </TableRow>
            ) : paginatedFines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No traffic fines found</TableCell>
              </TableRow>
            ) : (
              paginatedFines.map(fine => (
                <TableRow key={fine.id}>
                  <TableCell className="font-medium">{fine.license_plate}</TableCell>
                  <TableCell>
                    {fine.violation_date ? format(new Date(fine.violation_date), 'MMM d, yyyy') : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {typeof fine.fine_amount === 'number' ? `QAR ${fine.fine_amount.toFixed(2)}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {fine.payment_status === 'paid' && (
                      <Badge variant="outline" className="bg-green-100">Paid</Badge>
                    )}
                    {fine.payment_status === 'pending' && (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                    {fine.payment_status === 'disputed' && (
                      <Badge variant="outline" className="bg-orange-100">Disputed</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {fine.validation_status === 'pending' && (
                      <Badge variant="outline">Not Validated</Badge>
                    )}
                    {fine.validation_status === 'validated' && (
                      <Badge variant="outline" className="bg-green-100">
                        <Check className="h-3 w-3 mr-1" />
                        Validated
                      </Badge>
                    )}
                    {fine.validation_status === 'failed' && (
                      <Badge variant="outline" className="bg-red-100">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleValidate(fine.id, fine.license_plate || '')}
                        disabled={!fine.license_plate}
                      >
                        Validate
                      </Button>
                      {fine.payment_status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleMarkAsPaid(fine.id)}
                        >
                          <Receipt className="h-4 w-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
