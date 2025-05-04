
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileUp, AlertTriangle, UserPlus, Search } from 'lucide-react';
import { CustomerList } from '@/components/customers/CustomerList';
import { ImportHistoryList } from '@/components/customers/ImportHistoryList';
import { CSVImportModal } from '@/components/customers/CSVImportModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomerSearchResults } from '@/components/customers/CustomerSearchResults';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';
import PageContainer from '@/components/layout/PageContainer';
import { supabase } from '@/lib/supabase';
import { CustomerInfo } from '@/types/customer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Customers = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerInfo[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchParams, setSearchParams] = useState({
    query: '',
    status: 'all',
  });
  
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await checkEdgeFunctionAvailability('process-customer-imports', 2);
      setIsEdgeFunctionAvailable(available);
    };
    
    checkAvailability();
  }, []);

  // Handle search input changes
  const handleSearchInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number')
        .eq('role', 'customer')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching customers:', error);
        setSearchResults([]);
      } else {
        setSearchResults(data as CustomerInfo[]);
      }
    } catch (error) {
      console.error('Error in customer search:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: CustomerInfo) => {
    setSelectedCustomer(customer);
    setSearchQuery('');
    setSearchResults([]);
    
    // Update search params for the CustomerList component
    setSearchParams({
      query: customer.full_name,
      status: 'all'
    });
  };

  // Clear selected customer
  const clearSelectedCustomer = () => {
    setSelectedCustomer(null);
    setSearchParams({
      query: '',
      status: 'all'
    });
  };

  return (
    <PageContainer 
      title="Customers" 
      description="Manage your customer database and track customer information"
      actions={
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2"
            disabled={!isEdgeFunctionAvailable}
          >
            {!isEdgeFunctionAvailable && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <FileUp className="h-4 w-4" />
            Import CSV
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link to="/customers/add">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Customer
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Customer Search Section */}
        <div className="rounded-lg border bg-card p-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-6">
              {selectedCustomer ? (
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Selected Customer</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearSelectedCustomer}
                      >
                        Clear
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedCustomer.full_name}</h3>
                      <div className="text-sm text-muted-foreground mt-1">
                        <p>{selectedCustomer.email}</p>
                        <p>{selectedCustomer.phone_number}</p>
                      </div>
                      <div className="mt-2">
                        <Link 
                          to={`/customers/${selectedCustomer.id}`} 
                          className="text-primary text-sm hover:underline"
                        >
                          View Customer Details
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="search" 
                      placeholder="Search customers by name, email, or phone..." 
                      className="pl-8"
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                    />
                  </div>
                  {searchQuery && searchResults.length > 0 && (
                    <div className="absolute w-full z-10 mt-1">
                      <CustomerSearchResults 
                        results={searchResults} 
                        onSelect={handleCustomerSelect} 
                        isLoading={isSearching}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <CustomerList searchParams={searchParams} />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Import History</h2>
          <ImportHistoryList />
        </div>
      </div>
      
      <CSVImportModal 
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportComplete={() => {
          // Refresh the customer list
        }}
      />
    </PageContainer>
  );
};

export default Customers;
