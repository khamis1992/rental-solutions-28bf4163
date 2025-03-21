
import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';

const TrafficFinesList = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data - would be replaced with API data
  const trafficFines = [
    {
      id: '1',
      violationNumber: 'TF-2023-001',
      licensePlate: 'ABC-123',
      vehicleModel: 'Toyota Camry',
      violationDate: new Date('2023-09-15'),
      fineAmount: 150,
      violationCharge: 'Speeding (20km over limit)',
      paymentStatus: 'pending',
      location: 'Highway 101, Exit 23'
    },
    {
      id: '2',
      violationNumber: 'TF-2023-002',
      licensePlate: 'XYZ-456',
      vehicleModel: 'Honda Accord',
      violationDate: new Date('2023-10-02'),
      fineAmount: 75,
      violationCharge: 'Illegal Parking',
      paymentStatus: 'paid',
      location: 'Downtown, Main St.'
    },
    {
      id: '3',
      violationNumber: 'TF-2023-003',
      licensePlate: 'DEF-789',
      vehicleModel: 'Ford Explorer',
      violationDate: new Date('2023-10-10'),
      fineAmount: 200,
      violationCharge: 'Red Light Violation',
      paymentStatus: 'disputed',
      location: 'Junction Ave & 5th St'
    },
  ];

  const filteredFines = trafficFines.filter(fine => 
    fine.violationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fine.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fine.violationCharge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePayFine = (id: string) => {
    toast({
      title: "Processing payment",
      description: `Payment for fine #${id} has been processed.`,
    });
  };

  const handleDisputeFine = (id: string) => {
    toast({
      title: "Dispute submitted",
      description: `Dispute for fine #${id} has been submitted.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'disputed':
        return <Badge variant="outline">Disputed</Badge>;
      case 'pending':
      default:
        return <Badge variant="destructive">Pending</Badge>;
    }
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
          <Button className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Fine
          </Button>
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
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFines.length > 0 ? (
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
                    <TableCell className="hidden md:table-cell">{fine.location}</TableCell>
                    <TableCell>${fine.fineAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      {getStatusBadge(fine.paymentStatus)}
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No traffic fines found.
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
