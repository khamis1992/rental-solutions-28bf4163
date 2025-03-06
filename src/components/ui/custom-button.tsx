
import React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';

interface CustomButtonProps extends ButtonProps {
  // Add any custom props here
  glossy?: boolean;
}

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ className, variant, size, glossy, ...props }, ref) => {
    return (
      <Button
        className={cn(
          // Add custom styles for the glossy effect
          glossy && 'relative overflow-hidden',
          glossy && 'after:content-[""] after:absolute after:top-0 after:left-0 after:right-0 after:h-1/2 after:bg-white/10 after:rounded-t-[inherit]',
          'transition-all duration-300 ease-out hover:translate-y-[-1px] active:translate-y-[1px]',
          'shadow-button hover:shadow-lg',
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

CustomButton.displayName = 'CustomButton';

export { CustomButton };
