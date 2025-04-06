
import { z } from 'zod';

export type CustomerStatus = 'active' | 'inactive' | 'blacklisted' | 'pendingreview' | 'pendingpayment';

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  phone_number?: string; // For compatibility with API responses
  driver_license: string;
  nationality?: string;
  address?: string;
  notes?: string;
  status: CustomerStatus;
  created_at?: string;
  updated_at?: string;
}

// This type is used for customer data coming from the API that may have incomplete fields
export interface PartialCustomer {
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  driver_license?: string;
  nationality?: string;
  address?: string;
  notes?: string;
  status?: CustomerStatus;
  created_at?: string;
  updated_at?: string;
}
