import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';
import { 
  MoreHorizontal, 
  FileCheck, 
  FileX, 
  FileClock, 
  FileText, 
  FileEdit,
  Trash2,
  UserPlus,
  Car,
  Calendar,
  Banknote,
  Info,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { toast } from 'sonner';
import { asLeaseIdColumn } from '@/utils/database-type-helpers';

export function AgreementList() {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const navigate = useNavigate();
  
  const { 
    agreements, 
    isLoading, 
    error,
    deleteAgreement 
  } = useAgreements();
  
  const totalAgreements = agreements?.length || 0;
  const totalPages = Math.ceil(totalAgreements / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentAgreements = agreements?.slice(startIndex, endIndex) || [];

  const handleBulkDelete = async () => {
    if (!agreements) return;
    
    setIsDeleting(true);
    
    const selectedIds = Object.keys(rowSelection).map(id => id);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const id of selectedIds) {
      try {
        await deleteAgreement.mutateAsync(id);
        successCount++;
      } catch (err) {
        console.error('Error deleting:', err);
        errorCount++;
      }
    }
    
    if (errorCount === 0) {
      toast.success(`Successfully deleted ${successCount} agreement${successCount !== 1 ? 's' : ''}`);
    } else if (successCount === 0) {
      toast.error(`Failed to delete any agreements`);
    } else {
      toast.warning(`Deleted ${successCount} agreement${successCount !== 1 ? 's' : ''}, but failed to delete ${errorCount}`);
    }
    
    setRowSelection({});
    setBulkDeleteDialogOpen(false);
    setIsDeleting(false);
  };

  const selectedCount = Object.keys(rowSelection).length;
  const allSelected = currentAgreements.length > 0 && 
    currentAgreements.every(agreement => !!agreement.id && rowSelection[agreement.id]);
  
  const handleSelectAll = () => {
    if (allSelected) {
      setRowSelection({});
    } else {
      const newSelection = { ...rowSelection };
      currentAgreements.forEach(agreement => {
        if (agreement.id) {
          newSelection[agreement.id] = true;
        }
      });
      setRowSelection(newSelection);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "warning" | "success" | "destructive" | "outline", icon: any }> = {
      [AgreementStatus.ACTIVE]: { variant: "success", icon: FileCheck },
      [AgreementStatus.DRAFT]: { variant: "secondary", icon: FileEdit },
      [AgreementStatus.PENDING]: { variant: "warning", icon: FileClock },
      [AgreementStatus.EXPIRED]: { variant: "outline", icon: FileText },
      [AgreementStatus.CANCELLED]: { variant: "destructive", icon: FileX },
      [AgreementStatus.CLOSED]: { variant: "outline", icon: FileText },
    };
    
    const { variant, icon: Icon } = variants[status] || variants[AgreementStatus.DRAFT];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-3 text-red-600">
          <XCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Error loading agreements</h3>
            <p className="text-sm">{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
          </div>
        </div>
      </Card>
    );
  }

  const renderMobileView = () => {
    return (
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={`skeleton-card-${i}`} className="p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))
        ) : (
          currentAgreements.map(agreement => (
            <Card 
              key={agreement.id} 
              className="p-4 space-y-3 hover:bg-muted/50 cursor-pointer"
              onClick={() => navigate(`/agreements/${agreement.id}`)}
            >
              <div className="flex justify-between items-center">
                <div className="font-medium">{agreement.agreement_number}</div>
                {getStatusBadge(agreement.status as string)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <div className="flex items-center text-muted-foreground">
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Customer
                  </div>
                  <div>{agreement.customers?.full_name || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center text-muted-foreground">
                    <Car className="h-3.5 w-3.5 mr-1.5" />
                    Vehicle
                  </div>
                  <div>{agreement.vehicles?.license_plate || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center text-muted-foreground">
                    <Banknote className="h-3.5 w-3.5 mr-1.5" />
                    Monthly
                  </div>
                  <div className="font-medium">{formatCurrency(agreement.rent_amount || 0)}</div>
                </div>
              </div>
              <div className="flex justify-between border-t pt-2">
                <div className="text-xs flex items-center text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  {agreement.start_date ? format(new Date(agreement.start_date), 'MMM d, yyyy') : 'N/A'}
                  {" - "}
                  {agreement.end_date ? format(new Date(agreement.end_date), 'MMM d, yyyy') : 'N/A'}
                </div>
                <Button variant="ghost" size="sm">Details</Button>
              </div>
            </Card>
          ))
        )}
      </div>
    );
  };

  const renderDesktopView = () => {
    return (
      <div>
        {selectedCount > 0 && (
          <div className="bg-muted/80 p-2 mb-4 rounded-md flex items-center justify-between">
            <div className="flex items-center">
              <Checkbox 
                checked={allSelected} 
                onCheckedChange={handleSelectAll}
                className="mr-2"
              />
              <span className="text-sm font-medium">{selectedCount} selected</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
                className="h-8"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={allSelected} 
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Agreement #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Rental Period</TableHead>
                <TableHead>Monthly Rent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`} className="animate-pulse">
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : currentAgreements.length > 0 ? (
                currentAgreements.map((agreement) => (
                  <TableRow key={agreement.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox 
                        checked={agreement.id ? !!rowSelection[agreement.id] : false}
                        onCheckedChange={() => {
                          if (!agreement.id) return;
                          setRowSelection(prev => ({
                            ...prev,
                            [agreement.id]: !prev[agreement.id]
                          }))
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link 
                        to={`/agreements/${agreement.id}`}
                        className="text-primary hover:underline"
                      >
                        {agreement.agreement_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {agreement.customers && agreement.customer_id ? (
                        <Link 
                          to={`/customers/${agreement.customer_id}`}
                          className="hover:underline flex items-center"
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          {agreement.customers.full_name || 'N/A'}
                        </Link>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {agreement.vehicles && agreement.vehicle_id ? (
                        <Link 
                          to={`/vehicles/${agreement.vehicle_id}`}
                          className="hover:underline flex items-center"
                        >
                          <Car className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          {agreement.vehicles.make} {agreement.vehicles.model}
                          {agreement.vehicles.license_plate && (
                            <span className="font-medium text-primary ml-1">
                              ({agreement.vehicles.license_plate})
                            </span>
                          )}
                        </Link>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {agreement.start_date ? format(new Date(agreement.start_date), 'MMM d, yyyy') : 'N/A'} - 
                      {agreement.end_date ? format(new Date(agreement.end_date), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(agreement.rent_amount || 0)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(agreement.status as string)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to={`/agreements/${agreement.id}`}>View details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/agreements/edit/${agreement.id}`}>Edit agreement</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete agreement ${agreement.agreement_number}?`)) {
                                deleteAgreement.mutate(agreement.id as string);
                              }
                            }}
                          >
                            Delete agreement
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Info className="h-5 w-5 text-muted-foreground" />
                      <p>No agreements found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="md:hidden">
        {renderMobileView()}
      </div>
      <div className="hidden md:block">
        {renderDesktopView()}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, i, array) => {
                if (i > 0 && page > array[i - 1] + 1) {
                  return (
                    <React.Fragment key={`ellipsis-${page}`}>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={page === currentPage}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    </React.Fragment>
                  );
                }
                
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      isActive={page === currentPage}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
            
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

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
