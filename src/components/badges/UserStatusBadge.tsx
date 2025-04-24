
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Clock,
  Ban 
} from "lucide-react";

interface UserStatusBadgeProps {
  status: string;
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status }) => {
  let variant = "default";
  let icon = null;
  let label = status || 'Unknown';
  
  switch(status?.toLowerCase()) {
    case 'active':
      variant = "success";
      icon = <CheckCircle className="h-3 w-3 mr-1" />;
      break;
    case 'inactive':
      variant = "outline";
      icon = <XCircle className="h-3 w-3 mr-1" />;
      break;
    case 'suspended':
      variant = "warning";
      icon = <AlertCircle className="h-3 w-3 mr-1" />;
      break;
    case 'pending_review':
      variant = "secondary";
      icon = <Clock className="h-3 w-3 mr-1" />;
      label = 'Pending Review';
      break;
    case 'blacklisted':
      variant = "destructive";
      icon = <Ban className="h-3 w-3 mr-1" />;
      break;
    default:
      variant = "outline";
      icon = <XCircle className="h-3 w-3 mr-1" />;
  }
  
  return (
    <Badge variant={variant as any} className="flex items-center justify-center w-fit">
      {icon}
      <span className="capitalize">{label.replace('_', ' ')}</span>
    </Badge>
  );
};

export default UserStatusBadge;
