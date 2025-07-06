/**
 * Performance-optimized type definitions
 */

// Simplified Agreement type for performance
export interface SimpleAgreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  status: 'draft' | 'active' | 'terminated' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  rent_amount: number;
  agreement_number?: string;
  // Relational data (optional for performance)
  customer?: {
    id: string;
    full_name: string;
    phone_number?: string;
    email?: string;
  };
  vehicle?: {
    id: string;
    make?: string;
    model?: string;
    license_plate?: string;
    status?: string;
  };
}

// Simplified Customer type
export interface SimpleCustomer {
  id: string;
  full_name: string;
  phone_number?: string;
  email?: string;
  driver_license?: string;
}

// Simplified Vehicle type
export interface SimpleVehicle {
  id: string;
  make?: string;
  model?: string;
  license_plate?: string;
  year?: number;
  status?: 'available' | 'rented' | 'maintenance' | 'retired';
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  stage?: string;
}

// Performance metrics
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  componentCount: number;
  errorCount: number;
}