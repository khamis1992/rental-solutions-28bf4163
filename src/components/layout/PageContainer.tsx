
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface PageContainerProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backLink?: string;
  headerProps?: {
    onSearch?: (query: string) => void;
    searchQuery?: string;
    searchPlaceholder?: string;
  }
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  title, 
  description, 
  actions,
  backLink,
  headerProps
}) => {
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
          <div className="mb-4 sm:mb-0">
            {backLink && (
              <Link to={backLink} className="flex items-center text-sm text-gray-500 mb-2 hover:text-gray-700">
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Back</span>
              </Link>
            )}
            <h1 className="text-2xl font-semibold">{title}</h1>
            {description && <p className="text-gray-500 mt-1">{description}</p>}
          </div>
          {actions && (
            <div className="flex flex-wrap gap-2 items-center">
              {actions}
            </div>
          )}
        </div>
        
        {/* Search Input */}
        {headerProps?.onSearch && (
          <div className="mt-4">
            <div className="flex max-w-md">
              <Input
                placeholder={headerProps.searchPlaceholder || "Search..."}
                value={headerProps.searchQuery || ""}
                onChange={(e) => headerProps.onSearch && headerProps.onSearch(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
