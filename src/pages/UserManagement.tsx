import React, { useEffect, useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Users, UserPlus, Shield, ShieldCheck, Search } from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomButton } from "@/components/ui/custom-button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import RolePermissionsTable from "@/components/auth/RolePermissionsTable";
import SecurityPreferences from "@/components/auth/SecurityPreferences";
import { Input } from "@/components/ui/input";

const UserManagement = () => {
  const { profile, isLoading } = useProfile();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, status, created_at")
      .not("role", "eq", "customer");
    if (error) {
      toast.error("Failed to load users: " + error.message);
      setUsers([]);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (error) {
      toast.error("Failed to update role: " + error.message);
    } else {
      toast.success("User role updated");
      setUsers(users => users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
    setUpdatingId(null);
  };

  // Filtering and searching
  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesSearch =
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PageContainer>
    );
  }

  // Only block access if you want to restrict to admins:
  // const isAdmin = profile?.role === "admin";
  // if (!isAdmin) {
  //   toast.error("You don't have permission to access this page");
  //   return <Navigate to="/dashboard" replace />;
  // }

  return (
    <PageContainer>
      <SectionHeader
        title="User Management"
        description="Manage system users, roles, and permissions"
        icon={Users}
        actions={
          <CustomButton
            size="sm"
            variant="default"
            onClick={() => toast('User invitation sent')}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </CustomButton>
        }
      />
      <div className="space-y-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-flex">
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>List of users and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name or email..."
                      className="pl-8"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
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
                    <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
                      Refresh
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:bg-gray-900">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">Name</th>
                        <th className="px-4 py-2 text-left font-semibold">Email</th>
                        <th className="px-4 py-2 text-left font-semibold">Role</th>
                        <th className="px-4 py-2 text-left font-semibold">Status</th>
                        <th className="px-4 py-2 text-left font-semibold">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={5} className="text-center py-8">Loading users...</td></tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No users found.</td></tr>
                      ) : (
                        filteredUsers.map(user => (
                          <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="px-4 py-2 font-medium">{user.full_name || 'N/A'}</td>
                            <td className="px-4 py-2">{user.email}</td>
                            <td className="px-4 py-2">
                              <Select
                                value={user.role}
                                onValueChange={val => handleRoleChange(user.id, val)}
                                disabled={profile?.id === user.id || updatingId === user.id}
                              >
                                <SelectTrigger className="w-[130px] h-8">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="staff">Staff</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-2 capitalize">{user.status || 'N/A'}</td>
                            <td className="px-4 py-2">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="permissions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>
                  Define what each role can access in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RolePermissionsTable />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security" className="mt-6">
            <SecurityPreferences />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default UserManagement;
