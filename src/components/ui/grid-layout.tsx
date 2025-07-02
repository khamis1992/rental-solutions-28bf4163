
import React from 'react';
import { cn } from "@/lib/utils";

type GridColumns = 1 | 2 | 3 | 4 | 5 | 6;
type GridGap = 'none' | 'sm' | 'md' | 'lg';

const gapClasses: Record<GridGap, string> = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6'
};

interface GridLayoutProps {
  children: React.ReactNode;
  columns?: {
    base?: GridColumns;
    sm?: GridColumns;
    md?: GridColumns;
    lg?: GridColumns;
    xl?: GridColumns;
  };
  gap?: GridGap;
  className?: string;
}

export function GridLayout({
  children,
  columns = { base: 1, md: 2, lg: 3 },
  gap = 'md',
  className
}: GridLayoutProps) {
  const { base = 1, sm, md, lg, xl } = columns;
  
  const gridColsClasses = {
    base: `grid-cols-${base}`,
    sm: sm && `sm:grid-cols-${sm}`,
    md: md && `md:grid-cols-${md}`,
    lg: lg && `lg:grid-cols-${lg}`,
    xl: xl && `xl:grid-cols-${xl}`,
  };

  return (
    <div
      className={cn(
        'grid w-full',
        gridColsClasses.base,
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
}
