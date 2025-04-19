
import React from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';

interface AgreementTabsProps {
  agreement: Agreement;
  children: React.ReactNode;
}

export function AgreementTabs({
  agreement,
  children,
}: AgreementTabsProps) {
  return (
    <div className="w-full mt-6">
      <div className="animate-fade-in">
        {children}
      </div>
    </div>
  );
}
