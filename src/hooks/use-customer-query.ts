/**
 * Customer Hooks
 * 
 * Provides React Query hooks for customer data management with proper caching,
 * loading states, and error handling.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CustomerInfo, CustomerSearchParams } from '@/types/customer';
import { customerService } from '@/services/CustomerService';
import { toast } from 'sonner';
import { useState } from 'react';
import { getConnectionStatus } from '@/utils/database-connection';

// Query keys
const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params?: CustomerSearchParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  paymentHistory: (id: string) => [...customerKeys.detail(id), 'payments'] as const,
  documents: (id: string) => [...customerKeys.detail(id), 'documents'] as const,
};

/**
 * Hook for customer operations with React Query integration
 */
export function useCustomerQuery() {
  const queryClient = useQueryClient();
  const [connectionStatus] = useState(getConnectionStatus());
  
  /**
   * Get customers with filtering and pagination
   */
  const getCustomers = (params: CustomerSearchParams = { query: '', status: '' }, limit = 10, offset = 0) => {
    return useQuery({
      queryKey: customerKeys.list(params),
      queryFn: () => customerService.getCustomers(params, limit, offset),
      enabled: connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
      keepPreviousData: true,
    });
  };
  
  /**
   * Get a single customer by ID
   */
  const getCustomerById = (id: string) => {
    return useQuery({
      queryKey: customerKeys.detail(id),
      queryFn: () => customerService.getCustomerById(id),
      enabled: !!id && connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  /**
   * Get customer payment history
   */
  const getCustomerPaymentHistory = (id: string) => {
    return useQuery({
      queryKey: customerKeys.paymentHistory(id),
      queryFn: () => customerService.getCustomerPaymentHistory(id), 
      enabled: !!id && connectionStatus !== 'disconnected',
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };
  
  /**
   * Get customer document status (expiration checks)
   */
  const getCustomerDocuments = (id: string) => {
    return useQuery({
      queryKey: customerKeys.documents(id),
      queryFn: () => customerService.checkDocumentExpiration(id),
      enabled: !!id && connectionStatus !== 'disconnected',
      staleTime: 60 * 60 * 1000, // 1 hour
    });
  };
  
  /**
   * Create a new customer
   */
  const createCustomer = () => {
    return useMutation({
      mutationFn: (data: Omit<CustomerInfo, 'id' | 'created_at'>) => 
        customerService.createCustomer(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
        toast.success('Customer created successfully');
      }
    });
  };
  
  /**
   * Update an existing customer
   */
  const updateCustomer = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string, data: Partial<CustomerInfo> }) => 
        customerService.updateCustomer(id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
        toast.success('Customer updated successfully');
      }
    });
  };
  
  /**
   * Delete a customer
   */
  const deleteCustomer = () => {
    return useMutation({
      mutationFn: (id: string) => customerService.deleteCustomer(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
        toast.success('Customer deleted successfully');
      }
    });
  };
  
  /**
   * Search customers by name, email, or phone
   */
  const searchCustomers = (query: string) => {
    return useQuery({
      queryKey: [...customerKeys.lists(), 'search', query],
      queryFn: () => customerService.searchCustomers(query),
      enabled: !!query && query.length >= 2 && connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  return {
    getCustomers,
    getCustomerById,
    getCustomerPaymentHistory,
    getCustomerDocuments,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    connectionStatus
  };
}
