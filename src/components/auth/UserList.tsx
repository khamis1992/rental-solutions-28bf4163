import React, { useEffect, useState } from "react";
import { 
  ColumnDef, 
  flexRender, 
  getCoreRowModel, 
  useReactTable, 
  SortingState,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnFiltersState,
  getFilteredRowModel
} from "@tanstack/react-table";
import { CheckCircle, Clock, XCircle, MoreHorizontal, Search, Filter, Trash2, AlertCircle } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useProfile } from "@/contexts/ProfileContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { UserRoleManager } from "./UserRoleManager";

interface UserData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface PermissionSettings {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

interface UserPermissions {
  vehicles: PermissionSettings;
  customers: PermissionSettings;
  agreements: PermissionSettings;
  financials: PermissionSettings;
  userManagement: PermissionSettings;
}

const DEFAULT_PERMISSIONS: Record<string, UserPermissions> = {
  admin: {
    vehicles: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    agreements: { view: true, create: true, edit: true, delete: true },
    financials: { view: true, create: true, edit: true, delete: true },
    userManagement: { view: true, create: true, edit: true, delete: true }
  },
  staff: {
    vehicles: { view: true, create: true, edit: true, delete: false },
    customers: { view: true, create: true, edit: true, delete: false },
    agreements: { view: true, create: true, edit: true, delete: false },
    financials: { view: true, create: false, edit: false, delete: false },
    userManagement: { view: false, create: false, edit: false, delete: false }
  }
};

const UserList = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
    admins: 0,
    staff: 0
  });
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeletingUsers, setBulkDeletingUsers] = useState(false);
  const { profile } = useProfile();
  
  const form = useForm({
    defaultValues: {
      role: "",
    }
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      const stats = {
        total: users.length,
        active: users.filter(user => user.status === 'active').length,
        pending: users.filter(user => user.status === 'pending_review').length,
        inactive: users.filter(user => user.status === 'inactive').length,
        admins: users.filter(user => user.role === 'admin').length,
        staff: users.filter(user => user.role === 'staff').length
      };
      setUserStats(stats);
    }
  }, [users]);

  useEffect(() => {
    if (selectedUser) {
      form.setValue("role", selectedUser.role);
      
      setUserPermissions(DEFAULT_PERMISSIONS[selectedUser.role as keyof typeof DEFAULT_PERMISSIONS] || DEFAULT_PERMISSIONS.staff);
    }
  }, [selectedUser, form]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log("Fetching users from Supabase...");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .not('role', 'eq', 'customer');
      
      if (error) {
        console.error("Error details:", error);
        throw error;
      }
      
      console.log("Fetched users:", data);
      setUsers(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Failed: ${(error as { message: string }).message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setDeletingUser(true);
      
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);
      
      if (profileError) {
        console.error("Error deleting user profile:", profileError);
        throw profileError;
      }
      
      setUsers(users.filter(user => user.id !== userId));
      toast.success("User deleted successfully");
      
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Failed: ${(error as { message: string }).message || 'Unknown error'}`);
    } finally {
      setDeletingUser(false);
    }
  };

  const bulkDeleteUsersByEmail = async (email: string, excludeUserId: string) => {
    try {
      setBulkDeletingUsers(true);
      
      const usersToDelete = users.filter(user => 
        user.email === email && user.id !== excludeUserId
      );
      
      if (usersToDelete.length === 0) {
        toast.info("No duplicate users found with this email");
        return;
      }
      
      for (const user of usersToDelete) {
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", user.id);
        
        if (error) {
          console.error(`Error deleting user ${user.id}:`, error);
          throw error;
        }
      }
      
      await fetchUsers();
      
      toast.success(`Successfully deleted ${usersToDelete.length} duplicate user(s)`);
      
      setShowBulkDeleteDialog(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Failed: ${(error as { message: string }).message || 'Unknown error'}`);
    } finally {
      setBulkDeletingUsers(false);
    }
  };

  const handleDeleteKhamis = async () => {
    if (!profile) {
      toast.error("Cannot delete users: Your profile is not loaded");
      return;
    }
    
    try {
      setBulkDeletingUsers(true);
      console.log("Starting deletion of duplicate Khamis accounts");
      
      // Find all Khamis accounts except the current user's account
      const khamisUsers = users.filter(user => 
        user.email === "khamis-1992@hotmail.com" && user.id !== profile.id
      );
      
      console.log(`Found ${khamisUsers.length} duplicate Khamis accounts to delete`);
      
      if (khamisUsers.length === 0) {
        toast.info("No duplicate users found with this email");
        setBulkDeletingUsers(false);
        return;
      }
      
      // Loop through and delete each duplicate account
      const deletionPromises = khamisUsers.map(async (user) => {
        console.log(`Attempting to delete user ${user.id}`);
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", user.id);
        
        if (error) {
          console.error(`Error deleting user ${user.id}:`, error);
          throw error;
        }
        console.log(`Successfully deleted user ${user.id}`);
        return user.id;
      });
      
      // Wait for all deletions to complete
      await Promise.all(deletionPromises);
      
      // Refresh user list
      await fetchUsers();
      
      toast.success(`Successfully deleted ${khamisUsers.length} duplicate Khamis account(s)`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Failed: ${(error as { message: string }).message || 'Unknown error'}`);
    } finally {
      setBulkDeletingUsers(false);
    }
  };

  const openDeleteDialog = (user: UserData) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const updateAdminAccounts = async () => {
    try {
      const { error: tarekError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("email", "tareklaribi25914@gmail.com");
      
      if (tarekError) {
        console.error("Error updating Tarek's role:", tarekError);
        throw tarekError;
      }
      
      console.log("Tarek's account has been set as admin");
      
      const { error: khamisError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("email", "khamis-1992@hotmail.com");
      
      if (khamisError) {
        console.error("Error updating Khamis's role:", khamisError);
        throw khamisError;
      }
      
      console.log("Khamis's account has been set as admin");
      
      fetchUsers();
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Failed: ${(error as { message: string }).message || 'Unknown error'}`);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const validStatus = newStatus as "active" | "inactive" | "suspended" | "pending_review" | "blacklisted";
      
      const { error } = await supabase
        .from("profiles")
        .update({ status: validStatus })
        .eq("id", userId);
      
      if (error) {
        console.error("Update status error details:", error);
        throw error;
      }
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      
      toast.success(`User status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Failed: ${(error as { message: string }).message || 'Unknown error'}`);
    }
  };

  const openPermissionDialog = (user: UserData) => {
    setSelectedUser(user);
    setShowPermissionDialog(true);
  };

  const savePermissions = async () => {
    if (!selectedUser || !userPermissions) return;
    
    setSaving(true);
    try {
      const newRole = form.getValues("role");
      
      if (newRole !== selectedUser.role) {
        await supabase
          .from("profiles")
          .update({ role: newRole })
          .eq("id", selectedUser.id);
      }
      
      toast.success("User permissions updated successfully");
      setShowPermissionDialog(false);
      
      fetchUsers();
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Failed: ${(error as { message: string }).message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = (value: string) => {
    form.setValue("role", value);
    
    setUserPermissions(DEFAULT_PERMISSIONS[value as keyof typeof DEFAULT_PERMISSIONS] || DEFAULT_PERMISSIONS.staff);
  };

  const updatePermission = (section: keyof UserPermissions, action: keyof PermissionSettings, value: boolean) => {
    if (!userPermissions) return;
    
    setUserPermissions(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [action]: value
        }
      };
    });
  };

  const isCurrentUser = (userId: string) => {
    return profile?.id === userId;
  };

  const filteredUsers = users.filter(user => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    if (statusFilter !== "all" && user.status !== statusFilter) return false;
    return true;
  });

  const columns: ColumnDef<UserData>[] = [
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => {
        const value = row.getValue("full_name") as string;
        return <div className="font-medium">{value || "N/A"}</div>;
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        return <div className="text-sm text-muted-foreground">{row.getValue("email")}</div>;
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const user = row.original;
        const isAdmin = profile?.role === "admin";
        const isSelf = isCurrentUser(user.id);
        
        return (
          <UserRoleManager 
            userId={user.id}
            currentRole={user.role}
            fullName={user.full_name}
            disabled={!isAdmin || isSelf}
          />
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge 
            variant={
              status === "active" ? "success" : 
              status === "pending_review" ? "warning" : 
              "destructive"
            }
          >
            {status === "active" ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : status === "pending_review" ? (
              <Clock className="h-3 w-3 mr-1" />
            ) : (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            <span className="capitalize">{status ? status.replace('_', ' ') : 'N/A'}</span>
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Joined",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        const currentUserProfile = profile?.id === user.id;
        const isAdmin = profile?.role === "admin";
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">
const handleopenPermissionDialoguser = useCallback(() => {
  openPermissionDialog(user)
}, []);

              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleopenPermissionDialoguser
                disabled={!isAdmin}
              >
                Manage Permissions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleUpdateUserStatus(user.id, "active")}
                disabled={user.status === "active" || !isAdmin || currentUserProfile}
              >
                Set Active
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateUserStatus(user.id, "pending_review")}
                disabled={user.status === "pending_review" || !isAdmin || currentUserProfile}
              >
                Set Pending
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateUserStatus(user.id, "inactive")}
                disabled={user.status === "inactive" || !isAdmin || currentUserProfile}
              >
                Set Inactive
const handleopenDeleteDialoguser = useCallback(() => {
  openDeleteDialog(user)
}, []);

              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleopenDeleteDialoguser
                disabled={!isAdmin || currentUserProfile}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
            <div className="mt-2">
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.active}</div>
            <div className="mt-2">
              <Progress 
                value={userStats.total ? (userStats.active / userStats.total) * 100 : 0} 
                className="h-2" 
                indicatorClassName="bg-green-500"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.pending}</div>
            <div className="mt-2">
              <Progress 
                value={userStats.total ? (userStats.pending / userStats.total) * 100 : 0} 
                className="h-2" 
                indicatorClassName="bg-yellow-500"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Admins/Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.admins + userStats.staff}</div>
            <div className="mt-2">
              <Progress 
                value={userStats.total ? ((userStats.admins + userStats.staff) / userStats.total) * 100 : 0} 
                className="h-2" 
                indicatorClassName="bg-blue-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={(table.getColumn("full_name")?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn("full_name")?.setFilterValue(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending_review">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loading}>
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleDeleteKhamis}
          disabled={bulkDeletingUsers}
        >
          {bulkDeletingUsers ? (
            <>Deleting...</>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Duplicate Khamis Accounts
            </>
          )}
        </Button>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {loading ? "Loading..." : "No users found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {filteredUsers.length} users
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {selectedUser && (
        <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Manage User Permissions</DialogTitle>
              <DialogDescription>
                Configure permissions for {selectedUser.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="mb-4">
                <Label htmlFor="role-select" className="mb-2 block">User Role</Label>
                <Select 
                  onValueChange={handleRoleChange} 
                  defaultValue={selectedUser.role}
                  disabled={profile?.role !== "admin" || isCurrentUser(selectedUser.id)}
                >
                  <SelectTrigger id="role-select">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-5 font-medium">
                  <div>Feature</div>
                  <div className="text-center">View</div>
                  <div className="text-center">Create</div>
                  <div className="text-center">Edit</div>
                  <div className="text-center">Delete</div>
                </div>
                
                {userPermissions && Object.entries(userPermissions).map(([key, permissions]) => {
                  const section = key as keyof UserPermissions;
                  const featureName = key.replace(/([A-Z])/g, ' $1').trim();
                  
                  return (
                    <div key={key} className="grid grid-cols-5 items-center border-t pt-4">
                      <div className="font-medium">{featureName}</div>
                      <div className="text-center">
                        <Switch 
                          checked={permissions.view} 
                          onCheckedChange={(checked) => updatePermission(section, 'view', checked)}
                          disabled={profile?.role !== "admin" || isCurrentUser(selectedUser.id)}
                        />
                      </div>
                      <div className="text-center">
                        <Switch 
                          checked={permissions.create} 
                          onCheckedChange={(checked) => updatePermission(section, 'create', checked)}
                          disabled={profile?.role !== "admin" || isCurrentUser(selectedUser.id)}
                        />
                      </div>
                      <div className="text-center">
                        <Switch 
                          checked={permissions.edit} 
                          onCheckedChange={(checked) => updatePermission(section, 'edit', checked)}
                          disabled={profile?.role !== "admin" || isCurrentUser(selectedUser.id)}
                        />
                      </div>
                      <div className="text-center">
                        <Switch 
                          checked={permissions.delete} 
                          onCheckedChange={(checked) => updatePermission(section, 'delete', checked)}
                          disabled={profile?.role !== "admin" || isCurrentUser(selectedUser.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {(profile?.role !== "admin" || isCurrentUser(selectedUser.id)) && (
                <p className="mt-4 text-sm text-amber-600">
                  {isCurrentUser(selectedUser.id) 
                    ? "You cannot modify your own permissions." 
                    : "Only admins can modify permissions."}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPermissionDialog(false)}>
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="default" 
                onClick={savePermissions}
                disabled={profile?.role !== "admin" || isCurrentUser(selectedUser.id) || saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.full_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (userToDelete) deleteUser(userToDelete.id);
              }}
              disabled={deletingUser}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingUser ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Duplicate Users</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="flex items-center mb-2 text-amber-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>This will delete all duplicate users with the same email.</span>
              </div>
              <p>Are you sure you want to proceed? This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeletingUsers}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (profile) bulkDeleteUsersByEmail("khamis-1992@hotmail.com", profile.id);
              }}
              disabled={bulkDeletingUsers}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkDeletingUsers ? "Deleting..." : "Delete All Duplicates"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserList;
