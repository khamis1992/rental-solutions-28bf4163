import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer = ({ children, className }: PageContainerProps) => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 min-h-[calc(100vh-4rem)] overflow-auto">
      <div className={`container mx-auto space-y-4 ${className || ''}`}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;