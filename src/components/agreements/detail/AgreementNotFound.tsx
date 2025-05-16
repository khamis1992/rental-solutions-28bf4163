
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AgreementNotFound() {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-12">
      <div className="flex items-center justify-center mb-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Agreement not found</h3>
      <p className="text-muted-foreground mb-4">
        The agreement you're looking for doesn't exist or has been removed.
      </p>
      <Button variant="outline" onClick={() => navigate("/agreements")}>
        Return to Agreements
      </Button>
    </div>
  );
}
