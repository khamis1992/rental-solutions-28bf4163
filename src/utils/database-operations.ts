
import { Database } from '@/types/database.types';
import { 
  Tables,
  UUID,
  LeaseId,
  PaymentId,
  AgreementId 
} from '@/types/database-types';

// Typed helper for cast lease ID
export function castLeaseId(id: string): LeaseId {
  return id as LeaseId;
}

// Typed helper for cast agreement ID
export function castAgreementId(id: string): AgreementId {
  return id as AgreementId;
}

// Generic helper for database IDs 
export function castDatabaseId<T extends keyof Tables>(id: string): Tables[T]['Row']['id'] {
  return id as Tables[T]['Row']['id'];
}

// Type-safe helper for payment operations
export function castPaymentUpdate(update: Partial<Tables['unified_payments']['Update']>): Tables['unified_payments']['Update'] {
  return update as Tables['unified_payments']['Update'];
}

