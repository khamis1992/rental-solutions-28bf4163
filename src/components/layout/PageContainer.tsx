
import React from 'react';
import { cn } from '@/lib/utils';
import Header from './Header';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen pl-64 w-full">
      <Header />
      <main className={cn("p-6 animate-fade-in", className)}>
        {children}
      </main>
    </div>
  );
};

export default PageContainer;
