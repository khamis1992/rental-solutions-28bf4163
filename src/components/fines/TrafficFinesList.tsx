
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertTriangle, Check, Clock, Search, MoreHorizontal, Filter, FileText, DollarSign, Ban, CarTaxiFront } from "lucide-react";
import { toast } from "sonner";

interface TrafficFine {
  id: string;
  licensePlate: string;
  violationDate: string;
  violationType: string;
  fineAmount: number;
  location: string;
  serialNumber: string;
  violationPoints: number;
  paymentStatus: 'pending' | 'paid' | 'disputed';
  driver: string;
  vehicle: string;
}

// Sample data for the fines list
const sampleFines: TrafficFine[] = [
  {
    id: "1",
    licensePlate: "ABC123",
    violationDate: "2023-06-15",
    violationType: "speeding",
    fineAmount: 500,
    location: "Al Waab Street",
    serialNumber: "SPD12345",
    violationPoints: 3,
    paymentStatus: "pending",
    driver: "Ali Hassan",
    vehicle: "Toyota Camry 2022"
  },
  {
    id: "2",
    licensePlate: "XYZ789",
    violationDate: "2023-07-22",
    violationType: "parking",
    fineAmount: 300,
    location: "City Center Mall",
    serialNumber: "PRK67890",
    violationPoints: 1,
    paymentStatus: "paid",
    driver: "Mohammed Al-Mahmoud",
    vehicle: "Nissan Altima 2021"
  },
  {
    id: "3",
    licensePlate: "QTR456",
    violationDate: "2023-08-01",
    violationType: "red_light",
    fineAmount: 1000,
    location: "Corniche Intersection",
    serialNumber: "RLV54321",
    violationPoints: 6,
    paymentStatus: "disputed",
    driver: "Fatima Al-Khalifa",
    vehicle: "BMW X5 2023"
  },
  {
    id: "4",
    licensePlate: "DHG781",
    violationDate: "2023-08-12",
    violationType: "driving_behavior",
    fineAmount: 800,
    location: "Lusail Road",
    serialNumber: "BHV98765",
    violationPoints: 4,
    paymentStatus: "pending",
    driver: "Ahmed Al-Sulaiti",
    vehicle: "Lexus ES 2020"
  },
  {
    id: "5",
    licensePlate: "JKL321",
    violationDate: "2023-08-18",
    violationType: "documentation",
    fineAmount: 200,
    location: "Immigration Checkpoint",
    serialNumber: "DOC24680",
    violationPoints: 0,
    paymentStatus: "pending",
    driver: "Noora Al-Thani",
    vehicle: "Range Rover Sport 2022"
  }
];

const violationTypeMap: Record<string, string> = {
  "speeding": "Speeding",
  "parking": "Illegal Parking",
  "red_light": "Red Light Violation",
  "driving_behavior": "Unsafe Driving Behavior",
  "documentation": "Missing Documentation",
  "lane_violation": "Lane Violation",
  "phone_usage": "Phone Usage While Driving",
  "other": "Other"
};

interface TrafficFinesListProps {
  onAddFine?: () => void;
}

const TrafficFinesList: React.FC<TrafficFinesListProps> = ({ onAddFine }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fines, setFines] = useState<TrafficFine[]>(sampleFines);
  const [loading, setLoading] = useState(false);

  const filteredFines = fines.filter(fine => {
    // Apply status filter
    if (statusFilter !== "all" && fine.paymentStatus !== statusFilter) {
      return false;
    }
    
    // Apply search filter (case-insensitive)
    const searchLower = searchQuery.toLowerCase();
    return (
      searchQuery === "" || 
      fine.licensePlate.toLowerCase().includes(searchLower) ||
      fine.serialNumber.toLowerCase().includes(searchLower) ||
      fine.driver.toLowerCase().includes(searchLower) ||
      fine.vehicle.toLowerCase().includes(searchLower) ||
      fine.location.toLowerCase().includes(searchLower)
    );
  });
  
  const handlePayFine = async (fineId: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the local state
      setFines(fines.map(fine => 
        fine.id === fineId ? { ...fine, paymentStatus: 'paid' } : fine
      ));
      
      toast.success("Fine marked as paid successfully");
    } catch (error: any) {
      toast.error(`Failed to process payment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDisputeFine = async (fineId: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the local state
      setFines(fines.map(fine => 
        fine.id === fineId ? { ...fine, paymentStatus: 'disputed' } : fine
      ));
      
      toast.success("Fine marked as disputed. A review will be conducted.");
    } catch (error: any) {
      toast.error(`Failed to register dispute: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paid':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'disputed':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Disputed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center">
              <CarTaxiFront className="mr-2 h-5 w-5" />
              Traffic Fines
            </CardTitle>
            <CardDescription>
              Manage and track all traffic fines
            </CardDescription>
          </div>
          
          <Button onClick={onAddFine} className="w-full sm:w-auto">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Record New Fine
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by license plate, driver or reference..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
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
              
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Violation</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No traffic fines found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFines.map((fine) => (
                    <TableRow key={fine.id}>
                      <TableCell className="font-medium">
                        {fine.licensePlate}
                      </TableCell>
                      <TableCell>
                        {violationTypeMap[fine.violationType] || fine.violationType}
                      </TableCell>
                      <TableCell>
                        {new Date(fine.violationDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        QAR {fine.fineAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(fine.paymentStatus)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {fine.paymentStatus === 'pending' && (
                              <>
                                <DropdownMenuItem 
                                  className="flex items-center"
                                  onClick={() => handlePayFine(fine.id)}
                                  disabled={loading}
                                >
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Mark as Paid
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="flex items-center"
                                  onClick={() => handleDisputeFine(fine.id)}
                                  disabled={loading}
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Dispute Fine
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficFinesList;
