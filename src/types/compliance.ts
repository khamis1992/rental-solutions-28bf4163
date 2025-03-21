
export type DocumentStatus = 'valid' | 'expired' | 'pending' | 'rejected';
export type DocumentType = 'insurance' | 'registration' | 'inspection' | 'rental_agreement' | 'other';

export interface ComplianceDocument {
  id: string;
  document_type: DocumentType;
  entity_id: string;
  entity_type: 'agreement' | 'vehicle' | 'customer';
  upload_date: string;
  expiry_date?: string;
  status: DocumentStatus;
  document_url: string;
  verified_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceDocumentFormData {
  document_type: DocumentType;
  entity_id: string;
  entity_type: 'agreement' | 'vehicle' | 'customer';
  upload_date: string;
  expiry_date?: string;
  status: DocumentStatus;
  document_url: string;
  notes?: string;
}
