
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface AuditableEntity extends BaseEntity {
  created_by?: string;
  updated_by?: string;
}

export interface SoftDeleteEntity extends BaseEntity {
  deleted_at?: string;
  deleted_by?: string;
}

export interface FilterOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: Record<string, any>;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ModalConfig {
  title: string;
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  onClose?: () => void;
  footer?: React.ReactNode;
}
