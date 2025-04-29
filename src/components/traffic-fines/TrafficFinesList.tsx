
import React, { useState, useEffect } from 'react';
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
import TrafficFineRow from './TrafficFineRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertTriangle, 
  Car, 
  CheckCircle, 
  MoreVertical, 
  Plus, 
  Search, 
  X,
  UserCheck,
  DollarSign,
  Users,
} from 'lucide-react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/stat-card';

interface TrafficFinesListProps {
  isAutoAssigning?: boolean;
}

const TrafficFinesList = ({ isAutoAssigning = false }: TrafficFinesListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { trafficFines, isLoading, payTrafficFine, disputeTrafficFine, assignToCustomer } = useTrafficFines();
  const [assigningFines, setAssigningFines] = useState(false);
  
  const filteredFines = trafficFines ? trafficFines.filter(fine => 
    ((fine.violationNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (fine.licensePlate?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (fine.violationCharge?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
  ) : [];

  const assignedFines = filteredFines.filter(fine => fine.customerId);
  const unassignedFines = filteredFines.filter(fine => !fine.customerId);
  
  const assignedFinesAmount = assignedFines.reduce((total, fine) => total + fine.fineAmount, 0);
  const unassignedFinesAmount = unassignedFines.reduce((total, fine) => total + fine.fineAmount, 0);

  const handlePayFine = (id: string) => {
    payTrafficFine.mutate({ id });
  };

  const handleDisputeFine = (id: string) => {
    disputeTrafficFine.mutate({ id });
  };

  const handleAutoAssignFines = async () => {
    try {
      setAssigningFines(true);
      toast.info("Auto-assigning fines", {
        description: "Please wait while fines are assigned to customers..."
      });

      let assignedCount = 0;
      let failedCount = 0;
      const pendingFines = filteredFines.filter(fine => !fine.customerId);

      if (pendingFines.length === 0) {
        toast.info("No unassigned fines to process");
        setAssigningFines(false);
        return;
      }

      console.log(`Attempting to auto-assign ${pendingFines.length} fines`);

      for (const fine of pendingFines) {
        if (!fine.licensePlate) {
          console.log(`Skipping fine ${fine.id} - missing license plate`);
          continue;
        }

        try {
          console.log(`Assigning fine ${fine.id} with license plate ${fine.licensePlate}`);
          await assignToCustomer.mutate({ id: fine.id });
          assignedCount++;
        } catch (error) {
          console.error(`Failed to assign fine ${fine.id}:`, error);
          failedCount++;
        }
      }

      if (assignedCount > 0) {
        toast.success(`Successfully assigned ${assignedCount} out of ${pendingFines.length} fines to customers`);
      } else {
        toast.warning("No fines could be assigned to customers");
      }

      if (failedCount > 0) {
        toast.error(`Failed to assign ${failedCount} fines`);
      }
    } catch (error: any) {
      console.error("Auto-assignment error:", error);
      toast.error("There was an error assigning fines to customers: " + (error.message || "Unknown error"));
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Total Traffic Fines"
          value={filteredFines.length.toString()}
          description="Total number of traffic fines in the system"
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
        <StatCard 
          title="Assigned Fines"
          value={assignedFines.length.toString()}
          description={`Total amount: ${formatCurrency(assignedFinesAmount)}`}
          icon={UserCheck}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="Unassigned Fines"
          value={unassignedFines.length.toString()}
          description={`Total amount: ${formatCurrency(unassignedFinesAmount)}`}
          icon={Users}
          iconColor="text-red-500"
        />
      </div>

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
                disabled={assigningFines || isAutoAssigning}
                variant="secondary"
              >
                <UserCheck className="mr-2 h-4 w-4" /> 
                {(assigningFines || isAutoAssigning) ? "Assigning..." : "Auto-Assign"}
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
                {isLoading || isAutoAssigning ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {isAutoAssigning ? "Auto-assigning traffic fines..." : "Loading traffic fines..."}
                    </TableCell>
                  </TableRow>
                ) : filteredFines.length > 0 ? (
                  filteredFines.map((fine) => (
  <TrafficFineRow
    key={fine.id}
    fine={fine}
    onPay={handlePayFine}
    onDispute={handleDisputeFine}
    onAssign={(id) => assignToCustomer.mutate({ id })}
  />
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
    </div>
  );
};

export default TrafficFinesList;
