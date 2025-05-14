
/**
 * Customer related types for the Fleet Management System
 */

/**
 * Complete customer information
 */
export interface CustomerInfo {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  driver_license?: string;
  nationality?: string;
  address?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  role?: string;
  id_document_expiry?: string;
  license_document_expiry?: string;
  notes?: string;
}

/**
 * Customer item for display in lists
 */
export interface CustomerListItem {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  status: string;
  created_at: string;
}

/**
 * Search parameters for customer filtering
 */
export interface CustomerSearchParams {
  query: string;
  status: string;
}
