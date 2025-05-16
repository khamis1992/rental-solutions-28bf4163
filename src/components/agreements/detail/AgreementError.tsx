
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AgreementErrorProps {
  error: Error | null;
}

export function AgreementError({ error }: AgreementErrorProps) {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-12">
      <div className="flex items-center justify-center mb-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Error Loading Agreement</h3>
      <p className="text-muted-foreground mb-4">
        {error instanceof Error ? error.message : 'An unknown error occurred while fetching the agreement details.'}
      </p>
      <Button variant="outline" onClick={() => navigate("/agreements")}>
        Return to Agreements
      </Button>
    </div>
  );
}
