
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { 
  AlertTriangle, 
  Car, 
  CheckCircle, 
  MoreVertical, 
  Plus, 
  Search, 
  X,
  UserCheck
} from 'lucide-react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const TrafficFinesList = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const { trafficFines, isLoading, payTrafficFine, disputeTrafficFine, assignToCustomer } = useTrafficFines();
  const [assigningFines, setAssigningFines] = useState(false);
  
  // Filter traffic fines based on search query
  const filteredFines = trafficFines ? trafficFines.filter(fine => 
    ((fine.violationNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (fine.licensePlate?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (fine.violationCharge?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
  ) : [];

  // Handle paying a fine
  const handlePayFine = (id: string) => {
    payTrafficFine({ id });
  };

  // Handle disputing a fine
  const handleDisputeFine = (id: string) => {
    disputeTrafficFine({ id });
  };

  // Auto-assign fines to customers
  const handleAutoAssignFines = async () => {
    try {
      setAssigningFines(true);
      toast({
        title: "Auto-assigning fines",
        description: "Please wait while fines are assigned to customers..."
      });

      let assignedCount = 0;
      const pendingFines = filteredFines.filter(fine => !fine.customerId);

      for (const fine of pendingFines) {
        // Only process fines with license plates
        if (!fine.licensePlate) continue;

        // Try to assign by finding a lease with this vehicle
        try {
          const result = await assignToCustomer({ id: fine.id });
          if (result) {
            assignedCount++;
          }
        } catch (error) {
          console.error(`Failed to assign fine ${fine.id}:`, error);
        }
      }

      toast({
        title: "Assignment complete",
        description: `Successfully assigned ${assignedCount} out of ${pendingFines.length} fines to customers.`
      });
    } catch (error) {
      console.error("Auto-assignment error:", error);
      toast({
        title: "Assignment failed",
        description: "There was an error assigning fines to customers.",
        variant: "destructive"
      });
    } finally {
      setAssigningFines(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 text-white border-green-600"><CheckCircle className="mr-1 h-3 w-3" /> Paid</Badge>;
      case 'disputed':
        return <Badge className="bg-amber-500 text-white border-amber-600"><AlertTriangle className="mr-1 h-3 w-3" /> Disputed</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-red-500 text-white border-red-600"><X className="mr-1 h-3 w-3" /> Pending</Badge>;
    }
  };

  const getCustomerAssignmentStatus = (fine: any) => {
    if (fine.customerId) {
      return (
        <Badge className="bg-blue-500 text-white border-blue-600">
          <UserCheck className="mr-1 h-3 w-3" /> Assigned
        </Badge>
      );
    }
    return <Badge variant="outline">Unassigned</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Traffic Fines</CardTitle>
            <CardDescription>
              Manage and track traffic fines for your vehicles
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              className="w-full md:w-auto"
              onClick={handleAutoAssignFines}
              disabled={assigningFines}
              variant="secondary"
            >
              <UserCheck className="mr-2 h-4 w-4" /> 
              {assigningFines ? "Assigning..." : "Auto-Assign"}
            </Button>
            <Button className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Fine
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by violation number, license plate, or charge..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Violation #</TableHead>
                <TableHead>License Plate</TableHead>
                <TableHead className="hidden md:table-cell">Violation Date</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Loading traffic fines...
                  </TableCell>
                </TableRow>
              ) : filteredFines.length > 0 ? (
                filteredFines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4 text-warning" />
                        {fine.violationNumber}
                      </div>
                    </TableCell>
                    <TableCell>{fine.licensePlate}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(fine.violationDate, 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{fine.location || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(fine.fineAmount)}</TableCell>
                    <TableCell>
                      {getStatusBadge(fine.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      {getCustomerAssignmentStatus(fine)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handlePayFine(fine.id)}
                            disabled={fine.paymentStatus === 'paid'}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Pay Fine
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDisputeFine(fine.id)}
                            disabled={fine.paymentStatus === 'disputed'}
                          >
                            <X className="mr-2 h-4 w-4" /> Dispute Fine
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => assignToCustomer({ id: fine.id })}
                            disabled={!!fine.customerId}
                          >
                            <UserCheck className="mr-2 h-4 w-4" /> Assign to Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {searchQuery ? "No matching traffic fines found." : "No traffic fines found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficFinesList;
