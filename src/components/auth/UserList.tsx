
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserRoleManager } from './UserRoleManager';
import { withTimeout } from '@/utils/promise-utils';
import { safeQueryToServiceResponse } from '@/utils/supabase-type-helpers';
import { Badge } from '@/components/ui/badge';

export interface UserData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending_review' | 'blacklisted';
}

export const UserList = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    
    try {
      const result = await withTimeout(
        safeQueryToServiceResponse(() => 
          supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
        ),
        5000,
        'Load users'
      );
      
      if (result.success && result.data) {
        // Type-safe conversion of the results to match our UserData interface
        const typedUsers: UserData[] = result.data.map(user => ({
          id: String(user.id),
          full_name: String(user.full_name || ''),
          email: String(user.email || ''),
          role: String(user.role || 'customer'),
          created_at: user.created_at ? new Date(user.created_at).toLocaleString() : '',
          status: (user.status as UserData['status']) || 'pending_review'
        }));
        
        setUsers(typedUsers);
      } else {
        toast.error(`Failed to load users: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(`Error loading users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // First, get user auth ID
      const authResponse = await withTimeout(
        safeQueryToServiceResponse(() => 
          supabase
            .from('auth_users')
            .select('id')
            .eq('profile_id', userId)
            .single()
        ),
        5000,
        'Get auth user'
      );

      if (authResponse.success && authResponse.data) {
        const authId = String(authResponse.data.id);
        
        // Delete from auth.users through admin API
        const { error: authError } = await supabase.auth.admin.deleteUser(authId);
        if (authError) throw new Error(`Auth delete error: ${authError.message}`);
      }

      // Delete profile
      const profileResult = await withTimeout(
        safeQueryToServiceResponse(() => 
          supabase
            .from('profiles')
            .delete()
            .eq('id', userId)
        ),
        5000,
        'Delete profile'
      );

      if (profileResult.success) {
        toast.success("User deleted successfully");
        loadUsers(); // Reload the list
      } else {
        toast.error(`Failed to delete user: ${profileResult.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(`Error deleting user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const suspendUser = async (userId: string) => {
    try {
      const result = await withTimeout(
        safeQueryToServiceResponse(() => 
          supabase
            .from('profiles')
            .update({ status: 'suspended' as const })
            .eq('id', userId)
        ),
        5000,
        'Suspend user'
      );

      if (result.success) {
        toast.success("User suspended successfully");
        loadUsers(); // Reload the list
      } else {
        toast.error(`Failed to suspend user: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error suspending user:", error);
      toast.error(`Error suspending user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const activateUser = async (userId: string) => {
    try {
      const result = await withTimeout(
        safeQueryToServiceResponse(() => 
          supabase
            .from('profiles')
            .update({ status: 'active' as const })
            .eq('id', userId)
        ),
        5000,
        'Activate user'
      );

      if (result.success) {
        toast.success("User activated successfully");
        loadUsers(); // Reload the list
      } else {
        toast.error(`Failed to activate user: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error activating user:", error);
      toast.error(`Error activating user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const promoteToStaff = async (email: string) => {
    try {
      const result = await withTimeout(
        safeQueryToServiceResponse(() => 
          supabase
            .from('profiles')
            .update({ role: 'staff' })
            .eq('email', email)
        ),
        5000,
        'Promote to staff'
      );

      if (result.success) {
        toast.success("User promoted to staff successfully");
        loadUsers(); // Reload the list
      } else {
        toast.error(`Failed to promote user: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error promoting user:", error);
      toast.error(`Error promoting user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const demoteToCustomer = async (email: string) => {
    try {
      const result = await withTimeout(
        safeQueryToServiceResponse(() => 
          supabase
            .from('profiles')
            .update({ role: 'customer' })
            .eq('email', email)
        ),
        5000,
        'Demote to customer'
      );

      if (result.success) {
        toast.success("User demoted to customer successfully");
        loadUsers(); // Reload the list
      } else {
        toast.error(`Failed to demote user: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error demoting user:", error);
      toast.error(`Error demoting user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateUserStatus = async (userId: string, status: UserData['status']) => {
    try {
      const result = await withTimeout(
        safeQueryToServiceResponse(() => 
          supabase
            .from('profiles')
            .update({ status })
            .eq('id', userId)
        ),
        5000,
        'Update user status'
      );

      if (result.success) {
        toast.success(`User status updated to ${status}`);
        loadUsers(); // Reload the list
      } else {
        toast.error(`Failed to update user status: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error(`Error updating user status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      const result = await withTimeout(
        safeQueryToServiceResponse(() => 
          supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId)
        ),
        5000,
        'Change user role'
      );

      if (result.success) {
        toast.success(`User role updated to ${newRole}`);
        loadUsers(); // Reload the list
        setShowRoleManager(false);
      } else {
        toast.error(`Failed to update user role: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error(`Error updating user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'suspended': return 'bg-red-500';
      case 'pending_review': return 'bg-yellow-500';
      case 'inactive': return 'bg-gray-500';
      case 'blacklisted': return 'bg-black text-white';
      default: return 'bg-blue-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Role</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Created</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{user.full_name || "No name"}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="capitalize">
                        {user.role || "customer"}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge className={`capitalize ${getStatusColor(user.status)}`}>
                        {user.status || "pending"}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm">{user.created_at}</td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog open={showRoleManager && selectedUser?.id === user.id} onOpenChange={(open) => !open && setShowRoleManager(false)}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowRoleManager(true);
                              }}
                            >
                              Role
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage User Role</DialogTitle>
                            </DialogHeader>
                            {selectedUser && (
                              <UserRoleManager 
                                user={selectedUser} 
                                onRoleChange={(role) => changeUserRole(selectedUser.id, role)}
                              />
                            )}
                          </DialogContent>
                        </Dialog>

                        <Dialog open={showDeleteDialog && selectedUser?.id === user.id} onOpenChange={(open) => !open && setShowDeleteDialog(false)}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteDialog(true);
                              }}
                            >
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Delete</DialogTitle>
                            </DialogHeader>
                            <p>Are you sure you want to delete {selectedUser?.full_name || selectedUser?.email}?</p>
                            <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
                            <div className="flex justify-end gap-2 mt-4">
                              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                              <Button 
                                variant="destructive" 
                                onClick={() => {
                                  if (selectedUser) deleteUser(selectedUser.id);
                                  setShowDeleteDialog(false);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {user.status === 'active' ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => suspendUser(user.id)}
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => activateUser(user.id)}
                          >
                            Activate
                          </Button>
                        )}

                        {user.role === 'customer' ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => promoteToStaff(user.email)}
                          >
                            Promote
                          </Button>
                        ) : user.role === 'staff' ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => demoteToCustomer(user.email)}
                          >
                            Demote
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
