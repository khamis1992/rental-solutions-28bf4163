
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerDetail from '@/components/customers/CustomerDetail';
import PageContainer from '@/components/layout/PageContainer';
import { useCustomers } from '@/hooks/use-customers';

const CustomerDetailPage = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { customers, isLoading, error, refreshCustomers } = useCustomers();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) {
        navigate('/customers');
        return;
      }
      
      try {
        setLoading(true);
        // Find customer in the existing customers list
        let customerData = customers.find(c => c.id === customerId);
        
        // If not found, try to refresh the list
        if (!customerData) {
          await refreshCustomers();
          customerData = customers.find(c => c.id === customerId);
        }
        
        if (customerData) {
          setCustomer(customerData);
        } else {
          navigate('/customers');
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomer();
  }, [customerId, customers, navigate, refreshCustomers]);

  if (loading || isLoading) {
    return (
      <PageContainer
        title="Loading..."
        description="Fetching customer details"
        backLink="/customers"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }
  
  if (error) {
    return (
      <PageContainer
        title="Error"
        description="Failed to load customer details"
        backLink="/customers"
      >
        <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-700">
          {typeof error === 'string' ? error : 'An error occurred while loading customer data.'}
        </div>
      </PageContainer>
    );
  }

  if (!customer) {
    return (
      <PageContainer
        title="Customer Not Found"
        description="The requested customer could not be found"
        backLink="/customers"
      >
        <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-700">
          Customer not found or has been deleted.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Customer Details"
      description="View detailed information about the customer."
      backLink="/customers"
    >
      <CustomerDetail customer={customer} />
    </PageContainer>
  );
};

export default CustomerDetailPage;
