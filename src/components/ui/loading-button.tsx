
import React from "react";
import { Button, type ButtonProps } from "./button";
import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingButtonProps extends ButtonProps {
  /**
   * Key in the loading states object to determine if this button is loading
   */
  loadingKey?: string;
  
  /**
   * Loading states object from useLoadingStates hook
   */
  loadingStates?: Record<string, boolean>;
  
  /**
   * Text to display when button is loading
   */
  loadingText?: string;
  
  /**
   * Whether to show the loading spinner
   */
  showSpinner?: boolean;
}

export function LoadingButton({
  loadingKey,
  loadingStates = {},
  loadingText = "Loading...",
  showSpinner = true,
  disabled,
  className,
  children,
  ...props
}: LoadingButtonProps) {
  // Determine if the button is in loading state
  const isLoading = loadingKey ? !!loadingStates[loadingKey] : false;
  
  return (
    <Button
      disabled={isLoading || disabled}
      className={cn(className)}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          {showSpinner && <Loader className="h-4 w-4 animate-spin" />}
          {loadingText}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
