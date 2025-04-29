
import React from 'react';
import { Button } from "@/components/ui/button";
import { FilePlus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import VirtualizedAgreementTable from './table/VirtualizedAgreementTable';
import { mapDbToAgreement } from '@/services/agreement/transformations';
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
  
  // Map database agreements to proper Agreement type including required fields
  const mappedAgreements = agreements?.map(agreement => mapDbToAgreement(agreement)) || [];

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

      <VirtualizedAgreementTable
        agreements={mappedAgreements}
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
