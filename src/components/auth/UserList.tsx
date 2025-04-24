
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MoreHorizontal, 
  Search, 
  UserPlus, 
  AlertCircle,
  Mail,
  ShieldAlert, 
  ShieldCheck,
  UserX,
  Check,
  Ban,
  MoreVertical
} from "lucide-react";
import { toast } from 'sonner';
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from 'date-fns';
import { UserRoleBadge } from '../badges/UserRoleBadge';
import { UserStatusBadge } from '../badges/UserStatusBadge';

interface UserData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending_review' | 'blacklisted';
  last_login?: string;
}

const UserList = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'suspended' | 'pending_review' | 'blacklisted'>('active');
  const [dialogLoading, setDialogLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, status, last_login')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const typedData: UserData[] = data?.map(user => ({
        id: user.id,
        full_name: user.full_name || 'Unnamed User',
        email: user.email || '',
        role: user.role || 'user',
        status: user.status as 'active' | 'inactive' | 'suspended' | 'pending_review' | 'blacklisted',
        last_login: user.last_login
      })) || [];
      
      setUsers(typedData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChangeClick = (user: UserData) => {
    setSelectedUser(user);
    setNewRole(user.role || '');
    setShowRoleDialog(true);
  };

  const handleStatusChangeClick = (user: UserData) => {
    setSelectedUser(user);
    setNewStatus(user.status);
    setShowStatusDialog(true);
  };

  const handleDeleteClick = (user: UserData) => {
    setSelectedUser(user);
    setConfirmDelete(true);
  };

  const handleViewDetailsClick = (user: UserData) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    
    try {
      setDialogLoading(true);
      
      if (newRole === 'admin' || newRole === 'staff') {
        // Update role in profiles table
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('email', selectedUser.email);
          
        if (error) throw error;
        
        toast.success(`User role updated to ${newRole}`);
      } else {
        // For other roles
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('email', selectedUser.email);
          
        if (error) throw error;
        
        toast.success(`User role updated to ${newRole}`);
      }
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id ? { ...user, role: newRole } : user
        )
      );
      setShowRoleDialog(false);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setDialogLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedUser) return;
    
    try {
      setDialogLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      toast.success(`User status updated to ${newStatus}`);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id ? { ...user, status: newStatus } : user
        )
      );
      setShowStatusDialog(false);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    try {
      setDialogLoading(true);
      
      // Update role instead of deleting - safer approach
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'deleted' })
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      toast.success('User marked as deleted');
      
      // Remove from local state
      setUsers(prevUsers => 
        prevUsers.filter(user => user.id !== selectedUser.id)
      );
      setConfirmDelete(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setDialogLoading(false);
    }
  };

  const renderLastLogin = (lastLogin: string | undefined) => {
    if (!lastLogin) return 'Never';
    try {
      return formatDistanceToNow(new Date(lastLogin), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center w-full max-w-sm space-x-2">
          <Input 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            startIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" /> Add User
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><UserRoleBadge role={user.role} /></TableCell>
                  <TableCell><UserStatusBadge status={user.status} /></TableCell>
                  <TableCell>{renderLastLogin(user.last_login)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetailsClick(user)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleRoleChangeClick(user)}>
                          Change role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChangeClick(user)}>
                          Update status
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(user)} className="text-destructive">
                          Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Change Role Dialog */}
      {selectedUser && (
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Update the role for {selectedUser.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRoleChange} disabled={dialogLoading}>
                {dialogLoading ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Change Status Dialog */}
      {selectedUser && (
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Change User Status</DialogTitle>
              <DialogDescription>
                Update the status for {selectedUser.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="blacklisted">Blacklisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleStatusChange} disabled={dialogLoading}>
                {dialogLoading ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Confirm Delete Dialog */}
      {selectedUser && (
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the user as deleted. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={dialogLoading}>
                {dialogLoading ? "Processing..." : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Detailed information for {selectedUser.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm">User ID</h3>
                <p className="text-sm text-muted-foreground break-all">{selectedUser.id}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm">Email</h3>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm">Role</h3>
                <div><UserRoleBadge role={selectedUser.role} /></div>
              </div>
              <div>
                <h3 className="font-medium text-sm">Status</h3>
                <div><UserStatusBadge status={selectedUser.status} /></div>
              </div>
              <div>
                <h3 className="font-medium text-sm">Last Login</h3>
                <p className="text-sm text-muted-foreground">
                  {renderLastLogin(selectedUser.last_login)}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDetails(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserList;
