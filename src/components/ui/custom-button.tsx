
import React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

/**
 * Props for the CustomButton component
 */
interface CustomButtonProps extends ButtonProps {
  /**
   * Whether to apply a glossy effect to the button
   */
  glossy?: boolean;

  /**
   * Whether the button is in a loading state
   */
  isLoading?: boolean;

  /**
   * Icon to display before the button text
   */
  icon?: React.ReactNode;

  /**
   * Icon to display after the button text
   */
  iconRight?: React.ReactNode;

  /**
   * Text to display when the button is in a loading state
   */
  loadingText?: string;
}

/**
 * Enhanced button component with loading state, icon support, and glossy effect
 */
const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({
    className,
    variant,
    size,
    glossy,
    isLoading,
    icon,
    iconRight,
    loadingText,
    children,
    disabled,
    ...props
  }, ref) => {
    const isDisabled = disabled || isLoading;

    return (
      <Button
        className={cn(
          // Add custom styles for the glossy effect
          glossy && 'relative overflow-hidden',
          glossy && 'after:content-[""] after:absolute after:top-0 after:left-0 after:right-0 after:h-1/2 after:bg-white/10 after:rounded-t-[inherit]',
          'transition-all duration-300 ease-out hover:translate-y-[-1px] active:translate-y-[1px]',
          'shadow-button hover:shadow-lg',
          'inline-flex items-center justify-center gap-2',
          className
        )}
        variant={variant}
        size={size}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && icon}
        {isLoading && loadingText ? loadingText : children}
        {!isLoading && iconRight && <span className="ml-2">{iconRight}</span>}
      </Button>
    );
  }
);

CustomButton.displayName = 'CustomButton';

export { CustomButton };
