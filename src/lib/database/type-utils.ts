
import { Database } from "@/types/supabase";

// Helper functions to safely type database IDs and enum values when passing them to Supabase
export function asLeaseId(id: string): Database['public']['Tables']['leases']['Row']['id'] {
  return id as Database['public']['Tables']['leases']['Row']['id'];
}

export function asVehicleId(id: string): Database['public']['Tables']['vehicles']['Row']['id'] {
  return id as Database['public']['Tables']['vehicles']['Row']['id'];
}

export function asPaymentStatus(status: string): Database['public']['Tables']['unified_payments']['Row']['status'] {
  return status as Database['public']['Tables']['unified_payments']['Row']['status'];
}

export function asTrafficFineStatus(status: string): Database['public']['Tables']['traffic_fines']['Row']['payment_status'] {
  return status as Database['public']['Tables']['traffic_fines']['Row']['payment_status'];
}

export function asPaymentId(id: string): Database['public']['Tables']['unified_payments']['Row']['id'] {
  return id as Database['public']['Tables']['unified_payments']['Row']['id'];
}
