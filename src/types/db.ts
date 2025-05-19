import { Database } from './database.types'

export type Tables = Database['public']['Tables']

export type DbId = string
export type LeaseRow = Tables['leases']['Row']
export type LeaseInsert = Tables['leases']['Insert']
export type LeaseUpdate = Tables['leases']['Update']
export type LeaseId = LeaseRow['id']
export type LeaseStatus = LeaseRow['status']

export type VehicleRow = Tables['vehicles']['Row']
export type VehicleInsert = Tables['vehicles']['Insert']
export type VehicleUpdate = Tables['vehicles']['Update']
export type VehicleId = VehicleRow['id']
export type VehicleStatus = VehicleRow['status']

export type ProfileRow = Tables['profiles']['Row']
export type ProfileId = ProfileRow['id']

export type PaymentRow = Tables['unified_payments']['Row']
export type PaymentInsert = Tables['unified_payments']['Insert']
export type PaymentUpdate = Tables['unified_payments']['Update']
export type PaymentId = PaymentRow['id']
export type PaymentStatus = PaymentRow['status']

export type TrafficFineRow = Tables['traffic_fines']['Row']
export type TrafficFineId = TrafficFineRow['id']

export type LegalCaseRow = Tables['legal_cases']['Row']
export type LegalCaseId = LegalCaseRow['id']

export const asLeaseId = (id: string): LeaseId => id as LeaseId
export const asVehicleId = (id: string): VehicleId => id as VehicleId
export const asProfileId = (id: string): ProfileId => id as ProfileId
export const asPaymentId = (id: string): PaymentId => id as PaymentId
export const asTrafficFineId = (id: string): TrafficFineId => id as TrafficFineId
export const asLegalCaseId = (id: string): LegalCaseId => id as LegalCaseId
export const asLeaseStatus = (status: string): LeaseStatus => status as LeaseStatus
export const asVehicleStatus = (status: string): VehicleStatus => status as VehicleStatus
export const asPaymentStatus = (status: string): PaymentStatus => status as PaymentStatus

