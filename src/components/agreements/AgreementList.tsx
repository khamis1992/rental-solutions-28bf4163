
import React, { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  asImportId, 
  asLeaseId,
  asLeaseStatus,
  castDeleteAgreementsResult,
  castRevertAgreementImportResult,
  castGenerateAgreementDocumentResult
} from '@/utils/database-type-helpers';
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Plus, FileText, Trash2, Edit, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { ImportRevertDialog } from "./ImportRevertDialog";
import { useAuth } from "@/contexts/AuthContext";

// Type for the database lease status to ensure type safety
type LeaseStatus = 'active' | 'pending' | 'completed' | 'cancelled' | 'pending_payment' | 'pending_deposit' | 'draft' | 'terminated' | 'archived' | 'closed';

const AgreementList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [agreementToDelete, setAgreementToDelete] = useState<string | null>(null);
  const [isImportRevertDialogOpen, setIsImportRevertDialogOpen] = useState(false);
  const [importToRevert, setImportToRevert] = useState<string | null>(null);
  const [imports, setImports] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchAgreements();
    fetchImports();
  }, [currentPage, statusFilter, searchTerm, refreshTrigger]);

  /**
   * Fetch agreement data with pagination and filters
   */
  const fetchAgreements = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("leases")
        .select(
          `
          *,
          vehicles:vehicle_id (
            make,
            model,
            license_plate
          ),
          customer:customer_id (
            full_name,
            phone_number,
            email
          )
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      // Apply status filter if selected
      if (statusFilter) {
        // Use asLeaseStatus for proper typing
        const typedStatus = asLeaseStatus(statusFilter as LeaseStatus);
        query = query.eq("status", typedStatus);
      }

      // Apply search term if provided
      if (searchTerm) {
        query = query.or(
          `agreement_number.ilike.%${searchTerm}%,vehicles.license_plate.ilike.%${searchTerm}%,customer.full_name.ilike.%${searchTerm}%,customer.phone_number.ilike.%${searchTerm}%`
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;

      if (count !== null) {
        setTotalPages(Math.ceil(count / pageSize));
      }

      setAgreements(data || []);
    } catch (error) {
      console.error("Error fetching agreements:", error);
      toast.error("Failed to load agreements");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch recent import data
   */
  const fetchImports = async () => {
    try {
      const { data, error } = await supabase
        .from("agreement_imports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setImports(data || []);
    } catch (error) {
      console.error("Error fetching imports:", error);
    }
  };

  /**
   * Handle delete button click
   */
  const handleDeleteClick = (id: string) => {
    setAgreementToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  /**
   * Handle deleting an import
   */
  const handleDeleteImport = async (importId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('delete_agreements_by_import_id', {
          p_import_id: asImportId(importId)
        });

      if (error) throw error;

      const typedResult = castDeleteAgreementsResult(data);
      
      if (typedResult && typedResult.success) {
        toast.success(`Successfully deleted ${typedResult.deleted_count} agreements`);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        toast.error(typedResult?.message || 'Failed to delete import');
      }
    } catch (err: any) {
      console.error("Error deleting import:", err);
      toast.error(err.message || 'An error occurred while deleting import');
    }
  };

  /**
   * Handle agreement deletion confirmation
   */
  const handleDeleteAgreement = async () => {
    if (!agreementToDelete) return;

    try {
      const typedLeaseId = asLeaseId(agreementToDelete);
      
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', typedLeaseId);

      if (error) throw error;
      toast.success('Agreement deleted successfully');
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      console.error("Error deleting agreement:", err);
      toast.error(err.message || 'An error occurred while deleting the agreement');
    } finally {
      setIsDeleteDialogOpen(false);
      setAgreementToDelete(null);
    }
  };

  /**
   * Handle revert import button click
   */
  const handleRevertImport = (importId: string) => {
    setImportToRevert(importId);
    setIsImportRevertDialogOpen(true);
  };

  /**
   * Confirm import reversion with reason
   */
  const confirmRevertImport = async (reason: string) => {
    if (!importToRevert) return;

    try {
      const { data, error } = await supabase.rpc("revert_agreement_import", {
        p_import_id: importToRevert,
        p_reason: reason,
        p_user_id: user?.id || null,
      });

      if (error) throw error;

      const typedResult = castRevertAgreementImportResult(data);

      if (typedResult && typedResult.success) {
        toast.success(`Successfully reverted import. ${typedResult.deleted_count} agreements deleted.`);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        toast.error(typedResult?.message || "Failed to revert import");
      }
    } catch (err: any) {
      console.error("Error reverting import:", err);
      toast.error(err.message || "An error occurred while reverting the import");
    } finally {
      setIsImportRevertDialogOpen(false);
      setImportToRevert(null);
    }
  };

  /**
   * Generate document for an agreement
   */
  const handleGenerateDocument = async (agreementId: string) => {
    try {
      const { data, error } = await supabase
        .rpc("generate_agreement_document", {
          p_agreement_id: agreementId,
        });

      if (error) throw error;

      const typedResult = castGenerateAgreementDocumentResult(data);

      if (typedResult && typedResult.success) {
        toast.success("Document generated successfully");
        if (typedResult.document_url) {
          window.open(typedResult.document_url, "_blank");
        }
      } else {
        toast.error(typedResult?.message || "Failed to generate document");
      }
    } catch (err: any) {
      console.error("Error generating document:", err);
      toast.error(err.message || "An error occurred while generating the document");
    }
  };

  /**
   * Get badge variant based on agreement status
   */
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "pending":
        return "warning";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      case "terminated":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with title and new agreement button */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Agreements</h2>
        <Button onClick={() => navigate("/agreements/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Agreement
        </Button>
      </div>

      {/* Filters card */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by agreement #, license plate, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setCurrentPage(1);
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agreement list card */}
      <Card>
        <CardHeader>
          <CardTitle>Agreement List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : agreements.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No agreements found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agreement #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreements.map((agreement) => (
                    <TableRow key={agreement.id}>
                      <TableCell className="font-medium">
                        {agreement.agreement_number}
                      </TableCell>
                      <TableCell>
                        {agreement.customer?.full_name}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {agreement.customer?.phone_number}
                        </span>
                      </TableCell>
                      <TableCell>
                        {agreement.vehicles?.make} {agreement.vehicles?.model}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {agreement.vehicles?.license_plate}
                        </span>
                      </TableCell>
                      <TableCell>
                        {agreement.start_date
                          ? format(new Date(agreement.start_date), "MMM d, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {agreement.end_date
                          ? format(new Date(agreement.end_date), "MMM d, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(agreement.status)}>
                          {agreement.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => navigate(`/agreements/${agreement.id}`)}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate(`/agreements/edit/${agreement.id}`)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleGenerateDocument(agreement.id)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Generate Document
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(agreement.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent imports card */}
      {imports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Imports</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Import Date</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((importItem) => (
                  <TableRow key={importItem.id}>
                    <TableCell>
                      {format(new Date(importItem.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{importItem.file_name}</TableCell>
                    <TableCell>{importItem.record_count}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          importItem.status === "completed"
                            ? "success"
                            : importItem.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {importItem.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleRevertImport(importItem.id)}
                          >
                            Revert Import
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteImport(importItem.id)}
                            className="text-red-600"
                          >
                            Delete Import
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Confirmation dialogs */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setAgreementToDelete(null);
        }}
        onConfirm={handleDeleteAgreement}
        itemType="agreement"
      />

      <ImportRevertDialog
        isOpen={isImportRevertDialogOpen}
        onClose={() => {
          setIsImportRevertDialogOpen(false);
          setImportToRevert(null);
        }}
        onConfirm={confirmRevertImport}
      />
    </div>
  );
};

export default AgreementList;
