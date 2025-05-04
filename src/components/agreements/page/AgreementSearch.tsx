
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomerInfo } from '@/types/customer';
import { CustomerSearchResults } from '@/components/customers/CustomerSearchResults';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface AgreementSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCustomer: CustomerInfo | null;
  setSelectedCustomer: (customer: CustomerInfo | null) => void;
  setSearchParams: (params: Record<string, any>) => void;
}

export const AgreementSearch: React.FC<AgreementSearchProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCustomer,
  setSelectedCustomer,
  setSearchParams,
}) => {
  const [searchResults, setSearchResults] = useState<CustomerInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
    
    // Update search params to filter agreements by selected customer
    setSearchParams(prev => ({
      ...prev,
      customer_id: customer.id
    }));
  };

  // Clear selected customer
  const clearSelectedCustomer = () => {
    setSelectedCustomer(null);
    
    // Remove customer_id filter
    setSearchParams(prev => {
      const newParams = { ...prev };
      delete newParams.customer_id;
      return newParams;
    });
  };

  return (
    <div className="flex flex-grow max-w-md relative">
      {selectedCustomer ? (
        <Card className="w-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Selected Customer</CardTitle>
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
              <h3 className="font-semibold text-base">{selectedCustomer.full_name}</h3>
              <div className="text-xs text-muted-foreground mt-1">
                <p>{selectedCustomer.email}</p>
                <p>{selectedCustomer.phone_number}</p>
              </div>
              <div className="mt-2">
                <Link 
                  to={`/customers/${selectedCustomer.id}`} 
                  className="text-primary text-xs hover:underline"
                >
                  View Customer Details
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="relative w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="search" 
              placeholder="Search for customers..." 
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={searchQuery}
              onChange={handleSearchInputChange}
            />
          </div>
          {searchQuery.trim().length > 0 && (
            <div className="absolute w-full z-20 mt-1">
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
  );
};
