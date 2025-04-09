import React, { useState, useMemo } from 'react';
import { useAgreements } from '@/hooks/use-agreements';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

const AgreementList = ({ searchQuery }: { searchQuery: string }) => {
  const { 
    agreements, 
    isLoading, 
    error, 
    fetchAgreementById,
    deleteAgreement
  } = useAgreements();
  
  // Create a local array to hold the agreements and make TypeScript happy
  const agreementsArray = Array.isArray(agreements) ? agreements : [];
  
  const [filters, setFilters] = useState({
    status: '',
  });
  
  // Filter agreements based on search query and status filter
  const filteredAgreements = useMemo(() => {
    return agreementsArray.filter(agreement => {
      // Status filter
      if (filters.status && agreement.status !== filters.status) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        // Search in relevant fields
        return (
          (agreement.agreement_number?.toLowerCase().includes(searchLower)) ||
          (agreement.customer_name?.toLowerCase().includes(searchLower)) ||
          (agreement.vehicle_details?.license_plate?.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
  }, [agreementsArray, filters.status, searchQuery]);
  
  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status }));
  };
  
  const handleDeleteAgreement = async (id: string) => {
    try {
      await deleteAgreement(id);
      toast.success("Agreement deleted successfully");
    } catch (error) {
      console.error("Error deleting agreement:", error);
      toast.error("Failed to delete agreement");
    }
  };

  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-4">
        <AgreementStatusFilter
          currentStatus={filters.status}
          onStatusChange={handleStatusChange}
        />
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredAgreements.map((agreement) => (
          <AgreementCard
            key={agreement.id}
            agreement={agreement}
            onDelete={handleDeleteAgreement}
          />
        ))}
      </div>
    </div>
  );

  function AgreementStatusFilter({ currentStatus, onStatusChange }: { currentStatus: string, onStatusChange: (status: string) => void }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            Status
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onStatusChange('')}>
            All
          </DropdownMenuItem>
          {Object.values(AgreementStatus).map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => onStatusChange(status)}
            >
              {status}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  function AgreementCard({ agreement, onDelete }: { agreement: any, onDelete: (id: string) => void }) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    return (
      <Card>
        <CardHeader>
          <CardTitle>{agreement.agreement_number}</CardTitle>
          <CardDescription>
            {agreement.customer_name} - {agreement.vehicle_details?.license_plate}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate(`/agreements/${agreement.id}`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="space-y-1">
            <p>
              Status: <Badge variant="secondary">{agreement.status}</Badge>
            </p>
            <p>Start Date: {agreement.start_date}</p>
            <p>End Date: {agreement.end_date}</p>
            <p>Total Amount: {agreement.total_amount}</p>
          </div>
        </CardContent>
        <ConfirmDeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => {
            onDelete(agreement.id);
            setIsDeleteDialogOpen(false);
          }}
          itemType="agreement"
          itemName={agreement.agreement_number}
        />
      </Card>
    )
  }
};

export default AgreementList;
