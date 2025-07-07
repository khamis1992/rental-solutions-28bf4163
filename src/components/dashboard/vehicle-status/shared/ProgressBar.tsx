import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  className, 
  style 
}) => {
  return (
    <Progress 
      value={Math.min(Math.max(value, 0), 100)} 
      className={cn("transition-all duration-300", className)}
      style={style}
    />
  );
};