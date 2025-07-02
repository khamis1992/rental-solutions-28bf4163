
// @ts-nocheck
/* eslint-disable */

import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
import { useDocumentationMode } from '@/context/DocumentationModeContext';

interface TooltipWrapperProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
}

export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  content,
  children,
  side = 'top',
  sideOffset = 8,
}) => {
  const { enabled: docMode } = useDocumentationMode();

  return (
    <TooltipProvider>
      <Tooltip open={docMode ? true : undefined}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} sideOffset={sideOffset}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 