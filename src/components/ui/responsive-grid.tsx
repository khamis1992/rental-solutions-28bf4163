

import { useIsMobile, useBreakpoint } from '@/hooks/use-mobile';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  minCardWidth?: string;
  equalHeight?: boolean;
}

const gapClasses = {
  none: 'gap-0',
  xs: 'gap-1 md:gap-2',
  sm: 'gap-2 md:gap-3',
  md: 'gap-3 md:gap-4 lg:gap-6',
  lg: 'gap-4 md:gap-6 lg:gap-8',
  xl: 'gap-6 md:gap-8 lg:gap-12',
};

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  minCardWidth = '280px',
  equalHeight = false
}) => {
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint();

  const getGridCols = () => {
    if (isMobile) return `grid-cols-${columns.mobile || 1}`;
    if (breakpoint === 'tablet') return `md:grid-cols-${columns.tablet || 2}`;
    return `lg:grid-cols-${columns.desktop || 3}`;
  };

  return (
    <div
      className={cn(
        'grid w-full',
        getGridCols(),
        gapClasses[gap],
        equalHeight && 'auto-rows-fr',
        className
      )}
      style={{
        gridTemplateColumns: !isMobile && minCardWidth 
          ? `repeat(auto-fit, minmax(${minCardWidth}, 1fr))` 
          : undefined
      }}
    >
      {children}
    </div>
  );
};

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-3 md:p-4',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
};

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className,
  padding = 'md',
  hover = false,
  clickable = false,
  onClick
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        paddingClasses[padding],
        hover && 'transition-all duration-200 hover:shadow-md hover:-translate-y-1',
        clickable && 'cursor-pointer touch-friendly',
        clickable && 'active:scale-95 md:active:scale-98',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'vertical' | 'horizontal' | 'responsive';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

const spacingClasses = {
  xs: 'space-y-1 md:space-y-2',
  sm: 'space-y-2 md:space-y-3',
  md: 'space-y-3 md:space-y-4',
  lg: 'space-y-4 md:space-y-6',
  xl: 'space-y-6 md:space-y-8',
};

const spacingHorizontalClasses = {
  xs: 'space-x-1 md:space-x-2',
  sm: 'space-x-2 md:space-x-3',
  md: 'space-x-3 md:space-x-4',
  lg: 'space-x-4 md:space-x-6',
  xl: 'space-x-6 md:space-x-8',
};

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  className,
  spacing = 'md',
  direction = 'vertical',
  align = 'stretch',
  justify = 'start'
}) => {
  const getFlexDirection = () => {
    switch (direction) {
      case 'horizontal':
        return 'flex-row';
      case 'responsive':
        return 'flex-col md:flex-row';
      default:
        return 'flex-col';
    }
  };

  const getSpacing = () => {
    if (direction === 'horizontal') return spacingHorizontalClasses[spacing];
    return spacingClasses[spacing];
  };

  return (
    <div
      className={cn(
        'flex',
        getFlexDirection(),
        getSpacing(),
        `items-${align}`,
        `justify-${justify}`,
        className
      )}
    >
      {children}
    </div>
  );
};

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  mobileLayout?: 'cards' | 'scroll' | 'stack';
  showHeader?: boolean;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  className,
  mobileLayout = 'cards',
  showHeader = true
}) => {
  const isMobile = useIsMobile();

  if (isMobile && mobileLayout === 'cards') {
    return (
      <div className={cn('space-y-4', className)}>
        {children}
      </div>
    );
  }

  if (isMobile && mobileLayout === 'scroll') {
    return (
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="inline-block min-w-full">
          <table className={cn('min-w-full', className)}>
            {children}
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full">
        {children}
      </table>
    </div>
  );
};

interface ResponsiveModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  children,
  isOpen,
  onClose,
  title,
  size = 'md',
  className
}) => {
  const isMobile = useIsMobile();

  const sizeClasses = {
    sm: isMobile ? 'max-w-full' : 'max-w-sm',
    md: isMobile ? 'max-w-full' : 'max-w-md',
    lg: isMobile ? 'max-w-full' : 'max-w-lg',
    xl: isMobile ? 'max-w-full' : 'max-w-xl',
    full: 'max-w-full',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className={cn(
          'relative bg-white shadow-xl',
          isMobile 
            ? 'w-full h-auto max-h-[90vh] rounded-t-lg'
            : 'rounded-lg',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b" dir="rtl">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 touch-friendly"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
      </div>
    </div>
  );
}; 