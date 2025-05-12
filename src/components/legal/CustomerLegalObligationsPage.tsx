
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerObligation } from './CustomerLegalObligations';
import LegalObligationsTab from './LegalObligationsTab';

interface CustomerLegalObligationsPageProps {
  customerId?: string;
}

const CustomerLegalObligationsPage: React.FC<CustomerLegalObligationsPageProps> = ({ customerId }) => {
  const [obligations, setObligations] = useState<CustomerObligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This is a placeholder for the future API call
    // For now, just simulate loading and then show empty state
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Don't set any data for now, just finish loading state
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [customerId]); // Ensure customerId is in the dependency array

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

  // If we have a customerId, use the LegalObligationsTab component
  if (customerId) {
    return <LegalObligationsTab customerId={customerId} />;
  }

  // Default view when no customerId is provided
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Legal Obligations</h3>
        {obligations.length > 0 ? (
          <div>
            {obligations.map((obligation) => (
              <div key={obligation.id} className="mb-4 p-4 border rounded">
                <h4 className="font-medium">{obligation.description}</h4>
                <p className="text-sm text-muted-foreground">{obligation.description}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-xs">
                    {obligation.dueDate ? new Date(obligation.dueDate).toLocaleDateString() : 'No due date'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    obligation.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    obligation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {obligation.status}
                  </span>
                </div>
              </div>
            ))}
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
