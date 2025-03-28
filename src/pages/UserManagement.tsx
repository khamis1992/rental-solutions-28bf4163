
import React from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Users } from "lucide-react";
import UserList from "@/components/auth/UserList";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { Navigate } from "react-router-dom";

const UserManagement = () => {
  const { profile } = useProfile();
  
  // Check if user has admin role
  const isAdmin = profile?.role === "admin";
  
  // If not admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <PageContainer>
      <SectionHeader
        title="User Management"
        description="Manage users, roles, and permissions"
        icon={Users}
      />
      
      <div className="space-y-6">
        <UserList />
      </div>
    </PageContainer>
  );
};

export default UserManagement;
