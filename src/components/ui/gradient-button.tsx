
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type ButtonProps } from '@/components/ui/button';

interface GradientButtonProps extends ButtonProps {
  gradient?: 'primary' | 'success' | 'warning' | 'danger';
  isLoading?: boolean;
}

export function GradientButton({
  gradient = 'primary',
  isLoading,
  className,
  children,
  ...props
}: GradientButtonProps) {
  const gradientStyles = {
    primary: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600',
  };

  return (
    <Button
      className={cn(
        gradientStyles[gradient],
        "text-white transition-all duration-200 shadow-lg hover:shadow-xl",
        isLoading && "opacity-80 cursor-not-allowed",
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </Button>
  );
}
