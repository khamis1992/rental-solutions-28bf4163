
import { forwardRef } from 'react';
import { Link, LinkProps as RouterLinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SmartLinkProps extends RouterLinkProps {
  prefetch?: boolean;
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}

const prepareRoute = async (path: string) => {
  try {
    // Implement route preparation logic if needed
    console.log(`Preparing route: ${path}`);
  } catch (error) {
    console.error(`Failed to prepare route: ${path}`, error);
  }
};

export const SmartLink = forwardRef<HTMLAnchorElement, SmartLinkProps>(
  ({ to, prefetch = true, className, activeClassName, children, ...props }, ref) => {
    const handleMouseEnter = () => {
      if (prefetch && typeof to === 'string') {
        prepareRoute(to);
      }
    };

    return (
      <Link
        ref={ref}
        to={to}
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onFocus={handleMouseEnter}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

SmartLink.displayName = 'SmartLink';
