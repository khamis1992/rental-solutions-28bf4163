
import React from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Users, UserPlus, Shield, ShieldCheck } from "lucide-react";
import UserList from "@/components/auth/UserList";
import RolePermissionsTable from "@/components/auth/RolePermissionsTable";
import SecurityPreferences from "@/components/auth/SecurityPreferences";
import { useProfile } from "@/contexts/ProfileContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomButton } from "@/components/ui/custom-button";
import { toast } from "sonner";

const UserManagement = () => {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();
  
  // Show loading state while profile is loading
  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PageContainer>
    );
  }
  
  // Check if user has admin role
  const isAdmin = profile?.role === "admin";
  
  // If not admin, redirect to dashboard
  if (!isAdmin) {
    toast.error("You don't have permission to access this page");
    return <Navigate to="/dashboard" replace />;
  }
  
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
            <UserList />
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
