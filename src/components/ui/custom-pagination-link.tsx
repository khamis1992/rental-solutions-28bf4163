
import React from 'react';
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Create a properly typed PaginationLink component that handles disabled state
export interface PaginationLinkProps extends React.HTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  size?: ButtonProps["size"];
  disabled?: boolean;
}

export const CustomPaginationLink = React.forwardRef<HTMLButtonElement, PaginationLinkProps>(
  ({ className, isActive, size = "icon", disabled, ...props }, ref) => (
    <Button
      ref={ref}
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(
        "hover:bg-primary/5", 
        {
          "pointer-events-none opacity-50": disabled,
        }, 
        className
      )}
      disabled={disabled}
      aria-current={isActive ? "page" : undefined}
      {...props}
    />
  )
);

CustomPaginationLink.displayName = "CustomPaginationLink";
