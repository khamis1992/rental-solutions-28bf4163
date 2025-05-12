
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerObligation } from './CustomerLegalObligations';

interface CustomerLegalObligationsPageProps {
  customerId?: string;
}

export const CustomerLegalObligationsPage: React.FC<CustomerLegalObligationsPageProps> = ({ customerId }) => {
  const [obligations, setObligations] = useState<CustomerObligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This is a placeholder for the future API call
    // For now, just simulate loading and then show empty state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [customerId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Legal Obligations</h3>
        {obligations.length > 0 ? (
          <div>
            {/* Legal obligations will be displayed here in the future */}
            <p>Customer has {obligations.length} legal obligations.</p>
          </div>
        ) : (
          <p className="text-muted-foreground">
            No legal obligations found for this customer.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerLegalObligationsPage;
