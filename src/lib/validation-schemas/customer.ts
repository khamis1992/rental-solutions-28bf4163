
export type CustomerStatus = "active" | "inactive" | "pending_review" | "blacklisted" | "pending_payment";

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  driver_license: string;
  nationality: string;
  address: string;
  notes: string;
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
  phone_number?: string; // For backward compatibility
}
