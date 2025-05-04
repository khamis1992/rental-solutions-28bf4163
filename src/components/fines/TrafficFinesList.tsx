import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DotsHorizontalIcon, PlusIcon } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TrafficFine } from '@/types/traffic-fine';
import { useToast } from "@/components/ui/use-toast"
import { useTrafficFineService } from '@/hooks/use-traffic-fine-service';
import { useAsyncAction } from '@/hooks/use-async-action';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAgreements } from '@/hooks/use-agreements';
import { useCustomers } from '@/hooks/use-customers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { mapTrafficFineData } from '@/utils/traffic-fine-mapper';

interface TrafficFinesListProps {
  onAddFine: () => void;
  onInvalidAssignmentsFound: (hasInvalid: boolean) => void;
  showInvalidAssignments: boolean;
  triggerCleanup: boolean;
}

const TrafficFinesList: React.FC<TrafficFinesListProps> = ({
  onAddFine,
  onInvalidAssignmentsFound,
  showInvalidAssignments,
  triggerCleanup
}) => {
  const { toast } = useToast();
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);
  const [selectedFineId, setSelectedFineId] = useState<string | null>(null);
  const [reassignLeaseId, setReassignLeaseId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [invalidAssignments, setInvalidAssignments] = useState<TrafficFine[]>([]);
  const { agreements } = useAgreements();
  const { customers } = useCustomers();
  const { trafficFineService } = useTrafficFineService();

  const { execute: reassignFine, loading: isReassignLoading } = useAsyncAction(async () => {
    if (!selectedFineId || !reassignLeaseId) {
      throw new Error('Lease ID is required for reassignment.');
    }
    
    await trafficFineService.reassign(selectedFineId, reassignLeaseId);
    
    toast({
      title: "Fine Reassigned",
      description: "Traffic fine reassigned successfully.",
    });
    
    setReassignLeaseId(null);
    setSelectedFineId(null);
    setShowConfirmation(false);
    fetchTrafficFines();
  }, [trafficFineService, selectedFineId, reassignLeaseId, toast]);

  const fetchTrafficFines = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let fetchedFines: TrafficFine[] = [];
      
      if (debouncedSearchTerm || selectedStatus) {
        // Implement search and filter logic here
        fetchedFines = await searchAndFilterFines(debouncedSearchTerm, selectedStatus);
      } else {
        // Fetch all fines
        const response = await trafficFineService.findAll();
        fetchedFines = response;
      }
      
      setTrafficFines(fetchedFines);
      setLoading(false);
      
      // Check for invalid assignments
      const invalid = findInvalidAssignments(fetchedFines);
      setInvalidAssignments(invalid);
      onInvalidAssignmentsFound(invalid.length > 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load traffic fines';
      setError(message);
      setLoading(false);
    }
  };

  const searchAndFilterFines = async (searchTerm: string, status: string | null): Promise<TrafficFine[]> => {
    // Placeholder for search and filter logic
    // This should call your data fetching/filtering logic
    const response = await trafficFineService.findAll();
    let filteredFines = response;
    
    if (searchTerm) {
      filteredFines = filteredFines.filter(fine =>
        fine.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fine.violation_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (status) {
      filteredFines = filteredFines.filter(fine => fine.payment_status === status);
    }
    
    return filteredFines;
  };

  const findInvalidAssignments = (fines: TrafficFine[]): TrafficFine[] => {
    return fines.filter(fine => {
      if (!fine.customer_id || !fine.lease_id) return false;
      
      const lease = agreements?.find(agreement => agreement.id === fine.lease_id);
      if (!lease) return true;
      
      const violationDate = new Date(fine.violation_date);
      const startDate = new Date(lease.start_date);
      const endDate = lease.end_date ? new Date(lease.end_date) : new Date();
      
      return violationDate < startDate || violationDate > endDate;
    });
  };

  useEffect(() => {
    fetchTrafficFines();
  }, [debouncedSearchTerm, selectedStatus]);

  useEffect(() => {
    if (triggerCleanup && invalidAssignments.length > 0) {
      // Implement logic to clear invalid assignments
      console.log('Clearing invalid assignments:', invalidAssignments);
      setInvalidAssignments([]);
      onInvalidAssignmentsFound(false);
    }
  }, [triggerCleanup, invalidAssignments, onInvalidAssignmentsFound]);

  const handleReassign = (fineId: string) => {
    setSelectedFineId(fineId);
    setShowConfirmation(true);
  };

  const handleConfirmReassign = async () => {
    setIsReassigning(true);
    try {
      await reassignFine();
    } catch (error) {
      console.error("Error reassigning fine:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reassign traffic fine.",
      });
    } finally {
      setIsReassigning(false);
    }
  };

  const handleCancelReassign = () => {
    setShowConfirmation(false);
    setSelectedFineId(null);
    setReassignLeaseId(null);
  };

  const handleStatusChange = (fineId: string, newStatus: string) => {
    trafficFineService.updatePaymentStatus(fineId, newStatus)
      .then(() => {
        toast({
          title: "Status Updated",
          description: `Traffic fine status updated to ${newStatus}.`,
        });
        fetchTrafficFines();
      })
      .catch(error => {
        console.error("Error updating status:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update traffic fine status.",
        });
      });
  };

  const rows = trafficFines.map((fine) => {
    const licensePlate = fine.license_plate || '';
    const violationNumber = fine.violation_number || '';
    
    return (
      <tr key={fine.id}>
        <td>{violationNumber}</td>
        <td>{licensePlate}</td>
        <td>
          {fine.violation_date instanceof Date 
            ? format(fine.violation_date, 'dd/MM/yyyy') 
            : format(new Date(fine.violation_date), 'dd/MM/yyyy')}
        </td>
        <td>{formatCurrency(fine.fine_amount)}</td>
        <td>
          <Badge
            variant={fine.payment_status === 'paid' ? 'success' : 'warning'}
            className={fine.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}
          >
            {fine.payment_status}
          </Badge>
        </td>
        <td>{fine.location}</td>
        <td>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleReassign(fine.id)}>
                Reassign
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusChange(fine.id, 'paid')}>
                Mark as Paid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(fine.id, 'pending')}>
                Mark as Pending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
    );
  });

  if (loading) {
    return <div>Loading traffic fines...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const filteredInvalidAssignments = showInvalidAssignments ? invalidAssignments : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Traffic Fines</h2>
        <Button onClick={onAddFine}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Fine
        </Button>
      </div>

      <div className="flex space-x-4 mb-4">
        <Input
          type="text"
          placeholder="Search by license plate or violation number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ConfirmDialog
        open={showConfirmation}
        title="Reassign Traffic Fine"
        description="Are you sure you want to reassign this traffic fine to a different lease?"
        onConfirm={handleConfirmReassign}
        onCancel={handleCancelReassign}
        confirmButtonText="Reassign"
        cancelButtonText="Cancel"
        loading={isReassignLoading || isReassigning}
      >
        <Select value={reassignLeaseId} onValueChange={setReassignLeaseId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Lease" />
          </SelectTrigger>
          <SelectContent>
            {agreements?.map((lease) => (
              <SelectItem key={lease.id} value={lease.id}>
                {lease.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ConfirmDialog>

      <h3 className="text-md font-semibold mt-4">Traffic Fines List</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Violation #</TableHead>
              <TableHead>License Plate</TableHead>
              <TableHead>Violation Date</TableHead>
              <TableHead>Fine Amount</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows}
          </TableBody>
        </Table>
      </div>

      {showInvalidAssignments && filteredInvalidAssignments.length > 0 && (
        <>
          <h3 className="text-md font-semibold mt-4">Invalid Assignments</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Violation #</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Violation Date</TableHead>
                  <TableHead>Fine Amount</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Lease</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvalidAssignments.map(fine => {
                  const customer = customers?.find(c => c.id === fine.customer_id);
                  const lease = agreements?.find(l => l.id === fine.lease_id);

                  return (
                    <TableRow key={fine.id}>
                      <TableCell>{fine.violation_number}</TableCell>
                      <TableCell>{fine.license_plate}</TableCell>
                      <TableCell>{format(new Date(fine.violation_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{formatCurrency(fine.fine_amount)}</TableCell>
                      <TableCell>{fine.payment_status}</TableCell>
                      <TableCell>{fine.location}</TableCell>
                      <TableCell>{customer ? `${customer.first_name} ${customer.last_name}` : 'N/A'}</TableCell>
                      <TableCell>{lease ? lease.id : 'N/A'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};

export default TrafficFinesList;
