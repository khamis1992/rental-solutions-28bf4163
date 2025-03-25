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
import { CheckCircle, Clock, XCircle, MoreHorizontal, UserCog, User, Shield, Search, Filter } from "lucide-react";
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
import { supabase } from "@/lib/supabase";
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

interface UserData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

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
    managers: 0,
    users: 0
  });

  useEffect(() => {
    fetchUsers();
    updateTarekToAdmin();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      const stats = {
        total: users.length,
        active: users.filter(user => user.status === 'active').length,
        pending: users.filter(user => user.status === 'pending_review').length,
        inactive: users.filter(user => user.status === 'inactive').length,
        admins: users.filter(user => user.role === 'admin').length,
        managers: users.filter(user => user.role === 'manager').length,
        users: users.filter(user => user.role === 'user').length
      };
      setUserStats(stats);
    }
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .not('role', 'eq', 'customer');
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error.message);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const updateTarekToAdmin = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("email", "tareklaribi25914@gmail.com");
      
      if (error) throw error;
      
      toast.success("Tarek's account has been set as admin");
      
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user role:", error.message);
      toast.error("Failed to update user role");
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      toast.success(`User role updated to ${newRole}`);
    } catch (error: any) {
      console.error("Error updating user role:", error.message);
      toast.error("Failed to update user role");
    }
  };
  
  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", userId);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      
      toast.success(`User status updated to ${newStatus}`);
    } catch (error: any) {
      console.error("Error updating user status:", error.message);
      toast.error("Failed to update user status");
    }
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
        const role = row.getValue("role") as string;
        return (
          <div className="flex items-center">
            {role === "admin" ? (
              <Shield className="h-4 w-4 mr-2 text-primary" />
            ) : role === "manager" ? (
              <UserCog className="h-4 w-4 mr-2 text-blue-500" />
            ) : (
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
            )}
            <span className="capitalize">{role || "user"}</span>
          </div>
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
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => toast.info(`User details: ${user.full_name}`)}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Change Role</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleUpdateUserRole(user.id, "admin")}
                disabled={user.role === "admin"}
              >
                Set as Admin
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateUserRole(user.id, "manager")}
                disabled={user.role === "manager"}
              >
                Set as Manager
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateUserRole(user.id, "user")}
                disabled={user.role === "user"}
              >
                Set as User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleUpdateUserStatus(user.id, "active")}
                disabled={user.status === "active"}
              >
                Set Active
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateUserStatus(user.id, "pending_review")}
                disabled={user.status === "pending_review"}
              >
                Set Pending
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateUserStatus(user.id, "inactive")}
                disabled={user.status === "inactive"}
              >
                Set Inactive
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
            <CardTitle className="text-base font-medium">Admins/Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.admins + userStats.managers}</div>
            <div className="mt-2">
              <Progress 
                value={userStats.total ? ((userStats.admins + userStats.managers) / userStats.total) * 100 : 0} 
                className="h-2" 
                indicatorClassName="bg-blue-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
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
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="user">User</SelectItem>
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
    </div>
  );
};

export default UserList;
