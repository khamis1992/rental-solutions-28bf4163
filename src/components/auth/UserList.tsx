import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Loader2
} from 'lucide-react';

export function UserList() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [showAdminControls, setShowAdminControls] = useState(false);

  // Derived state
  const adminUsers = users.filter(user => user.role === 'admin');
  const staffUsers = users.filter(user => user.role === 'staff');
  const customerUsers = users.filter(user => user.role === 'customer');
  const totalUsers = users.length;

  // Filtered users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    const matchesStatus = showInactive ? true : user.active !== false;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ active: !currentStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, active: !currentStatus } : user
      ));
      
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      toast.success('User role updated successfully');
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAdminControls(!showAdminControls)}>
              {showAdminControls ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showAdminControls ? 'Hide Admin Controls' : 'Show Admin Controls'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Users</Label>
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <Label htmlFor="role-filter">Filter by Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger id="role-filter">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={() => setShowInactive(!showInactive)}
                >
                  {showInactive ? 'Hide Inactive' : 'Show Inactive'}
                </Button>
              </div>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{totalUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  
                  {adminUsers.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Admin Users</span>
                        <span className="font-medium">{adminUsers.length}</span>
                      </div>
                      <Progress 
                        value={(adminUsers.length / totalUsers) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}

                  {staffUsers.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Staff Users</span>
                        <span className="font-medium">{staffUsers.length}</span>
                      </div>
                      <Progress 
                        value={(staffUsers.length / totalUsers) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}

                  {customerUsers.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Customer Users</span>
                        <span className="font-medium">{customerUsers.length}</span>
                      </div>
                      <Progress 
                        value={(customerUsers.length / totalUsers) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Users</p>
                      <p className="text-2xl font-bold">
                        {users.filter(user => user.active !== false).length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Active Rate</span>
                      <span className="font-medium">
                        {totalUsers > 0 
                          ? `${Math.round((users.filter(user => user.active !== false).length / totalUsers) * 100)}%` 
                          : '0%'}
                      </span>
                    </div>
                    <Progress 
                      value={totalUsers > 0 
                        ? (users.filter(user => user.active !== false).length / totalUsers) * 100 
                        : 0} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Recent Signups</p>
                      <p className="text-2xl font-bold">
                        {users.filter(user => {
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          return new Date(user.created_at) >= thirtyDaysAgo;
                        }).length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last 30 days</span>
                      <span className="font-medium">
                        {totalUsers > 0 
                          ? `${Math.round((users.filter(user => {
                              const thirtyDaysAgo = new Date();
                              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                              return new Date(user.created_at) >= thirtyDaysAgo;
                            }).length / totalUsers) * 100)}%` 
                          : '0%'}
                      </span>
                    </div>
                    <Progress 
                      value={totalUsers > 0 
                        ? (users.filter(user => {
                            const thirtyDaysAgo = new Date();
                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                            return new Date(user.created_at) >= thirtyDaysAgo;
                          }).length / totalUsers) * 100 
                        : 0} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* User List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  Users ({filteredUsers.length})
                </h3>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
              
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found matching your filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className={user.active === false ? 'opacity-70' : ''}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-medium">{user.full_name || 'Unnamed User'}</h4>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={
                                user.role === 'admin' ? 'default' : 
                                user.role === 'staff' ? 'secondary' : 
                                'outline'
                              }>
                                {user.role || 'customer'}
                              </Badge>
                              {user.active === false && (
                                <Badge variant="destructive">Inactive</Badge>
                              )}
                            </div>
                          </div>
                          
                          {showAdminControls && (
                            <div className="flex flex-col gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleToggleUserStatus(user.id, user.active !== false)}
                              >
                                {user.active === false ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {showAdminControls && (
                          <>
                            <Separator className="my-3" />
                            <div className="flex justify-between items-center">
                              <Label htmlFor={`role-${user.id}`} className="text-xs">Change Role</Label>
                              <Select 
                                value={user.role || 'customer'} 
                                onValueChange={(value) => handleUpdateRole(user.id, value)}
                              >
                                <SelectTrigger id={`role-${user.id}`} className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="staff">Staff</SelectItem>
                                  <SelectItem value="customer">Customer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                        
                        <div className="mt-3 text-xs text-muted-foreground">
                          Created: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
