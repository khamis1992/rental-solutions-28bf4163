
import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  backLink?: string;
  headerProps?: any;
  actions?: React.ReactNode;
  systemDate?: Date;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  description,
  backLink,
  headerProps,
  actions,
  systemDate,
}) => {
  // Set document title if provided
  React.useEffect(() => {
    if (title) {
      document.title = `${title} | Fleet Management`;
    }
  }, [title]);

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Content */}
      {children}
    </div>
  );
};

export default PageContainer;
