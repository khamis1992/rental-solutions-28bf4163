
import { useParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { isValidDatabaseId } from '@/lib/database/validation';
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [isValidId, setIsValidId] = useState(true);
  
  // Validate ID format
  useEffect(() => {
    if (id && !isValidDatabaseId(id)) {
      console.warn(`Invalid customer ID format: ${id}`);
      setIsValidId(false);
    } else {
      setIsValidId(true);
    }
  }, [id]);
  
  return (
    <PageContainer
      title="Customer Details"
      description="View detailed information about the customer."
      backLink="/customers"
    >
      {!isValidId ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Invalid customer ID format. Please return to the customers list and try again.
          </AlertDescription>
        </Alert>
      ) : !id ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No customer ID provided. Please return to the customers list and select a customer.
          </AlertDescription>
        </Alert>
      ) : (
        <CustomerDetail customerId={id} />
      )}
    </PageContainer>
  );
};

export default CustomerDetailPage;
