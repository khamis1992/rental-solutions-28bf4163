
import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidthOnMobile?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  paddingX?: boolean;
}

/**
 * A responsive container component that adapts its width based on screen size
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  fullWidthOnMobile = true,
  maxWidth = 'lg',
  paddingX = true,
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  return (
    <div
      className={cn(
        'mx-auto w-full',
        paddingX && 'px-4 sm:px-6 md:px-8',
        maxWidth === 'sm' && 'max-w-screen-sm',
        maxWidth === 'md' && 'max-w-screen-md',
        maxWidth === 'lg' && 'max-w-screen-lg',
        maxWidth === 'xl' && 'max-w-screen-xl',
        maxWidth === '2xl' && 'max-w-screen-2xl',
        fullWidthOnMobile && isMobile ? 'max-w-none' : '',
        className
      )}
    >
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * A responsive grid component that adapts columns based on screen size
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  gap = 'md',
}) => {
  return (
    <div
      className={cn(
        'grid w-full',
        gap === 'none' && 'gap-0',
        gap === 'xs' && 'gap-2',
        gap === 'sm' && 'gap-4',
        gap === 'md' && 'gap-6',
        gap === 'lg' && 'gap-8',
        gap === 'xl' && 'gap-10',
        cols.xs === 1 && 'grid-cols-1',
        cols.xs === 2 && 'grid-cols-2',
        cols.xs === 3 && 'grid-cols-3',
        cols.xs === 4 && 'grid-cols-4',
        cols.sm === 1 && 'sm:grid-cols-1',
        cols.sm === 2 && 'sm:grid-cols-2',
        cols.sm === 3 && 'sm:grid-cols-3',
        cols.sm === 4 && 'sm:grid-cols-4',
        cols.md === 1 && 'md:grid-cols-1',
        cols.md === 2 && 'md:grid-cols-2',
        cols.md === 3 && 'md:grid-cols-3',
        cols.md === 4 && 'md:grid-cols-4',
        cols.lg === 1 && 'lg:grid-cols-1',
        cols.lg === 2 && 'lg:grid-cols-2',
        cols.lg === 3 && 'lg:grid-cols-3',
        cols.lg === 4 && 'lg:grid-cols-4',
        cols.lg === 5 && 'lg:grid-cols-5',
        cols.lg === 6 && 'lg:grid-cols-6',
        cols.xl === 1 && 'xl:grid-cols-1',
        cols.xl === 2 && 'xl:grid-cols-2',
        cols.xl === 3 && 'xl:grid-cols-3',
        cols.xl === 4 && 'xl:grid-cols-4',
        cols.xl === 5 && 'xl:grid-cols-5',
        cols.xl === 6 && 'xl:grid-cols-6',
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * A stack component that adds consistent spacing between elements
 */
export const ResponsiveStack: React.FC<{
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'column';
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
}> = ({
  children,
  className,
  direction = 'column',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
}) => {
  return (
    <div
      className={cn(
        'flex',
        direction === 'row' ? 'flex-row' : 'flex-col',
        wrap && 'flex-wrap',
        spacing === 'none' && 'gap-0',
        spacing === 'xs' && 'gap-2',
        spacing === 'sm' && 'gap-4',
        spacing === 'md' && 'gap-6',
        spacing === 'lg' && 'gap-8',
        spacing === 'xl' && 'gap-10',
        align === 'start' && 'items-start',
        align === 'center' && 'items-center',
        align === 'end' && 'items-end',
        align === 'stretch' && 'items-stretch',
        justify === 'start' && 'justify-start',
        justify === 'center' && 'justify-center',
        justify === 'end' && 'justify-end',
        justify === 'between' && 'justify-between',
        justify === 'around' && 'justify-around',
        className
      )}
    >
      {children}
    </div>
  );
};
