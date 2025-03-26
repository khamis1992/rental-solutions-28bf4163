
import React, { useState } from "react";
import { Shield, UserCog } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserRoleManagerProps {
  userId: string;
  currentRole: string;
  fullName: string;
  disabled?: boolean;
}

export const UserRoleManager = ({ userId, currentRole, fullName, disabled = false }: UserRoleManagerProps) => {
  const [role, setRole] = useState<string>(currentRole);
  const [isChanging, setIsChanging] = useState(false);

  const handleRoleChange = async (newRole: string) => {
    if (newRole === role || disabled) return;
    
    try {
      setIsChanging(true);
      console.log(`Updating user ${userId} to role ${newRole}`);
      
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);
      
      if (error) {
        console.error("Update role error details:", error);
        throw error;
      }
      
      setRole(newRole);
      toast.success(`${fullName}'s role updated to ${newRole}`);
    } catch (error: any) {
      console.error("Error updating user role:", error.message);
      toast.error("Failed to update user role: " + error.message);
      // Reset to the previous role on error
      setRole(currentRole);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {role === "admin" ? (
        <Shield className="h-4 w-4 text-primary" />
      ) : (
        <UserCog className="h-4 w-4 text-blue-500" />
      )}
      
      <Select
        defaultValue={role}
        onValueChange={handleRoleChange}
        disabled={disabled || isChanging}
      >
        <SelectTrigger className="w-[130px] h-8">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin" className="flex items-center">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2 text-primary" />
              <span>Admin</span>
            </div>
          </SelectItem>
          <SelectItem value="staff" className="flex items-center">
            <div className="flex items-center">
              <UserCog className="h-4 w-4 mr-2 text-blue-500" />
              <span>Staff</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
