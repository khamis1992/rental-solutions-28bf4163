
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  ShieldAlert, 
  ShieldCheck,
  User,
  UserCog,
  Car,
  UserX,
} from "lucide-react";

interface UserRoleBadgeProps {
  role: string;
}

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ role }) => {
  let variant = "default";
  let icon = null;
  let label = role || 'user';
  
  switch(role?.toLowerCase()) {
    case 'admin':
      variant = "destructive";
      icon = <ShieldAlert className="h-3 w-3 mr-1" />;
      break;
    case 'staff':
      variant = "secondary";
      icon = <ShieldCheck className="h-3 w-3 mr-1" />;
      break;
    case 'customer':
      variant = "outline";
      icon = <User className="h-3 w-3 mr-1" />;
      break;
    case 'driver':
      variant = "default";
      icon = <Car className="h-3 w-3 mr-1" />;
      break;
    case 'deleted':
      variant = "outline";
      icon = <UserX className="h-3 w-3 mr-1" />;
      label = 'Deleted';
      break;
    default:
      variant = "outline";
      icon = <User className="h-3 w-3 mr-1" />;
  }
  
  return (
    <Badge variant={variant as any} className="flex items-center justify-center w-fit">
      {icon}
      <span className="capitalize">{label}</span>
    </Badge>
  );
};

export default UserRoleBadge;
