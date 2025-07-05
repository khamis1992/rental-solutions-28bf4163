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
// Import with both named and default import to ensure compatibility
import UserData, { UserData as UserDataType, UserRole, UserStatus, DbProfileRow } from "@/types/user-types";
import { PermissionSettings, RolePermissions, DEFAULT_ROLE_PERMISSIONS } from "@/types/permissions";

type UserPermissions = RolePermissions;

const DEFAULT_PERMISSIONS: Record<string, UserPermissions> = DEFAULT_ROLE_PERMISSIONS;

const UserList = () => {
  const [users, setUsers] = useState<UserDataType[]>([]);
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
  const [selectedUser, setSelectedUser] = useState<UserDataType | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserDataType | null>(null);
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
        active: 0,
        pending: 0,
        inactive: 0,
        admins: 0,
        staff: 0
      };

      users.forEach(user => {
        switch (user.status) {
          case "active": stats.active++; break;
          case "pending_review": stats.pending++; break;
          case "inactive": stats.inactive++; break;
        }

        if (user.role === "admin") stats.admins++;
        else if (user.role === "staff") stats.staff++;
      });

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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .not('role', 'eq', 'customer') as { data: DbProfileRow[] | null; error: any };

      if (error) throw error;

      setUsers(data as unknown as UserDataType[]);
    } catch (error: any) {
      console.error("خطأ في جلب المستخدمين:", error.message);
      toast.error("فشل في تحميل المستخدمين: " + error.message);
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

      if (profileError) throw profileError;

      setUsers(users.filter(user => user.id !== userId));
      toast.success("تم حذف المستخدم بنجاح");
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error("خطأ في حذف المستخدم:", error.message);
      toast.error("فشل في حذف المستخدم: " + error.message);
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

      if (!usersToDelete.length) {
        toast.info("لم يتم العثور على مستخدمين مكررين بهذا البريد الإلكتروني");
        return;
      }

      for (const user of usersToDelete) {
        const { error } = await supabase.from("profiles").delete().eq("id", user.id);
        if (error) throw error;
      }

      await fetchUsers();
      toast.success(`Successfully deleted ${usersToDelete.length} duplicate user(s)`);
      setShowBulkDeleteDialog(false);
    } catch (error: any) {
      console.error("Error performing bulk deletion:", error.message);
      toast.error("Failed to delete duplicate users: " + error.message);
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
      const khamisUsers = users.filter(user => 
        user.email === "khamis-1992@hotmail.com" && user.id !== profile.id
      );

      if (!khamisUsers.length) {
        toast.info("No duplicate Khamis accounts found");
        setBulkDeletingUsers(false);
        return;
      }

      const deletionPromises = khamisUsers.map(async (user) => {
        const { error } = await supabase.from("profiles").delete().eq("id", user.id);
        if (error) throw error;
        return user.id;
      });

      await Promise.all(deletionPromises);
      await fetchUsers();
      toast.success(`Successfully deleted ${khamisUsers.length} duplicate Khamis account(s)`);
    } catch (error: any) {
      console.error("Error deleting Khamis duplicates:", error.message);
      toast.error("Failed to delete users: " + error.message);
    } finally {
      setBulkDeletingUsers(false);
    }
  };

  const openDeleteDialog = (user: UserDataType) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const updateAdminAccounts = async () => {
    try {
      const { error: tarekError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("email", "tareklaribi25914@gmail.com");

      if (tarekError) throw tarekError;

      const { error: khamisError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("email", "khamis-1992@hotmail.com");

      if (khamisError) throw khamisError;

      fetchUsers();
    } catch (error: any) {
      console.error("Error updating roles:", error.message);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: UserStatus) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));

      const statusText = newStatus === 'active' ? 'نشط' : 
                         newStatus === 'inactive' ? 'غير نشط' : 
                         newStatus === 'pending_review' ? 'في انتظار المراجعة' : newStatus;
      toast.success(`تم تحديث حالة المستخدم إلى ${statusText}`);
    } catch (error: any) {
      console.error("خطأ في تحديث حالة المستخدم:", error.message);
      toast.error("فشل في تحديث حالة المستخدم: " + error.message);
    }
  };

  const openPermissionDialog = (user: UserDataType) => {
    setSelectedUser(user);
    setShowPermissionDialog(true);
  };

  const savePermissions = async () => {
    if (!selectedUser || !userPermissions) return;
    setSaving(true);

    try {
      const newRole = form.getValues("role") as UserRole;
      if (newRole !== selectedUser.role) {
        await supabase
          .from("profiles")
          .update({ role: newRole })
          .eq("id", selectedUser.id);
      }

      toast.success("تم تحديث صلاحيات المستخدم بنجاح");
      setShowPermissionDialog(false);
      fetchUsers();
    } catch (error: any) {
      console.error("خطأ في حفظ الصلاحيات:", error.message);
      toast.error("فشل في حفظ الصلاحيات");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = (value: string) => {
    form.setValue("role", value);
    setUserPermissions(DEFAULT_PERMISSIONS[value as keyof typeof DEFAULT_PERMISSIONS] || DEFAULT_PERMISSIONS.staff);
  };

  const updatePermission = (section: keyof UserPermissions, action: keyof PermissionSettings, value: boolean) => {
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

  const isCurrentUser = (userId: string) => profile?.id === userId;

  const filteredUsers = users.filter(user => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    if (statusFilter !== "all" && user.status !== statusFilter) return false;
    return true;
  });

  const columns: ColumnDef<UserDataType>[] = [
    {
      accessorKey: "full_name",
      header: "الاسم",
      cell: ({ row }) => {
        const value = row.getValue("full_name") as string;
        return <div className="font-medium text-right">{value || "غير متوفر"}</div>;
      },
    },
    {
      accessorKey: "email",
      header: "البريد الإلكتروني",
      cell: ({ row }) => {
        return <div className="text-sm text-muted-foreground text-right">{row.getValue("email")}</div>;
      },
    },
    {
      accessorKey: "role",
      header: "الدور",
      cell: ({ row }) => {
        const user = row.original;
        const isAdmin = profile?.role === "admin";
        const isSelf = isCurrentUser(user.id);
        return (
          <UserRoleManager 
            userId={user.id}
            currentRole={user.role}
            fullName={user.full_name}
            disabled={isSelf}
          />
        );
      },
    },
    {
      accessorKey: "status",
      header: "الحالة",
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
              <CheckCircle className="h-3 w-3 ml-1" />
            ) : status === "pending_review" ? (
              <Clock className="h-3 w-3 ml-1" />
            ) : (
              <XCircle className="h-3 w-3 ml-1" />
            )}
            <span>
              {status === "active" ? "نشط" : 
               status === "pending_review" ? "في انتظار المراجعة" : 
               status === "inactive" ? "غير نشط" : 
               status || "غير متوفر"}
            </span>
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "تاريخ الانضمام",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return <div className="text-right">{date ? new Date(date).toLocaleDateString('ar-QA') : 'غير متوفر'}</div>;
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
                <span className="sr-only">فتح القائمة</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">
              <DropdownMenuLabel className="text-right">الإجراءات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openPermissionDialog(user)}
                disabled={!isAdmin}
                className="text-right"
              >
                إدارة الصلاحيات
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-right">تغيير الحالة</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleUpdateUserStatus(user.id, "active")}
                disabled={user.status === "active" || !isAdmin || currentUserProfile}
                className="text-right"
              >
                تعيين كنشط
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateUserStatus(user.id, "pending_review")}
                disabled={user.status === "pending_review" || !isAdmin || currentUserProfile}
                className="text-right"
              >
                تعيين كمعلق
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateUserStatus(user.id, "inactive")}
                disabled={user.status === "inactive" || !isAdmin || currentUserProfile}
                className="text-right"
              >
                تعيين كغير نشط
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openDeleteDialog(user)}
                disabled={!isAdmin || currentUserProfile}
                className="text-red-600 text-right space-x-reverse space-x-2"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف المستخدم
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
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-right">إجمالي المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{userStats.total}</div>
            <div className="mt-2">
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-right">المستخدمون النشطون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{userStats.active}</div>
            <div className="mt-2">
              <Progress 
                value={userStats.total ? (userStats.active / userStats.total) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-right">في انتظار الموافقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{userStats.pending}</div>
            <div className="mt-2">
              <Progress 
                value={userStats.total ? (userStats.pending / userStats.total) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-right">المديرون والموظفون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{userStats.admins + userStats.staff}</div>
            <div className="mt-2">
              <Progress 
                value={userStats.total ? ((userStats.admins + userStats.staff) / userStats.total) * 100 : 0} 
                className="h-2" 
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
        {/* Delete Duplicate Khamis Accounts button removed */}
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
      <div className="flex items-center justify-between py-4 flex-row-reverse">
        <div className="flex-1 text-sm text-muted-foreground text-right">
          عرض {table.getRowModel().rows.length} من {filteredUsers.length} مستخدم
        </div>
        <div className="flex items-center space-x-reverse space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            التالي
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            السابق
          </Button>
        </div>
      </div>

      {/* Permission Dialog */}
      {selectedUser && (
        <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">إدارة صلاحيات المستخدم</DialogTitle>
              <DialogDescription className="text-right">
                تكوين الصلاحيات لـ {selectedUser.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="mb-4">
                <Label htmlFor="role-select" className="mb-2 block text-right">دور المستخدم</Label>
                <Select 
                  onValueChange={handleRoleChange} 
                  defaultValue={selectedUser.role}
                  disabled={profile?.role !== "admin" || isCurrentUser(selectedUser.id)}
                >
                  <SelectTrigger id="role-select">
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">مدير</SelectItem>
                    <SelectItem value="staff">موظف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-5 font-medium">
                  <div className="text-right">الميزة</div>
                  <div className="text-center">عرض</div>
                  <div className="text-center">إنشاء</div>
                  <div className="text-center">تعديل</div>
                  <div className="text-center">حذف</div>
                </div>
                {userPermissions && Object.entries(userPermissions).map(([key, permissions]) => {
                  const section = key as keyof UserPermissions;
                  const translateFeatureName = (key: string) => {
                    const translations: Record<string, string> = {
                      'agreements': 'العقود',
                      'customers': 'العملاء',
                      'vehicles': 'المركبات',
                      'payments': 'المدفوعات',
                      'maintenance': 'الصيانة',
                      'reports': 'التقارير',
                      'users': 'المستخدمون',
                      'settings': 'الإعدادات'
                    };
                    return translations[key.toLowerCase()] || key.replace(/([A-Z])/g, ' $1').trim();
                  };
                  return (
                    <div key={key} className="grid grid-cols-5 items-center border-t pt-4">
                      <div className="font-medium text-right">{translateFeatureName(key)}</div>
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
                <p className="mt-4 text-sm text-amber-600 text-right">
                  {isCurrentUser(selectedUser.id) 
                    ? "لا يمكنك تعديل صلاحياتك الخاصة." 
                    : "المديرون فقط يمكنهم تعديل الصلاحيات."}
                </p>
              )}
            </div>
            <DialogFooter className="flex flex-row-reverse space-x-reverse space-x-2">
              <Button 
                type="button" 
                variant="default" 
                onClick={savePermissions}
                disabled={profile?.role !== "admin" || isCurrentUser(selectedUser.id) || saving}
              >
                {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowPermissionDialog(false)}>
                إلغاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">حذف المستخدم</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من أنك تريد حذف {userToDelete?.full_name}؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row-reverse space-x-reverse space-x-2">
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (userToDelete) deleteUser(userToDelete.id);
              }}
              disabled={deletingUser}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingUser ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
            <AlertDialogCancel disabled={deletingUser}>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">حذف المستخدمين المكررين</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              <div className="flex items-center mb-2 text-amber-600 flex-row-reverse">
                <span>سيؤدي هذا إلى حذف جميع المستخدمين المكررين بنفس البريد الإلكتروني.</span>
                <AlertCircle className="h-5 w-5 ml-2" />
              </div>
              <p>هل أنت متأكد من أنك تريد المتابعة؟ لا يمكن التراجع عن هذا الإجراء.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row-reverse space-x-reverse space-x-2">
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (profile) bulkDeleteUsersByEmail("khamis-1992@hotmail.com", profile.id);
              }}
              disabled={bulkDeletingUsers}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkDeletingUsers ? "جاري الحذف..." : "حذف جميع المكررات"}
            </AlertDialogAction>
            <AlertDialogCancel disabled={bulkDeletingUsers}>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Simple test dropdown for debugging */}
      <div style={{ margin: '16px 0' }} dir="rtl">
        <label className="text-right">قائمة اختبار:&nbsp;</label>
        <Select value="admin" onValueChange={() => {}}>
          <SelectTrigger className="w-[130px] h-8">
            <SelectValue placeholder="دور الاختبار" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">مدير</SelectItem>
            <SelectItem value="staff">موظف</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default UserList;