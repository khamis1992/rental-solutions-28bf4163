
import React from 'react';
import { cn } from '@/lib/utils';

interface ArabicTextProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * Component specifically for displaying Arabic text with the right styling and direction
 */
const ArabicText = React.forwardRef<HTMLSpanElement, ArabicTextProps>(
  ({ children, className, as: Component = 'span', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        dir="rtl"
        className={cn(
          'font-cairo rtl',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

ArabicText.displayName = 'ArabicText';

export default ArabicText;
