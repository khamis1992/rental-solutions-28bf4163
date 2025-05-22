import { DbId } from './database-common';

/**
 * Document categories
 */
export enum DocumentCategory {
  CONTRACT = 'contract',
  INSURANCE = 'insurance',
  MAINTENANCE = 'maintenance',
  IDENTITY = 'identity',
  FINANCIAL = 'financial',
  LEGAL = 'legal',
  OTHER = 'other'
}

/**
 * Document types
 */
export enum DocumentType {
  AGREEMENT = 'agreement',
  INSURANCE_POLICY = 'insurance_policy',
  MAINTENANCE_REPORT = 'maintenance_report',
  ID_CARD = 'id_card',
  LICENSE = 'license',
  RECEIPT = 'receipt',
  INVOICE = 'invoice',
  LEGAL_NOTICE = 'legal_notice',
  OTHER = 'other'
}

/**
 * Document status
 */
export enum DocumentStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DRAFT = 'draft',
  EXPIRED = 'expired'
}

/**
 * Entity types that documents can be associated with
 */
export enum DocumentEntityType {
  VEHICLE = 'vehicle',
  CUSTOMER = 'customer',
  AGREEMENT = 'agreement',
  MAINTENANCE = 'maintenance',
  LEGAL_CASE = 'legal_case',
  COMPANY = 'company'
}

/**
 * Document entity
 */
export interface DocumentEntity {
  id: string;
  type: DocumentEntityType;
}

/**
 * Document metadata
 */
export interface Document {
  id: DbId;
  title: string;
  description: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url: string | null;
  category: DocumentCategory;
  type: DocumentType;
  status: DocumentStatus;
  entity_type: DocumentEntityType | null;
  entity_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Document creation request
 */
export interface CreateDocumentRequest {
  title: string;
  description?: string;
  file: File;
  category: DocumentCategory;
  type: DocumentType;
  status?: DocumentStatus;
  entity_type?: DocumentEntityType;
  entity_id?: string;
}

/**
 * Document update request
 */
export interface UpdateDocumentRequest {
  id: DbId;
  title?: string;
  description?: string | null;
  category?: DocumentCategory;
  type?: DocumentType;
  status?: DocumentStatus;
  entity_type?: DocumentEntityType | null;
  entity_id?: string | null;
}
