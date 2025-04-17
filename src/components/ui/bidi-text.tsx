
import React from 'react';
import { hasRTLCharacters, getTextDirection } from '@/utils/rtl-utils';
import { cn } from '@/lib/utils';

interface BidiTextProps {
  text: string;
  className?: string;
  as?: React.ElementType;
}

/**
 * A component for properly displaying text that might contain RTL characters (Arabic, Hebrew, etc.)
 * It automatically sets the proper text direction and font-family
 */
const BidiText = React.forwardRef<HTMLSpanElement, BidiTextProps>(
  ({ text, className, as: Component = 'span', ...props }, ref) => {
    const hasRTL = hasRTLCharacters(text);
    const direction = getTextDirection(text);
    
    return (
      <Component
        ref={ref}
        dir={direction}
        className={cn(
          hasRTL ? 'font-cairo' : 'font-sans',
          className
        )}
        style={{ 
          direction,
          textAlign: hasRTL ? 'right' : 'left',
        }}
        {...props}
      >
        {text}
      </Component>
    );
  }
);

BidiText.displayName = 'BidiText';

export default BidiText;
