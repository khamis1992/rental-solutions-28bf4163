
import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`container py-8 space-y-6 ${className}`}>
      {children}
    </div>
  );
}
