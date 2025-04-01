
import React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';

interface GradientButtonProps extends ButtonProps {
  gradientFrom?: string;
  gradientTo?: string;
  hoverGradientFrom?: string;
  hoverGradientTo?: string;
  glow?: boolean;
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ 
    className, 
    variant = "default", 
    size, 
    gradientFrom = "from-primary", 
    gradientTo = "to-blue-500",
    hoverGradientFrom = "hover:from-blue-600",
    hoverGradientTo = "hover:to-primary",
    glow = false,
    ...props 
  }, ref) => {
    return (
      <Button
        className={cn(
          "bg-gradient-to-r transition-all duration-300",
          gradientFrom,
          gradientTo,
          hoverGradientFrom,
          hoverGradientTo,
          glow && "shadow-[0_0_20px_rgba(59,130,246,0.5)]",
          "transform hover:scale-[1.02] active:scale-[0.98]",
          "hover:shadow-lg",
          className
        )}
        variant={variant}
        size={size}
        ref={ref}
        {...props}
      />
    );
  }
);

GradientButton.displayName = 'GradientButton';

export { GradientButton };
