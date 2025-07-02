

import { ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { TooltipWrapper } from '@/components/ui/TooltipWrapper';

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  tooltip?: string;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({
    children,
    isLoading = false,
    loadingText,
    disabled,
    tooltip,
    ...props
  }, ref) => {
    const button = (
      <Button ref={ref} disabled={disabled || isLoading} {...props}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Button>
    );
    return tooltip ? (
      <TooltipWrapper content={tooltip}>{button}</TooltipWrapper>
    ) : (
      button
    );
  }
);
LoadingButton.displayName = 'LoadingButton';
