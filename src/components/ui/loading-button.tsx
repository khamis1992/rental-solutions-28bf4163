
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface LoadingButtonProps extends ButtonProps {
  /**
   * The key to check in loadingStates object
   */
  loadingKey?: string;
  
  /**
   * The loading states object
   */
  loadingStates?: Record<string, boolean>;
  
  /**
   * Direct loading state (alternative to loadingKey + loadingStates)
   */
  isLoading?: boolean;
  
  /**
   * Text to show when loading
   */
  loadingText?: string;
}

export function LoadingButton({ 
  loadingKey, 
  loadingStates = {}, 
  isLoading: directLoading,
  loadingText = "Loading...",
  children, 
  disabled,
  ...props 
}: LoadingButtonProps) {
  // Determine if loading from either direct prop or from loadingStates
  const isLoading = directLoading ?? (loadingKey ? loadingStates[loadingKey] : false);
  
  return (
    <Button 
      disabled={isLoading || disabled} 
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" />
          {loadingText}
        </span>
      ) : children}
    </Button>
  );
}
