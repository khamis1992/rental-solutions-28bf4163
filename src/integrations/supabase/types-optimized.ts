/**
 * أنواع Supabase محسنة - الأنواع الأساسية
 * Optimized Supabase Types - Core Types
 * 
 * تم تقسيم الملف الكبير إلى أجزاء أصغر لتحسين الأداء
 */

// الأنواع الأساسية المستخدمة بكثرة
export interface DatabaseUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  role: 'admin' | 'user' | 'viewer';
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

// أنواع المركبات الأساسية
export interface Vehicle {
  id: string;
  plate_number: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  status: 'available' | 'rented' | 'maintenance' | 'out_of_service';
  daily_rate: number;
  created_at: string;
  updated_at: string;
}

// أنواع العملاء الأساسية
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  national_id: string;
  license_number: string;
  created_at: string;
  updated_at: string;
}

// أنواع العقود الأساسية
export interface Agreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: 'active' | 'completed' | 'cancelled' | 'draft';
  created_at: string;
  updated_at: string;
}

// أنواع المدفوعات الأساسية
export interface Payment {
  id: string;
  agreement_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'card' | 'transfer' | 'check';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// أنواع الاستعلامات المحسنة - تحميل كسول
export type VehicleWithDetails = Vehicle & {
  current_agreement?: Agreement;
  maintenance_records?: MaintenanceRecord[];
};

export type CustomerWithAgreements = Customer & {
  agreements?: Agreement[];
  total_rentals?: number;
};

export type AgreementWithDetails = Agreement & {
  customer?: Customer;
  vehicle?: Vehicle;
  payments?: Payment[];
};

// أنواع الصيانة الأساسية
export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description: string;
  cost: number;
  maintenance_date: string;
  created_at: string;
}

// أنواع API Response محسنة
export interface ApiResponse<T> {
  data: T;
  error?: string;
  count?: number;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Helper Types للفلترة والبحث
export interface VehicleFilters {
  status?: Vehicle['status'];
  brand?: string;
  year_from?: number;
  year_to?: number;
  rate_from?: number;
  rate_to?: number;
}

export interface CustomerFilters {
  name?: string;
  phone?: string;
  national_id?: string;
}

export interface AgreementFilters {
  status?: Agreement['status'];
  start_date_from?: string;
  start_date_to?: string;
  customer_id?: string;
  vehicle_id?: string;
}

// أنواع النماذج
export interface VehicleFormData {
  plate_number: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  daily_rate: number;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  email?: string;
  national_id: string;
  license_number: string;
}

export interface AgreementFormData {
  customer_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
}

// Utility Types
export type CreateVehicle = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;
export type UpdateVehicle = Partial<CreateVehicle>;

export type CreateCustomer = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCustomer = Partial<CreateCustomer>;

export type CreateAgreement = Omit<Agreement, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAgreement = Partial<CreateAgreement>;

// Enums للقيم الثابتة
export enum VehicleStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service'
}

export enum AgreementStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DRAFT = 'draft'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  CHECK = 'check'
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer'
}

// Type guards للفحص الآمن
export const isVehicle = (obj: any): obj is Vehicle => {
  return obj && typeof obj.id === 'string' && typeof obj.plate_number === 'string';
};

export const isCustomer = (obj: any): obj is Customer => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
};

export const isAgreement = (obj: any): obj is Agreement => {
  return obj && typeof obj.id === 'string' && typeof obj.customer_id === 'string';
};

// Re-export من الملفات المقسمة الأخرى عند الحاجة
export type { 
  // سيتم إضافة أنواع أخرى عند تقسيم الملف الكبير
} from './types-extended';

// Default export للتوافق مع الكود الموجود
export default {
  VehicleStatus,
  AgreementStatus,
  PaymentStatus,
  PaymentMethod,
  UserRole,
  isVehicle,
  isCustomer,
  isAgreement
};