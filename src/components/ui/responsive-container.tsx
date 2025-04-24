
import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'screen';
  padding?: boolean;
}

const maxWidthClasses = {
  'xs': 'max-w-xs',
  'sm': 'max-w-sm',
  'md': 'max-w-md',
  'lg': 'max-w-lg',
  'xl': 'max-w-xl',
  '2xl': 'max-w-2xl',
  'full': 'max-w-full',
  'screen': 'max-w-screen-xl',
};

/**
 * A responsive container component that adapts its width based on screen size
 */
export const ResponsiveContainer = ({
  children,
  className,
  as: Component = 'div',
  maxWidth = 'screen',
  padding = true,
}: ResponsiveContainerProps) => {
  return (
    <Component 
      className={cn(
        'w-full mx-auto',
        maxWidthClasses[maxWidth],
        padding && 'px-4 sm:px-6 md:px-8',
        className
      )}
    >
      {children}
    </Component>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
}

const gapClasses = {
  'none': 'gap-0',
  'xs': 'gap-1',
  'sm': 'gap-2',
  'md': 'gap-4',
  'lg': 'gap-6',
};

/**
 * A responsive grid component that adjusts columns based on screen size
 */
export const ResponsiveGrid = ({
  children,
  className,
  columns = {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
  },
  gap = 'md',
}: ResponsiveGridProps) => {
  const { sm = 1, md = 2, lg = 3, xl = 4 } = columns;
  
  const gridColsClasses = {
    sm: `grid-cols-${sm}`,
    md: md && `md:grid-cols-${md}`,
    lg: lg && `lg:grid-cols-${lg}`,
    xl: xl && `xl:grid-cols-${xl}`,
  };
  
  return (
    <div
      className={cn(
        'grid w-full',
        gridColsClasses.sm,
        gridColsClasses.md,
        gridColsClasses.lg,
        gridColsClasses.xl,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

interface ResponsiveFlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'col';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  items?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

/**
 * A flex container that switches between row and column based on screen size
 */
export const ResponsiveFlex = ({
  children,
  className,
  direction = 'col',
  gap = 'md',
  items = 'start',
  justify = 'start',
  wrap = false,
}: ResponsiveFlexProps) => {
  const flexDirectionClass = direction === 'col' 
    ? 'flex-col md:flex-row' 
    : 'flex-row md:flex-col';
    
  const alignItemsClass = `items-${items}`;
  const justifyContentClass = `justify-${justify}`;
  
  return (
    <div
      className={cn(
        'flex',
        flexDirectionClass,
        alignItemsClass,
        justifyContentClass,
        wrap && 'flex-wrap',
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};
