
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrafficFines } from "@/hooks/use-traffic-fines";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Plus, FilterX, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TrafficFinesListProps {
  onAddFine: () => void;
  onInvalidAssignmentsFound?: (hasInvalid: boolean) => void;
  showInvalidAssignments?: boolean;
  triggerCleanup?: boolean;
}

const TrafficFinesList = ({
  onAddFine,
  onInvalidAssignmentsFound,
  showInvalidAssignments = false,
  triggerCleanup = false,
}: TrafficFinesListProps) => {
  const {
    trafficFines,
    isLoading,
    error,
    payTrafficFine,
    disputeTrafficFine,
    assignToCustomer,
    cleanupInvalidAssignments,
    isValidFine,
    bulkProcessFines,
  } = useTrafficFines();

  const [fines, setFines] = useState<any[]>([]);
  const [filteredFines, setFilteredFines] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [showPaidOnly, setShowPaidOnly] = useState(false);
  const [hasInvalidAssignments, setHasInvalidAssignments] = useState(false);

  // Handle cleanup trigger from parent
  useEffect(() => {
    if (triggerCleanup) {
      handleCleanupInvalidAssignments();
    }
  }, [triggerCleanup]);

  // Process fines data
  useEffect(() => {
    if (trafficFines) {
      const processedFines = trafficFines.map((fine) => {
        const valid = isValidFine(fine);
        return {
          ...fine,
          valid,
        };
      });

      setFines(processedFines);

      // Check for invalid assignments
      const invalidAssignments = processedFines.filter(
        (fine) => fine.customerId && !fine.valid
      );
      setHasInvalidAssignments(invalidAssignments.length > 0);
      
      if (onInvalidAssignmentsFound) {
        onInvalidAssignmentsFound(invalidAssignments.length > 0);
      }
    }
  }, [trafficFines, isValidFine, onInvalidAssignmentsFound]);

  // Apply filters
  useEffect(() => {
    if (!fines) return;

    let result = [...fines];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (fine) =>
          (fine.licensePlate || "").toLowerCase().includes(search) ||
          (fine.violationNumber || "").toLowerCase().includes(search) ||
          (fine.customerName || "").toLowerCase().includes(search) ||
          (fine.location || "").toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((fine) => fine.paymentStatus === statusFilter);
    }

    // Assignment filter
    if (assignmentFilter !== "all") {
      if (assignmentFilter === "assigned") {
        result = result.filter((fine) => !!fine.customerId);
      } else if (assignmentFilter === "unassigned") {
        result = result.filter((fine) => !fine.customerId);
      } else if (assignmentFilter === "invalid") {
        result = result.filter((fine) => fine.customerId && !fine.valid);
      }
    }

    // Show unassigned only
    if (showUnassignedOnly) {
      result = result.filter((fine) => !fine.customerId);
    }

    // Show paid only
    if (showPaidOnly) {
      result = result.filter((fine) => fine.paymentStatus === "paid");
    }

    // Show invalid assignments explicitly
    if (showInvalidAssignments) {
      result = result.filter((fine) => fine.customerId && !fine.valid);
    }

    setFilteredFines(result);
  }, [
    fines,
    searchTerm,
    statusFilter,
    assignmentFilter,
    showUnassignedOnly,
    showPaidOnly,
    showInvalidAssignments,
  ]);

  const handlePayFine = async (id: string) => {
    try {
      await payTrafficFine.mutateAsync({ id });
    } catch (error) {
      console.error("Error paying fine:", error);
    }
  };

  const handleDisputeFine = async (id: string) => {
    try {
      await disputeTrafficFine.mutateAsync({ id });
    } catch (error) {
      console.error("Error disputing fine:", error);
    }
  };

  const handleAssignToCustomer = async (id: string) => {
    try {
      await assignToCustomer.mutateAsync({ id });
      toast.success("Fine assigned to customer successfully");
    } catch (error) {
      console.error("Error assigning fine:", error);
      toast.error("Failed to assign fine", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleCleanupInvalidAssignments = async () => {
    setIsProcessing(true);
    try {
      await cleanupInvalidAssignments.mutateAsync();
      // Success message handled by the hook
    } catch (error) {
      console.error("Error cleaning up invalid assignments:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBulkProcess = async () => {
    const unassignedFines = fines.filter(fine => !fine.customerId);
    
    if (unassignedFines.length === 0) {
      toast.warning("No unassigned fines to process");
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await bulkProcessFines({
        batchSize: 5,
        concurrency: 2,
        silent: false,
        onSuccess: (results: any) => {
          // This callback will be handled within the bulkProcessFines function
          console.log("Batch processing completed:", results);
        }
      });
      
      toast.success(`Processed ${result.processed} fines`, {
        description: `Successfully assigned: ${result.assigned}, Failed: ${result.failed}`
      });
    } catch (error) {
      console.error("Error in bulk processing:", error);
      toast.error("Bulk processing failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const columns = [
    {
      accessorKey: "violationNumber",
      header: "Violation #",
    },
    {
      accessorKey: "licensePlate",
      header: "License Plate",
    },
    {
      accessorKey: "violationDate",
      header: "Date",
      cell: ({ row }: any) => {
        const date = row.getValue("violationDate");
        return date ? format(new Date(date), "dd MMM yyyy") : "N/A";
      },
    },
    {
      accessorKey: "location",
      header: "Location",
    },
    {
      accessorKey: "fineAmount",
      header: "Amount",
      cell: ({ row }: any) => {
        const amount = parseFloat(row.getValue("fineAmount"));
        return !isNaN(amount) ? `QAR ${amount.toLocaleString()}` : "N/A";
      },
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }: any) => {
        const customerName = row.getValue("customerName");
        const valid = row.original.valid;
        const hasCustomer = !!row.original.customerId;
        
        if (!hasCustomer) return <span className="text-muted-foreground">Unassigned</span>;
        
        return (
          <div className="flex items-center">
            <span>{customerName || "Unknown"}</span>
            {hasCustomer && !valid && (
              <Badge variant="destructive" className="ml-2">Invalid</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.getValue("paymentStatus");
        return (
          <Badge
            className={
              status === "paid"
                ? "bg-green-500"
                : status === "disputed"
                ? "bg-yellow-500"
                : "bg-red-500"
            }
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }: any) => {
        const fine = row.original;
        return (
          <div className="flex items-center gap-2">
            {!fine.customerId ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAssignToCustomer(fine.id)}
              >
                Assign
              </Button>
            ) : (
              <>
                {fine.paymentStatus === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePayFine(fine.id)}
                    >
                      Pay
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisputeFine(fine.id)}
                    >
                      Dispute
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading traffic fines</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Unknown error occurred"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Traffic Fines</CardTitle>
        <div className="flex items-center space-x-2">
          <Button onClick={onAddFine} className="h-8">
            <Plus className="h-4 w-4 mr-2" />
            Add Fine
          </Button>
          <Button 
            onClick={handleBulkProcess} 
            variant="outline"
            className="h-8"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Bulk Process
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search fines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
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
            <div>
              <Select
                value={assignmentFilter}
                onValueChange={setAssignmentFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignments</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value="invalid">Invalid Assignments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-end space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="unassigned"
                  checked={showUnassignedOnly}
                  onCheckedChange={setShowUnassignedOnly}
                />
                <Label htmlFor="unassigned" className="text-sm">Unassigned</Label>
              </div>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setAssignmentFilter("all");
                  setShowUnassignedOnly(false);
                  setShowPaidOnly(false);
                }}
                className="h-8"
              >
                <FilterX className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>

          {hasInvalidAssignments && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Invalid Assignments Detected</AlertTitle>
              <AlertDescription className="flex justify-between items-center">
                <span>
                  Some traffic fines are assigned to customers but the violation dates
                  fall outside the lease periods.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCleanupInvalidAssignments}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Fixing...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-3 w-3" />
                      Fix Invalid Assignments
                    </>
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Table */}
          <DataTable columns={columns} data={filteredFines} />

          {filteredFines.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p>No traffic fines match your filters</p>
              {searchTerm || statusFilter !== "all" || assignmentFilter !== "all" || showUnassignedOnly || showPaidOnly ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setAssignmentFilter("all");
                    setShowUnassignedOnly(false);
                    setShowPaidOnly(false);
                  }}
                  className="mt-2"
                >
                  <FilterX className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficFinesList;
