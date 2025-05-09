
// This file is kept for backward compatibility but is now deprecated.
// Please use the generic Pagination component from @/components/ui/pagination instead.

import React from 'react';
import { Pagination } from '@/components/ui/pagination';

interface AgreementPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function AgreementPagination(props: AgreementPaginationProps) {
  // Forward to the generic Pagination component
  return <Pagination {...props} />;
}
