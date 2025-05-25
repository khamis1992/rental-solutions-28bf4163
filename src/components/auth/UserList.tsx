import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface Permission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

interface Permissions {
  [resource: string]: Permission;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [permissions, setPermissions] = useState<Permissions>({});

  useEffect(() => {
    // Fetch users and permissions from API
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Replace with actual API endpoint
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchPermissions = async () => {
      try {
        // Replace with actual API endpoint
        const response = await fetch('/api/permissions');
        const data = await response.json();
        setPermissions(data);
      } catch (error) {
        console.error("Error fetching permissions:", error);
        toast({
          title: "Error",
          description: "Failed to fetch permissions",
          variant: "destructive",
        });
      }
    };

    fetchUsers();
    fetchPermissions();
  }, []);

  const viewUser = (user: User) => {
    setSelectedUser(user);
    // Implement view logic (e.g., open a modal)
  };

  const createUser = () => {
    // Implement create logic (e.g., open a modal)
  };

  const editUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const deleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedUser) {
      try {
        // Replace with actual API endpoint
        await fetch(`/api/users/${selectedUser.id}`, { method: 'DELETE' });
        setUsers(users.filter(user => user.id !== selectedUser.id));
        setShowDeleteModal(false);
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting user:", error);
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        });
      }
    }
  };

  const checkPermission = (action: keyof Permission): boolean => {
    const userPermissions = permissions['users'];
    return userPermissions?.[action] || false;
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <tr key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.status}</TableCell>
              <TableCell className="py-2 px-4">
                {checkPermission('view') && (
                  <Button variant="ghost" size="sm" onClick={() => viewUser(user)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                )}
                {checkPermission('create') && (
                  <Button variant="ghost" size="sm" onClick={() => createUser()}>
                    Create
                  </Button>
                )}
                {checkPermission('edit') && (
                  <Button variant="ghost" size="sm" onClick={() => editUser(user)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
                {checkPermission('delete') && (
                  <Button variant="ghost" size="sm" onClick={() => deleteUser(user)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </TableCell>
            </tr>
          ))}
        </TableBody>
      </Table>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Edit User</h3>
              <div className="px-7 py-3">
                <Input
                  type="email"
                  placeholder="Email"
                  value={selectedUser.email}
                  disabled
                />
                <Input
                  type="text"
                  placeholder="Role"
                  value={selectedUser.role}
                />
                <Input
                  type="text"
                  placeholder="Status"
                  value={selectedUser.status}
                />
              </div>
              <div className="items-center px-4 py-3">
                <Button
                  variant="outline"
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md width-full shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="ml-4 px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md width-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Delete User</h3>
              <div className="px-7 py-3">
                <p>Are you sure you want to delete {selectedUser.email}?</p>
              </div>
              <div className="items-center px-4 py-3">
                <Button
                  variant="outline"
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md width-full shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="ml-4 px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md width-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                  onClick={confirmDelete}
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
