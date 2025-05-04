
import React from 'react';
import { Button } from "@/components/ui/button";
import { FilePlus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementTable } from './table/AgreementTable';
import { Agreement } from '@/types/agreement';
import { SimpleAgreement } from '@/hooks/use-agreements';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AgreementList() {
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  
  const {
    agreements,
    isLoading,
    error,
    rowSelection,
    setRowSelection,
    isDeleting,
    handleBulkDelete,
  } = useAgreementTable();

  const selectedCount = Object.keys(rowSelection).length;

  // For debugging
  React.useEffect(() => {
    if (agreements && agreements.length > 0) {
      console.log("Sample agreement data structure:", agreements[0]);
    }
  }, [agreements]);

  // Cast agreements to the correct type with the required fields
  const typedAgreements = agreements?.map((agreement: SimpleAgreement) => {
    // Check if data is coming from "profiles" or "customers" property
    const customerData = agreement.profiles || agreement.customers;
    const customerName = 
      customerData?.full_name || // From profiles/customers object
      agreement.customer_name || // From flattened data
      'N/A';  // Fallback
    
    const customerId = 
      customerData?.id || // From profiles/customers object
      agreement.customer_id || // From flattened data
      '';
      
    return {
      ...agreement,
      payment_frequency: 'monthly', // Default value for type compatibility
      payment_day: 1, // Default value for type compatibility
      customers: {
        full_name: customerName,
        id: customerId
      },
    };
  }) as Agreement[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete ({selectedCount})
            </Button>
          )}
        </div>
        <Button asChild>
          <Link to="/agreements/add">
            <FilePlus className="h-4 w-4 mr-2" />
            New Agreement
          </Link>
        </Button>
      </div>

      <AgreementTable
        agreements={typedAgreements}
        isLoading={isLoading}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        deleteAgreement={handleBulkDelete}
      />

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} Agreements</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected agreements? 
              This action cannot be undone and will permanently remove the selected agreements from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBulkDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </>
              ) : (
                'Delete Agreements'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
