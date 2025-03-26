
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Users, UserPlus, Shield, RefreshCw } from "lucide-react";
import UserList from "@/components/auth/UserList";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomButton } from "@/components/ui/custom-button";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

const UserManagement = () => {
  const { profile } = useProfile();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Check if user has admin role
  const isAdmin = profile?.role === "admin";
  
  // If not admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const refreshUserList = () => {
    // Force a re-render of the UserList component
    setRefreshKey(prev => prev + 1);
    
    toast({
      title: "Refreshing",
      description: "Refreshing user list...",
      variant: "default"
    });
  };
  
  return (
    <PageContainer>
      <SectionHeader
        title="User Management"
        description="Manage system users, roles, and permissions"
        icon={Users}
        actions={
          <div className="flex space-x-2">
            <CustomButton size="sm" variant="outline" onClick={refreshUserList}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </CustomButton>
            <CustomButton size="sm" variant="default">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </CustomButton>
          </div>
        }
      />
      
      <div className="space-y-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-flex">
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Permissions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-6">
            <UserList key={refreshKey} />
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
                <div className="space-y-6">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 p-4 font-medium border-b">
                      <div>Feature</div>
                      <div className="text-center">View</div>
                      <div className="text-center">Create</div>
                      <div className="text-center">Edit</div>
                      <div className="text-center">Delete</div>
                    </div>
                    
                    {/* Users */}
                    <div className="grid grid-cols-5 p-4 border-b items-center">
                      <div className="font-medium">Users</div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin, Manager</span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin</span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin</span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin</span>
                      </div>
                    </div>
                    
                    {/* Vehicles */}
                    <div className="grid grid-cols-5 p-4 border-b items-center">
                      <div className="font-medium">Vehicles</div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">All Roles</span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin, Manager</span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin, Manager</span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin</span>
                      </div>
                    </div>
                    
                    {/* Customers */}
                    <div className="grid grid-cols-5 p-4 border-b items-center">
                      <div className="font-medium">Customers</div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">All Roles</span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin, Manager</span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin, Manager</span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin</span>
                      </div>
                    </div>
                    
                    {/* Agreements */}
                    <div className="grid grid-cols-5 p-4 border-b items-center">
                      <div className="font-medium">Agreements</div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">All Roles</span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin, Manager</span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin, Manager</span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin</span>
                      </div>
                    </div>
                    
                    {/* Financials */}
                    <div className="grid grid-cols-5 p-4 items-center">
                      <div className="font-medium">Financials</div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin, Manager</span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin</span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin</span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Admin</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default UserManagement;
