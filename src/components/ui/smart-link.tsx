import { forwardRef, useEffect, useRef } from 'react';
import { Link, LinkProps, useLocation } from 'react-router-dom';
import { useRouteLoader } from '@/utils/route-loader';
import { cn } from '@/lib/utils';

interface SmartLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  prefetch?: boolean;
  className?: string;
}

export const SmartLink = forwardRef<HTMLAnchorElement, SmartLinkProps>(
  ({ to, prefetch = true, className, children, ...props }, ref) => {
    const location = useLocation();
    const { prepareRoute, isRouteLoaded } = useRouteLoader();
    const linkRef = useRef<HTMLAnchorElement>(null);
    const mergedRef = (node: HTMLAnchorElement) => {
      linkRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    useEffect(() => {
      if (!prefetch || !linkRef.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isRouteLoaded(to)) {
              prepareRoute(to);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(linkRef.current);

      return () => {
        if (linkRef.current) observer.unobserve(linkRef.current);
      };
    }, [to, prefetch, prepareRoute, isRouteLoaded]);

    // Handle hover intent
    const handleMouseEnter = () => {
      if (prefetch && !isRouteLoaded(to)) {
        prepareRoute(to);
      }
    };

    // Handle touch start for mobile
    const handleTouchStart = () => {
      if (prefetch && !isRouteLoaded(to)) {
        prepareRoute(to);
      }
    };

    const isActive = location.pathname.startsWith(to);

    return (
      <Link
        ref={mergedRef}
        to={to}
        className={cn(
          'transition-colors hover:text-primary',
          isActive && 'text-primary font-medium',
          className
        )}
        onMouseEnter={handleMouseEnter}
        onTouchStart={handleTouchStart}
        {...props}
      >
        {children}
      </Link>
    );
  }
);