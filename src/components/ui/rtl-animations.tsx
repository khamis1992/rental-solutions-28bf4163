import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { createRTLAnimation, createRTLTransition, rtlAnimations, rtlTransitions } from '@/utils/rtl-advanced-features';

/**
 * RTL Animated Container Component
 */
interface RTLAnimatedProps {
  children: React.ReactNode;
  animation: keyof typeof rtlAnimations;
  duration?: string;
  delay?: string;
  easing?: string;
  trigger?: 'mount' | 'hover' | 'focus' | 'visible' | 'manual';
  isActive?: boolean;
  className?: string;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
}

export const RTLAnimated: React.FC<RTLAnimatedProps> = ({
  children,
  animation,
  duration = '300ms',
  delay = '0ms',
  easing = 'ease-in-out',
  trigger = 'mount',
  isActive = true,
  className,
  onAnimationStart,
  onAnimationEnd,
}) => {
  const [shouldAnimate, setShouldAnimate] = useState(trigger === 'mount');
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for visibility trigger
  useEffect(() => {
    if (trigger !== 'visible' || !elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setShouldAnimate(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [trigger]);

  // Manual trigger
  useEffect(() => {
    if (trigger === 'manual') {
      setShouldAnimate(isActive);
    }
  }, [trigger, isActive]);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setShouldAnimate(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setShouldAnimate(false);
    }
  };

  const handleFocus = () => {
    if (trigger === 'focus') {
      setShouldAnimate(true);
    }
  };

  const handleBlur = () => {
    if (trigger === 'focus') {
      setShouldAnimate(false);
    }
  };

  const animationClasses = shouldAnimate
    ? createRTLAnimation(animation, { duration, delay, easing })
    : '';

  return (
    <div
      ref={elementRef}
      className={cn(animationClasses, className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onAnimationStart={onAnimationStart}
      onAnimationEnd={onAnimationEnd}
      dir="rtl"
    >
      {children}
    </div>
  );
};

/**
 * RTL Fade In Animation Component
 */
interface RTLFadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  trigger?: 'mount' | 'visible';
}

export const RTLFadeIn: React.FC<RTLFadeInProps> = ({
  children,
  delay = 0,
  duration = 300,
  className,
  trigger = 'mount',
}) => {
  return (
    <RTLAnimated
      animation="fadeIn"
      duration={`${duration}ms`}
      delay={`${delay}ms`}
      trigger={trigger}
      className={className}
    >
      {children}
    </RTLAnimated>
  );
};

/**
 * RTL Slide In Animation Component
 */
interface RTLSlideInProps {
  children: React.ReactNode;
  direction: 'start' | 'end' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  trigger?: 'mount' | 'visible';
}

export const RTLSlideIn: React.FC<RTLSlideInProps> = ({
  children,
  direction,
  delay = 0,
  duration = 300,
  className,
  trigger = 'mount',
}) => {
  const getAnimation = () => {
    switch (direction) {
      case 'start':
        return 'slideInStart';
      case 'end':
        return 'slideInEnd';
      case 'up':
        return 'slideInRight'; // Repurpose for up
      case 'down':
        return 'slideInLeft'; // Repurpose for down
      default:
        return 'slideInStart';
    }
  };

  return (
    <RTLAnimated
      animation={getAnimation() as keyof typeof rtlAnimations}
      duration={`${duration}ms`}
      delay={`${delay}ms`}
      trigger={trigger}
      className={className}
    >
      {children}
    </RTLAnimated>
  );
};

/**
 * RTL Staggered Animation Container
 */
interface RTLStaggeredProps {
  children: React.ReactNode[];
  animation: keyof typeof rtlAnimations;
  staggerDelay?: number;
  duration?: number;
  className?: string;
  trigger?: 'mount' | 'visible';
}

export const RTLStaggered: React.FC<RTLStaggeredProps> = ({
  children,
  animation,
  staggerDelay = 100,
  duration = 300,
  className,
  trigger = 'mount',
}) => {
  return (
    <div className={cn('space-y-2', className)} dir="rtl">
      {children.map((child, index) => (
        <RTLAnimated
          key={index}
          animation={animation}
          duration={`${duration}ms`}
          delay={`${index * staggerDelay}ms`}
          trigger={trigger}
        >
          {child}
        </RTLAnimated>
      ))}
    </div>
  );
};

/**
 * RTL Loading Spinner Component
 */
interface RTLLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  text?: string;
}

export const RTLLoadingSpinner: React.FC<RTLLoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-blue-600',
  className,
  text,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <div className={cn('flex items-center justify-center', className)} dir="rtl">
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-t-transparent',
            sizeClasses[size],
            color
          )}
        />
        {text && (
          <span className={cn('text-sm font-medium', color)}>
            {text}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * RTL Pulse Animation Component
 */
interface RTLPulseProps {
  children: React.ReactNode;
  intensity?: 'light' | 'medium' | 'strong';
  duration?: number;
  className?: string;
}

export const RTLPulse: React.FC<RTLPulseProps> = ({
  children,
  intensity = 'medium',
  duration = 2000,
  className,
}) => {
  const intensityClasses = {
    light: 'animate-pulse opacity-75',
    medium: 'animate-pulse opacity-50',
    strong: 'animate-pulse opacity-25',
  };

  return (
    <div
      className={cn(intensityClasses[intensity], className)}
      style={{ animationDuration: `${duration}ms` }}
      dir="rtl"
    >
      {children}
    </div>
  );
};

/**
 * RTL Skeleton Loading Component
 */
interface RTLSkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
  lines?: number;
}

export const RTLSkeleton: React.FC<RTLSkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className,
  rounded = false,
  lines = 1,
}) => {
  const skeletonStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (lines === 1) {
    return (
      <div
        className={cn(
          'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]',
          rounded ? 'rounded-full' : 'rounded',
          className
        )}
        style={skeletonStyle}
        dir="rtl"
      />
    );
  }

  return (
    <div className={cn('space-y-2', className)} dir="rtl">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]',
            rounded ? 'rounded-full' : 'rounded',
            index === lines - 1 && 'w-3/4' // Last line is shorter
          )}
          style={{
            ...skeletonStyle,
            animationDelay: `${index * 100}ms`,
          }}
        />
      ))}
    </div>
  );
};

/**
 * RTL Bounce Animation Component
 */
interface RTLBounceProps {
  children: React.ReactNode;
  trigger?: 'mount' | 'hover' | 'click';
  intensity?: 'light' | 'medium' | 'strong';
  className?: string;
}

export const RTLBounce: React.FC<RTLBounceProps> = ({
  children,
  trigger = 'mount',
  intensity = 'medium',
  className,
}) => {
  const [isActive, setIsActive] = useState(trigger === 'mount');

  const intensityClasses = {
    light: 'animate-bounce-light',
    medium: 'animate-bounce',
    strong: 'animate-bounce-strong',
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsActive(true);
      setTimeout(() => setIsActive(false), 600);
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsActive(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsActive(false);
    }
  };

  return (
    <div
      className={cn(
        isActive && intensityClasses[intensity],
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      dir="rtl"
    >
      {children}
    </div>
  );
};

/**
 * RTL Notification Animation Component
 */
interface RTLNotificationProps {
  children: React.ReactNode;
  isVisible: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

export const RTLNotification: React.FC<RTLNotificationProps> = ({
  children,
  isVisible,
  position = 'top-right',
  className,
}) => {
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
  };

  const getAnimation = () => {
    if (position.includes('right')) {
      return isVisible ? 'slideInRight' : 'slideOutRight';
    } else {
      return isVisible ? 'slideInLeft' : 'slideOutLeft';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        positionClasses[position],
        createRTLAnimation(getAnimation() as keyof typeof rtlAnimations),
        className
      )}
      dir="rtl"
    >
      {children}
    </div>
  );
};

/**
 * RTL Modal Animation Component
 */
interface RTLModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  overlayClassName?: string;
  closeOnOverlayClick?: boolean;
}

export const RTLModal: React.FC<RTLModalProps> = ({
  children,
  isOpen,
  onClose,
  className,
  overlayClassName,
  closeOnOverlayClick = true,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40',
          createRTLTransition('opacity'),
          overlayClassName
        )}
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
        <div
          className={cn(
            'bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto',
            createRTLAnimation('modalFadeIn'),
            className
          )}
        >
          {children}
        </div>
      </div>
    </>
  );
};

/**
 * RTL Progress Animation Component
 */
interface RTLProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  animated?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export const RTLProgress: React.FC<RTLProgressProps> = ({
  value,
  max = 100,
  className,
  barClassName,
  showLabel = false,
  animated = true,
  color = 'blue',
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
  };

  return (
    <div className={cn('w-full', className)} dir="rtl">
      <div className="flex justify-between items-center mb-1">
        {showLabel && (
          <span className="text-sm font-medium text-gray-700">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-500 ease-out',
            colorClasses[color],
            animated && 'animate-pulse',
            barClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Export all RTL animation components
 */
export {
  RTLAnimated as Animated,
  RTLFadeIn as FadeIn,
  RTLSlideIn as SlideIn,
  RTLStaggered as Staggered,
  RTLLoadingSpinner as LoadingSpinner,
  RTLPulse as Pulse,
  RTLSkeleton as Skeleton,
  RTLBounce as Bounce,
  RTLNotification as Notification,
  RTLModal as Modal,
  RTLProgress as Progress,
}; 