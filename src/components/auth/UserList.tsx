
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDataHandler } from "@/hooks/use-data-handler";

// Define the UserData type and export it
export interface UserData {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToUpdate, setUserToUpdate] = useState<UserData | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const { handleOperation } = useDataHandler({
    showSuccessToast: true,
    showErrorToast: true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    try {
      const result = await handleOperation(async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, role, status, created_at, updated_at");

        if (error) {
          throw new Error(`Failed to fetch users: ${error.message}`);
        }
        
        return { success: true, data: data || [] };
      });

      if (result.success && result.data) {
        setUsers(result.data.map(user => ({
          ...user,
          createdAt: new Date(user.created_at).toLocaleDateString(),
          updatedAt: user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (email: string, newRole: string) => {
    await handleOperation(async () => {
      // First check if user has an auth entry
      const { data: authUser, error: authUserError } = await supabase
        .from("auth_users")
        .select("profile_id")
        .eq("email", email)
        .single();
        
      if (authUserError && authUserError.code !== 'PGRST116') {
        console.error("Error fetching auth user:", authUserError);
        throw new Error(`Error fetching user authentication data: ${authUserError.message}`);
      }
      
      // Update the profile with the new role
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("email", email);
        
      if (error) {
        throw new Error(`Failed to update user role: ${error.message}`);
      }
      
      // Update the UI
      setUsers(users.map(user => 
        user.email === email ? { ...user, role: newRole } : user
      ));
      
      return { success: true, message: `User role updated to ${newRole}` };
    });
  };

  const handleSuspendUser = async (userId: string) => {
    await handleOperation(async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "suspended" })
        .eq("id", userId);
        
      if (error) {
        throw new Error(`Failed to suspend user: ${error.message}`);
      }
      
      // Update the UI
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: "suspended" } : user
      ));
      
      return { success: true, message: "User suspended successfully" };
    });
  };

  const handleReinstateUser = async (userId: string) => {
    await handleOperation(async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "active" })
        .eq("id", userId);
        
      if (error) {
        throw new Error(`Failed to reinstate user: ${error.message}`);
      }
      
      // Update the UI
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: "active" } : user
      ));
      
      return { success: true, message: "User reinstated successfully" };
    });
  };

  const openUpdateDialog = (user: UserData) => {
    setUserToUpdate(user);
    setIsUpdateOpen(true);
  };

  const handleUpdateRole = async (newRole: string) => {
    if (!userToUpdate) return;

    await handleOperation(async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("email", userToUpdate.email);
        
      if (error) {
        throw new Error(`Failed to update user role: ${error.message}`);
      }
      
      // Update the UI
      setUsers(users.map(user => 
        user.email === userToUpdate.email ? { ...user, role: newRole } : user
      ));
      
      setIsUpdateOpen(false);
      
      return { success: true, message: `User role updated to ${newRole}` };
    });
  };

  return (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "admin" ? "default" : "outline"}
                      >
                        {user.role || "user"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "active"
                            ? "success"
                            : user.status === "suspended"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {user.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.createdAt}</TableCell>
                    <TableCell>{user.updatedAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUpdateDialog(user)}
                        >
                          Change Role
                        </Button>
                        {user.status === "suspended" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReinstateUser(user.id)}
                          >
                            Reinstate
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleSuspendUser(user.id)}
                          >
                            Suspend
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {userToUpdate && (
        <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update User Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p>
                Current role for {userToUpdate.email}:{" "}
                <Badge>{userToUpdate.role || "user"}</Badge>
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant={userToUpdate.role === "admin" ? "default" : "outline"}
                  onClick={() => handleUpdateRole("admin")}
                >
                  Set as Admin
                </Button>
                <Button
                  variant={userToUpdate.role === "staff" ? "default" : "outline"}
                  onClick={() => handleUpdateRole("staff")}
                >
                  Set as Staff
                </Button>
                <Button
                  variant={userToUpdate.role === "user" ? "default" : "outline"}
                  onClick={() => handleUpdateRole("user")}
                >
                  Set as Regular User
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpdateOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default UserList;
