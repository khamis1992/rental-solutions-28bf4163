
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AgreementHeaderProps {
  agreementNumber: string;
  status: string;
  onDelete: () => void;
}

const AgreementHeader = ({ agreementNumber, status, onDelete }: AgreementHeaderProps) => {
  const navigate = useNavigate();

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return "success";
      case 'pending':
        return "warning";
      case 'closed':
        return "outline";
      case 'cancelled':
        return "destructive";
      case 'expired':
        return "secondary";
      case 'draft':
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Agreement {agreementNumber}
        </h2>
        <Badge variant={getStatusBadgeVariant(status)}>
          {status.toUpperCase()}
        </Badge>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => navigate(`/agreements/edit/${agreementNumber}`)}>
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
};

export default AgreementHeader;
